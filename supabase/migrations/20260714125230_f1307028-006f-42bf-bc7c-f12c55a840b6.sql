
-- 1) Tabela de resgates semanais do Top 10 do Poder Geral
CREATE TABLE IF NOT EXISTS public.power_ranking_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),
  gems INTEGER NOT NULL DEFAULT 0,
  gold BIGINT NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_key)
);

GRANT SELECT, INSERT ON public.power_ranking_claims TO authenticated;
GRANT ALL ON public.power_ranking_claims TO service_role;

ALTER TABLE public.power_ranking_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own claims read"
  ON public.power_ranking_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "own claims insert"
  ON public.power_ranking_claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_power_ranking_claims_user_week
  ON public.power_ranking_claims (user_id, week_key);

-- 2) Função de resgate: confere posição atual e credita a carteira
CREATE OR REPLACE FUNCTION public.claim_power_ranking_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  my_score NUMERIC;
  higher_count INTEGER;
  my_rank INTEGER;
  reward_gems INTEGER := 0;
  reward_gold BIGINT := 0;
  wk TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Chave da semana ISO (ex: 2026-W28) — mesmo formato do resto do app
  wk := to_char(now() AT TIME ZONE 'UTC', 'IYYY') || '-W' || lpad(extract(week FROM now() AT TIME ZONE 'UTC')::TEXT, 2, '0');

  -- Já resgatou nesta semana?
  IF EXISTS (SELECT 1 FROM public.power_ranking_claims WHERE user_id = uid AND week_key = wk) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed', 'week_key', wk);
  END IF;

  -- Pontuação atual no ranking semanal de Poder Geral
  SELECT score INTO my_score
    FROM public.leaderboards
   WHERE user_id = uid AND category = 'hero_power' AND season_key = wk;

  IF my_score IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_ranked', 'week_key', wk);
  END IF;

  -- Quantos jogadores estão à frente na semana
  SELECT count(*) INTO higher_count
    FROM public.leaderboards
   WHERE category = 'hero_power' AND season_key = wk AND score > my_score;

  my_rank := higher_count + 1;

  IF my_rank > 10 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'out_of_top10', 'rank', my_rank, 'week_key', wk);
  END IF;

  -- Tabela de recompensas
  reward_gems := CASE my_rank
    WHEN 1 THEN 1000
    WHEN 2 THEN 500
    WHEN 3 THEN 250
    ELSE 0
  END;
  reward_gold := CASE my_rank
    WHEN 4  THEN 1000000
    WHEN 5  THEN  917000
    WHEN 6  THEN  833000
    WHEN 7  THEN  750000
    WHEN 8  THEN  667000
    WHEN 9  THEN  583000
    WHEN 10 THEN  500000
    ELSE 0
  END;

  -- Registra o resgate (bloqueia repetição na mesma semana)
  INSERT INTO public.power_ranking_claims (user_id, week_key, rank, gems, gold)
  VALUES (uid, wk, my_rank, reward_gems, reward_gold);

  -- Credita a carteira
  INSERT INTO public.player_wallet (user_id, gems, gold)
  VALUES (uid, reward_gems, reward_gold)
  ON CONFLICT (user_id) DO UPDATE
    SET gems = public.player_wallet.gems + EXCLUDED.gems,
        gold = public.player_wallet.gold + EXCLUDED.gold;

  RETURN jsonb_build_object(
    'ok', true,
    'rank', my_rank,
    'gems', reward_gems,
    'gold', reward_gold,
    'week_key', wk
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_power_ranking_reward() TO authenticated;

-- 3) Realtime na tabela de rankings para o ranking global atualizar em tempo real
ALTER TABLE public.leaderboards REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboards;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
