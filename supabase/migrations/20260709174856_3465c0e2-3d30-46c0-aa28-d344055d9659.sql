-- Reset game data (preserve admin accounts and configuration)
TRUNCATE TABLE public.player_save_backups CASCADE;
TRUNCATE TABLE public.player_saves CASCADE;
TRUNCATE TABLE public.player_wallet CASCADE;
TRUNCATE TABLE public.player_titles CASCADE;
TRUNCATE TABLE public.leaderboards CASCADE;
TRUNCATE TABLE public.season_rewards CASCADE;
TRUNCATE TABLE public.payment_transactions CASCADE;

-- Remove non-admin auth users (keep admin master accounts)
DELETE FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.admin_user_roles);