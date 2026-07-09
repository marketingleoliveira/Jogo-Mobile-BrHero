// Fase 3 · Bloco 2 — LiveOps read-only para o gameplay.
// Consulta campanhas ativas do Admin CMS (admin_module_entities) e expõe
// multiplicadores + mensagem global + aviso de manutenção.
// Cacheia em localStorage para uso offline. Nunca bloqueia o jogo.
// NÃO altera a estrutura do save.

import { useEffect, useState } from "react";
import { remoteList } from "@/lib/admin/supabase-module-store";

type CampaignType =
  | "double_xp" | "double_gold" | "double_drop"
  | "flash_event" | "global_message" | "maintenance";

interface RemoteCampaign {
  id: string;
  name: string;
  type: CampaignType;
  startsAt: string | null;
  endsAt: string | null;
  multiplier: number;
  message: string;
  active: boolean;
  priority: number;
}

export interface LiveOpsMultipliers { xp: number; gold: number; drop: number }
export interface LiveOpsFlashEvent { id: string; name: string; message: string; endsAt: string | null }
export interface LiveOpsSnapshot {
  mult: LiveOpsMultipliers;
  globalMessage: string | null;
  maintenance: { message: string; startsAt: string | null; endsAt: string | null; active: boolean } | null;
  activeBuffs: { type: "double_xp" | "double_gold" | "double_drop"; multiplier: number; endsAt: string | null }[];
  flashEvents: LiveOpsFlashEvent[];
}

const CACHE_KEY = "brhero_remote_liveops_cache_v1";
const EMPTY: LiveOpsSnapshot = {
  mult: { xp: 1, gold: 1, drop: 1 },
  globalMessage: null,
  maintenance: null,
  activeBuffs: [],
  flashEvents: [],
};

let campaigns: RemoteCampaign[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function loadCache(): RemoteCampaign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as RemoteCampaign[];
  } catch { /* ignore */ }
  return [];
}
function saveCache(list: RemoteCampaign[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

function isActive(c: RemoteCampaign, now: number): boolean {
  if (!c.active) return false;
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return false;
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return false;
  return true;
}
function isScheduledSoon(c: RemoteCampaign, now: number): boolean {
  if (!c.active) return false;
  if (!c.startsAt) return false;
  const t = new Date(c.startsAt).getTime();
  return t > now && t - now < 24 * 60 * 60 * 1000;
}

export function getLiveOpsSnapshot(): LiveOpsSnapshot {
  if (campaigns.length === 0) return EMPTY;
  const now = Date.now();
  const snap: LiveOpsSnapshot = {
    mult: { xp: 1, gold: 1, drop: 1 },
    globalMessage: null,
    maintenance: null,
    activeBuffs: [],
  };
  let msgPriority = Infinity;
  for (const c of campaigns) {
    const active = isActive(c, now);
    if (active && (c.type === "double_xp" || c.type === "double_gold" || c.type === "double_drop")) {
      const m = Math.max(1, c.multiplier || 1);
      const key = c.type === "double_xp" ? "xp" : c.type === "double_gold" ? "gold" : "drop";
      if (m > snap.mult[key]) snap.mult[key] = m;
      snap.activeBuffs.push({ type: c.type, multiplier: m, endsAt: c.endsAt });
    }
    if (active && c.type === "global_message" && c.message && c.priority < msgPriority) {
      snap.globalMessage = c.message;
      msgPriority = c.priority;
    }
    if (c.type === "maintenance" && (active || isScheduledSoon(c, now))) {
      // manter apenas o mais próximo/ativo
      if (!snap.maintenance || (c.startsAt && (!snap.maintenance.startsAt || new Date(c.startsAt) < new Date(snap.maintenance.startsAt)))) {
        snap.maintenance = {
          message: c.message || "Manutenção programada",
          startsAt: c.startsAt, endsAt: c.endsAt, active,
        };
      }
    }
  }
  return snap;
}

export function getLiveOpsMultipliers(): LiveOpsMultipliers {
  return getLiveOpsSnapshot().mult;
}

function emit() { listeners.forEach((l) => l()); }

export async function hydrateRemoteLiveOps(): Promise<void> {
  campaigns = loadCache();
  emit();
  try {
    const list = await remoteList<RemoteCampaign>("liveops");
    if (list) {
      campaigns = list.map((r) => r.data);
      saveCache(campaigns);
      emit();
    }
  } catch { /* silencioso */ }
  hydrated = true;
}

// Kick-off automático + refresh periódico leve (5 min)
void hydrateRemoteLiveOps();
if (typeof window !== "undefined") {
  window.setInterval(() => { void hydrateRemoteLiveOps(); }, 5 * 60 * 1000);
  // Re-emit a cada 30s para que buffs expirem visualmente sem refetch
  window.setInterval(emit, 30 * 1000);
}

export function isRemoteLiveOpsHydrated() { return hydrated; }

export function useLiveOps(): LiveOpsSnapshot {
  const [snap, setSnap] = useState<LiveOpsSnapshot>(() => getLiveOpsSnapshot());
  useEffect(() => {
    const l = () => setSnap(getLiveOpsSnapshot());
    listeners.add(l);
    l();
    return () => { listeners.delete(l); };
  }, []);
  return snap;
}
