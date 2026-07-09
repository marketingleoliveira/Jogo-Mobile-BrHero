
DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'marketing@digitaletextil.com.br';

  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, aud_id, is_super_admin,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'marketing@digitaletextil.com.br', crypt('BrHero12!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NULL, false,
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', 'marketing@digitaletextil.com.br'), 'email', uid::text, now(), now(), now());
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt('BrHero12!', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = uid;
  END IF;

  INSERT INTO public.admin_profiles (id, display_name)
  VALUES (uid, 'Admin Master')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.admin_user_roles (user_id, role, granted_by)
  VALUES (uid, 'super_admin', uid)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
