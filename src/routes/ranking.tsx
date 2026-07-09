import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trophy, RefreshCw, Home, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useLeaderboard,
  uploadPlayerSnapshot,
  type LeaderboardCategory,
  type PlayerSnapshot,
} from "@/lib/game/leaderboards";
import { currentSeasonKey, seasonLabel, type SeasonType } from "@/lib/game/seasons";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking Global — BRHero" },
      { name: "description", content: "Ranking global do BRHero: estágio máximo, rebirths, torre infinita, arena e poder total." },
      { property: "og:title", content: "Ranking Global — BRHero" },
      { property: "og:description", content: "Compare seu progresso com heróis do mundo todo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RankingPage,
});

const CATEGORIES: { key: LeaderboardCategory; label: string; icon: string; suffix?: string }[] = [
  { key: "stage",      label: "Estágio Máximo", icon: "🗺️", suffix: "" },
  { key: "rebirth",    label: "Rebirths",       icon: "🔥", suffix: "" },
  { key: "tower",      label: "Torre Infinita", icon: "🗼", suffix: " and" },
  { key: "arena",      label: "Arena",          icon: "⚔️", suffix: " pts" },
  { key: "hero_power", label: "Poder Total",    icon: "💪", suffix: "" },
];

const STORAGE_KEY = "hero-rise-idle-v4";

interface LocalSaveShape {
  maxStage?: number;
  prestigeLevel?: number;
  tower?: { bestFloor?: number };
  arena?: { points?: number };
  // heroPower não fica no save — calculado no jogo. Aqui usamos maxStage como proxy leve.
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
      heroPower: Math.max(1, Number(s.maxStage ?? 1)) * 10, // proxy simples até integração completa
    };
  } catch {
    return null;
  }
}

function RankingPage() {
  const [category, setCategory] = useState<LeaderboardCategory>("stage");
  const [uploading, setUploading] = useState(false);
  const { rows, loading, refresh } = useLeaderboard(category, 100);
  const cat = useMemo(() => CATEGORIES.find((c) => c.key === category)!, [category]);

  const doUpload = async () => {
    const snap = readLocalSnapshot();
    if (!snap) { toast.error("Nenhum progresso local encontrado."); return; }
    setUploading(true);
    const ok = await uploadPlayerSnapshot(snap, true);
    setUploading(false);
    if (ok) { toast.success("Snapshot enviado ao ranking."); refresh(true); }
    else toast.error("Faça login para enviar seu ranking.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold">Ranking Global</h1>
              <p className="text-sm text-slate-400">Compare seu progresso com heróis do mundo todo.</p>
            </div>
          </div>
          <Link to="/game">
            <Button variant="outline" size="sm"><Home className="h-4 w-4 mr-2" />Jogo</Button>
          </Link>
        </header>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c.key}
              size="sm"
              variant={c.key === category ? "default" : "outline"}
              onClick={() => setCategory(c.key)}
            >
              <span className="mr-1">{c.icon}</span>{c.label}
            </Button>
          ))}
        </div>

        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <span>{cat.icon}</span> Top 100 — {cat.label}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={doUpload} disabled={uploading}>
                <Upload className={`h-4 w-4 mr-2 ${uploading ? "animate-pulse" : ""}`} />
                Enviar meu score
              </Button>
              <Button variant="outline" size="sm" onClick={() => refresh(true)} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-slate-400">
                {loading ? "Carregando ranking…" : "Nenhum herói no ranking ainda. Seja o primeiro!"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 pr-3 w-14">#</th>
                      <th className="py-2 pr-3">Herói</th>
                      <th className="py-2 pr-3 text-right">Pontuação</th>
                      <th className="py-2 pr-3 text-right hidden sm:table-cell">Atualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={r.user_id} className="border-b border-slate-800/60">
                        <td className="py-2 pr-3">
                          {idx === 0 ? <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">🥇 1</Badge>
                            : idx === 1 ? <Badge className="bg-slate-300/20 text-slate-200 border-slate-300/40">🥈 2</Badge>
                            : idx === 2 ? <Badge className="bg-amber-700/20 text-amber-300 border-amber-700/40">🥉 3</Badge>
                            : <span className="text-slate-500">{idx + 1}</span>}
                        </td>
                        <td className="py-2 pr-3 font-medium">
                          <Link to="/perfil/$userId" params={{ userId: r.user_id }} className="hover:text-sky-300 underline-offset-2 hover:underline">
                            {r.display_name ?? "Herói"}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 text-right font-mono text-emerald-300">
                          {r.score.toLocaleString("pt-BR")}{cat.suffix ?? ""}
                        </td>
                        <td className="py-2 pr-3 text-right text-xs text-slate-500 hidden sm:table-cell">
                          {new Date(r.updated_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-slate-500 text-center">
          Cache local de 30s • Upload throttle de 5min • RLS por usuário
        </p>
      </div>
    </div>
  );
}
