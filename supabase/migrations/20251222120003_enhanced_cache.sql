-- Enhance user_anime_list table with additional metadata
-- This enables content-based filtering and better recommendations

ALTER TABLE user_anime_list
  ADD COLUMN IF NOT EXISTS synopsis TEXT,
  ADD COLUMN IF NOT EXISTS studios JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mean_score DECIMAL,
  ADD COLUMN IF NOT EXISTS popularity INTEGER,
  ADD COLUMN IF NOT EXISTS season VARCHAR(20),
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS num_episodes INTEGER,
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(50);

-- Enhance user_manga_list table with additional metadata
ALTER TABLE user_manga_list
  ADD COLUMN IF NOT EXISTS synopsis TEXT,
  ADD COLUMN IF NOT EXISTS authors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mean_score DECIMAL,
  ADD COLUMN IF NOT EXISTS popularity INTEGER,
  ADD COLUMN IF NOT EXISTS num_chapters INTEGER,
  ADD COLUMN IF NOT EXISTS num_volumes INTEGER,
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(50);

-- Add indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_anime_mean_score ON user_anime_list(mean_score DESC);
CREATE INDEX IF NOT EXISTS idx_anime_popularity ON user_anime_list(popularity ASC);
CREATE INDEX IF NOT EXISTS idx_anime_year ON user_anime_list(year DESC);

CREATE INDEX IF NOT EXISTS idx_manga_mean_score ON user_manga_list(mean_score DESC);
CREATE INDEX IF NOT EXISTS idx_manga_popularity ON user_manga_list(popularity ASC);

-- Add comments
COMMENT ON COLUMN user_anime_list.synopsis IS 'Anime synopsis for semantic search';
COMMENT ON COLUMN user_anime_list.studios IS 'Array of studio objects for content-based filtering';
COMMENT ON COLUMN user_manga_list.authors IS 'Array of author objects for content-based filtering';
