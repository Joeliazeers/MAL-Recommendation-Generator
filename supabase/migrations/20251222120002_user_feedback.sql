-- User feedback table for tracking likes, dislikes, and ratings
-- This enables collaborative filtering and feedback loops

CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Item reference (either anime or manga)
  anime_id BIGINT,
  manga_id BIGINT,
  item_type VARCHAR(10) CHECK (item_type IN ('anime', 'manga')),
  
  -- Feedback type
  feedback_type VARCHAR(20) CHECK (feedback_type IN ('like', 'dislike', 'watch_later', 'completed', 'dismissed')),
  
  -- Optional rating (1-10 scale to match MAL)
  rating INTEGER CHECK (rating IS NULL OR (rating BETWEEN 1 AND 10)),
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (
    (anime_id IS NOT NULL AND manga_id IS NULL AND item_type = 'anime') OR
    (manga_id IS NOT NULL AND anime_id IS NULL AND item_type = 'manga')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_anime ON user_feedback(anime_id) WHERE anime_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_feedback_manga ON user_feedback(manga_id) WHERE manga_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(user_id, item_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created ON user_feedback(created_at DESC);

-- Prevent duplicate feedback for same item
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_feedback_unique_anime 
  ON user_feedback(user_id, anime_id) 
  WHERE anime_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_feedback_unique_manga 
  ON user_feedback(user_id, manga_id) 
  WHERE manga_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON TABLE user_feedback IS 'Tracks user feedback (likes, dislikes, ratings) for improving recommendations';
