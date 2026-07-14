// Recompensas semanais do ranking de Poder Geral (top 10).
// Espelha exatamente a tabela usada em `claim_power_ranking_reward` no banco.

export type PowerRankingReward = {
  rank: number;
  gems: number;
  gold: number;
};

export const POWER_RANKING_REWARDS: PowerRankingReward[] = [
  { rank: 1,  gems: 1000, gold: 0 },
  { rank: 2,  gems: 500,  gold: 0 },
  { rank: 3,  gems: 250,  gold: 0 },
  { rank: 4,  gems: 0, gold: 1_000_000 },
  { rank: 5,  gems: 0, gold:   917_000 },
  { rank: 6,  gems: 0, gold:   833_000 },
  { rank: 7,  gems: 0, gold:   750_000 },
  { rank: 8,  gems: 0, gold:   667_000 },
  { rank: 9,  gems: 0, gold:   583_000 },
  { rank: 10, gems: 0, gold:   500_000 },
];

export function rewardForRank(rank: number): PowerRankingReward | null {
  if (rank < 1 || rank > 10) return null;
  return POWER_RANKING_REWARDS[rank - 1];
}

export function formatReward(r: PowerRankingReward): string {
  if (r.gems > 0) return `${r.gems.toLocaleString("pt-BR")} 💎`;
  if (r.gold > 0) return `${r.gold.toLocaleString("pt-BR")} 🪙`;
  return "—";
}
