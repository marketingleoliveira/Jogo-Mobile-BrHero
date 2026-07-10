
CREATE TABLE public.player_sessions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_sessions TO authenticated;
GRANT ALL ON public.player_sessions TO service_role;

ALTER TABLE public.player_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own session read"   ON public.player_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own session insert" ON public.player_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own session update" ON public.player_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own session delete" ON public.player_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_player_sessions_touch
BEFORE UPDATE ON public.player_sessions
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
