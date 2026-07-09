import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Smartphone, ArrowLeft } from "lucide-react";
import brheroLogo from "@/assets/brhero-logo.png.asset.json";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "BRHero — Baixar APK Android" },
      {
        name: "description",
        content:
          "BRHero é um jogo exclusivo para Android. Baixe o APK e comece a jogar o primeiro RPG idle brasileiro.",
      },
      { property: "og:title", content: "BRHero — Baixar APK Android" },
      { property: "og:description", content: "Jogo exclusivo para Android. Baixe o APK do BRHero." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
    ],
    links: [{ rel: "canonical", href: "https://brhero.lovable.app/download" }],
  }),
  component: DownloadPage,
});

const FONT_TITLE = { fontFamily: "'Lilita One', system-ui, sans-serif" } as const;
const FONT_BODY = { fontFamily: "'Fredoka', system-ui, sans-serif", fontWeight: 500 } as const;

function DownloadPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden text-[#e8ecf1]"
      style={{
        ...FONT_BODY,
        background:
          "radial-gradient(1200px 600px at 50% -10%, #1e3a7a 0%, #152b5c 35%, #0a1c3a 75%, #050e1f 100%)",
      }}
    >
      <div className="relative mx-auto w-full max-w-md px-5 pb-16 pt-8 text-center">
        <img
          src={brheroLogo.url}
          alt="BRHero"
          className="mx-auto h-48 w-48 object-contain drop-shadow-[0_10px_25px_rgba(245,197,66,0.35)]"
        />
        <h1 className="mt-4 text-3xl text-[#f5c542]" style={FONT_TITLE}>
          Jogue direto no navegador
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#e8ecf1]/90">
          BRHero agora é um <b className="text-[#f5c542]">RPG idle web</b>.
          Rode em qualquer aparelho — desktop, notebook, tablet ou celular.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border-2 border-[#f5c542]/40 bg-[#0a1c3a]/70 p-3 text-sm text-[#e8ecf1]/80">
          <Smartphone className="h-4 w-4 text-[#f5c542]" />
          Nada para instalar. Basta abrir e jogar.
        </div>

        <Link
          to="/game"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#f5c542] bg-gradient-to-b from-[#f5c542] to-[#d4a02a] py-4 text-lg text-[#0a1c3a] shadow-[0_6px_0_#8a6614] active:translate-y-1 active:shadow-[0_2px_0_#8a6614]"
          style={FONT_TITLE}
        >
          JOGAR AGORA
        </Link>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-sm text-[#e8ecf1]/70 underline hover:text-[#f5c542]"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar
        </Link>
      </div>
    </main>
  );
}

