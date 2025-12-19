// Use proxy paths to bypass CORS during development
const MAL_API_URL = '/api/mal/v2'
const MAL_AUTH_URL = 'https://myanimelist.net/v1/oauth2' // Keep this for auth redirect
const MAL_TOKEN_URL = '/api/mal/oauth2'

const CLIENT_ID = import.meta.env.VITE_MAL_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_MAL_CLIENT_SECRET
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI

// PKCE Helper Functions
const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// MAL uses plain challenge method (code_verifier === code_challenge)
export const generateCodeVerifier = () => {
  return generateRandomString(128)
}

export const generateCodeChallenge = (codeVerifier) => {
  // MAL uses 'plain' method, so challenge equals verifier
  return codeVerifier
}

// OAuth Functions
export const getAuthUrl = () => {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  
  // Store code verifier in localStorage for callback (persists across redirects)
  localStorage.setItem('mal_code_verifier', codeVerifier)
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    code_challenge: codeChallenge,
    code_challenge_method: 'plain',
    redirect_uri: REDIRECT_URI,
    state: generateRandomString(16)
  })
  
  return `${MAL_AUTH_URL}/authorize?${params.toString()}`
}

export const exchangeCodeForToken = async (code) => {
  const codeVerifier = localStorage.getItem('mal_code_verifier')
  
  if (!codeVerifier) {
    throw new Error('Code verifier not found')
  }
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier
  })
  
  const response = await fetch(`${MAL_TOKEN_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to exchange code for token')
  }
  
  // Clear code verifier after successful exchange
  localStorage.removeItem('mal_code_verifier')
  
  const data = await response.json()
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
  }
}

export const refreshAccessToken = async (refreshToken) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })
  
  const response = await fetch(`${MAL_TOKEN_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })
  
  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }
  
  const data = await response.json()
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
  }
}

// API Helper
const apiRequest = async (endpoint, accessToken, params = {}) => {
  // Build URL with query params (works with relative paths for proxy)
  const queryString = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryString.append(key, value)
    }
  })
  
  const url = `${MAL_API_URL}${endpoint}${queryString.toString() ? `?${queryString.toString()}` : ''}`
  
  const headers = accessToken 
    ? { 'Authorization': `Bearer ${accessToken}` }
    : { 'X-MAL-CLIENT-ID': CLIENT_ID }
  
  const response = await fetch(url, { headers })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API request failed: ${response.status}`)
  }
  
  return response.json()
}

// User API
export const getUserInfo = async (accessToken) => {
  return apiRequest('/users/@me', accessToken, {
    fields: 'id,name,picture,gender,joined_at,anime_statistics,manga_statistics'
  })
}

// Anime API
export const getUserAnimeList = async (accessToken, status = null, limit = 1000) => {
  const allItems = []
  let offset = 0
  const batchSize = 100
  
  while (offset < limit) {
    const params = {
      fields: 'list_status,id,title,main_picture,genres,mean,status,num_episodes,media_type',
      limit: Math.min(batchSize, limit - offset),
      offset,
      sort: 'list_updated_at'
    }
    if (status) params.status = status
    
    const data = await apiRequest('/users/@me/animelist', accessToken, params)
    allItems.push(...(data.data || []))
    
    if (!data.paging?.next) break
    offset += batchSize
  }
  
  return allItems
}

export const getAnimeRanking = async (accessToken, type = 'all', limit = 100) => {
  const data = await apiRequest('/anime/ranking', accessToken, {
    ranking_type: type,
    limit,
    fields: 'id,title,main_picture,genres,mean,status,num_episodes,media_type'
  })
  return data.data || []
}

export const getAnimeSuggestions = async (accessToken, limit = 100) => {
  const data = await apiRequest('/anime/suggestions', accessToken, {
    limit,
    fields: 'id,title,main_picture,genres,mean,status,num_episodes,media_type'
  })
  return data.data || []
}

export const getSeasonalAnime = async (accessToken, year, season, limit = 100) => {
  const data = await apiRequest(`/anime/season/${year}/${season}`, accessToken, {
    limit,
    fields: 'id,title,main_picture,genres,mean,status,num_episodes,media_type'
  })
  return data.data || []
}

export const searchAnime = async (accessToken, query, limit = 100) => {
  const data = await apiRequest('/anime', accessToken, {
    q: query,
    limit,
    fields: 'id,title,main_picture,genres,mean,status,num_episodes,media_type'
  })
  return data.data || []
}

// Get detailed anime info for modal
export const getAnimeDetails = async (accessToken, animeId) => {
  const data = await apiRequest(`/anime/${animeId}`, accessToken, {
    fields: 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_episodes,start_season,broadcast,source,average_episode_duration,rating,studios,genres,media_type,status'
  })
  return data
}

// Get detailed manga info for modal
export const getMangaDetails = async (accessToken, mangaId) => {
  const data = await apiRequest(`/manga/${mangaId}`, accessToken, {
    fields: 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_chapters,num_volumes,authors,genres,media_type,status'
  })
  return data
}

// Add anime to user's list (Plan to Watch, Watching, etc.)
export const addAnimeToList = async (accessToken, animeId, status = 'plan_to_watch') => {
  const url = `${MAL_API_URL}/anime/${animeId}/my_list_status`
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ status })
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to add anime to list')
  }
  
  return response.json()
}

// Add manga to user's list (Plan to Read, Reading, etc.)
export const addMangaToList = async (accessToken, mangaId, status = 'plan_to_read') => {
  const url = `${MAL_API_URL}/manga/${mangaId}/my_list_status`
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ status })
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to add manga to list')
  }
  
  return response.json()
}

// Manga API
export const getUserMangaList = async (accessToken, status = null, limit = 1000) => {
  const allItems = []
  let offset = 0
  const batchSize = 100
  
  while (offset < limit) {
    const params = {
      fields: 'list_status,id,title,main_picture,genres,mean,status,num_chapters,num_volumes,media_type',
      limit: Math.min(batchSize, limit - offset),
      offset,
      sort: 'list_updated_at'
    }
    if (status) params.status = status
    
    const data = await apiRequest('/users/@me/mangalist', accessToken, params)
    allItems.push(...(data.data || []))
    
    if (!data.paging?.next) break
    offset += batchSize
  }
  
  return allItems
}

export const getMangaRanking = async (accessToken, type = 'all', limit = 100) => {
  const data = await apiRequest('/manga/ranking', accessToken, {
    ranking_type: type,
    limit,
    fields: 'id,title,main_picture,genres,mean,status,num_chapters,num_volumes,media_type'
  })
  return data.data || []
}

export const searchManga = async (accessToken, query, limit = 100) => {
  const data = await apiRequest('/manga', accessToken, {
    q: query,
    limit,
    fields: 'id,title,main_picture,genres,mean,status,num_chapters,num_volumes,media_type'
  })
  return data.data || []
}

// Genre list (MAL genres)
export const ANIME_GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horror' },
  { id: 7, name: 'Mystery' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Supernatural' },
  { id: 41, name: 'Thriller' }
]

export const MANGA_GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horror' },
  { id: 7, name: 'Mystery' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Supernatural' },
  { id: 41, name: 'Thriller' }
]
