
CREATE TABLE IF NOT EXISTS public.player_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL UNIQUE,
  awarded_gems INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_player_referrals_referrer ON public.player_referrals(referrer_id);

GRANT SELECT ON public.player_referrals TO authenticated;
GRANT ALL ON public.player_referrals TO service_role;
ALTER TABLE public.player_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own referrals" ON public.player_referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE OR REPLACE FUNCTION public.claim_referral(_referrer UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;
  IF _referrer IS NULL OR _referrer = uid THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid');
  END IF;
  IF EXISTS (SELECT 1 FROM public.player_referrals WHERE referred_id = uid) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already');
  END IF;

  INSERT INTO public.player_referrals (referrer_id, referred_id, awarded_gems)
  VALUES (_referrer, uid, 10);

  INSERT INTO public.player_wallet (user_id, gems, gold)
  VALUES (_referrer, 10, 0)
  ON CONFLICT (user_id) DO UPDATE
    SET gems = public.player_wallet.gems + 10;

  RETURN jsonb_build_object('ok', true, 'gems', 10);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_referral(UUID) TO authenticated;
