
CREATE TABLE public.admin_module_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(module, entity_id)
);
CREATE INDEX idx_ame_module ON public.admin_module_entities(module);
CREATE INDEX idx_ame_updated ON public.admin_module_entities(updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_module_entities TO authenticated;
GRANT ALL ON public.admin_module_entities TO service_role;
ALTER TABLE public.admin_module_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read module entities" ON public.admin_module_entities
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins create module entities" ON public.admin_module_entities
  FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_permission(module, 'create'));

CREATE POLICY "Admins edit module entities" ON public.admin_module_entities
  FOR UPDATE TO authenticated
  USING (public.has_admin_permission(module, 'edit'))
  WITH CHECK (public.has_admin_permission(module, 'edit'));

CREATE POLICY "Admins delete module entities" ON public.admin_module_entities
  FOR DELETE TO authenticated
  USING (public.has_admin_permission(module, 'delete'));

CREATE TRIGGER trg_ame_updated
  BEFORE UPDATE ON public.admin_module_entities
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
