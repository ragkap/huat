-- Tracks which exchange announcements have been auto-posted to the feed by
-- the @huat-news bot, so the cron job doesn't repost the same item.

CREATE TABLE IF NOT EXISTS public.announcement_posts (
  ticker            TEXT NOT NULL,
  announcement_key  TEXT NOT NULL, -- hash of (title + pubDate) per ticker
  post_id           UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  posted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ticker, announcement_key)
);

CREATE INDEX IF NOT EXISTS announcement_posts_posted_at_idx
  ON public.announcement_posts(posted_at DESC);

-- No RLS — only service-role writes; nothing reads from app code.
