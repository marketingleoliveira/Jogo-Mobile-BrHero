import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "hero-rise-idle-v4";

type SaveLite = {
  level?: number;
  xp?: number;
  gold?: number;
  gems?: number;
  stage?: number;
  maxStage?: number;
  attrs?: Record<string, { level?: number }>;
  counters?: { enemies?: number; bosses?: number };
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BRHero" },
      { name: "description", content: "Estatísticas do seu herói e recorde de estágios." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [save, setSave] = useState<SaveLite | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSave(JSON.parse(raw) as SaveLite);
    } catch {
      /* ignore */
    }
  }, []);

  const stats = [
    { label: "Nível", value: save?.level ?? 1, icon: "⭐" },
    { label: "Estágio atual", value: save?.stage ?? 1, icon: "📍" },
    { label: "Recorde", value: save?.maxStage ?? save?.stage ?? 1, icon: "🏆" },
    { label: "Ouro", value: (save?.gold ?? 0).toLocaleString("pt-BR"), icon: "🪙" },
    { label: "Gemas", value: save?.gems ?? 0, icon: "💎" },
    { label: "Inimigos derrotados", value: save?.counters?.enemies ?? 0, icon: "⚔️" },
    { label: "Chefes derrotados", value: save?.counters?.bosses ?? 0, icon: "🐲" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1A0F08] via-[#2A180C] to-[#0F0805] px-4 py-8 text-amber-100">
      <div className="mx-auto max-w-md">
        <h1
          className="mb-6 text-center text-4xl tracking-wider text-amber-300 drop-shadow-[0_3px_0_rgba(0,0,0,0.6)]"
          style={{ fontFamily: "'Luckiest Guy', cursive" }}
        >
          MENU INICIAL
        </h1>

        <div className="mb-4 rounded-2xl border-4 border-[#5D2E0C] bg-[#3E2723]/80 p-4 shadow-xl backdrop-blur">
          <div className="mb-3 text-center text-lg text-amber-200" style={{ fontFamily: "'Luckiest Guy', cursive" }}>
            🛡️ Estatísticas do Herói
          </div>
          <ul className="space-y-2">
            {stats.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between rounded-lg border-2 border-black/40 bg-black/30 px-3 py-2"
              >
                <span className="text-sm text-amber-100/90">
                  <span className="mr-2">{s.icon}</span>
                  {s.label}
                </span>
                <span className="tabular-nums font-bold text-amber-300">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            to="/game"
            className="rounded-xl border-2 border-emerald-900 bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-3 text-center text-base font-bold text-white shadow-lg active:translate-y-0.5"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            ▶️ CONTINUAR JOGANDO
          </Link>
          <Link
            to="/"
            className="rounded-xl border-2 border-slate-900 bg-gradient-to-b from-slate-600 to-slate-800 px-4 py-3 text-center text-base font-bold text-white shadow-lg active:translate-y-0.5"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            🏠 PÁGINA INICIAL
          </Link>
        </div>
      </div>
    </main>
  );
}
