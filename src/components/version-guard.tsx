// VersionGuard — detecta que uma nova versão do jogo foi publicada.
// Faz polling em /api/public/version a cada 60s (e no foco da aba). Se a versão
// do servidor for diferente da versão estampada no bundle do cliente, mostra
// um modal bloqueante pedindo para atualizar. Isso evita dessincronia entre
// front antigo e backend novo (schemas de save, endpoints, RLS, etc).

import { useEffect, useState } from "react";

const POLL_MS = 60_000;
const ENDPOINT = "/api/public/version";

async function fetchServerVersion(): Promise<string | null> {
  try {
    const res = await fetch(ENDPOINT, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  }
}

export function VersionGuard() {
  const [outdated, setOutdated] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  useEffect(() => {
    // SSR guard: __APP_VERSION__ existe também no server bundle, mas rodamos
    // fetch/polling só no cliente.
    if (typeof window === "undefined") return;
    // Só protege em produção — em preview/dev o build muda o tempo todo.
    if (!import.meta.env.PROD) return;

    let cancelled = false;

    const check = async () => {
      const v = await fetchServerVersion();
      if (cancelled || !v) return;
      if (v !== __APP_VERSION__) {
        setServerVersion(v);
        setOutdated(true);
      }
    };

    // primeira verificação após 5s para não competir com o carregamento inicial
    const first = window.setTimeout(() => void check(), 5000);
    const interval = window.setInterval(() => void check(), POLL_MS);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  if (!outdated) return null;

  const reload = () => {
    try {
      // Tenta forçar bypass de cache: limpa caches do Service Worker (se houver)
      // e recarrega ignorando o disk cache.
      if ("caches" in window) {
        void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
      }
    } catch { /* noop */ }
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border-4 border-amber-400 bg-gradient-to-b from-[#1a0f07] to-[#2d1b0e] p-6 text-center text-amber-50 shadow-2xl">
        <div className="mb-3 text-5xl">🔄</div>
        <h2
          className="mb-2 text-2xl text-amber-300"
          style={{ fontFamily: "'Lilita One', cursive" }}
        >
          Nova versão disponível!
        </h2>
        <p className="mb-4 text-sm text-amber-100/90">
          O BRHero foi atualizado. Para continuar jogando com a versão mais recente
          e evitar erros de sincronização, é preciso recarregar o jogo.
        </p>
        <button
          onClick={reload}
          className="w-full rounded-xl border-2 border-amber-300 bg-gradient-to-b from-amber-400 to-amber-600 px-4 py-3 text-base font-black text-[#1a0f07] shadow-lg transition hover:scale-[1.02]"
          style={{ fontFamily: "'Lilita One', cursive" }}
        >
          ATUALIZAR AGORA
        </button>
        {serverVersion && (
          <p className="mt-3 text-[10px] opacity-50">
            build: {__APP_VERSION__} → {serverVersion}
          </p>
        )}
      </div>
    </div>
  );
}
