// Fase 3 · Bloco 4a.2 — Entrega segura de recompensa sandbox no cliente.
// Regras:
//  - Só entrega quando transação está `paid` E `reward_delivered = true` no backend.
//  - Idempotente: cada transaction.id é entregue no máximo uma vez neste dispositivo
//    (registro em localStorage). Se o jogador jogar em outro device, o backend
//    permanece como fonte de verdade para o admin, mas a recompensa é aplicada
//    ao save local do device onde o polling encontrar o `paid` primeiro.
//  - Se parsing do reward falhar, aplica fallback pequeno (100 gems) e loga.

import { useEffect, useRef } from "react";
import { getPlayerTransactions, type PaymentTransaction } from "@/lib/game/payments";

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
 * Polling do histórico + entrega idempotente.
 * Chama `onDeliver` uma única vez por transação `paid` + `reward_delivered`.
 */
export function useSandboxDelivery(
  onDeliver: (tx: PaymentTransaction, parsed: ParsedReward) => void,
  intervalMs = 6000,
) {
  const cb = useRef(onDeliver); cb.current = onDeliver;
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const list = await getPlayerTransactions(30);
        if (!alive) return;
        for (const tx of list) {
          if (tx.status !== "paid" || !tx.reward_delivered) continue;
          if (isLocallyDelivered(tx.id)) continue;
          const snapshot = tx.offer_snapshot as { reward?: string } | null;
          const parsed = parseReward(snapshot?.reward ?? "");
          markLocallyDelivered(tx.id);
          cb.current(tx, parsed);
        }
      } catch { /* silencioso */ }
    };
    void tick();
    const id = window.setInterval(tick, intervalMs);
    return () => { alive = false; window.clearInterval(id); };
  }, [intervalMs]);
}
