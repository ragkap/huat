-- Posts
CREATE TABLE IF NOT EXISTS public.posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  post_type     TEXT NOT NULL CHECK (post_type IN ('post','poll','forecast')) DEFAULT 'post',
  sentiment     TEXT CHECK (sentiment IN ('bullish','bearish','neutral')),
  attachments   JSONB NOT NULL DEFAULT '[]',
  tagged_stocks TEXT[] NOT NULL DEFAULT '{}',
  is_pinned     BOOLEAN DEFAULT false,
  parent_id     UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_author_id_idx ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_tagged_stocks_idx ON public.posts USING GIN(tagged_stocks);
CREATE INDEX IF NOT EXISTS posts_parent_id_idx ON public.posts(parent_id);

-- Polls
CREATE TABLE IF NOT EXISTS public.polls (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID UNIQUE NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  options    JSONB NOT NULL,
  ends_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll votes
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_id  TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Forecasts
CREATE TABLE IF NOT EXISTS public.forecasts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        UUID UNIQUE NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  ticker         TEXT NOT NULL,
  current_price  NUMERIC(14,4),
  target_price   NUMERIC(14,4) NOT NULL,
  target_date    DATE NOT NULL,
  outcome        TEXT CHECK (outcome IN ('pending','hit','missed')) DEFAULT 'pending',
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions
CREATE TABLE IF NOT EXISTS public.reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('like','fire','rocket','bear')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, type)
);

CREATE INDEX IF NOT EXISTS reactions_post_id_idx ON public.reactions(post_id);

-- Saved posts
CREATE TABLE IF NOT EXISTS public.saved_posts (
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, post_id)
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts readable by all authenticated users" ON public.posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Polls readable by all" ON public.polls FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Poll votes readable by all" ON public.poll_votes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own votes" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Forecasts readable by all" ON public.forecasts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Reactions readable by all" ON public.reactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own reactions" ON public.reactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Saved posts: user can manage own" ON public.saved_posts FOR ALL USING (auth.uid() = user_id);
