
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('stage','rebirth','tower','arena','hero_power')),
  score BIGINT NOT NULL DEFAULT 0,
  display_name TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);

GRANT SELECT ON public.leaderboards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaderboards TO authenticated;
GRANT ALL ON public.leaderboards TO service_role;

ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboards_read_public" ON public.leaderboards
  FOR SELECT USING (true);

CREATE POLICY "leaderboards_insert_own" ON public.leaderboards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leaderboards_update_own" ON public.leaderboards
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leaderboards_delete_own" ON public.leaderboards
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS leaderboards_category_score_idx
  ON public.leaderboards (category, score DESC);

CREATE TRIGGER leaderboards_touch_updated_at
  BEFORE UPDATE ON public.leaderboards
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
