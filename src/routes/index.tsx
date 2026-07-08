import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Swords,
  Sparkles,
  Trophy,
  Shield,
  Zap,
  Users,
  Download,
  Globe,
  UserPlus,
  LogIn,
  X,
} from "lucide-react";

const ACCOUNT_KEY = "hero-rise-account-v1";

type Account = { name: string; email: string; createdAt: number };

function loadAccount(): Account | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hero Rise — RPG Mobile Idle em Português" },
      {
        name: "description",
        content:
          "Hero Rise: RPG mobile idle brasileiro. Batalhas automáticas, evolução constante, chefões épicos e progressão viciante. Jogue no navegador ou baixe no Google Play.",
      },
      { property: "og:title", content: "Hero Rise — RPG Mobile Idle" },
      {
        property: "og:description",
        content:
          "RPG idle em português. Evolua seu herói, derrote chefões e desbloqueie novas funções.",
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
  const [account, setAccount] = useState<Account | null>(() => loadAccount());
  const [modal, setModal] = useState<"signup" | "login" | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#3E2723] via-[#5D4037] to-[#3E2723] text-amber-50">
      <div className="mx-auto w-full max-w-md px-5 pb-24 pt-10">
        {/* Hero */}
        <header className="text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-[#8B4513] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] shadow-[0_6px_0_#B34700]">
            <Swords className="h-12 w-12 text-amber-950" strokeWidth={2.5} />
          </div>
          <h1
            className="text-5xl leading-none text-[#FFE0B2] drop-shadow-[0_3px_0_#1A0F08]"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            HERO RISE
          </h1>
          <p
            className="mt-2 text-sm tracking-widest text-amber-200"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            RPG IDLE · 100% EM PORTUGUÊS
          </p>
        </header>

        {/* O que é */}
        <section className="mt-8 rounded-2xl border-4 border-[#8B4513] bg-[#4E342E]/80 p-5 shadow-lg">
          <h2
            className="mb-2 text-xl text-amber-200"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            🎮 O que é Hero Rise?
          </h2>
          <p className="text-sm leading-relaxed text-amber-100">
            Um RPG <b>idle</b> (o herói luta sozinho!) inspirado em Legend of Mushroom.
            Sua missão é evoluir atributos, coletar equipamentos raros e derrotar
            chefões cada vez mais poderosos.
          </p>
        </section>

        {/* Como funciona */}
        <section className="mt-4 rounded-2xl border-4 border-[#8B4513] bg-[#4E342E]/80 p-5 shadow-lg">
          <h2
            className="mb-3 text-xl text-amber-200"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            ⚙️ Como funciona?
          </h2>
          <ul className="space-y-3 text-sm">
            <Step
              icon={<Swords className="h-4 w-4" />}
              title="Batalhas automáticas"
              body="Seu herói ataca inimigos sozinho. Você só assiste o show!"
            />
            <Step
              icon={<Zap className="h-4 w-4" />}
              title="Evolua atributos"
              body="Gaste ouro em ATK, HP, Crítico, Velocidade e muito mais."
            />
            <Step
              icon={<Trophy className="h-4 w-4" />}
              title="Chefões a cada 10 estágios"
              body="Vença bosses para ganhar gemas e recompensas raras."
            />
            <Step
              icon={<Shield className="h-4 w-4" />}
              title="Equipamentos e raridades"
              body="Colete itens de Comum a Divino — cada um deixa você mais forte."
            />
            <Step
              icon={<Users className="h-4 w-4" />}
              title="PvP e Multiplayer"
              body="Desbloqueie arena PvP no Lv 30 e Multiplayer no Lv 50."
            />
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-6 space-y-3">
          {!account ? (
            <>
              <button
                onClick={() => setModal("signup")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-[#B34700] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] py-4 text-lg text-amber-950 shadow-[0_6px_0_#B34700] active:translate-y-1 active:shadow-[0_2px_0_#B34700]"
                style={{ fontFamily: "'Luckiest Guy', cursive" }}
              >
                <UserPlus className="h-5 w-5" />
                CRIAR CONTA GRÁTIS
              </button>
              <button
                onClick={() => setModal("login")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-amber-200/40 bg-[#3E2723] py-3 text-sm font-bold text-amber-100"
              >
                <LogIn className="h-4 w-4" />
                Já tenho conta
              </button>
              <Link
                to="/game"
                className="block text-center text-xs text-amber-300/80 underline"
              >
                ou jogar como convidado
              </Link>
            </>
          ) : (
            <PlayOptions account={account} onLogout={() => {
              localStorage.removeItem(ACCOUNT_KEY);
              setAccount(null);
            }} />
          )}
        </section>

        <p className="mt-8 text-center text-[10px] text-amber-200/60">
          © Hero Rise · Beta MVP · Feito com ❤️ no Brasil
        </p>
      </div>

      {modal && (
        <AuthModal
          mode={modal}
          onClose={() => setModal(null)}
          onSuccess={(acc) => {
            localStorage.setItem(ACCOUNT_KEY, JSON.stringify(acc));
            setAccount(acc);
            setModal(null);
          }}
        />
      )}
    </main>
  );
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#8B4513] bg-[#FFB74D] text-amber-950">
        {icon}
      </span>
      <div>
        <div className="font-bold text-amber-100">{title}</div>
        <div className="text-xs text-amber-200/80">{body}</div>
      </div>
    </li>
  );
}

function PlayOptions({ account, onLogout }: { account: Account; onLogout: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-4 border-[#8B4513] bg-[#4E342E]/80 p-4 text-center">
        <div className="text-xs text-amber-200/70">Bem-vindo(a),</div>
        <div
          className="text-lg text-amber-100"
          style={{ fontFamily: "'Luckiest Guy', cursive" }}
        >
          {account.name} 👑
        </div>
      </div>

      <Link
        to="/game"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-[#B34700] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] py-4 text-lg text-amber-950 shadow-[0_6px_0_#B34700] active:translate-y-1 active:shadow-[0_2px_0_#B34700]"
        style={{ fontFamily: "'Luckiest Guy', cursive" }}
      >
        <Globe className="h-5 w-5" />
        JOGAR NO NAVEGADOR
      </Link>

      <a
        href="https://play.google.com/store/search?q=hero+rise+rpg&c=apps"
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-emerald-800 bg-gradient-to-b from-emerald-500 to-emerald-700 py-4 text-lg text-emerald-50 shadow-[0_6px_0_#065f46] active:translate-y-1 active:shadow-[0_2px_0_#065f46]"
        style={{ fontFamily: "'Luckiest Guy', cursive" }}
      >
        <Download className="h-5 w-5" />
        BAIXAR NO GOOGLE PLAY
      </a>

      <button
        onClick={onLogout}
        className="w-full py-2 text-xs text-amber-300/70 underline"
      >
        Sair da conta
      </button>
    </div>
  );
}

function AuthModal({
  mode,
  onClose,
  onSuccess,
}: {
  mode: "signup" | "login";
  onClose: () => void;
  onSuccess: (a: Account) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return setError("Email inválido");
    if (password.length < 4) return setError("Senha muito curta (min. 4)");
    if (mode === "signup" && name.trim().length < 2)
      return setError("Digite seu nome de herói");
    const acc: Account = {
      name: mode === "signup" ? name.trim() : email.split("@")[0],
      email: email.trim(),
      createdAt: Date.now(),
    };
    onSuccess(acc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border-4 border-[#8B4513] bg-gradient-to-b from-[#FFF3E0] to-[#FFE0B2] p-6 text-[#3E2723] shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-2xl"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            {mode === "signup" ? "Criar Conta" : "Entrar"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#8B4513] bg-white/50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {mode === "signup" && (
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-bold">Nome do herói</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border-2 border-[#8B4513] bg-white/70 px-3 py-2 text-sm outline-none focus:border-[#FF9800]"
              placeholder="Ex: Arthur o Bravo"
            />
          </label>
        )}
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-bold">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border-2 border-[#8B4513] bg-white/70 px-3 py-2 text-sm outline-none focus:border-[#FF9800]"
            placeholder="voce@email.com"
            autoComplete="email"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-bold">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border-2 border-[#8B4513] bg-white/70 px-3 py-2 text-sm outline-none focus:border-[#FF9800]"
            placeholder="••••••"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>

        {error && (
          <div className="mb-3 rounded-lg border-2 border-red-700 bg-red-100 px-3 py-2 text-xs text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-[#B34700] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] py-3 text-amber-950 shadow-[0_4px_0_#B34700] active:translate-y-1 active:shadow-[0_1px_0_#B34700]"
          style={{ fontFamily: "'Luckiest Guy', cursive" }}
        >
          <Sparkles className="h-4 w-4" />
          {mode === "signup" ? "CRIAR E JOGAR" : "ENTRAR"}
        </button>

        <p className="mt-3 text-center text-[10px] text-[#5D4037]">
          Conta salva localmente neste dispositivo (beta).
        </p>
      </form>
    </div>
  );
}
