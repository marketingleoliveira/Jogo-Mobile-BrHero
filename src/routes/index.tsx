import { createFileRoute, Link } from "@tanstack/react-router";
import { Swords, Play, Sparkles, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hero Rise — RPG mobile viciante" },
      {
        name: "description",
        content:
          "Hero Rise: RPG mobile de progressão rápida. Evolua seu herói, derrote chefes e desbloqueie novas funções. Beta gratuita.",
      },
      { property: "og:title", content: "Hero Rise — RPG mobile viciante" },
      {
        property: "og:description",
        content:
          "Um RPG mobile simples e viciante. Toque em Lutar e sinta a evolução a cada segundo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-between bg-background px-6 py-12 text-foreground">
      <div className="w-full text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-xl">
          <Swords className="h-10 w-10" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-black tracking-tight">Hero Rise</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          RPG mobile · Beta MVP
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-6">
        <div className="text-7xl">🧝⚔️👹</div>
        <div className="w-full space-y-2">
          <Feature icon={<Sparkles className="h-4 w-4" />} label="Evolua rápido nos primeiros níveis" />
          <Feature icon={<Trophy className="h-4 w-4" />} label="Enfrente chefes a cada 5 estágios" />
          <Feature icon={<Swords className="h-4 w-4" />} label="Equipamentos, missões e conquistas" />
        </div>
      </div>

      <div className="w-full space-y-3">
        <Link
          to="/game"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <Play className="h-5 w-5" aria-hidden="true" />
          Jogar agora
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Multiplayer, clãs e arena desbloqueiam conforme você evolui.
        </p>
      </div>
    </main>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}
