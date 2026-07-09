
-- Fase 3 · Bloco 4a.2.1 — Auditoria de Pagamentos Sandbox
-- Adiciona lock server-side de entrega ao cliente (idempotência global).

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS client_consumed_at TIMESTAMPTZ;

-- Policy: dono da transação pode marcar consumo UMA VEZ, apenas quando paga+entregue.
DROP POLICY IF EXISTS "Players consume own paid transactions" ON public.payment_transactions;
CREATE POLICY "Players consume own paid transactions"
  ON public.payment_transactions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status = 'paid'
    AND reward_delivered = true
    AND client_consumed_at IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'paid'
    AND reward_delivered = true
    AND client_consumed_at IS NOT NULL
  );
