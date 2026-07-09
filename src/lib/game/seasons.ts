// Fase 4 · Bloco 4 — Temporadas de Ranking/Arena.
// Chaves determinísticas por data (UTC). Nada é resetado no personagem;
// apenas o slice sazonal do leaderboard é separado por `season_key`.

export type SeasonType = "all-time" | "weekly" | "monthly";

/** Formato: "all-time" | "w-YYYY-WW" | "m-YYYY-MM" */
export function currentSeasonKey(type: SeasonType, now: Date = new Date()): string {
  if (type === "all-time") return "all-time";
  if (type === "monthly") {
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    return `m-${y}-${m}`;
  }
  // ISO week (semana começa segunda-feira)
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((+d - +yearStart) / 86400000) + 1) / 7);
  return `w-${d.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}

export function seasonLabel(key: string): string {
  if (key === "all-time") return "Histórico Global";
  if (key.startsWith("w-")) return `Semana ${key.slice(2)}`;
  if (key.startsWith("m-")) return `Mês ${key.slice(2)}`;
  return key;
}

export interface SeasonReward {
  gems: number;
  gold: number;
  title?: string;
}

/** Tier de recompensa por posição. */
export function rewardTierForRank(rank: number): "top1" | "top10" | "top100" | "participation" {
  if (rank <= 1) return "top1";
  if (rank <= 10) return "top10";
  if (rank <= 100) return "top100";
  return "participation";
}

export function rewardForTier(tier: ReturnType<typeof rewardTierForRank>): SeasonReward {
  switch (tier) {
    case "top1":          return { gems: 500, gold: 100_000, title: "Campeão da Temporada" };
    case "top10":         return { gems: 200, gold: 50_000,  title: "Elite da Temporada" };
    case "top100":        return { gems: 75,  gold: 15_000 };
    case "participation": return { gems: 10,  gold: 1_000 };
  }
}
