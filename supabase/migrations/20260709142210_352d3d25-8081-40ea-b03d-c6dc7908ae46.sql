
-- Carteira de recompensas do servidor (separada do save local do jogo)
CREATE TABLE IF NOT EXISTS public.player_wallet (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gems    INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0),
  gold    BIGINT  NOT NULL DEFAULT 0 CHECK (gold >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.player_wallet TO authenticated;
GRANT ALL ON public.player_wallet TO service_role;
ALTER TABLE public.player_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallet_select_own" ON public.player_wallet
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wallet_insert_own" ON public.player_wallet
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallet_update_own" ON public.player_wallet
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_player_wallet_updated_at
  BEFORE UPDATE ON public.player_wallet
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Títulos cosméticos do jogador (único item cosmético permitido pelo bloco)
CREATE TABLE IF NOT EXISTS public.player_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_season_key TEXT,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, title)
);
GRANT SELECT, INSERT ON public.player_titles TO authenticated;
GRANT ALL ON public.player_titles TO service_role;
ALTER TABLE public.player_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "titles_select_own" ON public.player_titles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "titles_insert_own" ON public.player_titles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Função atômica e idempotente de claim.
-- Trava a linha, marca claimed_at, credita carteira e insere título (se houver).
-- Retorna a recompensa aplicada; retorna NULL se já resgatada ou inexistente.
CREATE OR REPLACE FUNCTION public.claim_season_reward(_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Lock + verificação de posse + trava lógica via claimed_at IS NULL
  UPDATE public.season_rewards
     SET claimed_at = now()
   WHERE id = _reward_id
     AND user_id = uid
     AND claimed_at IS NULL
  RETURNING * INTO row;

  IF NOT FOUND THEN
    RETURN NULL; -- já resgatada, não existe, ou não pertence ao usuário
  END IF;

  _gems  := COALESCE((row.reward->>'gems')::INTEGER, 0);
  _gold  := COALESCE((row.reward->>'gold')::BIGINT, 0);
  _title := NULLIF(row.reward->>'title', '');

  -- Credita carteira (upsert atômico)
  INSERT INTO public.player_wallet (user_id, gems, gold)
  VALUES (uid, GREATEST(_gems, 0), GREATEST(_gold, 0))
  ON CONFLICT (user_id) DO UPDATE
    SET gems = public.player_wallet.gems + EXCLUDED.gems,
        gold = public.player_wallet.gold + EXCLUDED.gold;

  -- Título cosmético (único por usuário+título; ignora se já possui)
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

REVOKE ALL ON FUNCTION public.claim_season_reward(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_season_reward(UUID) TO authenticated;
