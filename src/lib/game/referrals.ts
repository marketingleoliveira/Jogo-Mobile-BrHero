// Sistema de convites — cada jogador tem um link `?ref=<uid>`.
// Quem entra pelo link e loga: credita 10💎 ao convidante (via RPC claim_referral).
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const REF_KEY = "brhero_pending_ref_v1";
const CLAIMED_KEY = "brhero_ref_claimed_v1";

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Chame uma vez no boot: captura ?ref= da URL e guarda em localStorage. */
export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (ref && uuidRe.test(ref) && !localStorage.getItem(CLAIMED_KEY)) {
      localStorage.setItem(REF_KEY, ref);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.toString());
    }
  } catch { /* noop */ }
}

/** Se houver ref pendente e o usuário atual não for o próprio convidante, reclama 10💎. */
export async function tryClaimPendingReferral(userId: string): Promise<{ ok: boolean; gems?: number; reason?: string } | null> {
  if (typeof window === "undefined") return null;
  const ref = localStorage.getItem(REF_KEY);
  if (!ref || localStorage.getItem(CLAIMED_KEY)) return null;
  if (ref === userId) { localStorage.removeItem(REF_KEY); return null; }
  try {
    const { data, error } = await supabase.rpc("claim_referral", { _referrer: ref });
    if (error) return { ok: false, reason: error.message };
    localStorage.removeItem(REF_KEY);
    localStorage.setItem(CLAIMED_KEY, "1");
    return data as { ok: boolean; gems?: number; reason?: string };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

export function buildInviteLink(userId: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/?ref=${userId}`;
}

export interface ReferralStats { count: number; }

export function useReferralStats(userId: string | null): ReferralStats {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!userId) { setCount(0); return; }
    void supabase
      .from("player_referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .then(({ count }) => setCount(count ?? 0));
  }, [userId]);
  return { count };
}
