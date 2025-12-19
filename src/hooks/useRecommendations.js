import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  getAnimeRanking, 
  getMangaRanking, 
  getAnimeSuggestions,
  getSeasonalAnime
} from '../services/malApi'
import { 
  getUserAnimeListCache, 
  getUserMangaListCache 
} from '../services/supabase'

// Debug flag - set to true to disable cooldown during development
const DEBUG_MODE = false

// Helper to shuffle array (Fisher-Yates)
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Get next midnight (00:00 AM) in local time
const getNextMidnight = () => {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0) // Next midnight
  return midnight
}

// Calculate time remaining until midnight in ms
const getTimeUntilMidnight = () => {
  return getNextMidnight().getTime() - Date.now()
}

// Format milliseconds to HH:MM:SS
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

  // Check and load cached recommendations on mount
  const checkCooldown = useCallback((type, mode) => {
    if (!user || DEBUG_MODE) return { canGenerate: true, cached: null }
    
    const cooldownKey = getCooldownKey(user.id, type, mode)
    const recsKey = getRecsKey(user.id, type, mode)
    
    const cooldownData = localStorage.getItem(cooldownKey)
    if (!cooldownData) return { canGenerate: true, cached: null }
    
    const cooldownTime = new Date(cooldownData)
    const now = new Date()
    
    if (now >= cooldownTime) {
      // Cooldown expired (past midnight)
      localStorage.removeItem(cooldownKey)
      localStorage.removeItem(recsKey)
      return { canGenerate: true, cached: null }
    }
    
    // Still in cooldown - load cached recommendations
    const cachedRecs = localStorage.getItem(recsKey)
    return { 
      canGenerate: false, 
      cached: cachedRecs ? JSON.parse(cachedRecs) : null,
      isOnCooldown: true
    }
  }, [user])

  // Save recommendations and set cooldown until midnight
  const saveCooldown = useCallback((type, mode, recs) => {
    if (!user || DEBUG_MODE) return
    
    const cooldownKey = getCooldownKey(user.id, type, mode)
    const recsKey = getRecsKey(user.id, type, mode)
    
    // Set cooldown to expire at next midnight
    const midnight = getNextMidnight()
    localStorage.setItem(cooldownKey, midnight.toISOString())
    localStorage.setItem(recsKey, JSON.stringify(recs))
    setHasGeneratedToday(true)
  }, [user])

  const getNewRecommendations = useCallback(async (type = 'anime', genreFilter = null) => {
    if (!user) return
    
    // Check cooldown (skip in debug mode)
    const { canGenerate, cached, hoursRemaining } = checkCooldown(type, 'new')
    if (!canGenerate && cached) {
      setRecommendations(cached)
      setCooldownRemaining(hoursRemaining)
      return
    }
    
    setLoading(true)
    setError(null)
    setNoRatings(false)
    setCooldownRemaining(null)
    
    try {
      // Get user's existing list from cache
      const userList = type === 'anime' 
        ? await getUserAnimeListCache(user.id)
        : await getUserMangaListCache(user.id)
      
      // Create set of anime IDs user has watched/completed/plan to watch
      const userListIds = new Set(
        userList.map(item => 
          type === 'anime' ? item.mal_anime_id : item.mal_manga_id
        )
      )
      
      let candidates = []
      
      if (type === 'anime') {
        // CUSTOM RECOMMENDATION SYSTEM
        // Fetch seasonal anime from random years to build diverse pool
        const currentYear = new Date().getFullYear()
        const seasons = ['winter', 'spring', 'summer', 'fall']
        
        // Pick 4 random year/season combinations from 2010 to current year
        const randomSeasons = []
        for (let i = 0; i < 4; i++) {
          const randomYear = Math.floor(Math.random() * (currentYear - 2010 + 1)) + 2010
          const randomSeason = seasons[Math.floor(Math.random() * seasons.length)]
          randomSeasons.push({ year: randomYear, season: randomSeason })
        }
        
        // Fetch anime from each random season
        const seasonalResults = await Promise.all(
          randomSeasons.map(({ year, season }) => 
            getSeasonalAnime(user.access_token, year, season, 50).catch(() => [])
          )
        )
        
        // Combine all results
        candidates = seasonalResults.flat()
      } else {
        // For manga, use rankings since there's no seasonal manga API
        const ranking = await getMangaRanking(user.access_token, 'all', 100)
        candidates = ranking
      }
      
      // FILTER 1: Only pick items with score >= 7
      let filtered = candidates.filter(item => {
        const score = item.node?.mean || 0
        return score >= 7
      })
      
      // FILTER 2: Exclude OVA, ONA, special episodes (anime only)
      if (type === 'anime') {
        const allowedMediaTypes = ['tv', 'movie']
        filtered = filtered.filter(item => {
          const mediaType = item.node?.media_type?.toLowerCase() || ''
          return allowedMediaTypes.includes(mediaType)
        })
      } else {
        // For manga, allow manga, light_novel, one_shot
        const allowedMangaTypes = ['manga', 'light_novel', 'novel', 'one_shot', 'manhwa', 'doujinshi']
        filtered = filtered.filter(item => {
          const mediaType = item.node?.media_type?.toLowerCase() || ''
          // If no media_type, include it (some manga may not have this field)
          return !mediaType || allowedMangaTypes.includes(mediaType)
        })
      }
      
      // FILTER 3: Exclude donghua/manhua (anime only - Chinese animation)
      if (type === 'anime') {
        filtered = filtered.filter(item => {
          const genres = item.node?.genres || []
          const source = item.node?.source?.toLowerCase() || ''
          
          // Check if any genre contains "donghua" or similar indicators
          const isDonghua = genres.some(g => 
            (g.name || g).toLowerCase().includes('donghua')
          )
          
          // Check source for Chinese novel/manhua adaptations
          const isChineseSource = source.includes('chinese') || source.includes('manhua')
          
          return !isDonghua && !isChineseSource
        })
      }
      
      // FILTER 4: Remove anime user has already watched/completed
      filtered = filtered.filter(item => 
        !userListIds.has(item.node.id)
      )
      
      // FILTER 5: Apply genre filter if specified (match any selected genre)
      if (genreFilter && genreFilter.length > 0) {
        filtered = filtered.filter(item => 
          item.node.genres?.some(g => 
            genreFilter.includes(g.id) || genreFilter.includes(String(g.id))
          )
        )
      }
      
      // Remove duplicates (same anime might appear in multiple seasons)
      const uniqueIds = new Set()
      filtered = filtered.filter(item => {
        if (uniqueIds.has(item.node.id)) return false
        uniqueIds.add(item.node.id)
        return true
      })
      
      // RANDOMIZE: Shuffle all eligible anime and pick 5
      const shuffled = shuffleArray(filtered)
      const topRecommendations = shuffled.slice(0, 5).map(item => ({
        id: item.node.id,
        title: item.node.title,
        main_picture: item.node.main_picture,
        image_url: item.node.main_picture?.medium || item.node.main_picture?.large,
        score: item.node.mean,
        mean: item.node.mean,
        genres: item.node.genres || [],
        status: item.node.status,
        episodes: item.node.num_episodes,
        num_episodes: item.node.num_episodes,
        chapters: item.node.num_chapters,
        volumes: item.node.num_volumes,
        media_type: item.node.media_type,
        type
      }))
      
      setRecommendations(topRecommendations)
      
      // Save cooldown (only if not in debug mode)
      saveCooldown(type, 'new', topRecommendations)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, checkCooldown, saveCooldown])

  const getRewatchRecommendations = useCallback(async (type = 'anime', genreFilter = null) => {
    if (!user) return
    
    // Check cooldown (skip in debug mode)
    const { canGenerate, cached, hoursRemaining } = checkCooldown(type, 'rewatch')
    if (!canGenerate && cached) {
      setRecommendations(cached)
      setCooldownRemaining(hoursRemaining)
      return
    }
    
    setLoading(true)
    setError(null)
    setNoRatings(false)
    setCooldownRemaining(null)
    
    try {
      // Get user's list from cache
      const userList = type === 'anime' 
        ? await getUserAnimeListCache(user.id)
        : await getUserMangaListCache(user.id)
      
      // Filter for completed/watched items with ratings
      const ratedItems = userList.filter(item => 
        item.score > 0 && 
        (item.status === 'completed' || item.status === 'watching' || item.status === 'reading')
      )
      
      // Check if user has any ratings
      if (ratedItems.length === 0) {
        setNoRatings(true)
        setRecommendations([])
        return
      }
      
      // Filter for items rated > 7 (exclude disliked items < 5-6)
      let eligibleItems = ratedItems.filter(item => item.score >= 7)
      
      // If no items >= 7, show message
      if (eligibleItems.length === 0) {
        setRecommendations([])
        setError('No items rated 7 or higher found. Rate more anime/manga to get rewatch recommendations!')
        return
      }
      
      // Apply genre filter if specified (match any selected genre)
      if (genreFilter && genreFilter.length > 0) {
        eligibleItems = eligibleItems.filter(item => 
          item.genres?.some(g => 
            genreFilter.includes(g.id) || genreFilter.includes(String(g.id))
          )
        )
      }
      
      // Shuffle and take up to 5 random recommendations
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
      
      // Save cooldown (only if not in debug mode)
      saveCooldown(type, 'rewatch', selected)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, checkCooldown, saveCooldown])

  // Load cached recommendations for a specific type/mode (used when switching tabs or on page load)
  const loadCachedRecommendations = useCallback((type, mode) => {
    if (!user) return { hasCached: false }
    
    const { canGenerate, cached, isOnCooldown } = checkCooldown(type, mode)
    
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
    getTimeUntilMidnight,
    formatCountdown,
    getNewRecommendations,
    getRewatchRecommendations,
    clearRecommendations,
    loadCachedRecommendations
  }
}

export default useRecommendations
