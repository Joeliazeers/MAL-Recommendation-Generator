-- Add missing indexes identified by query performance analysis
-- These indexes will significantly speed up user-specific queries

-- Index for user_anime_list lookups by user_id
-- Recommended by PostgreSQL index advisor (22% cost reduction)
CREATE INDEX IF NOT EXISTS idx_user_anime_list_user_id 
  ON user_anime_list(user_id);

-- Index for user_manga_list lookups by user_id (same pattern)
CREATE INDEX IF NOT EXISTS idx_user_manga_list_user_id 
  ON user_manga_list(user_id);

-- Add comments for documentation
COMMENT ON INDEX idx_user_anime_list_user_id IS 'Optimizes SELECT/DELETE queries filtering by user_id';
COMMENT ON INDEX idx_user_manga_list_user_id IS 'Optimizes SELECT/DELETE queries filtering by user_id';
