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
    // Use server-side RPC function for better performance
    const { data, error } = await supabase.rpc('match_similar_users', {
      target_user_id: userId,
      item_type: itemType,
      min_similarity: minSimilarity,
      limit_count: 10
    })
    
    if (error) throw error
    
    // Transform to match expected format
    return (data || []).map(row => ({
      userId: row.user_id,
      similarity: row.similarity,
      sharedLikes: row.shared_likes
    }))
    
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
    // Use optimized server-side RPC function
    const { data, error } = await supabase.rpc('get_collaborative_recommendations', {
      target_user_id: userId,
      item_type: itemType,
      user_list_ids: userListIds,
      limit_count: limit
    })
    
    if (error) throw error
    
    // Transform to match expected format
    return (data || []).map(row => ({
      itemId: row.item_id,
      score: row.score,
      count: row.liked_by_count,
      avgSimilarity: row.score / row.liked_by_count
    }))
    
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
