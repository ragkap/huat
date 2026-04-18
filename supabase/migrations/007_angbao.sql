-- AngBao (红包) social currency system
-- Each user earns AngBao for performing and receiving social actions

-- 1. Add balance column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS angbao_balance NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 2. Transaction log
CREATE TABLE IF NOT EXISTS public.angbao_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL,
  reason      TEXT NOT NULL,
  ref_id      UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS angbao_tx_user_idx ON public.angbao_transactions(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS angbao_tx_idempotent_idx ON public.angbao_transactions(user_id, reason, ref_id);

-- RLS: users can only read their own transactions
ALTER TABLE public.angbao_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions"
  ON public.angbao_transactions FOR SELECT USING (auth.uid() = user_id);

-- 3. Credit helper — idempotent via unique index
CREATE OR REPLACE FUNCTION public.angbao_credit(
  p_user_id UUID, p_amount NUMERIC, p_reason TEXT, p_ref_id UUID
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.angbao_transactions(user_id, amount, reason, ref_id)
  VALUES (p_user_id, p_amount, p_reason, p_ref_id)
  ON CONFLICT (user_id, reason, ref_id) DO NOTHING;

  IF FOUND THEN
    UPDATE public.profiles SET angbao_balance = angbao_balance + p_amount WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger: posts (new post, reply, poll, forecast)
CREATE OR REPLACE FUNCTION public.angbao_on_post() RETURNS TRIGGER AS $$
DECLARE
  v_amount NUMERIC;
  v_reason TEXT;
  v_is_first BOOLEAN;
  v_parent_author UUID;
BEGIN
  -- First post ever? +$8 bonus
  SELECT NOT EXISTS(
    SELECT 1 FROM public.posts WHERE author_id = NEW.author_id AND id != NEW.id LIMIT 1
  ) INTO v_is_first;

  IF v_is_first THEN
    PERFORM public.angbao_credit(NEW.author_id, 8, 'first_post', NEW.id);
    RETURN NEW;
  END IF;

  -- Reply/comment
  IF NEW.parent_id IS NOT NULL THEN
    PERFORM public.angbao_credit(NEW.author_id, 1, 'reply', NEW.id);
    SELECT author_id INTO v_parent_author FROM public.posts WHERE id = NEW.parent_id;
    IF v_parent_author IS NOT NULL AND v_parent_author != NEW.author_id THEN
      PERFORM public.angbao_credit(v_parent_author, 1, 'received_reply', NEW.id);
    END IF;
    RETURN NEW;
  END IF;

  -- Poll
  IF NEW.post_type = 'poll' THEN
    PERFORM public.angbao_credit(NEW.author_id, 2, 'poll', NEW.id);
    RETURN NEW;
  END IF;

  -- Forecast/prediction
  IF NEW.post_type = 'forecast' THEN
    PERFORM public.angbao_credit(NEW.author_id, 3, 'forecast', NEW.id);
    RETURN NEW;
  END IF;

  -- Regular post — check for link or image attachments
  IF NEW.attachments::text LIKE '%"type":"link"%' OR NEW.attachments::text LIKE '%"type": "link"%' THEN
    v_amount := 3; v_reason := 'post_link';
  ELSIF NEW.attachments::text LIKE '%"type":"image"%' OR NEW.attachments::text LIKE '%"type": "image"%' THEN
    v_amount := 2; v_reason := 'post_image';
  ELSE
    v_amount := 1; v_reason := 'post';
  END IF;

  PERFORM public.angbao_credit(NEW.author_id, v_amount, v_reason, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER angbao_post_trigger
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.angbao_on_post();

-- 5. Trigger: reactions
CREATE OR REPLACE FUNCTION public.angbao_on_reaction() RETURNS TRIGGER AS $$
DECLARE v_post_author UUID;
BEGIN
  PERFORM public.angbao_credit(NEW.user_id, 0.25, 'react', NEW.id);
  SELECT author_id INTO v_post_author FROM public.posts WHERE id = NEW.post_id;
  IF v_post_author IS NOT NULL AND v_post_author != NEW.user_id THEN
    PERFORM public.angbao_credit(v_post_author, 0.50, 'received_reaction', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER angbao_reaction_trigger
  AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.angbao_on_reaction();

-- 6. Trigger: follows
CREATE OR REPLACE FUNCTION public.angbao_on_follow() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rel_type = 'follow' THEN
    PERFORM public.angbao_credit(NEW.actor_id, 0.50, 'follow', NEW.id);
    PERFORM public.angbao_credit(NEW.subject_id, 1, 'received_follow', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER angbao_follow_trigger
  AFTER INSERT ON public.social_graph
  FOR EACH ROW EXECUTE FUNCTION public.angbao_on_follow();

-- 7. Trigger: reposts
CREATE OR REPLACE FUNCTION public.angbao_on_repost() RETURNS TRIGGER AS $$
DECLARE v_post_author UUID;
BEGIN
  PERFORM public.angbao_credit(NEW.user_id, 0.50, 'repost', NEW.id);
  SELECT author_id INTO v_post_author FROM public.posts WHERE id = NEW.post_id;
  IF v_post_author IS NOT NULL AND v_post_author != NEW.user_id THEN
    PERFORM public.angbao_credit(v_post_author, 2, 'received_repost', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER angbao_repost_trigger
  AFTER INSERT ON public.reposts
  FOR EACH ROW EXECUTE FUNCTION public.angbao_on_repost();

-- 8. Trigger: saved posts
CREATE OR REPLACE FUNCTION public.angbao_on_save() RETURNS TRIGGER AS $$
DECLARE v_post_author UUID;
DECLARE v_ref UUID;
BEGIN
  v_ref := md5(NEW.user_id::text || NEW.post_id::text)::uuid;
  PERFORM public.angbao_credit(NEW.user_id, 0.25, 'save', v_ref);
  SELECT author_id INTO v_post_author FROM public.posts WHERE id = NEW.post_id;
  IF v_post_author IS NOT NULL AND v_post_author != NEW.user_id THEN
    PERFORM public.angbao_credit(v_post_author, 0.50, 'received_save', v_ref);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER angbao_save_trigger
  AFTER INSERT ON public.saved_posts
  FOR EACH ROW EXECUTE FUNCTION public.angbao_on_save();
