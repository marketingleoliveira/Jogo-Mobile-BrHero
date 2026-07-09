import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Home, Trophy, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
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
  head: ({ params }) => {
    const url = `https://brhero.lovable.app/perfil/${params.userId}`;
    return {
      meta: [
        { title: "Perfil do Herói — BRHero" },
        { name: "description", content: "Perfil público de um herói do BRHero: estágio, rebirths, torre, arena e poder." },
        { property: "og:title", content: "Perfil do Herói — BRHero" },
        { property: "og:description", content: "Veja as conquistas deste herói." },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        { property: "og:image", content: "https://brhero.lovable.app/og-default.png" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:image", content: "https://brhero.lovable.app/og-default.png" },
        { name: "robots", content: "index,follow" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
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

  // Atualiza title/description dinamicamente com nome + score principal (sem dados privados).
  useEffect(() => {
    if (!profile) return;
    const hp = profile.scores.hero_power ?? 0;
    const name = profile.displayName || "Herói";
    const t = profile.meta.title ? ` · 🏆 ${profile.meta.title}` : "";
    try {
      document.title = `${name}${t} — BRHero`;
      const desc = `${name}${t} · Poder ${hp.toLocaleString("pt-BR")} · Estágio ${profile.scores.stage ?? 0}`;
      document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", `${name} — BRHero`);
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", desc);
    } catch { /* noop */ }
  }, [profile]);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : `https://brhero.lovable.app/perfil/${userId}`;
    const name = profile?.displayName || "Herói";
    const text = `Veja o perfil de ${name} no BRHero!`;
    try {
      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (nav && typeof nav.share === "function") {
        await nav.share({ title: `${name} — BRHero`, text, url });
        return;
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(url);
        toast.success("Link do perfil copiado!");
        return;
      }
      toast.error("Compartilhamento indisponível neste dispositivo.");
    } catch (e) {
      // AbortError = usuário fechou o share nativo; não é erro.
      if (e instanceof Error && e.name === "AbortError") return;
      toast.error("Não foi possível compartilhar o perfil.");
    }
  };


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
            <Button size="sm" variant="outline" onClick={share} disabled={loading}>
              <Share2 className="h-4 w-4 mr-2" />Compartilhar
            </Button>
            <Link to="/ranking"><Button size="sm" variant="outline"><Trophy className="h-4 w-4 mr-2" />Ver no Ranking</Button></Link>
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
