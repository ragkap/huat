-- Mark profiles as bots so the rest of the app can treat them differently:
-- excluded from leaderboards, AngBao earnings, who-to-follow; surfaced in
-- /bots; tagged with a BOT badge in feed/profile/mentions/search.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_bot          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_description TEXT;

CREATE INDEX IF NOT EXISTS profiles_is_bot_idx ON public.profiles(is_bot) WHERE is_bot = true;

-- Mark the existing huat-news bot.
UPDATE public.profiles
   SET is_bot          = true,
       bot_description = 'Auto-posts SGX exchange announcements for actively-discussed stocks.'
 WHERE username = 'huat-news';

-- Zero out the bot's accumulated AngBao balance and clear its transaction
-- history. The triggers we're about to install will prevent re-accrual.
DELETE FROM public.angbao_transactions
 WHERE user_id IN (SELECT id FROM public.profiles WHERE is_bot = true);

UPDATE public.profiles
   SET angbao_balance = 0
 WHERE is_bot = true;

-- Update the search RPC to include is_bot in its return shape so callers can
-- render a BOT badge inline with results. Postgres can't change a function's
-- return shape via REPLACE, so drop first.
DROP FUNCTION IF EXISTS public.search_profiles(TEXT, INT);

CREATE FUNCTION public.search_profiles(q TEXT, max_results INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  country TEXT,
  is_verified BOOLEAN,
  is_bot BOOLEAN,
  similarity REAL
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p.id, p.username, p.display_name, p.avatar_url, p.country, p.is_verified, p.is_bot,
         GREATEST(similarity(p.username, q), similarity(p.display_name, q)) AS similarity
  FROM public.profiles p
  WHERE p.username % q OR p.display_name % q
     OR p.username ILIKE q || '%' OR p.display_name ILIKE q || '%'
  ORDER BY
    CASE WHEN p.username ILIKE q || '%' OR p.display_name ILIKE q || '%' THEN 0 ELSE 1 END,
    GREATEST(similarity(p.username, q), similarity(p.display_name, q)) DESC
  LIMIT max_results;
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles(TEXT, INT) TO authenticated, anon;

-- Short-circuit the AngBao credit helper for bot accounts. This is the single
-- chokepoint for all earning paths (post, reply, react, follow, repost, save,
-- referral) so we only need to patch one function.
CREATE OR REPLACE FUNCTION public.angbao_credit(
  p_user_id UUID, p_amount NUMERIC, p_reason TEXT, p_ref_id UUID
) RETURNS VOID AS $$
DECLARE
  v_is_bot BOOLEAN;
BEGIN
  SELECT is_bot INTO v_is_bot FROM public.profiles WHERE id = p_user_id;
  IF v_is_bot THEN RETURN; END IF;

  INSERT INTO public.angbao_transactions(user_id, amount, reason, ref_id)
  VALUES (p_user_id, p_amount, p_reason, p_ref_id)
  ON CONFLICT (user_id, reason, ref_id) DO NOTHING;

  IF FOUND THEN
    UPDATE public.profiles SET angbao_balance = angbao_balance + p_amount WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
