-- API keys for the public /api/v1 surface.
-- Keys look like: hk_live_<32-random-chars>. Only the prefix + a SHA-256 hash are stored.

CREATE TABLE IF NOT EXISTS public.api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  key_prefix    TEXT NOT NULL,
  key_hash      TEXT NOT NULL UNIQUE,
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_keys_user_idx ON public.api_keys(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON public.api_keys(key_hash) WHERE revoked_at IS NULL;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Owners can see and manage their own keys. Lookup by hash (for auth) is done
-- via the service role, which bypasses RLS.
CREATE POLICY "Users can manage own api keys"
  ON public.api_keys FOR ALL USING (auth.uid() = user_id);
