-- Performance indexes for faster recommendation queries
-- Phase 6: Performance & Caching

-- Index for collaborative filtering (finding similar users)
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_type 
  ON user_feedback(user_id, feedback_type) 
  WHERE feedback_type = 'like';

-- Index for item lookups in feedback
CREATE INDEX IF NOT EXISTS idx_user_feedback_anime_lookup 
  ON user_feedback(anime_id) 
  WHERE anime_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_feedback_manga_lookup 
  ON user_feedback(manga_id) 
  WHERE manga_id IS NOT NULL;

-- Index for recommendation cache retrieval
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_lookup 
  ON recommendation_cache(user_id, item_type, generated_at DESC);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_expiry 
  ON recommendation_cache(expires_at) 
  WHERE expires_at > NOW();

-- Index for user preferences lookup
CREATE INDEX IF NOT EXISTS idx_user_preferences_user 
  ON user_preferences(user_id);

-- Composite index for feedback analysis
CREATE INDEX IF NOT EXISTS idx_user_feedback_composite 
  ON user_feedback(user_id, feedback_type, created_at DESC);

-- Add comment for documentation
COMMENT ON INDEX idx_user_feedback_user_type IS 'Speeds up collaborative filtering queries for finding similar users';
COMMENT ON INDEX idx_recommendation_cache_lookup IS 'Optimizes cache retrieval for recommendations';
