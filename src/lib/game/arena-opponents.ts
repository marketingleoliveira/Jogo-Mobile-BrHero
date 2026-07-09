// Fase 4 · Bloco 3 — Arena PvP com snapshots reais do ranking.
// Lê apenas campos públicos de `leaderboards` (RLS). Fallback silencioso para NPC.
// Throttle de 60s. Histórico local das últimas 20 batalhas.

import { supabase } from "@/integrations/supabase/client";
import type { PublicProfileMeta } from "@/lib/game/leaderboards";

export interface RealArenaOpponent {
  userId: string;
  name: string;
  heroPower: number;
  rank: number;                  // posição real na categoria hero_power
  avatar: string | null;
  title: string | null;
  skin: string | null;
  guild: string | null;
  updatedAt: string;
  real: true;
}

const REFRESH_KEY = "brhero_arena_last_refresh_v1";
const REFRESH_INTERVAL_MS = 60_000;
const CACHE_KEY = "brhero_arena_opponents_cache_v1";
const HISTORY_KEY = "brhero_arena_history_v1";
const HISTORY_MAX = 20;

export interface ArenaHistoryEntry {
  at: number;
  win: boolean;
  opponentName: string;
  opponentPower: number;
  opponentUserId?: string;
  real: boolean;
}

export function canRefreshOpponents(): boolean {
  try {
    const last = Number(localStorage.getItem(REFRESH_KEY) ?? 0);
    return Date.now() - last >= REFRESH_INTERVAL_MS;
  } catch { return true; }
}

export function nextRefreshInMs(): number {
  try {
    const last = Number(localStorage.getItem(REFRESH_KEY) ?? 0);
    return Math.max(0, REFRESH_INTERVAL_MS - (Date.now() - last));
  } catch { return 0; }
}

function readCachedOpponents(): RealArenaOpponent[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RealArenaOpponent[];
  } catch { return null; }
}

function writeCachedOpponents(list: RealArenaOpponent[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch { /* noop */ }
}

/**
 * Busca oponentes reais próximos do heroPower do jogador na categoria "hero_power".
 * Usa cache local. Respeita throttle salvo `force`.
 * Fallback: retorna [] se offline ou sem dados suficientes (chamador usa NPCs).
 */
export async function fetchArenaOpponents(
  currentUserId: string | null,
  heroPower: number,
  limit = 5,
  force = false,
): Promise<RealArenaOpponent[]> {
  if (!force) {
    const cached = readCachedOpponents();
    if (cached && !canRefreshOpponents()) return cached;
  }
  try {
    // Faixa: metade a dobro do poder do jogador
    const min = Math.max(1, Math.floor(heroPower * 0.5));
    const max = Math.max(min + 1, Math.ceil(heroPower * 2.0));

    let query = supabase
      .from("leaderboards")
      .select("user_id,score,display_name,extra,updated_at")
      .eq("category", "hero_power")
      .gte("score", min)
      .lte("score", max)
      .order("score", { ascending: false })
      .limit(limit * 4);
    if (currentUserId) query = query.neq("user_id", currentUserId);

    const { data, error } = await query;
    if (error || !data || data.length === 0) return readCachedOpponents() ?? [];

    // Embaralha e pega N
    const picked = [...data].sort(() => Math.random() - 0.5).slice(0, limit);

    // Rank global de cada um (score DESC): count de scores > o dele + 1
    const opponents: RealArenaOpponent[] = await Promise.all(
      picked.map(async (row) => {
        const meta = (row.extra ?? {}) as PublicProfileMeta;
        let rank = 0;
        try {
          const { count } = await supabase
            .from("leaderboards")
            .select("user_id", { count: "exact", head: true })
            .eq("category", "hero_power")
            .gt("score", row.score);
          rank = (count ?? 0) + 1;
        } catch { rank = 0; }
        return {
          userId: row.user_id,
          name: (row.display_name ?? "Herói").slice(0, 32),
          heroPower: Number(row.score) || 0,
          rank,
          avatar: meta.avatar ?? null,
          title:  meta.title  ?? null,
          skin:   meta.skin   ?? null,
          guild:  meta.guild  ?? null,
          updatedAt: row.updated_at,
          real: true,
        };
      }),
    );

    writeCachedOpponents(opponents);
    try { localStorage.setItem(REFRESH_KEY, String(Date.now())); } catch { /* noop */ }
    return opponents;
  } catch {
    return readCachedOpponents() ?? [];
  }
}

// ==== Histórico local de batalhas ====
export function readArenaHistory(): ArenaHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ArenaHistoryEntry[];
  } catch { return []; }
}

export function pushArenaHistory(entry: ArenaHistoryEntry) {
  try {
    const list = readArenaHistory();
    list.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  } catch { /* noop */ }
}
