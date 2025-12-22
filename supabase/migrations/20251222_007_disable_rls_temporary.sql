-- Disable RLS temporarily to restore functionality
-- until Supabase Auth is fully integrated

ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback DISABLE ROW LEVEL SECURITY;

-- Drop the policies we created as they are now blocking (and useless without RLS)
-- We can recreate them when we enable RLS again
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage their own cache" ON recommendation_cache;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON user_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON user_feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON user_feedback;
DROP POLICY IF EXISTS "Authenticated users can read all feedback" ON user_feedback;
