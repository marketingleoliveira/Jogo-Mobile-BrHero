import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import brheroLogo from "@/assets/brhero-logo.png.asset.json";
import {
  Swords,
  Sparkles,
  Trophy,
  Shield,
  Zap,
  Users,
  Download,
  Globe,
  LogOut,
} from "lucide-react";

const ACCOUNT_KEY = "hero-rise-account-v1";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type Account = {
  name: string;
  email: string;
  picture?: string;
  sub: string;
  createdAt: number;
};

declare global {
  interface Window {
    google?: any;
  }
}

function loadAccount(): Account | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

function decodeJwt(token: string): any {
  const payload = token.split(".")[1];
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decodeURIComponent(escape(json)));
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BRHero — O 1º RPG IDLE Brasileiro" },
      {
        name: "description",
        content:
          "BRHero - RPG mobile idle brasileiro. Batalhas automáticas, evolução constante e chefões épicos. Entre com Google e jogue no navegador ou baixe no Google Play.",
      },
      { property: "og:title", content: "BRHero — O 1º RPG IDLE Brasileiro" },
      {
        property: "og:description",
        content: "BRHero - RPG mobile idle brasileiro. Batalhas automáticas, evolução constante e chefões épicos. Entre com Google e jogue no navegador ou baixe no Google Play.",
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
  const btnRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);

  // Initialize Google Identity Services
  useEffect(() => {
    if (account) return;
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        setTimeout(tryInit, 300);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential: string }) => {
          try {
            const p = decodeJwt(resp.credential);
            const acc: Account = {
              name: p.name || p.given_name || "Herói",
              email: p.email,
              picture: p.picture,
              sub: p.sub,
              createdAt: Date.now(),
            };
            localStorage.setItem(ACCOUNT_KEY, JSON.stringify(acc));
            setAccount(acc);
          } catch (e) {
            console.error("Google sign-in decode failed", e);
          }
        },
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "filled_blue",
          size: "large",
          shape: "pill",
          text: "signup_with",
          logo_alignment: "left",
          width: 320,
        });
      }
      setGsiReady(true);
    };
    tryInit();
    return () => {
      cancelled = true;
    };
  }, [account]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#3E2723] via-[#5D4037] to-[#3E2723] text-amber-50">
      <div className="mx-auto w-full max-w-md px-5 pb-24 pt-10">
        {/* Hero */}
        <header className="text-center">
          <img
            src={brheroLogo.url}
            alt="BRHero — O primeiro RPG IDLE Brasileiro"
            className="mx-auto h-56 w-56 object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)]"
          />
          <h1 className="sr-only">BRHero</h1>
          <p
            className="mt-1 text-sm tracking-widest text-amber-200"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            O 1º RPG IDLE BRASILEIRO
          </p>
        </header>

        {!account && (
          <>
            {/* O que é */}
            <section className="mt-8 rounded-2xl border-4 border-[#8B4513] bg-[#4E342E]/80 p-5 shadow-lg">
              <h2
                className="mb-2 text-xl text-amber-200"
                style={{ fontFamily: "'Luckiest Guy', cursive" }}
              >
                🎮 O que é BRHero?
              </h2>
              <p className="text-sm leading-relaxed text-amber-100">
                Um RPG <b>idle</b> (o herói luta sozinho!) inspirado em Legend of
                Mushroom. Evolua atributos, colete equipamentos raros e derrote
                chefões cada vez mais poderosos.
              </p>
            </section>

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

            {/* Sign-in obrigatório */}
            <section className="mt-6 rounded-2xl border-4 border-[#8B4513] bg-gradient-to-b from-[#FFF3E0] to-[#FFE0B2] p-5 text-center text-[#3E2723] shadow-xl">
              <h2
                className="mb-1 text-xl"
                style={{ fontFamily: "'Luckiest Guy', cursive" }}
              >
                Entre para jogar
              </h2>
              <p className="mb-4 text-xs text-[#5D4037]">
                Use sua conta Google (a mesma do Google Play) para salvar seu
                progresso.
              </p>

              {GOOGLE_CLIENT_ID ? (
                <div className="flex flex-col items-center gap-2">
                  <div ref={btnRef} className="min-h-[44px]" />
                  {!gsiReady && (
                    <p className="text-xs text-[#8B4513]">
                      Carregando login do Google...
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-red-700 bg-red-100 p-3 text-left text-xs text-red-900">
                  <b>Configuração necessária:</b> defina{" "}
                  <code>VITE_GOOGLE_CLIENT_ID</code> nas variáveis de ambiente
                  com seu Client ID OAuth do Google Cloud Console para habilitar
                  o login.
                </div>
              )}
            </section>

            <p className="mt-4 text-center text-[10px] text-amber-200/60">
              É obrigatório criar conta. Não há modo convidado.
            </p>
          </>
        )}

        {account && <PlayOptions account={account} onLogout={() => {
          localStorage.removeItem(ACCOUNT_KEY);
          if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
          }
          setAccount(null);
        }} />}

        <p className="mt-8 text-center text-[10px] text-amber-200/60">
          © BRHero · Beta MVP · Feito com ❤️ no Brasil
        </p>
      </div>
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
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3 rounded-2xl border-4 border-[#8B4513] bg-[#4E342E]/80 p-4">
        {account.picture ? (
          <img
            src={account.picture}
            alt={account.name}
            referrerPolicy="no-referrer"
            className="h-12 w-12 rounded-full border-2 border-[#FFB74D]"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#FFB74D] bg-[#5D4037] text-lg">
            👑
          </div>
        )}
        <div className="flex-1 text-left">
          <div className="text-xs text-amber-200/70">Bem-vindo(a),</div>
          <div
            className="text-lg text-amber-100"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            {account.name}
          </div>
          <div className="truncate text-[10px] text-amber-200/60">
            {account.email}
          </div>
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
        className="flex w-full items-center justify-center gap-2 py-2 text-xs text-amber-300/70 underline"
      >
        <LogOut className="h-3 w-3" /> Sair da conta
      </button>

      <div className="rounded-xl border border-amber-200/20 bg-[#3E2723]/60 p-3 text-[10px] text-amber-200/70">
        <Sparkles className="mr-1 inline h-3 w-3" />
        Login feito via Google — o mesmo usado no Google Play. Seu progresso
        fica vinculado à sua conta.
      </div>
    </div>
  );
}
