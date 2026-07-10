// Webhook público InfinitePay. Confirma o pagamento via payment_check
// (a InfinitePay não assina o body), então revalidamos sempre no endpoint oficial
// antes de liberar reward_delivered=true.

import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface WebhookBody {
  invoice_slug?: string;
  amount?: number;
  paid_amount?: number;
  installments?: number;
  capture_method?: string;
  transaction_nsu?: string;
  order_nsu?: string;
  receipt_url?: string;
}

export const Route = createFileRoute("/api/public/hooks/infinitepay")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const handle = process.env.INFINITEPAY_HANDLE;
        if (!handle) {
          return new Response(JSON.stringify({ error: "handle-missing" }), {
            status: 500, headers: { "Content-Type": "application/json", ...CORS },
          });
        }
        let body: WebhookBody;
        try { body = (await request.json()) as WebhookBody; }
        catch { return new Response("bad json", { status: 400, headers: CORS }); }

        const orderNsu = body.order_nsu;
        const slug = body.invoice_slug;
        const txNsu = body.transaction_nsu;
        if (!orderNsu || !slug) {
          return new Response("missing order_nsu/slug", { status: 400, headers: CORS });
        }

        // 1) Revalida no endpoint oficial (evita spoof).
        let verified = false;
        let paidAmount = 0;
        try {
          const check = await fetch("https://api.checkout.infinitepay.io/payment_check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ handle, order_nsu: orderNsu, transaction_nsu: txNsu, slug }),
          });
          const cj = (await check.json().catch(() => ({}))) as { success?: boolean; paid?: boolean; paid_amount?: number };
          verified = check.ok && cj.success === true && cj.paid === true;
          paidAmount = cj.paid_amount ?? body.paid_amount ?? 0;
        } catch {
          return new Response("verify-failed", { status: 400, headers: CORS });
        }
        if (!verified) return new Response("not-paid", { status: 400, headers: CORS });

        // 2) Marca como pago + libera recompensa (idempotente por status).
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: existing } = await supabaseAdmin
          .from("payment_transactions")
          .select("id,status,reward_delivered,amount_cents")
          .eq("id", orderNsu)
          .maybeSingle();
        if (!existing) return new Response("tx-not-found", { status: 400, headers: CORS });

        if (existing.status === "paid" && existing.reward_delivered) {
          return new Response("ok", { status: 200, headers: CORS });
        }

        const { error: upErr } = await supabaseAdmin
          .from("payment_transactions")
          .update({
            status: "paid",
            reward_delivered: true,
            reward_delivered_at: new Date().toISOString(),
            provider_ref: slug,
            metadata: {
              paid_amount: paidAmount,
              capture_method: body.capture_method ?? null,
              receipt_url: body.receipt_url ?? null,
              transaction_nsu: txNsu ?? null,
            } as never,
          })
          .eq("id", orderNsu);
        if (upErr) return new Response("update-failed", { status: 400, headers: CORS });

        return new Response("ok", { status: 200, headers: CORS });
      },
    },
  },
});
