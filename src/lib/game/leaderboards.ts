// Fase 4 · Bloco 1 + Bloco 4 — Ranking Global com temporadas.
// Leitura pública + upload do próprio snapshot (RLS: só o dono grava a própria linha).
// Cache local (30s) por (categoria, temporada). Falha silenciosa se offline.

import { useEffect, useState } from "react";
import { currentSeasonKey, type SeasonType } from "@/lib/game/seasons";
import { supabase } from "@/integrations/supabase/client";

export type LeaderboardCategory = "stage" | "rebirth" | "tower" | "arena" | "hero_power";

export interface LeaderboardEntry {
  user_id: string;
  category: LeaderboardCategory;
  score: number;
  display_name: string | null;
  extra: Record<string, unknown>;
  updated_at: string;
}

/** Metadata cosmético público, exibido no perfil. Nada sensível. */
export interface PublicProfileMeta {
  avatar?: string | null;   // ex: emoji ou id de sprite
  title?: string | null;    // ex: "Andarilho Infinito"
  skin?: string | null;     // id da skin equipada
  guild?: string | null;    // id/nome da guilda
}

/** Snapshot mínimo que o jogo envia. Todos números — sem dados sensíveis. */
export interface PlayerSnapshot {
  displayName?: string | null;
  stage: number;
  rebirth: number;
  tower: number;
  arena: number;
  heroPower: number;
  profile?: PublicProfileMeta;
}

export interface PublicProfile {
  userId: string;
  displayName: string;
  meta: PublicProfileMeta;
  scores: Record<LeaderboardCategory, number>;
  updatedAt: string | null;
}


const CACHE_TTL_MS = 30_000;
const CACHE_KEY = "brhero_leaderboard_cache_v1";
const UPLOAD_KEY = "brhero_leaderboard_last_upload_v1";
const UPLOAD_INTERVAL_MS = 5 * 60_000;

type CacheShape = Partial<Record<LeaderboardCategory, { at: number; rows: LeaderboardEntry[] }>>;

function readCache(): CacheShape {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}"); } catch { return {}; }
}
function writeCache(c: CacheShape) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* noop */ }
}

/** Lê top N do ranking. Usa cache local (30s) para reduzir leituras remotas. */
export async function fetchLeaderboard(
  category: LeaderboardCategory,
  limit = 100,
  force = false,
): Promise<LeaderboardEntry[]> {
  const cache = readCache();
  const hit = cache[category];
  if (!force && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.rows;
  try {
    const { data, error } = await supabase
      .from("leaderboards")
      .select("user_id,category,score,display_name,extra,updated_at")
      .eq("category", category)
      .order("score", { ascending: false })
      .limit(limit);
    if (error || !data) return hit?.rows ?? [];
    const rows = data as unknown as LeaderboardEntry[];
    writeCache({ ...cache, [category]: { at: Date.now(), rows } });
    return rows;
  } catch {
    return hit?.rows ?? [];
  }
}

/**
 * Envia o snapshot do jogador. Um upsert por categoria (RLS impede sobrescrever outros).
 * No-op se não autenticado. Throttle local: no máx 1 upload a cada 5 min.
 */
export async function uploadPlayerSnapshot(snap: PlayerSnapshot, force = false): Promise<boolean> {
  try {
    const last = Number(localStorage.getItem(UPLOAD_KEY) ?? 0);
    if (!force && Date.now() - last < UPLOAD_INTERVAL_MS) return false;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const uid = session.user.id;
    const name = (snap.displayName ?? session.user.email ?? "Herói").slice(0, 32);

    const meta: PublicProfileMeta = {
      avatar: snap.profile?.avatar ?? null,
      title:  snap.profile?.title  ?? null,
      skin:   snap.profile?.skin   ?? null,
      guild:  snap.profile?.guild  ?? null,
    };
    const extra = meta as unknown as Record<string, unknown>;

    const rows: Array<{
      user_id: string; category: LeaderboardCategory; score: number;
      display_name: string; extra: Record<string, unknown>;
    }> = [
      { user_id: uid, category: "stage",      score: Math.max(0, Math.floor(snap.stage)),     display_name: name, extra },
      { user_id: uid, category: "rebirth",    score: Math.max(0, Math.floor(snap.rebirth)),   display_name: name, extra },
      { user_id: uid, category: "tower",      score: Math.max(0, Math.floor(snap.tower)),     display_name: name, extra },
      { user_id: uid, category: "arena",      score: Math.max(0, Math.floor(snap.arena)),     display_name: name, extra },
      { user_id: uid, category: "hero_power", score: Math.max(0, Math.floor(snap.heroPower)), display_name: name, extra },
    ];

    const { error } = await supabase
      .from("leaderboards")
      .upsert(rows as never, { onConflict: "user_id,category" });
    if (error) return false;

    try { localStorage.setItem(UPLOAD_KEY, String(Date.now())); } catch { /* noop */ }
    return true;
  } catch {
    return false;
  }
}

/** Hook: baixa e mantém em cache o ranking de uma categoria. */
export function useLeaderboard(category: LeaderboardCategory, limit = 100) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = (force = false) => {
    setLoading(true);
    void fetchLeaderboard(category, limit, force).then((r) => { setRows(r); setLoading(false); });
  };
  useEffect(() => { refresh(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [category, limit]);
  return { rows, loading, refresh };
}

const CATEGORIES: LeaderboardCategory[] = ["stage", "rebirth", "tower", "arena", "hero_power"];

/** Perfil público de um jogador. Agrega linhas dele em leaderboards. */
export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  try {
    const { data, error } = await supabase
      .from("leaderboards")
      .select("user_id,category,score,display_name,extra,updated_at")
      .eq("user_id", userId);
    if (error || !data || data.length === 0) return null;
    const rows = data as unknown as LeaderboardEntry[];
    const scores = { stage: 0, rebirth: 0, tower: 0, arena: 0, hero_power: 0 } as Record<LeaderboardCategory, number>;
    let updatedAt: string | null = null;
    let name = "Herói";
    let meta: PublicProfileMeta = {};
    for (const r of rows) {
      scores[r.category] = Number(r.score) || 0;
      if (r.display_name) name = r.display_name;
      const rm = (r.extra ?? {}) as PublicProfileMeta;
      if (rm && Object.keys(rm).length) meta = rm;
      if (!updatedAt || (r.updated_at && r.updated_at > updatedAt)) updatedAt = r.updated_at;
    }
    return { userId, displayName: name, meta, scores, updatedAt };
  } catch {
    return null;
  }
}

/** Posição 1-based do jogador na categoria. Retorna null se não estiver no ranking. */
export async function fetchRankPosition(userId: string, category: LeaderboardCategory): Promise<number | null> {
  try {
    const { data: mine } = await supabase
      .from("leaderboards")
      .select("score")
      .eq("user_id", userId).eq("category", category).maybeSingle();
    if (!mine) return null;
    const { count } = await supabase
      .from("leaderboards")
      .select("user_id", { count: "exact", head: true })
      .eq("category", category)
      .gt("score", mine.score);
    return (count ?? 0) + 1;
  } catch {
    return null;
  }
}

/** Posições em todas as categorias, em paralelo. */
export async function fetchAllRankPositions(userId: string): Promise<Record<LeaderboardCategory, number | null>> {
  const entries = await Promise.all(
    CATEGORIES.map(async (c) => [c, await fetchRankPosition(userId, c)] as const),
  );
  return Object.fromEntries(entries) as Record<LeaderboardCategory, number | null>;
}

