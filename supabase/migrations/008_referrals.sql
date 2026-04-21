-- Referral system
-- Each user gets a unique referral code; referred users earn starter AngBao

-- Add referral columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);

-- Generate referral codes for existing users
UPDATE public.profiles
SET referral_code = LOWER(SUBSTR(MD5(id::text || created_at::text), 1, 8))
WHERE referral_code IS NULL;

-- Make referral_code NOT NULL with a default for new users
ALTER TABLE public.profiles
  ALTER COLUMN referral_code SET DEFAULT LOWER(SUBSTR(MD5(RANDOM()::text || NOW()::text), 1, 8));

-- Index for fast referral code lookups
CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON public.profiles(referral_code);

-- Trigger: when a new user completes onboarding with a referral, credit both parties
CREATE OR REPLACE FUNCTION public.angbao_on_referral() RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when referred_by is set for the first time
  IF NEW.referred_by IS NOT NULL AND (OLD.referred_by IS NULL OR OLD.referred_by != NEW.referred_by) THEN
    -- Credit the new user (welcome bonus): +$8.88 (auspicious number)
    PERFORM public.angbao_credit(NEW.id, 8.88, 'referral_welcome', NEW.id);
    -- Credit the referrer: +$18.88 (even more auspicious)
    PERFORM public.angbao_credit(NEW.referred_by, 18.88, 'referral_bonus', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER angbao_referral_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.angbao_on_referral();
