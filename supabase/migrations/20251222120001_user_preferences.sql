-- User preferences table for storing personalized settings
-- This enables content-based filtering and user customization

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Genre preferences
  favorite_genres JSONB DEFAULT '[]'::jsonb,
  excluded_genres JSONB DEFAULT '[]'::jsonb,
  
  -- Studio/Author preferences
  preferred_studios JSONB DEFAULT '[]'::jsonb,
  preferred_authors JSONB DEFAULT '[]'::jsonb,
  
  -- Score preferences
  min_score DECIMAL DEFAULT 7.0,
  
  -- Media type preferences
  preferred_media_types JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one preference set per user
  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE user_preferences IS 'Stores user customization preferences for personalized recommendations';
