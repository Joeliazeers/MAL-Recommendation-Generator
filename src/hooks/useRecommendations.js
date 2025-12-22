import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  getMangaRanking, 
  getSeasonalAnime,
  getAnimeDetails,
  getMangaDetails
} from '../services/malApi'
import { 
  getUserAnimeListCache, 
  getUserMangaListCache,
  getUserPreferences,
  getRecommendationCache,
  saveRecommendationCache
} from '../services/supabase'
import {
  getCollaborativeRecommendations,
  createHybridRecommendations
} from '../services/recommendationEngine'

// Debugging
const DEBUG_MODE = false

// Randomize anime and manga
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Time reset - resets at 00:00 AM and 12:00 PM
const getNextResetTime = () => {
  const now = new Date()
  const currentHour = now.getHours()
  const nextReset = new Date(now)
  
  if (currentHour < 12) {
    // Next reset is 12:00 PM today
    nextReset.setHours(12, 0, 0, 0)
  } else {
    // Next reset is 00:00 AM tomorrow
    nextReset.setHours(24, 0, 0, 0)
  }
  
  return nextReset
}

// Calculate remaining time until next reset
const getTimeUntilReset = () => {
  return getNextResetTime().getTime() - Date.now()
}
const formatCountdown = (ms) => {
  if (ms <= 0) return null
  
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Cooldown storage keys
const getCooldownKey = (userId, type, mode) => `rec_cooldown_${userId}_${type}_${mode}`
const getRecsKey = (userId, type, mode) => `rec_data_${userId}_${type}_${mode}`

export const useRecommendations = () => {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [noRatings, setNoRatings] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(null)
  const [hasGeneratedToday, setHasGeneratedToday] = useState(false)

  const checkCooldown = useCallback((type, mode) => {
    if (!user || DEBUG_MODE) return { canGenerate: true, cached: null }
    
    const cooldownKey = getCooldownKey(user.id, type, mode)
    const recsKey = getRecsKey(user.id, type, mode)
    
    const cooldownData = localStorage.getItem(cooldownKey)
    if (!cooldownData) return { canGenerate: true, cached: null }
    
    const cooldownTime = new Date(cooldownData)
    const now = new Date()
    
    if (now >= cooldownTime) {
      localStorage.removeItem(cooldownKey)
      localStorage.removeItem(recsKey)
      return { canGenerate: true, cached: null }
    }
    const cachedRecs = localStorage.getItem(recsKey)
    return { 
      canGenerate: false, 
      cached: cachedRecs ? JSON.parse(cachedRecs) : null,
      isOnCooldown: true
    }
  }, [user])

  const saveCooldown = useCallback((type, mode, recs) => {
    if (!user || DEBUG_MODE) return
    
    const cooldownKey = getCooldownKey(user.id, type, mode)
    const recsKey = getRecsKey(user.id, type, mode)
    
    // Set cooldown to expire at next reset time (00:00 or 12:00)
    const nextReset = getNextResetTime()
    localStorage.setItem(cooldownKey, nextReset.toISOString())
    localStorage.setItem(recsKey, JSON.stringify(recs))
    setHasGeneratedToday(true)
  }, [user])

  const getNewRecommendations = useCallback(async (type = 'anime') => {
    if (!user) return
    
    // Check database cache first
    const cachedData = await getRecommendationCache(user.id, type, 'new')
    if (cachedData && cachedData.recommendations) {
      console.log('Loading recommendations from cache')
      setRecommendations(cachedData.recommendations)
      setHasGeneratedToday(true)
      return
    }
    
    // Check cooldown
    const { canGenerate, cached } = checkCooldown(type, 'new')
    if (!canGenerate && cached) {
      setRecommendations(cached)
      return
    }
    
    setLoading(true)
    setError(null)
    setNoRatings(false)
    setCooldownRemaining(null)
    
    try {
      // Fetch user preferences
      const userPrefs = await getUserPreferences(user.id)
      const favoriteGenres = userPrefs?.favorite_genres || []
      const excludedGenres = userPrefs?.excluded_genres || []
      const minScore = userPrefs?.min_score || 7.0
      
      const userList = type === 'anime' 
        ? await getUserAnimeListCache(user.id)
        : await getUserMangaListCache(user.id)
      
      const userListIds = new Set(
        userList.map(item => item.mal_anime_id || item.mal_manga_id)
      )
      
      let candidates = []
      if (type === 'anime') {
        const seasons = ['winter', 'spring', 'summer', 'fall']
        const currentYear = new Date().getFullYear()
        
        const randomSeasons = []
        for (let i = 0; i < 4; i++) {
          const randomYear = Math.floor(Math.random() * (currentYear - 2010 + 1)) + 2010
          const randomSeason = seasons[Math.floor(Math.random() * seasons.length)]
          randomSeasons.push({ year: randomYear, season: randomSeason })
        }
        
        const seasonalResults = await Promise.all(
          randomSeasons.map(({ year, season }) => 
            getSeasonalAnime(user.access_token, year, season, 50).catch(() => [])
          )
        )
        
        candidates = seasonalResults.flat()
      } else {
        const ranking = await getMangaRanking(user.access_token, 'all', 100)
        candidates = ranking
      }
      
      // Apply minimum score from user preferences
      let filtered = candidates.filter(item => {
        const score = item.node?.mean || 0
        return score >= minScore
      })
      
      if (type === 'anime') {
        const allowedMediaTypes = ['tv', 'movie']
        filtered = filtered.filter(item => {
          const mediaType = item.node?.media_type?.toLowerCase() || ''
          return allowedMediaTypes.includes(mediaType)
        })
      } else {
        const allowedMangaTypes = ['manga', 'light_novel', 'novel', 'one_shot', 'manhwa', 'doujinshi']
        filtered = filtered.filter(item => {
          const mediaType = item.node?.media_type?.toLowerCase() || ''
          return !mediaType || allowedMangaTypes.includes(mediaType)
        })
      }
      
      if (type === 'anime') {
        filtered = filtered.filter(item => {
          const genres = item.node?.genres || []
          const source = item.node?.source?.toLowerCase() || ''
          
          const isDonghua = genres.some(g => 
            (g.name || g).toLowerCase().includes('donghua')
          )
          
          const isChineseSource = source.includes('chinese') || source.includes('manhua')
          
          return !isDonghua && !isChineseSource
        })
      }
      
      filtered = filtered.filter(item => 
        !userListIds.has(item.node.id)
      )
      
      // Apply EXCLUDED genres from user preferences
      if (excludedGenres && excludedGenres.length > 0) {
        filtered = filtered.filter(item => {
          const itemGenres = item.node.genres || []
          const hasExcludedGenre = itemGenres.some(g => 
            excludedGenres.includes(g.id) || excludedGenres.includes(String(g.id))
          )
          return !hasExcludedGenre
        })
      }
      
      // Prioritize FAVORITE genres from user preferences
      let finalFiltered = filtered
      if (favoriteGenres && favoriteGenres.length > 0) {
        const withFavorites = filtered.filter(item =>
          item.node.genres?.some(g => 
            favoriteGenres.includes(g.id) || favoriteGenres.includes(String(g.id))
          )
        )
        const withoutFavorites = filtered.filter(item =>
          !item.node.genres?.some(g => 
            favoriteGenres.includes(g.id) || favoriteGenres.includes(String(g.id))
          )
        )
        
        const shuffledFavorites = shuffleArray(withFavorites)
        const shuffledOthers = shuffleArray(withoutFavorites)
        finalFiltered = [...shuffledFavorites, ...shuffledOthers]
      } else {
        finalFiltered = shuffleArray(filtered)
      }
      
      // Remove duplicates
      const uniqueIds = new Set()
      finalFiltered = finalFiltered.filter(item => {
        if (uniqueIds.has(item.node.id)) return false
        uniqueIds.add(item.node.id)
        return true
      })
      
      // Get collaborative filtering recommendations
      const userListIdArray = Array.from(userListIds)
      const collaborativeRecs = await getCollaborativeRecommendations(
        user.id,
        type,
        userListIdArray,
        20 // Get more candidates for hybrid scoring
      )
      
      // Convert filtered items to simple format for hybrid scoring
      const contentBasedItems = finalFiltered.map(item => ({
        id: item.node.id,
        ...item.node
      }))
      
      // Create hybrid recommendations (70% content-based, 30% collaborative)
      let hybridItems = contentBasedItems
      if (collaborativeRecs.length > 0) {
        hybridItems = createHybridRecommendations(
          contentBasedItems,
          collaborativeRecs,
          0.7 // 70% content weight
        )
      }
      
      // Fetch full details for collaborative recommendations not in content-based
      const collabItemIds = collaborativeRecs.map(r => r.itemId)
      const missingIds = collabItemIds.filter(id => 
        !contentBasedItems.some(item => item.id === id)
      )
      
      if (missingIds.length > 0) {
        const missingDetails = await Promise.all(
          missingIds.slice(0, 3).map(async (id) => {
            try {
              const details = type === 'anime'
                ? await getAnimeDetails(user.access_token, id)  
                : await getMangaDetails(user.access_token, id)
              return details
            } catch (err) {
              console.error(`Failed to fetch details for ${type} ${id}:`, err)
              return null
            }
          })
        )
        
        const validMissingItems = missingDetails
          .filter(Boolean)
          .map(item => ({
            id: item.id,
            ...item,
            collabScore: collaborativeRecs.find(r => r.itemId === item.id)?.score || 0
          }))
        
        // Add collaborative-only items to hybrid list
        hybridItems = [...hybridItems, ...validMissingItems]
      }
      
      // Pick top 5 and map to consistent format
      const topRecommendations = hybridItems.slice(0, 5).map(item => ({
        id: item.id,
        title: item.title,
        main_picture: item.main_picture,
        image_url: item.main_picture?.medium || item.main_picture?.large,
        score: item.mean,
        mean: item.mean,
        genres: item.genres || [],
        status: item.status,
        episodes: item.num_episodes,
        num_episodes: item.num_episodes,
        chapters: item.num_chapters,
        volumes: item.num_volumes,
        media_type: item.media_type,
        synopsis: item.synopsis,
        studios: item.studios,
        authors: item.authors,
        popularity: item.popularity,
        type
      }))
      
      setRecommendations(topRecommendations)
      
      // Save to database cache
      try {
        await saveRecommendationCache(user.id, type, 'new', topRecommendations, {
          algorithm: 'hybrid',
          contentWeight: 0.7,
          collaborativeUsed: collaborativeRecs.length > 0
        })
        console.log('Recommendations saved to database cache')
      } catch (cacheError) {
        console.error('Failed to cache recommendations:', cacheError)
        // Don't throw - caching failure shouldn't break recommendations
      }
      
      // Save cooldown
      saveCooldown(type, 'new', topRecommendations)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, checkCooldown, saveCooldown])

  const getRewatchRecommendations = useCallback(async (type = 'anime', genreFilter = null) => {
    if (!user) return
    
    // Check cooldown
    const { canGenerate, cached } = checkCooldown(type, 'rewatch')
    if (!canGenerate && cached) {
      setRecommendations(cached)
      return
    }
    
    setLoading(true)
    setError(null)
    setNoRatings(false)
    setCooldownRemaining(null)
    
    try {
      const userList = type === 'anime' 
        ? await getUserAnimeListCache(user.id)
        : await getUserMangaListCache(user.id)
      
      const ratedItems = userList.filter(item => 
        item.score > 0 && 
        (item.status === 'completed' || item.status === 'watching' || item.status === 'reading')
      )
      
      // Check user ratings
      if (ratedItems.length === 0) {
        setNoRatings(true)
        setRecommendations([])
        return
      }
      
      // Filter for items rated > 7 
      let eligibleItems = ratedItems.filter(item => item.score >= 7)
      
      if (eligibleItems.length === 0) {
        setRecommendations([])
        setError('No items rated 7 or higher found. Rate more anime/manga to get rewatch recommendations!')
        return
      }
      
      // Apply genre filter
      if (genreFilter && genreFilter.length > 0) {
        eligibleItems = eligibleItems.filter(item => 
          item.genres?.some(g => 
            genreFilter.includes(g.id) || genreFilter.includes(String(g.id))
          )
        )
      }
      
      // Shuffle and pick 5 rec..
      const shuffled = shuffleArray(eligibleItems)
      const selected = shuffled.slice(0, 5).map(item => ({
        id: type === 'anime' ? item.mal_anime_id : item.mal_manga_id,
        title: item.title,
        image_url: item.image_url,
        main_picture: { medium: item.image_url, large: item.image_url },
        score: item.score,
        mean: item.score,
        genres: item.genres || [],
        status: item.status,
        type,
        isRewatch: true,
        userScore: item.score
      }))
      
      setRecommendations(selected)
      
      saveCooldown(type, 'rewatch', selected)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, checkCooldown, saveCooldown])

  const loadCachedRecommendations = useCallback((type, mode) => {
    if (!user) return { hasCached: false }
    
    const { canGenerate, cached } = checkCooldown(type, mode)
    
    if (!canGenerate && cached) {
      setRecommendations(cached)
      setHasGeneratedToday(true)
      return { hasCached: true }
    }
    
    // No cache - clear recommendations
    setRecommendations([])
    setHasGeneratedToday(false)
    return { hasCached: false }
  }, [user, checkCooldown])

  const clearRecommendations = useCallback(() => {
    setRecommendations([])
    setError(null)
    setNoRatings(false)
    setCooldownRemaining(null)
    setHasGeneratedToday(false)
  }, [])

  return {
    recommendations,
    loading,
    error,
    noRatings,
    cooldownRemaining,
    hasGeneratedToday,
    getTimeUntilReset,
    formatCountdown,
    getNewRecommendations,
    getRewatchRecommendations,
    clearRecommendations,
    loadCachedRecommendations
  }
}

export default useRecommendations
