-- Precomputed recommendations cache table
-- This enables fast recommendation retrieval without recalculation

CREATE TABLE IF NOT EXISTS recommendation_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Recommendation type
  type VARCHAR(10) CHECK (type IN ('anime', 'manga')),
  mode VARCHAR(20) CHECK (mode IN ('new', 'rewatch')),
  
  -- Algorithm used
  algorithm VARCHAR(50) CHECK (algorithm IN ('hybrid', 'collaborative', 'content_based', 'semantic', 'simple')),
  
  -- Cached recommendations (array of anime/manga objects)
  recommendations JSONB NOT NULL,
  
  -- Confidence scores for each recommendation (array matching recommendations)
  confidence_scores JSONB,
  
  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '12 hours'),
  
  -- Preference snapshot (to detect if preferences changed)
  preferences_snapshot JSONB,
  
  -- Statistics
  computation_time_ms INTEGER,
  
  -- Ensure one cache per user/type/mode/algorithm combination
  UNIQUE(user_id, type, mode, algorithm)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rec_cache_user_type ON recommendation_cache(user_id, type, mode);
CREATE INDEX IF NOT EXISTS idx_rec_cache_expiry ON recommendation_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_rec_cache_algorithm ON recommendation_cache(algorithm);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM recommendation_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (can be called via cron or manually)
-- Note: Supabase supports pg_cron for scheduled tasks

-- Add comments
COMMENT ON TABLE recommendation_cache IS 'Caches precomputed recommendations for performance';
COMMENT ON COLUMN recommendation_cache.confidence_scores IS 'Confidence scores (0-1) for each recommendation indicating match quality';
