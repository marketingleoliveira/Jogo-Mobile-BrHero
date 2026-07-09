
-- Tabela principal do save em nuvem (1 linha por usuário)
CREATE TABLE public.player_saves (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  save_data JSONB NOT NULL,
  save_version INTEGER NOT NULL DEFAULT 1,
  level INTEGER NOT NULL DEFAULT 1,
  stage INTEGER NOT NULL DEFAULT 1,
  max_stage INTEGER NOT NULL DEFAULT 1,
  prestige_level INTEGER NOT NULL DEFAULT 0,
  gems INTEGER NOT NULL DEFAULT 0,
  essence INTEGER NOT NULL DEFAULT 0,
  client_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_saves TO authenticated;
GRANT ALL ON public.player_saves TO service_role;

ALTER TABLE public.player_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own save" ON public.player_saves
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own save" ON public.player_saves
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own save" ON public.player_saves
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own save" ON public.player_saves
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER player_saves_touch_updated
  BEFORE UPDATE ON public.player_saves
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Backups (até 20 por usuário, mantidos pela app antes de sobrescrever)
CREATE TABLE public.player_save_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  save_data JSONB NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  stage INTEGER NOT NULL DEFAULT 1,
  max_stage INTEGER NOT NULL DEFAULT 1,
  prestige_level INTEGER NOT NULL DEFAULT 0,
  gems INTEGER NOT NULL DEFAULT 0,
  essence INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT 'auto',
  client_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX player_save_backups_user_created_idx
  ON public.player_save_backups (user_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.player_save_backups TO authenticated;
GRANT ALL ON public.player_save_backups TO service_role;

ALTER TABLE public.player_save_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own backups" ON public.player_save_backups
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own backups" ON public.player_save_backups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own backups" ON public.player_save_backups
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
