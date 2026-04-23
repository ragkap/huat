-- Email notification preferences
CREATE TABLE IF NOT EXISTS public.email_preferences (
  user_id        UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  new_message    BOOLEAN NOT NULL DEFAULT true,
  new_follower   BOOLEAN NOT NULL DEFAULT true,
  connect_request BOOLEAN NOT NULL DEFAULT true,
  connect_accepted BOOLEAN NOT NULL DEFAULT true,
  post_reply     BOOLEAN NOT NULL DEFAULT true,
  post_reaction  BOOLEAN NOT NULL DEFAULT false,
  post_repost    BOOLEAN NOT NULL DEFAULT false,
  angbao_milestone BOOLEAN NOT NULL DEFAULT true,
  weekly_digest  BOOLEAN NOT NULL DEFAULT true,
  pause_all      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences"
  ON public.email_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences"
  ON public.email_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences"
  ON public.email_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create preferences row when profile is created
CREATE OR REPLACE FUNCTION public.create_email_preferences() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_preferences(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_create_email_prefs
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_email_preferences();

-- Create preferences for existing users
INSERT INTO public.email_preferences(user_id)
SELECT id FROM public.profiles
ON CONFLICT DO NOTHING;
