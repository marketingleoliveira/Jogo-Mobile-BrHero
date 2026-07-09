
CREATE OR REPLACE FUNCTION public.claim_season_reward(_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid   UUID := auth.uid();
  row   public.season_rewards%ROWTYPE;
  _gems INTEGER;
  _gold BIGINT;
  _title TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  UPDATE public.season_rewards
     SET claimed_at = now()
   WHERE id = _reward_id
     AND user_id = uid
     AND claimed_at IS NULL
  RETURNING * INTO row;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  _gems  := COALESCE((row.reward->>'gems')::INTEGER, 0);
  _gold  := COALESCE((row.reward->>'gold')::BIGINT, 0);
  _title := NULLIF(row.reward->>'title', '');

  INSERT INTO public.player_wallet (user_id, gems, gold)
  VALUES (uid, GREATEST(_gems, 0), GREATEST(_gold, 0))
  ON CONFLICT (user_id) DO UPDATE
    SET gems = public.player_wallet.gems + EXCLUDED.gems,
        gold = public.player_wallet.gold + EXCLUDED.gold;

  IF _title IS NOT NULL THEN
    INSERT INTO public.player_titles (user_id, title, source_season_key)
    VALUES (uid, _title, row.season_key)
    ON CONFLICT (user_id, title) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'reward_id', row.id,
    'gems', _gems,
    'gold', _gold,
    'title', _title,
    'season_key', row.season_key,
    'category', row.category,
    'tier', row.tier
  );
END;
$$;
