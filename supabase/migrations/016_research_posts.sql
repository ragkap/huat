-- Tracks which Smartkarma research insights have been auto-posted by the
-- @huat-research bot, so the cron job doesn't repost the same item.

CREATE TABLE IF NOT EXISTS public.research_posts (
  research_url TEXT PRIMARY KEY,
  ticker       TEXT NOT NULL,
  post_id      UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  posted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS research_posts_posted_at_idx
  ON public.research_posts(posted_at DESC);

-- No RLS — only service-role writes; nothing reads from app code.
