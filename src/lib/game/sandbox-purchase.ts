// Fase 3 · Bloco 4a.2.1 — Entrega segura de recompensa sandbox no cliente.
// Correções da auditoria:
//  - Idempotência GLOBAL agora vem do backend (claimSandboxDelivery + coluna
//    client_consumed_at). localStorage é apenas cache secundário de UX;
//    apagá-lo NÃO permite reentrega, pois o UPDATE atômico no servidor falha.
//  - reward vem do offer_snapshot autoritativo gravado pelo servidor.
//  - fallback removido: se parsing falhar, NÃO entrega gems fantasmas.

import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPlayerTransactions, type PaymentTransaction } from "@/lib/game/payments";
import { claimSandboxDelivery } from "@/lib/game/payments-secure.functions";

const DELIVERED_KEY = "brhero_sandbox_delivered_v1";

export interface ParsedReward {
  gems: number;
  gold: number;
  essence: number;
  raw: string;
}

/** Parser tolerante para strings de recompensa do Admin. */
export function parseReward(text: string): ParsedReward {
  const t = (text || "").toLowerCase();
  const grab = (re: RegExp): number => {
    const m = t.match(re);
    if (!m) return 0;
    const n = parseInt(m[1].replace(/[.,]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  };
  const gems = grab(/(\d[\d.,]*)\s*(?:💎|gems?|cristais|cristal)/) || grab(/(?:💎|gems?|cristais)\s*(\d[\d.,]*)/);
  const gold = grab(/(\d[\d.,]*)\s*(?:🪙|gold|ouro|moedas?)/) || grab(/(?:🪙|gold|ouro)\s*(\d[\d.,]*)/);
  const essence = grab(/(\d[\d.,]*)\s*(?:✨|essence|essência|essencia)/) || grab(/(?:✨|essence|essência)\s*(\d[\d.,]*)/);
  return { gems, gold, essence, raw: text };
}

function readDelivered(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DELIVERED_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}
function writeDelivered(set: Set<string>) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(DELIVERED_KEY, JSON.stringify([...set].slice(-200))); } catch { /* ignore */ }
}
export function isLocallyDelivered(txId: string): boolean { return readDelivered().has(txId); }
export function markLocallyDelivered(txId: string) {
  const s = readDelivered(); s.add(txId); writeDelivered(s);
}

/**
 * Polling do histórico + entrega idempotente via server-fn.
 * Só chama `onDeliver` quando o UPDATE atômico no backend seta client_consumed_at.
 */
export function useSandboxDelivery(
  onDeliver: (tx: PaymentTransaction, parsed: ParsedReward) => void,
  intervalMs = 6000,
) {
  const cb = useRef(onDeliver); cb.current = onDeliver;
  const claim = useServerFn(claimSandboxDelivery);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const list = await getPlayerTransactions(30);
        if (!alive) return;
        for (const tx of list) {
          if (tx.status !== "paid" || !tx.reward_delivered) continue;
          if (tx.client_consumed_at) { markLocallyDelivered(tx.id); continue; }
          if (isLocallyDelivered(tx.id)) continue;

          // Reivindica no servidor. Se outra sessão/device já consumiu, aborta.
          const res = await claim({ data: { transactionId: tx.id } });
          if (!res.ok) { markLocallyDelivered(tx.id); continue; }

          const snap = res.snapshot ?? (tx.offer_snapshot as { reward?: string } | null);
          const parsed = parseReward(snap?.reward ?? "");
          // Sem fallback: se parsing falhou, não fabrica recompensa.
          if (!parsed.gems && !parsed.gold && !parsed.essence) {
            markLocallyDelivered(tx.id);
            continue;
          }
          markLocallyDelivered(tx.id);
          cb.current(tx, parsed);
        }
      } catch { /* silencioso */ }
    };
    void tick();
    const id = window.setInterval(tick, intervalMs);
    return () => { alive = false; window.clearInterval(id); };
  }, [intervalMs, claim]);
}
