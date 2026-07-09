
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL,
  offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  provider TEXT NOT NULL DEFAULT 'sandbox',
  provider_ref TEXT,
  reward_delivered BOOLEAN NOT NULL DEFAULT FALSE,
  reward_delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players view own transactions"
  ON public.payment_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Players create own pending transactions"
  ON public.payment_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reward_delivered = FALSE);

CREATE POLICY "Admins update transactions"
  ON public.payment_transactions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX payment_transactions_user_idx ON public.payment_transactions(user_id, created_at DESC);
CREATE INDEX payment_transactions_status_idx ON public.payment_transactions(status);

CREATE TRIGGER payment_transactions_touch
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Seed feature flag as OFF
INSERT INTO public.admin_settings (key, value)
VALUES ('payments.config', '{"enabled": false, "provider": "sandbox"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
