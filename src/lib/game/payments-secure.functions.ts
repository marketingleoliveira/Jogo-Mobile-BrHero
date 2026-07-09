// Fase 3 · Bloco 4a.2.1 — Server-fns seguras de pagamento sandbox.
// Corrigem 2 bugs da auditoria:
//  BUG A: cliente forjava offer_snapshot (reward/valor). Agora o snapshot vem do Admin no servidor.
//  BUG B: idempotência era só localStorage. Agora client_consumed_at trava a entrega no backend.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const beginSchema = z.object({ offerId: z.string().min(1) });
const claimSchema = z.object({ transactionId: z.string().uuid() });

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

/**
 * Cria transação PENDING usando dados AUTORITATIVOS do Admin.
 * Cliente só envia offerId; server valida e monta o snapshot.
 */
export const beginSecureSandboxCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => beginSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1) Feature flag
    const { data: flagRow } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "payments.config")
      .maybeSingle();
    const flag = (flagRow?.value ?? {}) as { enabled?: boolean; provider?: string };
    if (flag.enabled !== true) {
      return { ok: false as const, reason: "Pagamentos desativados pelo Admin." };
    }
    const provider = flag.provider ?? "sandbox";

    // 2) Oferta autoritativa do Admin
    const { data: entity, error: entErr } = await supabase
      .from("admin_module_entities")
      .select("data")
      .eq("module", "shop")
      .eq("entity_id", data.offerId)
      .maybeSingle();
    if (entErr || !entity) {
      return { ok: false as const, reason: "Oferta inexistente." };
    }
    const offer = entity.data as AdminShopEntity;

    // 3) Validações server-side (janela / estoque / moeda)
    const now = Date.now();
    if (!offer.active) return { ok: false as const, reason: "Oferta inativa." };
    if (offer.currency !== "brl") return { ok: false as const, reason: "Oferta não é paga." };
    if (offer.startsAt && new Date(offer.startsAt).getTime() > now)
      return { ok: false as const, reason: "Oferta ainda não iniciou." };
    if (offer.endsAt && new Date(offer.endsAt).getTime() < now)
      return { ok: false as const, reason: "Oferta encerrada." };
    if (offer.quantity > 0 && offer.sold >= offer.quantity)
      return { ok: false as const, reason: "Oferta esgotada." };

    // 4) INSERT com snapshot autoritativo (nada do cliente é confiado)
    const amountCents = Math.round(offer.price * 100);
    const authoritativeSnapshot = {
      id: offer.id,
      name: offer.name,
      price: offer.price,
      currency: offer.currency,
      reward: offer.reward,
      rarity: offer.rarity ?? "common",
      featured: !!offer.featured,
      endsAt: offer.endsAt,
    };

    const { data: tx, error } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: userId,
        offer_id: offer.id,
        offer_snapshot: authoritativeSnapshot as never,
        amount_cents: amountCents,
        currency: "BRL",
        status: "pending",
        provider,
      })
      .select("id")
      .single();
    if (error || !tx) {
      return { ok: false as const, reason: error?.message ?? "Falha ao criar transação." };
    }
    return { ok: true as const, transactionId: tx.id };
  });

/**
 * Reivindica UMA VEZ a entrega da recompensa.
 * Retorna o snapshot autoritativo somente se o UPDATE atômico setar client_consumed_at.
 * Se já foi consumida, retorna alreadyConsumed=true e nada é entregue novamente.
 */
export const claimSandboxDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => claimSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // UPDATE atômico via RLS (policy exige status=paid, reward_delivered=true, client_consumed_at IS NULL).
    const { data: updated, error } = await supabase
      .from("payment_transactions")
      .update({ client_consumed_at: new Date().toISOString() })
      .eq("id", data.transactionId)
      .eq("user_id", userId)
      .is("client_consumed_at", null)
      .select("id, offer_snapshot, amount_cents")
      .maybeSingle();

    if (error) return { ok: false as const, reason: error.message };
    if (!updated) return { ok: false as const, alreadyConsumed: true, reason: "Já entregue ou não elegível." };

    return {
      ok: true as const,
      transactionId: updated.id,
      snapshot: updated.offer_snapshot as { reward?: string; name?: string } | null,
      amountCents: updated.amount_cents,
    };
  });
