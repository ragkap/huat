-- Add quote_of column to posts (for quote posts)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS quote_of UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- Reposts table (pure reposts — no content, just a pointer)
CREATE TABLE IF NOT EXISTS public.reposts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

-- Index for counting reposts per post
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON public.reposts (post_id);
-- Index for user's reposts feed
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON public.reposts (user_id, created_at DESC);
-- Index for quote lookups
CREATE INDEX IF NOT EXISTS idx_posts_quote_of ON public.posts (quote_of) WHERE quote_of IS NOT NULL;

-- RLS
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all reposts" ON public.reposts FOR SELECT USING (true);
CREATE POLICY "Users can create their own reposts" ON public.reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reposts" ON public.reposts FOR DELETE USING (auth.uid() = user_id);
