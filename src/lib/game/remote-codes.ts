// Fase 3 · Bloco 1 — Códigos/Redeem remoto com fallback local.
// Consulta códigos publicados no Admin (Supabase via admin_module_entities).
// Cacheia em memória + localStorage para uso offline.
// NÃO altera a estrutura do save do jogador; apenas resolve a definição do código.

import { remoteList } from "@/lib/admin/supabase-module-store";

export interface RemoteRewardDef {
  gold?: number;
  gems?: number;
  essence?: number;
  epicChest?: boolean;
  cosmetic?: string;
}

export interface RemoteRedeemDef {
  label: string;
  desc: string;
  reward: RemoteRewardDef;
}

export type RemoteRedeemResult =
  | { ok: true; def: RemoteRedeemDef }
  | { ok: false; error: string }
  | null; // não encontrado remotamente → chamador tenta fallback local

interface RemoteCodeRewards {
  gold?: number; gems?: number; essence?: number;
  chest?: string; item?: string; skin?: string; cosmetic?: string;
}

interface RemoteCode {
  id: string;
  code: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  totalLimit: number;
  perPlayerLimit: number;
  uses: number;
  rewards: RemoteCodeRewards;
}

const CACHE_KEY = "brhero_remote_codes_cache_v1";
let registry: Map<string, RemoteCode> = new Map();
let hydrated = false;

// -- Cache local (fallback offline) --
function loadCache(): RemoteCode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as RemoteCode[];
  } catch { /* ignore */ }
  return [];
}
function saveCache(list: RemoteCode[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

function setRegistry(list: RemoteCode[]) {
  registry = new Map(list.map((c) => [c.code.toUpperCase(), c]));
}

// Hidratação inicial silenciosa: primeiro cache local, depois tenta Supabase.
export async function hydrateRemoteCodes(): Promise<void> {
  setRegistry(loadCache());
  try {
    const list = await remoteList<RemoteCode>("codes");
    if (list && list.length > 0) {
      const codes = list.map((r) => r.data);
      setRegistry(codes);
      saveCache(codes);
    }
  } catch { /* silencioso — mantém cache local */ }
  hydrated = true;
}

// Kick-off automático (fire-and-forget)
void hydrateRemoteCodes();

function mapReward(r: RemoteCodeRewards): RemoteRewardDef {
  const out: RemoteRewardDef = {};
  if (r.gold) out.gold = r.gold;
  if (r.gems) out.gems = r.gems;
  if (r.essence) out.essence = r.essence;
  if (r.chest && r.chest.trim()) out.epicChest = true;
  if (r.cosmetic && r.cosmetic.trim()) out.cosmetic = r.cosmetic.trim();
  return out;
}

function describe(r: RemoteCodeRewards): string {
  const parts: string[] = [];
  if (r.gold)     parts.push(`+${r.gold.toLocaleString("pt-BR")} 🪙`);
  if (r.gems)     parts.push(`+${r.gems} 💎`);
  if (r.essence)  parts.push(`+${r.essence} ✨`);
  if (r.chest)    parts.push(`🎁 ${r.chest}`);
  if (r.cosmetic) parts.push(`🎭 ${r.cosmetic}`);
  if (r.item)     parts.push(`⚔️ ${r.item}`);
  if (r.skin)     parts.push(`👕 ${r.skin}`);
  return parts.join(" · ") || "Recompensa";
}

/**
 * Resolve um código a partir do registry remoto.
 * Retorna `null` se não existir remotamente (chamador deve tentar fallback local).
 * Valida: ativo/inativo, agendamento, expiração, limite total, limite por jogador.
 */
export function resolveRemoteRedeem(rawCode: string, usedList: string[]): RemoteRedeemResult {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Digite um código" };
  const entry = registry.get(code);
  if (!entry) return null; // → fallback local

  if (!entry.active) return { ok: false, error: "Código inativo" };

  const now = Date.now();
  if (entry.startsAt && new Date(entry.startsAt).getTime() > now)
    return { ok: false, error: "Código ainda não liberado" };
  if (entry.endsAt && new Date(entry.endsAt).getTime() < now)
    return { ok: false, error: "Código expirado" };
  if (entry.totalLimit > 0 && entry.uses >= entry.totalLimit)
    return { ok: false, error: "Código esgotado" };

  // Limite por jogador: usedList guarda códigos já resgatados neste save.
  // Estrutura atual do save não conta múltiplos usos, então tratamos qualquer
  // presença como "já resgatado" para respeitar perPlayerLimit >= 1.
  const alreadyUsed = usedList.includes(code);
  if (alreadyUsed && entry.perPlayerLimit >= 1)
    return { ok: false, error: "Código já resgatado" };

  return {
    ok: true,
    def: {
      label: entry.code,
      desc: describe(entry.rewards),
      reward: mapReward(entry.rewards),
    },
  };
}

export function isRemoteCodesHydrated() { return hydrated; }
