
-- 1. ENUM de papéis administrativos
CREATE TYPE public.admin_role AS ENUM (
  'super_admin',
  'game_master',
  'support',
  'moderator',
  'financial'
);

-- 2. admin_profiles
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_profiles TO authenticated;
GRANT ALL ON public.admin_profiles TO service_role;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 3. admin_user_roles
CREATE TABLE public.admin_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.admin_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
CREATE INDEX idx_admin_user_roles_user ON public.admin_user_roles(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_user_roles TO authenticated;
GRANT ALL ON public.admin_user_roles TO service_role;
ALTER TABLE public.admin_user_roles ENABLE ROW LEVEL SECURITY;

-- 4. admin_audit_logs
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_role public.admin_role,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  reason TEXT,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_module ON public.admin_audit_logs(module);
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. admin_settings
CREATE TABLE public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 6. Funções SECURITY DEFINER (evitam recursão de RLS)
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id UUID, _role public.admin_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_user_roles WHERE user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id UUID DEFAULT auth.uid())
RETURNS public.admin_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.admin_user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'game_master' THEN 2
    WHEN 'financial'   THEN 3
    WHEN 'moderator'   THEN 4
    WHEN 'support'     THEN 5
  END
  LIMIT 1;
$$;

-- Matriz de permissões: (role, module, action) -> bool
CREATE OR REPLACE FUNCTION public.has_admin_permission(
  _module TEXT,
  _action TEXT,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.admin_role;
BEGIN
  r := public.get_admin_role(_user_id);
  IF r IS NULL THEN RETURN FALSE; END IF;
  IF r = 'super_admin' THEN RETURN TRUE; END IF;

  -- view liberado para todos os admins
  IF _action = 'view' THEN RETURN TRUE; END IF;

  RETURN CASE r
    WHEN 'game_master' THEN _module IN ('players','codes','liveops','shop','items','balancing')
                            AND _action IN ('create','edit','toggle','critical')
    WHEN 'support'     THEN _module = 'players' AND _action IN ('edit','toggle')
    WHEN 'moderator'   THEN _module = 'players' AND _action IN ('edit','toggle','critical')
    WHEN 'financial'   THEN _module IN ('shop','codes') AND _action IN ('create','edit','toggle')
    ELSE FALSE
  END;
END;
$$;

-- 7. RLS Policies
-- admin_profiles: qualquer admin lê; usuário edita o próprio; super_admin edita todos
CREATE POLICY "Admins can view all profiles" ON public.admin_profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users manage own admin profile" ON public.admin_profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Super admin manages all profiles" ON public.admin_profiles
  FOR ALL TO authenticated
  USING (public.has_admin_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_admin_role(auth.uid(), 'super_admin'));

-- admin_user_roles: admins leem; só super_admin escreve
CREATE POLICY "Admins view roles" ON public.admin_user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Super admin manages roles" ON public.admin_user_roles
  FOR ALL TO authenticated
  USING (public.has_admin_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_admin_role(auth.uid(), 'super_admin'));

-- admin_audit_logs: admins leem tudo; qualquer admin insere; ninguém altera/apaga
CREATE POLICY "Admins read audit logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert audit logs" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND admin_id = auth.uid());

-- admin_settings: admins leem; só super_admin escreve
CREATE POLICY "Admins read settings" ON public.admin_settings
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Super admin writes settings" ON public.admin_settings
  FOR ALL TO authenticated
  USING (public.has_admin_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_admin_role(auth.uid(), 'super_admin'));

-- 8. Bootstrap seguro de Super Admin
-- Concede super_admin ao chamador se AINDA NÃO existe nenhum super_admin
CREATE OR REPLACE FUNCTION public.claim_super_admin(_display_name TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_user_roles WHERE role = 'super_admin') THEN
    RAISE EXCEPTION 'Super admin already exists';
  END IF;

  INSERT INTO public.admin_profiles (id, display_name)
  VALUES (uid, COALESCE(_display_name, 'Super Admin'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.admin_user_roles (user_id, role, granted_by)
  VALUES (uid, 'super_admin', uid);

  INSERT INTO public.admin_audit_logs (admin_id, admin_role, module, action, target, reason)
  VALUES (uid, 'super_admin', 'rbac', 'bootstrap', uid::text, 'Initial super admin claim');

  RETURN uid;
END;
$$;

-- 9. Trigger updated_at para admin_profiles
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_admin_profiles_updated
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 10. Seed de configuração inicial
INSERT INTO public.admin_settings (key, value) VALUES
  ('bootstrap.instructions', '"Chame a RPC claim_super_admin() estando autenticado para receber o papel de Super Admin (funciona apenas se nenhum existir ainda)."'::jsonb)
ON CONFLICT (key) DO NOTHING;
