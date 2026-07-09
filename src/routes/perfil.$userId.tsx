import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Home, Trophy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchPublicProfile,
  fetchAllRankPositions,
  type PublicProfile,
  type LeaderboardCategory,
} from "@/lib/game/leaderboards";

export const Route = createFileRoute("/perfil/$userId")({
  head: () => ({
    meta: [
      { title: "Perfil do Herói — BRHero" },
      { name: "description", content: "Perfil público de um herói do BRHero: estágio, rebirths, torre, arena e poder." },
      { property: "og:title", content: "Perfil do Herói — BRHero" },
      { property: "og:description", content: "Veja as conquistas deste herói." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "index,follow" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <p role="alert" className="text-sm text-red-300">Falha ao carregar perfil: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <p className="text-slate-400">Este herói ainda não enviou seu snapshot.</p>
    </div>
  ),
  component: ProfilePage,
});

const CAT_META: { key: LeaderboardCategory; label: string; icon: string; suffix?: string }[] = [
  { key: "stage",      label: "Estágio Máximo", icon: "🗺️" },
  { key: "rebirth",    label: "Rebirths",       icon: "🔥" },
  { key: "tower",      label: "Torre Infinita", icon: "🗼", suffix: " and" },
  { key: "arena",      label: "Arena",          icon: "⚔️", suffix: " pts" },
  { key: "hero_power", label: "Poder Total",    icon: "💪" },
];

function ProfilePage() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [ranks, setRanks] = useState<Record<LeaderboardCategory, number | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  const load = async () => {
    setLoading(true);
    const p = await fetchPublicProfile(userId);
    if (!p) { setNotFoundFlag(true); setLoading(false); return; }
    setProfile(p);
    setRanks(await fetchAllRankPositions(userId));
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  if (notFoundFlag) throw notFound();

  const meta = profile?.meta ?? {};
  const avatar = meta.avatar || "🦸";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-sky-400" />
            <h1 className="text-2xl font-bold">Perfil do Herói</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/ranking"><Button size="sm" variant="outline"><Trophy className="h-4 w-4 mr-2" />Ranking</Button></Link>
            <Link to="/game"><Button size="sm" variant="outline"><Home className="h-4 w-4 mr-2" />Jogo</Button></Link>
          </div>
        </header>

        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl">
              {avatar}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-slate-100 truncate">
                {loading ? "Carregando…" : profile?.displayName ?? "Herói"}
              </CardTitle>
              <div className="flex flex-wrap gap-1 mt-1">
                {meta.title && <Badge variant="outline" className="border-yellow-500/40 text-yellow-300">🏆 {meta.title}</Badge>}
                {meta.guild && <Badge variant="outline" className="border-purple-500/40 text-purple-300">🏰 {meta.guild}</Badge>}
                {meta.skin  && <Badge variant="outline" className="border-sky-500/40 text-sky-300">✨ {meta.skin}</Badge>}
              </div>
              {profile?.updatedAt && (
                <p className="text-xs text-slate-500 mt-1">
                  Atualizado {new Date(profile.updatedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {CAT_META.map((c) => {
            const score = profile?.scores[c.key] ?? 0;
            const pos = ranks?.[c.key] ?? null;
            return (
              <Card key={c.key} className="border-slate-800 bg-slate-900/60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">{c.icon} {c.label}</div>
                    <div className="text-2xl font-bold text-emerald-300 font-mono">
                      {score.toLocaleString("pt-BR")}{c.suffix ?? ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Posição</div>
                    <div className="text-lg font-semibold text-slate-100">
                      {pos ? `#${pos}` : "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 text-center">
          Perfil público • Nenhum dado pessoal exposto (sem e-mail, sem Google ID, sem save)
        </p>
      </div>
    </div>
  );
}
