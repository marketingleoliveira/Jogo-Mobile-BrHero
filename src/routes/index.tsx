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
const GOOGLE_CLIENT_ID = "363043719780-cnfdm9g2ror5uh6u48k0avceddvf80ij.apps.googleusercontent.com";

// Palette: Azul Real & Ouro
// #0a1c3a (deep navy) · #152b5c (royal navy) · #f5c542 (gold) · #e8ecf1 (ice)
const FONT_TITLE = { fontFamily: "'Lilita One', system-ui, sans-serif" } as const;
const FONT_BODY = { fontFamily: "'Lilita One', system-ui, sans-serif" } as const;

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
          "BRHero — O primeiro RPG idle brasileiro. Batalhas automáticas, evolução épica e chefões lendários. Entre com Google e jogue no navegador ou baixe no Google Play.",
      },
      { property: "og:title", content: "BRHero — O 1º RPG IDLE Brasileiro" },
      { property: "og:url", content: "https://brhero.lovable.app/" },
      { property: "og:description", content: "O primeiro RPG idle brasileiro. Jogue no navegador ou baixe no Google Play." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
    ],
    links: [{ rel: "canonical", href: "https://brhero.lovable.app/" }],
  }),
  component: Landing,
});

function Landing() {
  const [account, setAccount] = useState<Account | null>(() => loadAccount());
  const btnRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);

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
    <main
      className="relative min-h-screen overflow-hidden text-[#e8ecf1]"
      style={{
        ...FONT_BODY,
        background:
          "radial-gradient(1200px 600px at 50% -10%, #1e3a7a 0%, #152b5c 35%, #0a1c3a 75%, #050e1f 100%)",
      }}
    >
      {/* Sparkles bg */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[#f5c542]"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              boxShadow: "0 0 6px #f5c542",
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-md px-5 pb-24 pt-8">
        {/* Hero */}
        <header className="text-center">
          <img
            src={brheroLogo.url}
            alt="BRHero — O primeiro RPG IDLE Brasileiro"
            className="mx-auto h-60 w-60 object-contain drop-shadow-[0_10px_25px_rgba(245,197,66,0.35)]"
          />
          <h1 className="sr-only">BRHero</h1>
          <div
            className="mt-1 inline-block rounded-full border-2 border-[#f5c542]/60 bg-[#0a1c3a]/80 px-4 py-1 text-[11px] uppercase tracking-[0.25em] text-[#f5c542]"
            style={FONT_TITLE}
          >
            O 1º RPG IDLE Brasileiro
          </div>
        </header>

        {!account && (
          <>
            <section className="mt-8 rounded-2xl border-2 border-[#f5c542]/40 bg-[#0a1c3a]/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur">
              <h2
                className="mb-2 text-2xl text-[#f5c542]"
                style={FONT_TITLE}
              >
                O que é BRHero?
              </h2>
              <p className="text-sm leading-relaxed text-[#e8ecf1]/90">
                Um RPG <b className="text-[#f5c542]">idle</b> feito no Brasil — seu herói
                batalha sozinho enquanto você evolui atributos, coleta equipamentos
                raros e derrota chefões cada vez mais poderosos.
              </p>
            </section>

            <section className="mt-4 rounded-2xl border-2 border-[#f5c542]/40 bg-[#0a1c3a]/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur">
              <h2 className="mb-3 text-2xl text-[#f5c542]" style={FONT_TITLE}>
                Como funciona?
              </h2>
              <ul className="space-y-3 text-sm">
                <Step icon={<Swords className="h-4 w-4" />} title="Batalhas automáticas" body="Seu herói ataca inimigos sozinho. Você só assiste o show!" />
                <Step icon={<Zap className="h-4 w-4" />} title="Evolua atributos" body="Gaste ouro em ATK, HP, Crítico, Velocidade e muito mais." />
                <Step icon={<Trophy className="h-4 w-4" />} title="Chefões a cada 10 estágios" body="Vença bosses para ganhar gemas e recompensas raras." />
                <Step icon={<Shield className="h-4 w-4" />} title="Equipamentos e raridades" body="Colete itens de Comum a Divino — cada um deixa você mais forte." />
                <Step icon={<Users className="h-4 w-4" />} title="PvP e Multiplayer" body="Desbloqueie arena PvP no Lv 30 e Multiplayer no Lv 50." />
              </ul>
            </section>

            <section className="mt-6 rounded-2xl border-2 border-[#f5c542] bg-gradient-to-b from-[#f5c542] to-[#d4a02a] p-5 text-center text-[#0a1c3a] shadow-[0_10px_30px_rgba(245,197,66,0.35)]">
              <h2 className="mb-1 text-2xl" style={FONT_TITLE}>
                Entre para jogar
              </h2>
              <p className="mb-4 text-xs text-[#0a1c3a]/80">
                Use sua conta Google (a mesma do Google Play) para salvar seu progresso.
              </p>
              <div className="flex flex-col items-center gap-2">
                <div ref={btnRef} className="min-h-[44px]" />
                {!gsiReady && (
                  <p className="text-xs text-[#0a1c3a]/70">Carregando login do Google...</p>
                )}
              </div>
            </section>

            <p className="mt-4 text-center text-[10px] text-[#e8ecf1]/50">
              É obrigatório criar conta. Não há modo convidado.
            </p>
          </>
        )}

        {account && (
          <PlayOptions
            account={account}
            onLogout={() => {
              localStorage.removeItem(ACCOUNT_KEY);
              if (window.google?.accounts?.id) {
                window.google.accounts.id.disableAutoSelect();
              }
              setAccount(null);
            }}
          />
        )}

        <div className="mt-8 flex items-center justify-center gap-3 text-[11px] text-[#e8ecf1]/60">
          <Link to="/privacidade" className="underline hover:text-[#f5c542]">Privacidade</Link>
          <span>·</span>
          <Link to="/termos" className="underline hover:text-[#f5c542]">Termos</Link>
        </div>
        <p className="mt-2 text-center text-[10px] text-[#e8ecf1]/50">
          © BRHero · Beta MVP · Feito com ❤️ no Brasil
        </p>
      </div>
    </main>
  );
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#f5c542] bg-[#152b5c] text-[#f5c542]">
        {icon}
      </span>
      <div>
        <div className="text-[#f5c542]" style={FONT_TITLE}>{title}</div>
        <div className="text-xs text-[#e8ecf1]/75">{body}</div>
      </div>
    </li>
  );
}

function PlayOptions({ account, onLogout }: { account: Account; onLogout: () => void }) {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3 rounded-2xl border-2 border-[#f5c542]/40 bg-[#0a1c3a]/70 p-4 backdrop-blur">
        {account.picture ? (
          <img
            src={account.picture}
            alt={account.name}
            referrerPolicy="no-referrer"
            className="h-12 w-12 rounded-full border-2 border-[#f5c542]"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#f5c542] bg-[#152b5c] text-lg">
            👑
          </div>
        )}
        <div className="flex-1 text-left">
          <div className="text-xs text-[#e8ecf1]/60">Bem-vindo(a),</div>
          <div className="text-lg text-[#f5c542]" style={FONT_TITLE}>
            {account.name}
          </div>
          <div className="truncate text-[10px] text-[#e8ecf1]/50">{account.email}</div>
        </div>
      </div>

      <Link
        to="/game"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#f5c542] bg-gradient-to-b from-[#f5c542] to-[#d4a02a] py-4 text-lg text-[#0a1c3a] shadow-[0_6px_0_#8a6614] active:translate-y-1 active:shadow-[0_2px_0_#8a6614]"
        style={FONT_TITLE}
      >
        <Globe className="h-5 w-5" />
        JOGAR NO NAVEGADOR
      </Link>

      <a
        href="https://play.google.com/store/search?q=brhero&c=apps"
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#e8ecf1] bg-gradient-to-b from-[#1e3a7a] to-[#152b5c] py-4 text-lg text-[#e8ecf1] shadow-[0_6px_0_#050e1f] active:translate-y-1 active:shadow-[0_2px_0_#050e1f]"
        style={FONT_TITLE}
      >
        <Download className="h-5 w-5" />
        BAIXAR NO GOOGLE PLAY
      </a>

      <button
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 py-2 text-xs text-[#e8ecf1]/60 underline"
      >
        <LogOut className="h-3 w-3" /> Sair da conta
      </button>

      <div className="rounded-xl border border-[#f5c542]/20 bg-[#0a1c3a]/70 p-3 text-[10px] text-[#e8ecf1]/70">
        <Sparkles className="mr-1 inline h-3 w-3 text-[#f5c542]" />
        Login feito via Google — o mesmo usado no Google Play. Seu progresso fica vinculado à sua conta.
      </div>
    </div>
  );
}
