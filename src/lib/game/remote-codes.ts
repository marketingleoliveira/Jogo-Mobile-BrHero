// Fase 3 · Bloco 1 — Códigos/Redeem remoto com fallback local.
// Consulta códigos publicados no Admin (Supabase via admin_module_entities).
// Cacheia em memória + localStorage para uso offline.
// NÃO altera a estrutura do save do jogador; apenas resolve a definição do código.

import { supabase } from "@/integrations/supabase/client";

export interface RemoteRewardDef {
  gold?: number;
  gems?: number;
  essence?: number;
  epicChest?: boolean;
  cosmetic?: string;
  skin?: string;
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

const FALLBACK_CODES: RemoteCode[] = [
  {
    id: "C-GABI-FALLBACK",
    code: "GABI",
    active: true,
    startsAt: null,
    endsAt: null,
    totalLimit: 0,
    perPlayerLimit: 1,
    uses: 0,
    rewards: {
      gold: 100_000,
      gems: 500,
      essence: 50,
      chest: "Baú Épico",
      item: "",
      skin: "",
      cosmetic: "",
    },
  },
];

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

function cleanCode(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
}

function validRemoteCode(raw: unknown): RemoteCode | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<RemoteCode>;
  const code = cleanCode(data.code);
  if (!code) return null;
  return {
    id: typeof data.id === "string" ? data.id : `C-${code}`,
    code,
    active: data.active !== false,
    startsAt: typeof data.startsAt === "string" ? data.startsAt : null,
    endsAt: typeof data.endsAt === "string" ? data.endsAt : null,
    totalLimit: typeof data.totalLimit === "number" ? data.totalLimit : 0,
    perPlayerLimit: typeof data.perPlayerLimit === "number" ? data.perPlayerLimit : 1,
    uses: typeof data.uses === "number" ? data.uses : 0,
    rewards: (data.rewards ?? {}) as RemoteCodeRewards,
  };
}

function mergeFallbackCodes(list: RemoteCode[]): RemoteCode[] {
  const byCode = new Map<string, RemoteCode>();
  for (const code of FALLBACK_CODES) byCode.set(cleanCode(code.code), code);
  for (const code of list) byCode.set(cleanCode(code.code), code);
  return [...byCode.values()];
}

function setRegistry(list: RemoteCode[]) {
  registry = new Map(mergeFallbackCodes(list).map((c) => [cleanCode(c.code), c]));
}

async function fetchPublishedCodes(): Promise<RemoteCode[] | null> {
  try {
    const { data, error } = await supabase
      .from("admin_module_entities")
      .select("data")
      .eq("module", "codes");
    if (error || !data) return null;
    return data
      .map((row) => validRemoteCode((row as { data?: unknown }).data))
      .filter((code): code is RemoteCode => code !== null);
  } catch {
    return null;
  }
}

// Hidratação inicial silenciosa: primeiro cache local, depois tenta Supabase.
export async function hydrateRemoteCodes(): Promise<void> {
  setRegistry(loadCache());
  try {
    const codes = await fetchPublishedCodes();
    if (codes && codes.length > 0) {
      setRegistry(codes);
      saveCache(mergeFallbackCodes(codes));
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
  if (r.skin && r.skin.trim()) out.skin = r.skin.trim();
  return out;
}

function hasReward(r: RemoteCodeRewards): boolean {
  return !!(r.gold || r.gems || r.essence || (r.chest && r.chest.trim()) || (r.cosmetic && r.cosmetic.trim()) || (r.item && r.item.trim()) || (r.skin && r.skin.trim()));
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
  const code = cleanCode(rawCode);
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
  const alreadyUsed = usedList.map(cleanCode).includes(code);
  if (alreadyUsed && entry.perPlayerLimit >= 1)
    return { ok: false, error: "Código já resgatado" };

  if (!hasReward(entry.rewards))
    return { ok: false, error: "Cupom sem recompensa configurada" };


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
