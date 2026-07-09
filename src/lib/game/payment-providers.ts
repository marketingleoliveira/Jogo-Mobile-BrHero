// Fase 3 · Bloco 4a.3 (schema-only) — Feature flags de provedores de pagamento.
// Ainda NÃO liga Stripe: só expõe leitura das flags para o Admin/gameplay decidirem
// qual provider oferecer. Pagamento real permanece desligado até stripe_enabled=true
// + integração real do webhook (próximo bloco).

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { persistRemoteLog } from "@/lib/admin/supabase-admin";

const KEY = "payments.providers";
const TTL_MS = 60_000;

export type PaymentProvider = "stripe" | "sandbox" | "google_play";

export interface PaymentProvidersConfig {
  stripe_enabled: boolean;
  sandbox_enabled: boolean;
  google_play_enabled: boolean;
  /** Ordem de tentativa. Primeiro habilitado vence. */
  priority: PaymentProvider[];
}

const DEFAULT_CFG: PaymentProvidersConfig = {
  stripe_enabled: false,
  sandbox_enabled: true,
  google_play_enabled: false,
  priority: ["stripe", "sandbox"],
};

let cache: PaymentProvidersConfig | null = null;
let cachedAt = 0;
const listeners = new Set<(c: PaymentProvidersConfig) => void>();

export async function getPaymentProviders(force = false): Promise<PaymentProvidersConfig> {
  const now = Date.now();
  if (!force && cache && now - cachedAt < TTL_MS) return cache;
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", KEY)
      .maybeSingle();
    if (error || !data) {
      cache = { ...DEFAULT_CFG };
    } else {
      const v = (data.value ?? {}) as Partial<PaymentProvidersConfig>;
      cache = {
        stripe_enabled: v.stripe_enabled === true,
        sandbox_enabled: v.sandbox_enabled !== false,
        google_play_enabled: v.google_play_enabled === true,
        priority: Array.isArray(v.priority) && v.priority.length
          ? (v.priority as PaymentProvider[])
          : DEFAULT_CFG.priority,
      };
    }
  } catch {
    cache = { ...DEFAULT_CFG };
  }
  cachedAt = now;
  listeners.forEach((l) => l(cache!));
  return cache;
}

export async function setPaymentProviders(next: PaymentProvidersConfig): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("admin_settings").upsert(
      { key: KEY, value: next as never, updated_by: session?.user.id ?? null },
      { onConflict: "key" },
    );
    if (error) return false;
    cache = next;
    cachedAt = Date.now();
    listeners.forEach((l) => l(next));
    await persistRemoteLog({
      module: "shop",
      action: "toggle",
      target: KEY,
      reason: `providers stripe=${next.stripe_enabled} sandbox=${next.sandbox_enabled} gp=${next.google_play_enabled}`,
      role: "super_admin",
    });
    return true;
  } catch {
    return false;
  }
}

/** Retorna o primeiro provider habilitado seguindo a prioridade configurada. */
export function resolveActiveProvider(cfg: PaymentProvidersConfig): PaymentProvider | null {
  for (const p of cfg.priority) {
    if (p === "stripe" && cfg.stripe_enabled) return "stripe";
    if (p === "sandbox" && cfg.sandbox_enabled) return "sandbox";
    if (p === "google_play" && cfg.google_play_enabled) return "google_play";
  }
  return null;
}

export function usePaymentProviders(): PaymentProvidersConfig | null {
  const [cfg, setCfg] = useState<PaymentProvidersConfig | null>(cache);
  useEffect(() => {
    const l = (c: PaymentProvidersConfig) => setCfg(c);
    listeners.add(l);
    void getPaymentProviders().then(setCfg);
    return () => { listeners.delete(l); };
  }, []);
  return cfg;
}
