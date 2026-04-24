-- Trigram-based fuzzy search for profiles and posts.
-- pg_trgm gives us similarity() for ranking and GIN indexes for fast ILIKE.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Profile username/display_name search
CREATE INDEX IF NOT EXISTS profiles_username_trgm_idx
  ON public.profiles USING GIN (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_display_name_trgm_idx
  ON public.profiles USING GIN (display_name gin_trgm_ops);

-- Post content search
CREATE INDEX IF NOT EXISTS posts_content_trgm_idx
  ON public.posts USING GIN (content gin_trgm_ops);

-- Helper: search profiles by fuzzy username/display_name, ranked by similarity.
CREATE OR REPLACE FUNCTION public.search_profiles(q TEXT, max_results INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  country TEXT,
  is_verified BOOLEAN,
  similarity REAL
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p.id, p.username, p.display_name, p.avatar_url, p.country, p.is_verified,
         GREATEST(similarity(p.username, q), similarity(p.display_name, q)) AS similarity
  FROM public.profiles p
  WHERE p.username % q OR p.display_name % q
     OR p.username ILIKE q || '%' OR p.display_name ILIKE q || '%'
  ORDER BY
    -- Prefix matches win, then trigram similarity
    CASE WHEN p.username ILIKE q || '%' OR p.display_name ILIKE q || '%' THEN 0 ELSE 1 END,
    GREATEST(similarity(p.username, q), similarity(p.display_name, q)) DESC
  LIMIT max_results;
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles(TEXT, INT) TO authenticated, anon;

-- Helper: search posts by fuzzy content match, ranked by similarity + recency.
CREATE OR REPLACE FUNCTION public.search_posts(q TEXT, max_results INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  content TEXT,
  post_type TEXT,
  tagged_stocks TEXT[],
  created_at TIMESTAMPTZ,
  similarity REAL
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p.id, p.author_id, p.content, p.post_type, p.tagged_stocks, p.created_at,
         similarity(p.content, q) AS similarity
  FROM public.posts p
  WHERE p.content % q
    AND p.parent_id IS NULL
  ORDER BY similarity(p.content, q) DESC, p.created_at DESC
  LIMIT max_results;
$$;

GRANT EXECUTE ON FUNCTION public.search_posts(TEXT, INT) TO authenticated;

-- pg_trgm's `%` operator threshold defaults to 0.3. Lower it so short queries
-- (2–3 chars) still return results.
-- NOTE: set_limit() is session-scoped; for a server-side default, leave as-is
-- and let callers rely on the RPCs which use `%` with the default threshold.
