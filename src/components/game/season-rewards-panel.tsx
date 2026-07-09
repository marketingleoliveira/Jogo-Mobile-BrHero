// Fase 4 · Bloco 4 — Painel de recompensas de temporada.
// Consome listUnclaimedRewards / claimReward. Somente leitura + claim; não altera
// personagem, rebirth, pets, runas ou skins. A concessão (grantSeasonReward) deve
// ser disparada por automação — ver TODO abaixo.
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ INTEGRAÇÃO FUTURA — CRON DE FECHAMENTO DE TEMPORADA                         │
// │                                                                             │
// │ Objetivo: ao virar a semana/mês, iterar usuários que enviaram snapshot na   │
// │ temporada encerrada e chamar grantSeasonReward(userId, seasonKey, category) │
// │ para cada categoria de leaderboards. A tabela season_rewards tem UNIQUE     │
// │ (user_id, season_key, category), então o upsert é idempotente e impede      │
// │ duplicidade mesmo se o cron rodar mais de uma vez.                          │
// │                                                                             │
// │ Recomendado: rota pública protegida por apikey em                           │
// │   src/routes/api/public/hooks/close-season.ts                               │
// │ agendada via pg_cron + pg_net (weekly = segunda 00:05 UTC, monthly = dia 1  │
// │ 00:10 UTC). O handler recebe { season_key } e roda grantSeasonReward em     │
// │ lote com supabaseAdmin. O histórico all-time NÃO é tocado.                  │
// └─────────────────────────────────────────────────────────────────────────────┘

import { useCallback, useEffect, useState } from "react";
import { Gift, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  claimReward,
  listUnclaimedRewards,
  type SeasonRewardRow,
} from "@/lib/game/season-rewards";
import { seasonLabel } from "@/lib/game/seasons";

const CATEGORY_LABEL: Record<string, { label: string; icon: string }> = {
  stage:      { label: "Estágio",    icon: "🗺️" },
  rebirth:    { label: "Rebirths",   icon: "🔥" },
  tower:      { label: "Torre",      icon: "🗼" },
  arena:      { label: "Arena",      icon: "⚔️" },
  hero_power: { label: "Poder",      icon: "💪" },
};

const TIER_STYLE: Record<SeasonRewardRow["tier"], { label: string; className: string }> = {
  top1:          { label: "🥇 Top 1",         className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  top10:         { label: "🥈 Top 10",        className: "bg-slate-300/20 text-slate-200 border-slate-300/40" },
  top100:        { label: "🥉 Top 100",       className: "bg-amber-700/20 text-amber-300 border-amber-700/40" },
  participation: { label: "🎖️ Participação",  className: "bg-slate-700/40 text-slate-300 border-slate-600/40" },
};

export function SeasonRewardsPanel() {
  const [rows, setRows] = useState<SeasonRewardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async (uid: string | null) => {
    if (!uid) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const list = await listUnclaimedRewards(uid);
    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      void refresh(uid);
    });
    return () => { alive = false; };
  }, [refresh]);

  const onClaim = async (r: SeasonRewardRow) => {
    setClaiming(r.id);
    const ok = await claimReward(r.id);
    setClaiming(null);
    if (ok) {
      toast.success(`Recompensa resgatada: +${r.reward.gems}💎 +${r.reward.gold.toLocaleString("pt-BR")}🪙`);
      setRows((prev) => prev.filter((x) => x.id !== r.id));
    } else {
      toast.error("Não foi possível resgatar. Tente novamente.");
    }
  };

  // Agrupa por temporada para exibição
  const bySeason = rows.reduce<Record<string, SeasonRewardRow[]>>((acc, r) => {
    (acc[r.season_key] ??= []).push(r);
    return acc;
  }, {});

  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-slate-100 flex items-center gap-2">
          <Gift className="h-5 w-5 text-pink-400" /> Recompensas de Temporada
          {rows.length > 0 && (
            <Badge className="ml-2 bg-pink-500/20 text-pink-300 border-pink-500/40">{rows.length}</Badge>
          )}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => void refresh(userId)} disabled={loading || !userId}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!userId ? (
          <p className="text-sm text-slate-400">Faça login para ver suas recompensas.</p>
        ) : loading ? (
          <p className="text-sm text-slate-400">Carregando recompensas…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhuma recompensa pendente. Suba no ranking desta temporada para ganhar prêmios!
          </p>
        ) : (
          Object.entries(bySeason).map(([season, list]) => (
            <div key={season} className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5" /> {seasonLabel(season)}
              </div>
              <div className="grid gap-2">
                {list.map((r) => {
                  const cat = CATEGORY_LABEL[r.category] ?? { label: r.category, icon: "•" };
                  const tier = TIER_STYLE[r.tier];
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{cat.icon} {cat.label}</span>
                          <Badge variant="outline" className={`text-xs ${tier.className}`}>{tier.label}</Badge>
                          <span className="text-xs text-slate-500">#{r.rank}</span>
                        </div>
                        <div className="text-xs text-emerald-300 font-mono">
                          +{r.reward.gems}💎 · +{r.reward.gold.toLocaleString("pt-BR")}🪙
                          {r.reward.title ? <span className="text-yellow-300"> · 🏷️ {r.reward.title}</span> : null}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => void onClaim(r)}
                        disabled={claiming === r.id}
                        className="bg-pink-600 hover:bg-pink-500 text-white"
                      >
                        {claiming === r.id ? "Resgatando…" : "Resgatar"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
