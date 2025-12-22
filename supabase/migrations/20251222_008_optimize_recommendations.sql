-- Performance optimization: Move collaborative filtering to server-side
-- This eliminates the need to fetch all feedback data to the client

-- Function to find similar users based on Jaccard similarity
CREATE OR REPLACE FUNCTION match_similar_users(
  target_user_id UUID,
  item_type TEXT DEFAULT 'anime',
  min_similarity FLOAT DEFAULT 0.2,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  similarity FLOAT,
  shared_likes INT
) AS $$
DECLARE
  target_likes INT[];
BEGIN
  -- Get target user's liked items
  IF item_type = 'anime' THEN
    SELECT ARRAY_AGG(DISTINCT anime_id)
    INTO target_likes
    FROM user_feedback
    WHERE user_feedback.user_id = target_user_id
      AND feedback_type = 'like'
      AND anime_id IS NOT NULL;
  ELSE
    SELECT ARRAY_AGG(DISTINCT manga_id)
    INTO target_likes
    FROM user_feedback
    WHERE user_feedback.user_id = target_user_id
      AND feedback_type = 'like'
      AND manga_id IS NOT NULL;
  END IF;

  -- Return empty if user has no likes
  IF target_likes IS NULL OR array_length(target_likes, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Calculate Jaccard similarity with other users
  RETURN QUERY
  WITH other_user_likes AS (
    SELECT 
      uf.user_id,
      CASE 
        WHEN item_type = 'anime' THEN ARRAY_AGG(DISTINCT uf.anime_id)
        ELSE ARRAY_AGG(DISTINCT uf.manga_id)
      END AS likes
    FROM user_feedback uf
    WHERE uf.user_id != target_user_id
      AND uf.feedback_type = 'like'
      AND (
        (item_type = 'anime' AND uf.anime_id IS NOT NULL) OR
        (item_type = 'manga' AND uf.manga_id IS NOT NULL)
      )
    GROUP BY uf.user_id
  ),
  similarities AS (
    SELECT 
      oul.user_id,
      -- Jaccard similarity: |intersection| / |union|
      CASE 
        WHEN array_length(target_likes || oul.likes, 1) > 0 THEN
          CAST(
            (SELECT COUNT(*) FROM unnest(target_likes) AS t WHERE t = ANY(oul.likes))
            AS FLOAT
          ) / CAST(
            array_length(ARRAY(SELECT DISTINCT unnest(target_likes || oul.likes)), 1)
            AS FLOAT
          )
        ELSE 0
      END AS similarity_score,
      (SELECT COUNT(*) FROM unnest(target_likes) AS t WHERE t = ANY(oul.likes))::INT AS shared_count
    FROM other_user_likes oul
  )
  SELECT 
    s.user_id,
    s.similarity_score,
    s.shared_count
  FROM similarities s
  WHERE s.similarity_score >= min_similarity
  ORDER BY s.similarity_score DESC, s.shared_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get collaborative recommendations directly
CREATE OR REPLACE FUNCTION get_collaborative_recommendations(
  target_user_id UUID,
  item_type TEXT DEFAULT 'anime',
  user_list_ids INT[] DEFAULT ARRAY[]::INT[],
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  item_id INT,
  score FLOAT,
  liked_by_count INT
) AS $$
BEGIN
  -- Get similar users and their liked items in one query
  RETURN QUERY
  WITH similar_users AS (
    -- Use our similarity function
    SELECT * FROM match_similar_users(target_user_id, item_type, 0.2, 10)
  ),
  user_dislikes AS (
    -- Get items the target user has disliked
    SELECT 
      CASE 
        WHEN item_type = 'anime' THEN anime_id
        ELSE manga_id
      END AS disliked_id
    FROM user_feedback
    WHERE user_feedback.user_id = target_user_id
      AND feedback_type = 'dislike'
      AND (
        (item_type = 'anime' AND anime_id IS NOT NULL) OR
        (item_type = 'manga' AND manga_id IS NOT NULL)
      )
  ),
  recommendations AS (
    SELECT 
      CASE 
        WHEN item_type = 'anime' THEN uf.anime_id
        ELSE uf.manga_id
      END AS rec_item_id,
      su.similarity,
      su.user_id AS similar_user_id
    FROM user_feedback uf
    INNER JOIN similar_users su ON uf.user_id = su.user_id
    WHERE uf.feedback_type = 'like'
      AND (
        (item_type = 'anime' AND uf.anime_id IS NOT NULL) OR
        (item_type = 'manga' AND uf.manga_id IS NOT NULL)
      )
  ),
  scored_items AS (
    SELECT 
      r.rec_item_id,
      SUM(r.similarity) AS total_score,
      COUNT(*)::INT AS like_count
    FROM recommendations r
    WHERE r.rec_item_id IS NOT NULL
      -- Exclude items in user's list
      AND NOT (r.rec_item_id = ANY(user_list_ids))
      -- Exclude disliked items
      AND r.rec_item_id NOT IN (SELECT disliked_id FROM user_dislikes WHERE disliked_id IS NOT NULL)
    GROUP BY r.rec_item_id
  )
  SELECT 
    si.rec_item_id,
    si.total_score,
    si.like_count
  FROM scored_items si
  ORDER BY si.total_score DESC, si.like_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add helpful comments
COMMENT ON FUNCTION match_similar_users IS 'Finds users with similar taste using Jaccard similarity on feedback data';
COMMENT ON FUNCTION get_collaborative_recommendations IS 'Returns collaborative filtering recommendations based on similar users';
