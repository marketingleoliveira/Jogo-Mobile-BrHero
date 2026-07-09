// Fase 4 · Bloco 4 — Recompensas de temporada.
// Calcula tier a partir do rank do jogador na temporada finalizada e permite claim único.
// RLS: cada usuário só vê/insere/atualiza suas próprias recompensas.

import { supabase } from "@/integrations/supabase/client";
import type { LeaderboardCategory } from "@/lib/game/leaderboards";
import { rewardForTier, rewardTierForRank, type SeasonReward } from "@/lib/game/seasons";

export interface SeasonRewardRow {
  id: string;
  season_key: string;
  category: LeaderboardCategory;
  rank: number;
  tier: "top1" | "top10" | "top100" | "participation";
  reward: SeasonReward;
  claimed_at: string | null;
}

/** Registra recompensa da temporada anterior para o usuário atual (idempotente via UNIQUE). */
export async function grantSeasonReward(
  userId: string,
  seasonKey: string,
  category: LeaderboardCategory,
): Promise<SeasonRewardRow | null> {
  try {
    // Score do jogador na temporada
    const { data: mine } = await supabase
      .from("leaderboards")
      .select("score")
      .eq("user_id", userId).eq("category", category).eq("season_key", seasonKey)
      .maybeSingle();
    if (!mine) return null;
    const { count } = await supabase
      .from("leaderboards")
      .select("user_id", { count: "exact", head: true })
      .eq("category", category).eq("season_key", seasonKey)
      .gt("score", mine.score);
    const rank = (count ?? 0) + 1;
    const tier = rewardTierForRank(rank);
    const reward = rewardForTier(tier);

    const { data, error } = await supabase
      .from("season_rewards")
      .upsert(
        { user_id: userId, season_key: seasonKey, category, rank, tier, reward: reward as unknown as Record<string, unknown> } as never,
        { onConflict: "user_id,season_key,category", ignoreDuplicates: true },
      )
      .select()
      .maybeSingle();
    if (error || !data) return null;
    return data as unknown as SeasonRewardRow;
  } catch { return null; }
}

export async function listUnclaimedRewards(userId: string): Promise<SeasonRewardRow[]> {
  try {
    const { data, error } = await supabase
      .from("season_rewards")
      .select("*")
      .eq("user_id", userId)
      .is("claimed_at", null)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as unknown as SeasonRewardRow[];
  } catch { return []; }
}

export async function claimReward(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("season_rewards")
      .update({ claimed_at: new Date().toISOString() })
      .eq("id", id)
      .is("claimed_at", null);
    return !error;
  } catch { return false; }
}
