// Collaborative Filtering Engine
// Finds similar users based on feedback patterns and recommends items they liked

import { supabase } from './supabase'

/**
 * Calculate similarity between two users based on their feedback
 * Uses Jaccard similarity: intersection / union of liked items
 */
const calculateUserSimilarity = (userALikes, userBLikes) => {
  const setA = new Set(userALikes)
  const setB = new Set(userBLikes)
  
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  
  if (union === 0) return 0
  return intersection / union
}

/**
 * Find users with similar taste based on feedback patterns
 * @param {string} userId - Current user's ID
 * @param {string} itemType - 'anime' or 'manga'
 * @param {number} minSimilarity - Minimum similarity score (0-1)
 * @returns {Array} Array of similar user IDs with similarity scores
 */
export const findSimilarUsers = async (userId, itemType = 'anime', minSimilarity = 0.2) => {
  try {
    // Get current user's likes
    const { data: userFeedback, error: userError } = await supabase
      .from('user_feedback')
      .select('anime_id, manga_id')
      .eq('user_id', userId)
      .eq('feedback_type', 'like')
    
    if (userError) throw userError
    
    const userLikes = userFeedback
      .map(f => itemType === 'anime' ? f.anime_id : f.manga_id)
      .filter(Boolean)
    
    if (userLikes.length === 0) {
      return [] // No likes yet, can't find similar users
    }
    
    // Get all other users' likes
    const { data: allFeedback, error: allError } = await supabase
      .from('user_feedback')
      .select('user_id, anime_id, manga_id')
      .neq('user_id', userId)
      .eq('feedback_type', 'like')
    
    if (allError) throw allError
    
    // Group likes by user
    const userLikesMap = {}
    allFeedback.forEach(f => {
      const itemId = itemType === 'anime' ? f.anime_id : f.manga_id
      if (!itemId) return
      
      if (!userLikesMap[f.user_id]) {
        userLikesMap[f.user_id] = []
      }
      userLikesMap[f.user_id].push(itemId)
    })
    
    // Calculate similarity with each user
    const similarities = Object.entries(userLikesMap).map(([otherUserId, otherLikes]) => ({
      userId: otherUserId,
      similarity: calculateUserSimilarity(userLikes, otherLikes),
      sharedLikes: [...new Set(userLikes)].filter(x => otherLikes.includes(x)).length
    }))
    
    // Filter and sort by similarity
    return similarities
      .filter(s => s.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10) // Top 10 similar users
    
  } catch (error) {
    console.error('Error finding similar users:', error)
    return []
  }
}

/**
 * Get collaborative filtering recommendations
 * @param {string} userId - Current user's ID
 * @param {string} itemType - 'anime' or 'manga'
 * @param {Array} userListIds - IDs of items already in user's list
 * @param {number} limit - Number of recommendations to return
 * @returns {Array} Array of recommended item IDs with scores
 */
export const getCollaborativeRecommendations = async (
  userId, 
  itemType = 'anime', 
  userListIds = [], 
  limit = 10
) => {
  try {
    // Find similar users
    const similarUsers = await findSimilarUsers(userId, itemType, 0.2)
    
    if (similarUsers.length === 0) {
      return [] // No similar users found
    }
    
    // Get items liked by similar users
    const similarUserIds = similarUsers.map(u => u.userId)
    
    const { data: recommendations, error } = await supabase
      .from('user_feedback')
      .select('anime_id, manga_id, user_id')
      .in('user_id', similarUserIds)
      .eq('feedback_type', 'like')
    
    if (error) throw error
    
    // Get current user's dislikes to exclude
    const { data: userDislikes } = await supabase
      .from('user_feedback')
      .select('anime_id, manga_id')
      .eq('user_id', userId)
      .eq('feedback_type', 'dislike')
    
    const dislikedIds = new Set(
      (userDislikes || [])
        .map(f => itemType === 'anime' ? f.anime_id : f.manga_id)
        .filter(Boolean)
    )
    
    // Score items based on how many similar users liked them
    const itemScores = {}
    const userSimilarityMap = {}
    similarUsers.forEach(u => {
      userSimilarityMap[u.userId] = u.similarity
    })
    
    recommendations.forEach(rec => {
      const itemId = itemType === 'anime' ? rec.anime_id : rec.manga_id
      if (!itemId) return
      
      // Skip items in user's list or disliked
      if (userListIds.includes(itemId) || dislikedIds.has(itemId)) return
      
      const similarity = userSimilarityMap[rec.user_id] || 0
      if (!itemScores[itemId]) {
        itemScores[itemId] = { score: 0, count: 0 }
      }
      itemScores[itemId].score += similarity
      itemScores[itemId].count += 1
    })
    
    // Convert to array and sort by score
    const scoredItems = Object.entries(itemScores).map(([itemId, data]) => ({
      itemId: parseInt(itemId),
      score: data.score,
      count: data.count,
      avgSimilarity: data.score / data.count
    }))
    
    return scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
  } catch (error) {
    console.error('Error getting collaborative recommendations:', error)
    return []
  }
}

/**
 * Create hybrid recommendations combining content-based and collaborative filtering
 * @param {Array} contentBased - Content-based recommendations
 * @param {Array} collaborative - Collaborative filtering recommendations  
 * @param {number} contentWeight - Weight for content-based (0-1)
 * @returns {Array} Hybrid recommendations
 */
export const createHybridRecommendations = (
  contentBased = [], 
  collaborative = [], 
  contentWeight = 0.7
) => {
  const collabWeight = 1 - contentWeight
  
  // Create a map of all items with their scores
  const itemScores = {}
  
  // Add content-based scores
  contentBased.forEach((item, index) => {
    const score = (contentBased.length - index) / contentBased.length
    itemScores[item.id] = {
      ...item,
      contentScore: score * contentWeight,
      collabScore: 0,
      hybridScore: score * contentWeight
    }
  })
  
  // Add collaborative scores
  collaborative.forEach(rec => {
    const normalizedScore = rec.score / Math.max(...collaborative.map(r => r.score || 1))
    
    if (itemScores[rec.itemId]) {
      itemScores[rec.itemId].collabScore = normalizedScore * collabWeight
      itemScores[rec.itemId].hybridScore += normalizedScore * collabWeight
    }
  })
  
  // Sort by hybrid score
  return Object.values(itemScores)
    .sort((a, b) => b.hybridScore - a.hybridScore)
}
