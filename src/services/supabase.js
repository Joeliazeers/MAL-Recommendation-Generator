import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User operations
export const upsertUser = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      mal_id: userData.mal_id,
      username: userData.username,
      avatar_url: userData.avatar_url,
      access_token: userData.access_token,
      refresh_token: userData.refresh_token,
      token_expires_at: userData.token_expires_at,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'mal_id'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getUserByMalId = async (malId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('mal_id', malId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const updateUserTokens = async (malId, tokens) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.token_expires_at,
      updated_at: new Date().toISOString()
    })
    .eq('mal_id', malId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Anime list operations
export const cacheUserAnimeList = async (userId, animeList) => {
  // Delete existing cache
  await supabase
    .from('user_anime_list')
    .delete()
    .eq('user_id', userId)
  
  // Insert new cache
  if (animeList.length === 0) return []
  
  const records = animeList.map(item => ({
    user_id: userId,
    mal_anime_id: item.node.id,
    title: item.node.title,
    image_url: item.node.main_picture?.medium || item.node.main_picture?.large,
    score: item.list_status?.score || 0,
    status: item.list_status?.status,
    genres: item.node.genres || [],
    // Extended metadata
    synopsis: item.node.synopsis || null,
    studios: item.node.studios || [],
    mean_score: item.node.mean || null,
    popularity: item.node.popularity || null,
    season: item.node.start_season?.season || null,
    year: item.node.start_season?.year || null,
    num_episodes: item.node.num_episodes || null,
    media_type: item.node.media_type || null,
    cached_at: new Date().toISOString()
  }))
  
  const { data, error } = await supabase
    .from('user_anime_list')
    .insert(records)
    .select()
  
  if (error) throw error
  return data
}

export const getUserAnimeListCache = async (userId) => {
  const { data, error } = await supabase
    .from('user_anime_list')
    .select('*')
    .eq('user_id', userId)
  
  if (error) throw error
  return data || []
}

// Manga list operations
export const cacheUserMangaList = async (userId, mangaList) => {
  // Delete existing cache
  await supabase
    .from('user_manga_list')
    .delete()
    .eq('user_id', userId)
  
  // Insert new cache
  if (mangaList.length === 0) return []
  
  const records = mangaList.map(item => ({
    user_id: userId,
    mal_manga_id: item.node.id,
    title: item.node.title,
    image_url: item.node.main_picture?.medium || item.node.main_picture?.large,
    score: item.list_status?.score || 0,
    status: item.list_status?.status,
    genres: item.node.genres || [],
    // Extended metadata
    synopsis: item.node.synopsis || null,
    authors: item.node.authors || [],
    mean_score: item.node.mean || null,
    popularity: item.node.popularity || null,
    num_chapters: item.node.num_chapters || null,
    num_volumes: item.node.num_volumes || null,
    media_type: item.node.media_type || null,
    cached_at: new Date().toISOString()
  }))
  
  const { data, error } = await supabase
    .from('user_manga_list')
    .insert(records)
    .select()
  
  if (error) throw error
  return data
}

export const getUserMangaListCache = async (userId) => {
  const { data, error } = await supabase
    .from('user_manga_list')
    .select('*')
    .eq('user_id', userId)
  
  if (error) throw error
  return data || []
}

// Shared Recommendations
const generateShareCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const createSharedRecommendation = async (userId, type, mode, recommendations) => {
  const shareCode = generateShareCode()
  
  const { data, error } = await supabase
    .from('shared_recommendations')
    .insert({
      share_code: shareCode,
      type,
      mode,
      recommendations,
      created_by: userId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getSharedRecommendation = async (shareCode) => {
  const { data, error } = await supabase
    .from('shared_recommendations')
    .select('*')
    .eq('share_code', shareCode)
    .single()
  
  if (error) throw error
  return data
}

// ========== USER PREFERENCES ==========

export const getUserPreferences = async (userId) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
  return data || null
}

export const saveUserPreferences = async (userId, preferences) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      favorite_genres: preferences.favorite_genres || [],
      excluded_genres: preferences.excluded_genres || [],
      preferred_studios: preferences.preferred_studios || [],
      preferred_authors: preferences.preferred_authors || [],
      min_score: preferences.min_score || 7.0,
      preferred_media_types: preferences.preferred_media_types || [],
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ========== USER FEEDBACK ==========

export const saveFeedback = async (userId, itemId, itemType, feedbackType, rating = null) => {
  const feedbackData = {
    user_id: userId,
    item_type: itemType,
    feedback_type: feedbackType,
    rating,
    created_at: new Date().toISOString()
  }
  
  if (itemType === 'anime') {
    feedbackData.anime_id = itemId
    feedbackData.manga_id = null
  } else {
    feedbackData.manga_id = itemId
    feedbackData.anime_id = null
  }
  
  const { data, error } = await supabase
    .from('user_feedback')
    .upsert(feedbackData, {
      onConflict: itemType === 'anime' ? 'user_id,anime_id' : 'user_id,manga_id'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getUserFeedback = async (userId, itemType = null) => {
  let query = supabase
    .from('user_feedback')
    .select('*')
    .eq('user_id', userId)
  
  if (itemType) {
    query = query.eq('item_type', itemType)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const getFeedbackForItem = async (userId, itemId, itemType) => {
  const column = itemType === 'anime' ? 'anime_id' : 'manga_id'
  
  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('user_id', userId)
    .eq(column, itemId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

// ========== RECOMMENDATION CACHING ==========

export const saveRecommendationCache = async (userId, itemType, mode, recommendations, metadata = {}) => {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 12) // Cache for 12 hours
  
  const { data, error } = await supabase
    .from('recommendation_cache')
    .upsert({
      user_id: userId,
      item_type: itemType,
      mode,
      recommendations,
      metadata,
      generated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    }, {
      onConflict: 'user_id,item_type,mode'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getRecommendationCache = async (userId, itemType, mode) => {
  const { data, error } = await supabase
    .from('recommendation_cache')
    .select('*')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('mode', mode)
    .gt('expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine
    return null
  }
  
  return data
}

export const invalidateRecommendationCache = async (userId, itemType = null) => {
  let query = supabase
    .from('recommendation_cache')
    .delete()
    .eq('user_id', userId)
  
  if (itemType) {
    query = query.eq('item_type', itemType)
  }
  
  const { error } = await query
  if (error) throw error
  
  return true
}

export const cleanExpiredCache = async () => {
  const { error } = await supabase
    .from('recommendation_cache')
    .delete()
    .lt('expires_at', new Date().toISOString())
  
  if (error) throw error
  return true
}
