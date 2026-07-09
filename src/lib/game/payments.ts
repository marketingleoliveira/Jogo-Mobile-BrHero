// Fase 3 · Bloco 4a — Pagamentos Sandbox atrás de Feature Flag.
// Regras invioláveis:
//  - Nunca entrega recompensa antes de status = 'paid' + reward_delivered = true
//    (esse update só é possível via admin/backend).
//  - Se a flag estiver off, checkout retorna erro amigável e nada é gravado.
//  - Todas as transações geram registro em payment_transactions (audit trail).
//  - Fallback silencioso: se Supabase estiver indisponível, feature "off".

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { persistRemoteLog } from "@/lib/admin/supabase-admin";
import type { RemoteOffer } from "@/lib/game/remote-shop";

const FLAG_KEY = "payments.config";

export interface PaymentsConfig {
  enabled: boolean;
  provider: "sandbox" | "stripe" | "google_play";
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface PaymentTransaction {
  id: string;
  offer_id: string;
  offer_snapshot: RemoteOffer | Record<string, unknown>;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_ref: string | null;
  reward_delivered: boolean;
  reward_delivered_at: string | null;
  client_consumed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface CheckoutResult {
  ok: boolean;
  transactionId?: string;
  reason?: string;
}

let cachedConfig: PaymentsConfig | null = null;
let cachedAt = 0;
const CONFIG_TTL_MS = 60_000;

const configListeners = new Set<(c: PaymentsConfig) => void>();

/** Lê a flag do Admin (admin_settings). Cache 60s, fallback = disabled. */
export async function getPaymentsConfig(force = false): Promise<PaymentsConfig> {
  const now = Date.now();
  if (!force && cachedConfig && now - cachedAt < CONFIG_TTL_MS) return cachedConfig;
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", FLAG_KEY)
      .maybeSingle();
    if (error || !data) {
      cachedConfig = { enabled: false, provider: "sandbox" };
    } else {
      const v = (data.value ?? {}) as Partial<PaymentsConfig>;
      cachedConfig = {
        enabled: v.enabled === true,
        provider: (v.provider as PaymentsConfig["provider"]) ?? "sandbox",
      };
    }
  } catch {
    cachedConfig = { enabled: false, provider: "sandbox" };
  }
  cachedAt = now;
  configListeners.forEach((l) => l(cachedConfig!));
  return cachedConfig;
}

/** Admin only: atualiza a flag. RLS garante que só admin escreve admin_settings. */
export async function setPaymentsConfig(next: PaymentsConfig): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("admin_settings").upsert(
      { key: FLAG_KEY, value: next as never, updated_by: session?.user.id ?? null },
      { onConflict: "key" },
    );
    if (error) return false;
    cachedConfig = next;
    cachedAt = Date.now();
    configListeners.forEach((l) => l(next));
    await persistRemoteLog({
      module: "shop",
      action: "toggle",
      target: FLAG_KEY,
      reason: `payments_enabled=${next.enabled} provider=${next.provider}`,
      role: "super_admin",
    });
    return true;
  } catch {
    return false;
  }
}

export function usePaymentsConfig(): PaymentsConfig | null {
  const [cfg, setCfg] = useState<PaymentsConfig | null>(cachedConfig);
  useEffect(() => {
    const l = (c: PaymentsConfig) => setCfg(c);
    configListeners.add(l);
    void getPaymentsConfig().then(setCfg);
    return () => { configListeners.delete(l); };
  }, []);
  return cfg;
}

/**
 * Cria uma transação `pending` para a oferta. NÃO entrega recompensa.
 * Somente admins/webhooks podem marcar como `paid` e liberar a recompensa.
 */
export async function beginSandboxCheckout(offer: RemoteOffer): Promise<CheckoutResult> {
  if (offer.currency !== "brl") {
    return { ok: false, reason: "Oferta não é paga (moeda real)." };
  }
  try {
    // Delegado à server-fn segura: valida flag+oferta e monta snapshot AUTORITATIVO no backend.
    // Cliente NÃO envia mais reward/price — envia só o offerId.
    const { beginSecureSandboxCheckout } = await import("@/lib/game/payments-secure.functions");
    const res = await beginSecureSandboxCheckout({ data: { offerId: offer.id } });
    if (!res.ok) return { ok: false, reason: res.reason };
    return { ok: true, transactionId: res.transactionId };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Erro desconhecido." };
  }
}

/** Histórico de compras do jogador (mais recentes primeiro). */
export async function getPlayerTransactions(limit = 20): Promise<PaymentTransaction[]> {
  try {
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("id,offer_id,offer_snapshot,amount_cents,currency,status,provider,provider_ref,reward_delivered,reward_delivered_at,client_consumed_at,error_message,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as unknown as PaymentTransaction[];
  } catch {
    return [];
  }
}

export function usePlayerTransactions(): { list: PaymentTransaction[]; loading: boolean; refresh: () => void } {
  const [list, setList] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = () => {
    setLoading(true);
    void getPlayerTransactions().then((l) => { setList(l); setLoading(false); });
  };
  useEffect(() => { refresh(); }, []);
  return { list, loading, refresh };
}
