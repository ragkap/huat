-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN (
                 'reaction','reply','follow','connect_request',
                 'connect_accept','forecast_resolved','mention')),
  payload      JSONB NOT NULL DEFAULT '{}',
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notif_recipient_idx ON public.notifications(recipient_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- Auto-notify on reaction
CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author UUID;
BEGIN
  SELECT author_id INTO v_post_author FROM public.posts WHERE id = NEW.post_id;
  IF v_post_author IS NOT NULL AND v_post_author != NEW.user_id THEN
    INSERT INTO public.notifications(recipient_id, actor_id, type, payload)
    VALUES (v_post_author, NEW.user_id, 'reaction', jsonb_build_object('post_id', NEW.post_id, 'reaction_type', NEW.type));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reaction_created
  AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_reaction();

-- Auto-notify on follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rel_type = 'follow' THEN
    INSERT INTO public.notifications(recipient_id, actor_id, type, payload)
    VALUES (NEW.subject_id, NEW.actor_id, 'follow', '{}');
  ELSIF NEW.rel_type = 'connect_request' THEN
    INSERT INTO public.notifications(recipient_id, actor_id, type, payload)
    VALUES (NEW.subject_id, NEW.actor_id, 'connect_request', '{}');
  ELSIF NEW.rel_type = 'connect' THEN
    INSERT INTO public.notifications(recipient_id, actor_id, type, payload)
    VALUES (NEW.subject_id, NEW.actor_id, 'connect_accept', '{}');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_social_graph_created
  AFTER INSERT ON public.social_graph
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- Stock watchlist
CREATE TABLE IF NOT EXISTS public.stock_watchlist (
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, ticker)
);

ALTER TABLE public.stock_watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watchlist" ON public.stock_watchlist FOR ALL USING (auth.uid() = user_id);
