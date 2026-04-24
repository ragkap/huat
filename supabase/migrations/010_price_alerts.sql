-- Stock price alerts
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker      TEXT NOT NULL,
  target_price NUMERIC(12,4) NOT NULL,
  direction   TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  triggered   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS price_alerts_active_idx ON public.price_alerts(user_id, triggered) WHERE triggered = false;

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own alerts"
  ON public.price_alerts FOR ALL USING (auth.uid() = user_id);
