// InfinitePay Checkout (modo B: link + webhook).
// - beginInfinitepayCheckout: cria transação PENDING autoritativa e gera link em
//   POST https://api.checkout.infinitepay.io/links com order_nsu = transactionId.
// - Webhook público em /api/public/hooks/infinitepay confirma o pagamento
//   consultando payment_check e libera reward_delivered=true.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const beginSchema = z.object({ offerId: z.string().min(1), redirectUrl: z.string().url().optional() });

interface AdminShopEntity {
  id: string;
  name: string;
  price: number;
  currency: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  quantity: number;
  sold: number;
  reward: string;
  rarity?: string;
  featured?: boolean;
}

export const beginInfinitepayCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => beginSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const handle = process.env.INFINITEPAY_HANDLE;
    if (!handle) return { ok: false as const, reason: "INFINITEPAY_HANDLE não configurado." };

    // 1) Flag global de pagamentos
    const { data: flagRow } = await supabase
      .from("admin_settings").select("value").eq("key", "payments.config").maybeSingle();
    const flag = (flagRow?.value ?? {}) as { enabled?: boolean };
    if (flag.enabled !== true) return { ok: false as const, reason: "Pagamentos desativados." };

    // 2) Oferta autoritativa
    const { data: entity } = await supabase
      .from("admin_module_entities").select("data")
      .eq("module", "shop").eq("entity_id", data.offerId).maybeSingle();
    if (!entity) return { ok: false as const, reason: "Oferta inexistente." };
    const offer = entity.data as unknown as AdminShopEntity;

    const now = Date.now();
    if (!offer.active) return { ok: false as const, reason: "Oferta inativa." };
    if (offer.currency !== "brl") return { ok: false as const, reason: "Oferta não é paga." };
    if (offer.startsAt && new Date(offer.startsAt).getTime() > now) return { ok: false as const, reason: "Oferta ainda não iniciou." };
    if (offer.endsAt && new Date(offer.endsAt).getTime() < now) return { ok: false as const, reason: "Oferta encerrada." };
    if (offer.quantity > 0 && offer.sold >= offer.quantity) return { ok: false as const, reason: "Oferta esgotada." };

    const amountCents = Math.round(offer.price * 100);
    const snapshot = {
      id: offer.id, name: offer.name, price: offer.price, currency: offer.currency,
      reward: offer.reward, rarity: offer.rarity ?? "common", featured: !!offer.featured, endsAt: offer.endsAt,
    };

    // 3) Cria transação PENDING (order_nsu = tx.id)
    const { data: tx, error } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: userId, offer_id: offer.id, offer_snapshot: snapshot as never,
        amount_cents: amountCents, currency: "BRL", status: "pending", provider: "infinitepay",
      })
      .select("id").single();
    if (error || !tx) return { ok: false as const, reason: error?.message ?? "Falha ao criar transação." };

    // 4) Cria link no InfinitePay
    const origin = (data.redirectUrl && new URL(data.redirectUrl).origin) || "https://brhero.com.br";
    const webhookUrl = `${origin.replace(/\/$/, "")}/api/public/hooks/infinitepay`;
    const payload = {
      handle,
      order_nsu: tx.id,
      redirect_url: data.redirectUrl ?? `${origin}/?payment=success`,
      webhook_url: webhookUrl,
      items: [{ quantity: 1, price: amountCents, description: offer.name }],
    };

    try {
      const res = await fetch("https://api.checkout.infinitepay.io/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; link?: string; checkout_url?: string; slug?: string; message?: string };
      const url = body.url ?? body.link ?? body.checkout_url;
      if (!res.ok || !url) {
        await supabase.from("payment_transactions")
          .update({ status: "failed", error_message: body.message ?? `HTTP ${res.status}` })
          .eq("id", tx.id);
        return { ok: false as const, reason: body.message ?? "Falha ao gerar link InfinitePay." };
      }
      await supabase.from("payment_transactions")
        .update({ provider_ref: body.slug ?? null, metadata: { checkout_url: url, slug: body.slug ?? null } as never })
        .eq("id", tx.id);
      return { ok: true as const, transactionId: tx.id, checkoutUrl: url };
    } catch (e) {
      return { ok: false as const, reason: e instanceof Error ? e.message : "Erro de rede." };
    }
  });
