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

