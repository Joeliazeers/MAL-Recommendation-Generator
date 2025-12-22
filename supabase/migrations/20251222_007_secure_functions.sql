-- Secure functions by setting explicit search_path
-- This prevents potential security issues where the function runs in an unexpected schema

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' 
SECURITY DEFINER 
SET search_path = public;

-- Fix cleanup_expired_recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM recommendation_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
