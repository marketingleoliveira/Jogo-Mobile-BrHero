
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

REVOKE EXECUTE ON FUNCTION public.has_admin_role(uuid, public.admin_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(text, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_super_admin(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_admin_role(uuid, public.admin_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_super_admin(text) TO authenticated;
