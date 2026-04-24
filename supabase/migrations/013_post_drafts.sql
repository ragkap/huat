-- Post drafts and scheduled posts.
-- A draft is just a pending post with optional scheduled_for. When
-- scheduled_for <= NOW(), the publish cron moves it into posts.

CREATE TABLE IF NOT EXISTS public.post_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL DEFAULT '',
  post_type     TEXT NOT NULL CHECK (post_type IN ('post','forecast')) DEFAULT 'post',
  sentiment     TEXT CHECK (sentiment IN ('bullish','bearish','neutral')),
  attachments   JSONB NOT NULL DEFAULT '[]',
  tagged_stocks TEXT[] NOT NULL DEFAULT '{}',
  forecast_data JSONB, -- {ticker, target_price, target_date} when post_type=forecast
  scheduled_for TIMESTAMPTZ, -- NULL = plain draft; set = scheduled
  publish_error TEXT,        -- populated by cron when a scheduled publish fails
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_drafts_author_idx ON public.post_drafts(author_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS post_drafts_scheduled_idx
  ON public.post_drafts(scheduled_for)
  WHERE scheduled_for IS NOT NULL;

ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own drafts"
  ON public.post_drafts FOR ALL USING (auth.uid() = author_id);

-- Reuse the existing updated_at trigger function (defined in 002_posts.sql).
CREATE TRIGGER post_drafts_updated_at
  BEFORE UPDATE ON public.post_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
