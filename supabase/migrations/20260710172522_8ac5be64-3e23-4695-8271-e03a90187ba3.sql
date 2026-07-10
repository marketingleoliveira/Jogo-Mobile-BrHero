UPDATE public.player_sessions
SET session_id = gen_random_uuid()::text,
    updated_at = now();