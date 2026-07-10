GRANT SELECT ON public.admin_module_entities TO authenticated;

DROP POLICY IF EXISTS "Players can read redeem codes" ON public.admin_module_entities;
CREATE POLICY "Players can read redeem codes"
ON public.admin_module_entities
FOR SELECT
TO authenticated
USING (module = 'codes');