
ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_stripe_session_id_key
  ON public.payment_transactions (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_stripe_payment_intent_id_key
  ON public.payment_transactions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

INSERT INTO public.admin_settings (key, value)
VALUES (
  'payments.providers',
  jsonb_build_object(
    'stripe_enabled', false,
    'sandbox_enabled', true,
    'google_play_enabled', false,
    'priority', jsonb_build_array('stripe', 'sandbox')
  )
)
ON CONFLICT (key) DO NOTHING;
