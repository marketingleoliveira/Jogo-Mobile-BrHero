import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trophy, RefreshCw, Home, Upload, Gift, Radio, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeasonRewardsPanel } from "@/components/game/season-rewards-panel";
import {
  useLeaderboard,
  uploadPlayerSnapshot,
  type LeaderboardCategory,
  type PlayerSnapshot,
} from "@/lib/game/leaderboards";
import { currentSeasonKey, seasonLabel, type SeasonType } from "@/lib/game/seasons";
import { useWallet } from "@/lib/game/wallet";
import { POWER_RANKING_REWARDS, rewardForRank, formatReward } from "@/lib/game/power-rewards";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking Global — BRHero" },
      { name: "description", content: "Ranking global do BRHero: nível, estágio, rebirths, torre infinita, arena e poder total." },
      { property: "og:title", content: "Ranking Global — BRHero" },
      { property: "og:description", content: "Compare seu progresso com heróis do mundo todo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RankingPage,
});

type ExtendedCategory = LeaderboardCategory | "level";

const CATEGORIES: { key: ExtendedCategory; label: string; icon: string; suffix?: string }[] = [
  { key: "level",      label: "Nível (todos)",   icon: "⭐", suffix: "" },
  { key: "stage",      label: "Estágio Máximo",  icon: "🗺️", suffix: "" },
  { key: "rebirth",    label: "Rebirths",        icon: "🔥", suffix: "" },
  { key: "tower",      label: "Torre Infinita",  icon: "🗼", suffix: " and" },
  { key: "arena",      label: "Arena",           icon: "⚔️", suffix: " pts" },
  { key: "hero_power", label: "Poder Total",     icon: "💪", suffix: "" },
];

const STORAGE_KEY = "hero-rise-idle-v4";

interface LocalSaveShape {
  maxStage?: number;
  prestigeLevel?: number;
  tower?: { bestFloor?: number };
  arena?: { points?: number };
}

function readLocalSnapshot(): PlayerSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as LocalSaveShape;
    return {
      stage:     Math.max(1, Number(s.maxStage ?? 1)),
      rebirth:   Math.max(0, Number(s.prestigeLevel ?? 0)),
      tower:     Math.max(0, Number(s.tower?.bestFloor ?? 0)),
      arena:     Math.max(0, Number(s.arena?.points ?? 0)),
      heroPower: Math.max(1, Number(s.maxStage ?? 1)) * 10,
    };
  } catch {
    return null;
  }
}

const SEASONS: { key: SeasonType; label: string; icon: string }[] = [
  { key: "all-time", label: "Histórico", icon: "🏆" },
  { key: "weekly",   label: "Semanal",   icon: "📅" },
  { key: "monthly",  label: "Mensal",    icon: "🗓️" },
];

interface LevelRow {
  user_id: string;
  display_name: string | null;
  level: number;
  stage: number;
  max_stage: number;
  prestige_level: number;
  extra: Record<string, unknown> | null;
  updated_at: string;
}

interface UnifiedRow {
  user_id: string;
  display_name: string | null;
  score: number;
  extra: Record<string, unknown>;
  updated_at: string;
  sublabel?: string;
}

function useLevelRanking(enabled: boolean) {
  const [rows, setRows] = useState<LevelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_level_ranking" as never, { _limit: 200 } as never) as { data: LevelRow[] | null; error: unknown };
      if (!error && data) setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { if (enabled) void refresh(); }, [enabled, refresh]);
  return { rows, loading, refresh };
}

function RankingPage() {
  const [category, setCategory] = useState<ExtendedCategory>("level");
  const [seasonType, setSeasonType] = useState<SeasonType>("all-time");
  const [uploading, setUploading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const seasonKey = useMemo(() => currentSeasonKey(seasonType), [seasonType]);

  const isLevel = category === "level";
  const lbCategory: LeaderboardCategory = isLevel ? "hero_power" : (category as LeaderboardCategory);
  const { rows: lbRows, loading: lbLoading, refresh: lbRefresh, live } = useLeaderboard(lbCategory, 100, seasonKey);
  const { rows: levelRows, loading: levelLoading, refresh: levelRefresh } = useLevelRanking(isLevel);

  const cat = useMemo(() => CATEGORIES.find((c) => c.key === category)!, [category]);
  const { userId: myId, equippedTitle, refresh: refreshWallet } = useWallet();

  const rows: UnifiedRow[] = useMemo(() => {
    if (isLevel) {
      return levelRows.map((r) => ({
        user_id: r.user_id,
        display_name: r.display_name,
        score: r.level,
        extra: (r.extra ?? {}) as Record<string, unknown>,
        updated_at: r.updated_at,
        sublabel: `Prestígio ${r.prestige_level} · Estágio máx ${r.max_stage}`,
      }));
    }
    return lbRows.map((r) => ({
      user_id: r.user_id,
      display_name: r.display_name,
      score: r.score,
      extra: (r.extra ?? {}) as Record<string, unknown>,
      updated_at: r.updated_at,
    }));
  }, [isLevel, levelRows, lbRows]);

  const loading = isLevel ? levelLoading : lbLoading;
  const refresh = (force?: boolean) => (isLevel ? void levelRefresh() : lbRefresh(force));

  const myRow = useMemo(() => (myId ? rows.find((r) => r.user_id === myId) ?? null : null), [rows, myId]);
  const myRank = useMemo(() => (myId ? rows.findIndex((r) => r.user_id === myId) : -1), [rows, myId]);

  const isPowerWeekly = category === "hero_power" && seasonType === "weekly";
  const canClaim = isPowerWeekly && myRank >= 0 && myRank < 10;

  const doUpload = async () => {
    const snap = readLocalSnapshot();
    if (!snap) { toast.error("Nenhum progresso local encontrado."); return; }
    setUploading(true);
    const ok = await uploadPlayerSnapshot(snap, true);
    setUploading(false);
    if (ok) { toast.success("Snapshot enviado ao ranking."); refresh(true); }
    else toast.error("Faça login para enviar seu ranking.");
  };

  const doClaim = async () => {
    if (!myId) { toast.error("Faça login para resgatar."); return; }
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_power_ranking_reward");
      if (error) throw error;
      const res = data as { ok: boolean; reason?: string; rank?: number; gems?: number; gold?: number };
      if (!res?.ok) {
        const map: Record<string, string> = {
          already_claimed: "Você já resgatou a recompensa desta semana.",
          not_ranked: "Envie seu score primeiro para entrar no ranking desta semana.",
          out_of_top10: `Você está em #${res.rank}. Só o Top 10 ganha recompensa.`,
        };
        toast.info(map[res?.reason ?? ""] ?? "Não foi possível resgatar agora.");
      } else {
        const parts: string[] = [];
        if (res.gems) parts.push(`${res.gems} 💎`);
        if (res.gold) parts.push(`${res.gold.toLocaleString("pt-BR")} 🪙`);
        toast.success(`#${res.rank} — Você recebeu ${parts.join(" + ")}`);
        await refreshWallet();
      }
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao resgatar recompensa.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-yellow-400 drop-shadow" />
            <div>
              <h1 className="text-2xl font-bold text-white">Ranking Global</h1>
              <p className="text-sm text-slate-300">Compare seu progresso com heróis do mundo todo.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/roadmap">
              <Button variant="secondary" size="sm">Roadmap</Button>
            </Link>
            <Link to="/game">
              <Button variant="secondary" size="sm"><Home className="h-4 w-4 mr-2" />Jogo</Button>
            </Link>
          </div>
        </header>

        {!isLevel && (
          <div className="flex flex-wrap gap-2">
            {SEASONS.map((s) => (
              <Button
                key={s.key}
                size="sm"
                variant={s.key === seasonType ? "default" : "secondary"}
                onClick={() => setSeasonType(s.key)}
                className={s.key === seasonType ? "" : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"}
              >
                <span className="mr-1">{s.icon}</span>{s.label}
              </Button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c.key}
              size="sm"
              variant={c.key === category ? "default" : "secondary"}
              onClick={() => setCategory(c.key)}
              className={c.key === category ? "" : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"}
            >
              <span className="mr-1">{c.icon}</span>{c.label}
            </Button>
          ))}
        </div>

        {!isLevel && <SeasonRewardsPanel />}

        {myId && (() => {
          const meta = (myRow?.extra ?? {}) as { avatar?: unknown; skin?: unknown; title?: unknown };
          const avatar = typeof meta.avatar === "string" && meta.avatar.trim() !== "" ? meta.avatar : "🦸";
          const skin = typeof meta.skin === "string" && meta.skin.trim() !== "" ? meta.skin : null;
          const rowTitle = typeof meta.title === "string" && meta.title.trim() !== "" ? meta.title : null;
          const title = rowTitle ?? equippedTitle ?? null;
          const name = myRow?.display_name ?? "Você";
          return (
            <Card className="border-sky-600/50 bg-sky-950/50">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-full bg-slate-800 border border-sky-500 flex items-center justify-center text-2xl leading-none">
                  {avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate text-white">{name}</div>
                  {title && <div className="text-xs text-yellow-300 truncate">🏆 {title}</div>}
                  {skin && <div className="text-xs text-sky-300 truncate">✨ {skin}</div>}
                  <div className="text-xs text-slate-300">
                    {cat.icon} {cat.label}{!isLevel && ` · ${seasonLabel(seasonKey)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-300 text-lg leading-none font-bold">
                    {myRow ? myRow.score.toLocaleString("pt-BR") : "—"}{cat.suffix ?? ""}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    {myRank >= 0 ? `#${myRank + 1}` : "sem posição"}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {isPowerWeekly && (
          <Card className="border-amber-600/60 bg-amber-950/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Gift className="h-5 w-5 text-amber-300" />
                Recompensas semanais — Poder Geral
                {live && (
                  <Badge className="ml-2 border-emerald-400/60 bg-emerald-500/25 text-emerald-100 gap-1">
                    <Radio className="h-3 w-3 animate-pulse" /> ao vivo
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-200">
                Toda semana os 10 heróis com maior <b className="text-white">Poder Geral</b> recebem uma recompensa.
                O ranking atualiza em tempo real conforme os jogadores ficam mais fortes.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {POWER_RANKING_REWARDS.map((r) => {
                  const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`;
                  const isGems = r.gems > 0;
                  return (
                    <div
                      key={r.rank}
                      className={`rounded-lg border px-2 py-2 text-center ${
                        isGems
                          ? "border-fuchsia-500/60 bg-fuchsia-950/50"
                          : "border-amber-500/50 bg-amber-950/40"
                      }`}
                    >
                      <div className="text-xs text-white font-semibold">{medal}</div>
                      <div className={`text-sm font-bold ${isGems ? "text-fuchsia-200" : "text-amber-200"}`}>
                        {formatReward(r)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                <div className="text-sm text-slate-200">
                  Sua posição:{" "}
                  <span className="text-white font-bold">
                    {myRank >= 0 ? `#${myRank + 1}` : "sem posição"}
                  </span>
                  {canClaim && rewardForRank(myRank + 1) && (
                    <span className="ml-2 text-emerald-300">
                      · elegível para {formatReward(rewardForRank(myRank + 1)!)}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={doClaim}
                  disabled={!canClaim || claiming}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  <Gift className={`h-4 w-4 mr-2 ${claiming ? "animate-pulse" : ""}`} />
                  Resgatar da semana
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-700 bg-slate-900/80">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-white flex items-center gap-2 flex-wrap">
              <span>{cat.icon}</span>
              <span>{isLevel ? "Todos os heróis — por Nível" : `Top 100 — ${cat.label}`}</span>
              {!isLevel && (
                <Badge variant="outline" className="ml-2 text-xs border-slate-500 text-slate-100">
                  {seasonLabel(seasonKey)}
                </Badge>
              )}
              {isLevel && (
                <Badge className="ml-1 border-sky-400/60 bg-sky-500/25 text-sky-100 gap-1 text-xs">
                  <Users className="h-3 w-3" /> {rows.length} heróis
                </Badge>
              )}
              {!isLevel && live && (
                <Badge className="ml-1 border-emerald-400/60 bg-emerald-500/25 text-emerald-100 gap-1 text-xs">
                  <Radio className="h-3 w-3 animate-pulse" /> ao vivo
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {!isLevel && (
                <Button variant="secondary" size="sm" onClick={doUpload} disabled={uploading}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                  <Upload className={`h-4 w-4 mr-2 ${uploading ? "animate-pulse" : ""}`} />
                  Enviar meu score
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => refresh(true)} disabled={loading}
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-slate-200">
                {loading ? "Carregando ranking…" : "Nenhum herói no ranking ainda. Seja o primeiro!"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-200 border-b border-slate-700">
                    <tr>
                      <th className="py-2 pr-3 w-14 font-semibold">#</th>
                      <th className="py-2 pr-3 font-semibold">Herói</th>
                      <th className="py-2 pr-3 text-right font-semibold">
                        {isLevel ? "Nível" : "Pontuação"}
                      </th>
                      <th className="py-2 pr-3 text-right hidden sm:table-cell font-semibold">Atualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => {
                      const meta = r.extra as { avatar?: unknown; title?: unknown; skin?: unknown };
                      const avatar = typeof meta.avatar === "string" && meta.avatar.trim() !== "" ? meta.avatar : "🦸";
                      const title = typeof meta.title === "string" && meta.title.trim() !== "" ? meta.title : null;
                      const skin = typeof meta.skin === "string" && meta.skin.trim() !== "" ? meta.skin : null;
                      const isMe = r.user_id === myId;
                      return (
                        <tr key={r.user_id}
                            className={`border-b border-slate-800 ${isMe ? "bg-sky-950/40" : "hover:bg-slate-800/40"}`}>
                          <td className="py-2 pr-3">
                            {idx === 0 ? <Badge className="bg-yellow-500/30 text-yellow-100 border-yellow-400/60">🥇 1</Badge>
                              : idx === 1 ? <Badge className="bg-slate-300/30 text-white border-slate-300/60">🥈 2</Badge>
                              : idx === 2 ? <Badge className="bg-amber-600/30 text-amber-100 border-amber-500/60">🥉 3</Badge>
                              : <span className="text-slate-200 font-mono">{idx + 1}</span>}
                          </td>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Link
                                to="/perfil/$userId"
                                params={{ userId: r.user_id }}
                                aria-label={`Perfil de ${r.display_name ?? "Herói"}`}
                                className="h-8 w-8 shrink-0 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-lg leading-none hover:border-sky-400"
                              >
                                <span aria-hidden>{avatar}</span>
                              </Link>
                              <div className="min-w-0">
                                <Link to="/perfil/$userId" params={{ userId: r.user_id }}
                                      className="text-white font-medium hover:text-sky-300 underline-offset-2 hover:underline truncate block">
                                  {r.display_name ?? "Herói"} {isMe && <span className="text-sky-300 text-xs">(você)</span>}
                                </Link>
                                {title && (
                                  <div className="text-xs text-yellow-300 truncate">🏆 {title}</div>
                                )}
                                {skin && (
                                  <div className="text-xs text-sky-300 truncate">✨ {skin}</div>
                                )}
                                {r.sublabel && (
                                  <div className="text-xs text-slate-300 truncate">{r.sublabel}</div>
                                )}
                                {isPowerWeekly && idx < 10 && rewardForRank(idx + 1) && (
                                  <div className="text-xs font-semibold">
                                    <span className={idx < 3 ? "text-fuchsia-200" : "text-amber-200"}>
                                      🎁 {formatReward(rewardForRank(idx + 1)!)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-emerald-300 font-bold">
                            {r.score.toLocaleString("pt-BR")}{cat.suffix ?? ""}
                          </td>
                          <td className="py-2 pr-3 text-right text-xs text-slate-300 hidden sm:table-cell">
                            {new Date(r.updated_at).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-slate-400 text-center">
          Cache local de 30s • Upload throttle de 5min • RLS por usuário
        </p>
      </div>
    </div>
  );
}
