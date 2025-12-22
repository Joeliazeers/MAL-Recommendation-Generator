import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { 
  getAuthUrl, 
  exchangeCodeForToken, 
  refreshAccessToken, 
  getUserInfo,
  getUserAnimeList,
  getUserMangaList
} from '../services/malApi'
import { 
  upsertUser, 
  updateUserTokens,
  cacheUserAnimeList,
  cacheUserMangaList
} from '../services/supabase'

const AuthContext = createContext(null)

const calculateMangaStatistics = (mangaList) => {
  const stats = {
    num_items_reading: 0,
    num_items_completed: 0,
    num_items_on_hold: 0,
    num_items_dropped: 0,
    num_items_plan_to_read: 0,
    mean_score: 0
  }
  
  let totalScore = 0
  let scoredCount = 0
  
  mangaList.forEach(item => {
    const status = item.list_status?.status
    const score = item.list_status?.score || 0
    
    switch (status) {
      case 'reading':
        stats.num_items_reading++
        break
      case 'completed':
        stats.num_items_completed++
        break
      case 'on_hold':
        stats.num_items_on_hold++
        break
      case 'dropped':
        stats.num_items_dropped++
        break
      case 'plan_to_read':
        stats.num_items_plan_to_read++
        break
    }
    
    if (score > 0) {
      totalScore += score
      scoredCount++
    }
  })
  
  if (scoredCount > 0) {
    stats.mean_score = totalScore / scoredCount
  }
  
  return stats
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('mal_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        // Check if token is expired
        if (new Date(userData.token_expires_at) > new Date()) {
          setUser(userData)
        } else {
          handleTokenRefresh(userData)
        }
      } catch (e) {
        console.warn('Failed to parse stored user:', e)
        localStorage.removeItem('mal_user')
      }
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTokenRefresh = async (userData) => {
    try {
      const tokens = await refreshAccessToken(userData.refresh_token)
      const updatedUser = { ...userData, ...tokens }
      await updateUserTokens(userData.mal_id, tokens)
      setUser(updatedUser)
      localStorage.setItem('mal_user', JSON.stringify(updatedUser))
    } catch (e) {
      console.warn('Failed to refresh token:', e)
      logout()
    }
  }

  const login = () => {
    window.location.href = getAuthUrl()
  }

  const handleCallback = async (code) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Step 1: Exchanging code for tokens...')
      // Exchange code for tokens
      const tokens = await exchangeCodeForToken(code)
      console.log('Step 1 SUCCESS: Got tokens', { expires: tokens.token_expires_at })
      
      console.log('Step 2: Getting user info from MAL...')
      // Get user info from MAL
      const malUser = await getUserInfo(tokens.access_token)
      console.log('Step 2 SUCCESS: Got user info', { 
        id: malUser.id, 
        name: malUser.name,
        anime_statistics: malUser.anime_statistics,
        manga_statistics: malUser.manga_statistics
      })
      console.log('Full malUser response:', JSON.stringify(malUser, null, 2))
      
      // Prepare user data
      const userData = {
        mal_id: malUser.id,
        id: malUser.id,
        name: malUser.name,
        username: malUser.name,
        picture: malUser.picture,
        avatar_url: malUser.picture,
        gender: malUser.gender,
        joined_at: malUser.joined_at,
        ...tokens,
        anime_statistics: malUser.anime_statistics || {},
        manga_statistics: malUser.manga_statistics || {}
      }
      
      console.log('Step 3: Saving user to Supabase...')
      // Save to Supabase
      const savedUser = await upsertUser(userData)
      console.log('Step 3 SUCCESS: Saved to Supabase', { id: savedUser.id })
      userData.id = savedUser.id
      
      // Cache user's anime and manga lists
      try {
        console.log('Step 4: Caching anime/manga lists...')
        const [animeList, mangaList] = await Promise.all([
          getUserAnimeList(tokens.access_token),
          getUserMangaList(tokens.access_token)
        ])
        console.log('Step 4a: Got lists', { anime: animeList.length, manga: mangaList.length })
        
        await Promise.all([
          cacheUserAnimeList(savedUser.id, animeList),
          cacheUserMangaList(savedUser.id, mangaList)
        ])
        console.log('Step 4b SUCCESS: Cached lists')
        
        userData.animeListCount = animeList.length
        userData.mangaListCount = mangaList.length
        
        // Calculate manga statistics
        const mangaStats = calculateMangaStatistics(mangaList)
        userData.manga_statistics = mangaStats
        console.log('Calculated manga_statistics:', mangaStats)
      } catch (cacheError) {
        console.warn('Failed to cache lists:', cacheError)
      }
      
      // Save to local storage
      localStorage.setItem('mal_user', JSON.stringify(userData))
      setUser(userData)
      
      console.log('Authentication complete!')
      return true
    } catch (e) {
      console.error('Authentication error:', e)
      setError(e.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = useCallback(() => {
    localStorage.removeItem('mal_user')
    sessionStorage.removeItem('mal_code_verifier')
    setUser(null)
  }, [])

  const refreshUserData = async () => {
    if (!user) return
    
    console.log('Starting sync with MAL...')
    setLoading(true)
    try {
      if (new Date(user.token_expires_at) <= new Date()) {
        console.log('Token expired, refreshing...')
        await handleTokenRefresh(user)
      }
      
      console.log('Fetching user info and lists from MAL...')
      const [malUser, animeList, mangaList] = await Promise.all([
        getUserInfo(user.access_token),
        getUserAnimeList(user.access_token),
        getUserMangaList(user.access_token)
      ])
      
      console.log(`Got user info with statistics`)
      console.log(`Got ${animeList.length} anime, ${mangaList.length} manga`)
      
      console.log('Caching to Supabase...')
      await Promise.all([
        cacheUserAnimeList(user.id, animeList),
        cacheUserMangaList(user.id, mangaList)
      ])
      
      const updatedUser = {
        ...user,
        name: malUser.name,
        username: malUser.name,
        picture: malUser.picture,
        avatar_url: malUser.picture,
        gender: malUser.gender,
        joined_at: malUser.joined_at,
        anime_statistics: malUser.anime_statistics || {},
        manga_statistics: malUser.manga_statistics || {},
        animeListCount: animeList.length,
        mangaListCount: mangaList.length
      }
      
      localStorage.setItem('mal_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      console.log('Sync completed successfully!')
      console.log('Updated anime_statistics:', malUser.anime_statistics)
      console.log('Updated manga_statistics:', malUser.manga_statistics)
    } catch (e) {
      console.error('Sync failed:', e)
      setError(e.message)
      throw e // Re-throw so Profile.jsx can catch it
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    handleCallback,
    refreshUserData,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
