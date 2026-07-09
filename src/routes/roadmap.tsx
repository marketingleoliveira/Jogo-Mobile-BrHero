// V1 · Roadmap público — visão de evolução do jogo pós-login.
// Não altera personagem, rebirth, pets, runas, skins, ranking, carteira ou recompensas.
import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Rocket, CheckCircle2, Clock, Sparkles, Users, Swords, Crown, ShoppingBag, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — BRHero" },
      { name: "description", content: "Veja o que já está disponível no BRHero e o que vem a caminho: guildas, boss mundial, passe de batalha e mais." },
      { property: "og:title", content: "Roadmap — BRHero" },
      { property: "og:description", content: "O BRHero está em evolução. Confira as próximas atualizações." },
    ],
  }),
  component: RoadmapPage,
});

type Item = { label: string; icon?: React.ReactNode };
type Version = {
  version: string;
  title: string;
  status: "ready" | "next" | "planned";
  icon: React.ReactNode;
  items: Item[];
};

const ROADMAP: Version[] = [
  {
    version: "V1.0",
    title: "Pronto para lançamento",
    status: "ready",
    icon: <Rocket className="h-5 w-5" />,
    items: [
      { label: "Progressão do herói" },
      { label: "Ranking global, semanal e mensal" },
      { label: "Temporadas automáticas" },
      { label: "Recompensas sazonais" },
      { label: "Arena PvP" },
      { label: "Economia com gems e gold" },
      { label: "Títulos cosméticos" },
      { label: "Perfil público" },
      { label: "Compartilhamento de perfil" },
    ],
  },
  {
    version: "V1.1",
    title: "Próxima atualização",
    status: "next",
    icon: <Users className="h-5 w-5" />,
    items: [
      { label: "Guildas reais" },
      { label: "Ranking de guildas" },
      { label: "Recompensas coletivas" },
    ],
  },
  {
    version: "V1.2",
    title: "Cooperação e eventos",
    status: "planned",
    icon: <Flame className="h-5 w-5" />,
    items: [
      { label: "Boss mundial cooperativo" },
      { label: "Eventos temporários" },
    ],
  },
  {
    version: "V1.3",
    title: "Monetização e progresso",
    status: "planned",
    icon: <ShoppingBag className="h-5 w-5" />,
    items: [
      { label: "Passe de batalha" },
      { label: "Loja premium" },
    ],
  },
  {
    version: "V1.4",
    title: "Competição entre guildas",
    status: "planned",
    icon: <Swords className="h-5 w-5" />,
    items: [
      { label: "Guerra de guildas" },
      { label: "Temporadas competitivas entre guildas" },
    ],
  },
];

const V1_CHECKLIST = [
  { label: "Login com Google", done: true },
  { label: "Salvamento na nuvem", done: true },
  { label: "Ranking global e sazonal", done: true },
  { label: "Recompensas de temporada", done: true },
  { label: "Carteira (gems/gold) segura", done: true },
  { label: "Arena PvP funcional", done: true },
  { label: "Perfil público + compartilhamento", done: true },
  { label: "Fallback offline/anônimo", done: true },
  { label: "Meta tags e OG image", done: true },
  { label: "Typecheck sem erros críticos", done: true },
];

function StatusBadge({ status }: { status: Version["status"] }) {
  if (status === "ready") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
        <CheckCircle2 className="h-3 w-3" /> Disponível
      </Badge>
    );
  }
  if (status === "next") {
    return (
      <Badge className="bg-sky-600 hover:bg-sky-600 text-white gap-1">
        <Sparkles className="h-3 w-3" /> Em breve
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-slate-600 text-slate-300 gap-1">
      <Clock className="h-3 w-3" /> Planejado
    </Badge>
  );
}

function RoadmapPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-7 w-7 text-amber-400" />
            <div>
              <h1 className="text-2xl font-bold">Roadmap do BRHero</h1>
              <p className="text-sm text-slate-400">
                O jogo está em evolução constante. Veja o que já está pronto e o que vem por aí.
              </p>
            </div>
          </div>
          <Link to="/game">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Jogo
            </Button>
          </Link>
        </header>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-4 w-4 text-emerald-400" />
              Checklist de Lançamento V1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {V1_CHECKLIST.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  <CheckCircle2
                    className={`h-4 w-4 ${c.done ? "text-emerald-400" : "text-slate-600"}`}
                  />
                  <span className={c.done ? "text-slate-200" : "text-slate-500"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {ROADMAP.map((v) => (
            <Card
              key={v.version}
              className={`border-slate-800 ${
                v.status === "ready"
                  ? "bg-emerald-950/30 border-emerald-800/60"
                  : v.status === "next"
                    ? "bg-sky-950/20 border-sky-800/50"
                    : "bg-slate-900/50"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-amber-300">{v.icon}</span>
                    <span className="font-mono text-amber-300">{v.version}</span>
                    <span className="text-slate-100">— {v.title}</span>
                  </CardTitle>
                  <StatusBadge status={v.status} />
                </div>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {v.items.map((it) => (
                    <li key={it.label} className="flex items-center gap-2 text-sm text-slate-300">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          v.status === "ready"
                            ? "bg-emerald-400"
                            : v.status === "next"
                              ? "bg-sky-400"
                              : "bg-slate-500"
                        }`}
                      />
                      {it.label}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center pt-2">
          As versões futuras não têm data confirmada — a ordem pode mudar conforme o feedback da comunidade.
        </p>
      </div>
    </div>
  );
}
