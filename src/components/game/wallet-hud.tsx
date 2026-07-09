// Fase 4 · Bloco 4 — HUD de carteira (gems/gold do servidor) + modal de Títulos.
// Overlay leve montado no topo da rota /game. Não interfere na engine local.

import { useState } from "react";
import { Gem, Coins, Tag, RefreshCw, X, Check } from "lucide-react";
import { useWallet } from "@/lib/game/wallet";

function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function WalletHud() {
  const { wallet, titles, equippedTitle, loading, error, userId, refresh, equipTitle } = useWallet();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b-2 border-amber-900/40 bg-black/40 px-3 py-1.5 text-xs">
        <div className="flex items-center gap-3 font-semibold">
          <span className="flex items-center gap-1 text-pink-300" title="Cristais da carteira do servidor">
            <Gem className="h-3.5 w-3.5" /> {loading ? "…" : fmt(wallet.gems)}
          </span>
          <span className="flex items-center gap-1 text-amber-300" title="Ouro da carteira do servidor">
            <Coins className="h-3.5 w-3.5" /> {loading ? "…" : fmt(wallet.gold)}
          </span>
          {equippedTitle && (
            <span className="hidden sm:inline text-yellow-200" title="Título equipado">
              🏷️ {equippedTitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md border border-amber-900/60 bg-amber-950/40 px-2 py-0.5 text-amber-200 hover:bg-amber-900/50"
            aria-label="Abrir títulos"
          >
            <Tag className="inline h-3 w-3 mr-1" /> Títulos
            {titles.length > 0 && <span className="ml-1 text-[10px] opacity-80">({titles.length})</span>}
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-md border border-amber-900/60 bg-amber-950/40 px-1.5 py-0.5 text-amber-200 hover:bg-amber-900/50 disabled:opacity-50"
            aria-label="Atualizar carteira"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border-2 border-amber-800 bg-[#2D1B0E] p-4 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-200">🏷️ Meus Títulos</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-amber-200 hover:bg-amber-900/40"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!userId ? (
              <p className="text-sm text-amber-100/80">Faça login para ver seus títulos.</p>
            ) : loading ? (
              <p className="text-sm text-amber-100/80">Carregando…</p>
            ) : error ? (
              <p className="text-sm text-red-300">Erro: {error}</p>
            ) : titles.length === 0 ? (
              <p className="text-sm text-amber-100/80">
                Nenhum título ainda. Resgate recompensas de temporada em <b>/ranking</b>.
              </p>
            ) : (
              <ul className="space-y-1.5">
                <li>
                  <button
                    type="button"
                    onClick={() => equipTitle(null)}
                    className={`flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-sm ${
                      equippedTitle === null
                        ? "border-emerald-500 bg-emerald-900/30 text-emerald-200"
                        : "border-amber-900/60 bg-amber-950/40 hover:bg-amber-900/40"
                    }`}
                  >
                    <span>— Nenhum —</span>
                    {equippedTitle === null && <Check className="h-3.5 w-3.5" />}
                  </button>
                </li>
                {titles.map((t) => {
                  const active = equippedTitle === t.title;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => equipTitle(t.title)}
                        className={`flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-sm ${
                          active
                            ? "border-emerald-500 bg-emerald-900/30 text-emerald-200"
                            : "border-amber-900/60 bg-amber-950/40 hover:bg-amber-900/40"
                        }`}
                      >
                        <span className="truncate">
                          🏷️ {t.title}
                          {t.source_season_key && (
                            <span className="ml-1 text-[10px] opacity-70">({t.source_season_key})</span>
                          )}
                        </span>
                        {active ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px] opacity-70">equipar</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="mt-3 text-[10px] text-amber-100/60">
              Título é cosmético e salvo localmente. Carteira do servidor é sincronizada com o resgate de recompensas.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
