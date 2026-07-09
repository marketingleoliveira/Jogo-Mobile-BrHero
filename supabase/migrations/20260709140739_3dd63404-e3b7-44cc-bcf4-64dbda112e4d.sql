
-- Fase 4 · Bloco 4: temporadas de ranking/arena.
ALTER TABLE public.leaderboards
  ADD COLUMN IF NOT EXISTS season_key TEXT NOT NULL DEFAULT 'all-time';

-- Troca a chave única para incluir season_key
ALTER TABLE public.leaderboards
  DROP CONSTRAINT IF EXISTS leaderboards_user_id_category_key;
ALTER TABLE public.leaderboards
  ADD CONSTRAINT leaderboards_user_cat_season_key UNIQUE (user_id, category, season_key);

CREATE INDEX IF NOT EXISTS leaderboards_season_cat_score_idx
  ON public.leaderboards (season_key, category, score DESC);

-- Tabela de recompensas de temporada (histórico + reivindicação).
CREATE TABLE IF NOT EXISTS public.season_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_key TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('stage','rebirth','tower','arena','hero_power')),
  rank INT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('top1','top10','top100','participation')),
  reward JSONB NOT NULL DEFAULT '{}'::jsonb,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, season_key, category)
);

GRANT SELECT, INSERT, UPDATE ON public.season_rewards TO authenticated;
GRANT ALL ON public.season_rewards TO service_role;

ALTER TABLE public.season_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY season_rewards_read_own ON public.season_rewards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY season_rewards_insert_own ON public.season_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY season_rewards_update_own ON public.season_rewards
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER season_rewards_touch_updated_at
  BEFORE UPDATE ON public.season_rewards
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
