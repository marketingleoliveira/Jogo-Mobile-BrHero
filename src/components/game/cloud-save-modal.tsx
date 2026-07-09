// Fase 3 · Bloco 4b — Modal de Cloud Save com login Google, sync manual,
// tela de conflito, auto-sync opcional e export/import JSON.
// Toda a UI é read-only para o gameplay: se o jogador aplicar uma versão da
// nuvem, o game.tsx recebe o novo save via `onApplySave` e um backup local é
// criado antes.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { isBrHeroNativeApp, startNativeGoogleSignIn } from "@/lib/native-auth";
import {
  compareSaves, createCloudBackup, exportSaveJSON, getAutoSyncEnabled,
  loadCloudSave, parseImportedSave, pushLocalBackup, saveCloudSave,
  setAutoSyncEnabled, signOut, summarize, useCloudUser,
  type CloudSaveRow, type SaveSummary,
} from "@/lib/game/cloud-save";

interface Props {
  localSave: unknown;
  onClose: () => void;
  onApplySave: (save: unknown) => void;
}

type Phase = "idle" | "loading" | "conflict" | "done";

export function CloudSaveModal({ localSave, onClose, onApplySave }: Props) {
  const user = useCloudUser();
  const [phase, setPhase] = useState<Phase>("idle");
  const [cloud, setCloud] = useState<CloudSaveRow | null>(null);
  const [autoSync, setAutoSyncState] = useState<boolean>(() => getAutoSyncEnabled());
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const localSummary = summarize(localSave);
  const cloudSummary: SaveSummary | null = cloud
    ? {
      level: cloud.level, stage: cloud.stage, maxStage: cloud.max_stage,
      prestigeLevel: cloud.prestige_level, gems: cloud.gems, essence: cloud.essence,
      updatedAt: cloud.client_updated_at,
    }
    : null;

  const refreshCloud = useCallback(async () => {
    if (!user) return;
    setPhase("loading");
    try {
      const c = await loadCloudSave(user.id);
      setCloud(c);
      setPhase("idle");
    } catch (e) {
      setPhase("idle");
      toast.error(e instanceof Error ? e.message : "Falha ao carregar nuvem");
    }
  }, [user]);

  useEffect(() => { void refreshCloud(); }, [refreshCloud]);

  const handleSignIn = useCallback(async () => {
    setBusy(true);
    try {
      if (isBrHeroNativeApp()) {
        await startNativeGoogleSignIn();
        return;
      }

      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (r.error) toast.error("Erro ao entrar com Google");
    } finally { setBusy(false); }
  }, []);

  const handleSaveToCloud = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (cloud) {
        // Backup do que já estava na nuvem
        await createCloudBackup(user.id, cloud.save_data, "before-overwrite-upload");
      }
      await saveCloudSave(user.id, localSave);
      pushLocalBackup(localSave, "upload");
      toast.success("Save enviado para a nuvem");
      await refreshCloud();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally { setBusy(false); }
  }, [user, cloud, localSave, refreshCloud]);

  const handleLoadFromCloud = useCallback(() => {
    if (!cloud || !cloudSummary) return;
    setPhase("conflict");
  }, [cloud, cloudSummary]);

  const applyCloudSave = useCallback(async () => {
    if (!cloud || !user) return;
    setBusy(true);
    try {
      // Backup do save local antes de sobrescrever
      pushLocalBackup(localSave, "before-download");
      await createCloudBackup(user.id, localSave, "before-download-local");
      onApplySave(cloud.save_data);
      toast.success("Save da nuvem aplicado");
      setPhase("done");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao aplicar");
    } finally { setBusy(false); }
  }, [cloud, user, localSave, onApplySave]);

  const handleAutoSyncChange = useCallback((v: boolean) => {
    setAutoSyncState(v);
    setAutoSyncEnabled(v);
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([exportSaveJSON(localSave)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brhero-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [localSave]);

  const handleImportFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const { save } = parseImportedSave(text);
      pushLocalBackup(localSave, "before-import");
      onApplySave(save);
      toast.success("Save importado");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Arquivo inválido");
    }
  }, [localSave, onApplySave, onClose]);

  const conflictWinner = cloudSummary ? compareSaves(cloudSummary, localSummary) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm sm:items-center sm:justify-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-4 border-sky-400 bg-gradient-to-b from-[#0a1c3a] to-[#0d2b4a] p-5 text-[#e8ecf1] shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl text-sky-300" style={{ fontFamily: "'Lilita One', cursive" }}>
            ☁️ Save em Nuvem
          </h2>
          <button onClick={onClose} className="rounded-full border border-sky-400/40 px-3 py-1 text-xs text-sky-300">
            Fechar
          </button>
        </div>

        {!user && (
          <div className="space-y-3">
            <p className="rounded-lg border border-sky-400/30 bg-sky-500/10 p-3 text-sm">
              Entre com sua conta Google para sincronizar seu progresso em vários dispositivos.
              Seu save local <b>não é apagado</b>.
            </p>
            <button
              onClick={handleSignIn}
              disabled={busy}
              className="w-full rounded-xl border-2 border-white bg-white px-4 py-3 text-sm font-bold text-[#0a1c3a] disabled:opacity-60"
            >
              🔑 Entrar com Google
            </button>
            <BackupTools onExport={handleExport} onImport={() => fileRef.current?.click()} />
          </div>
        )}

        {user && phase !== "conflict" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-sky-400/30 bg-sky-500/10 p-3">
              {user.avatarUrl && <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full" />}
              <div className="flex-1 text-sm">
                <div className="font-bold text-sky-200">{user.displayName}</div>
                {user.email && <div className="text-[11px] opacity-70">{user.email}</div>}
              </div>
              <button
                onClick={() => void signOut()}
                className="rounded border border-sky-400/40 px-2 py-1 text-[11px] text-sky-200"
              >
                Sair
              </button>
            </div>

            <SummaryCard title="📱 Save local" summary={localSummary} />
            <SummaryCard
              title="☁️ Save na nuvem"
              summary={cloudSummary}
              empty={phase === "loading" ? "carregando…" : "nenhum save na nuvem ainda"}
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSaveToCloud}
                disabled={busy}
                className="rounded-lg border-2 border-emerald-400 bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-60"
              >
                ⬆️ Salvar na nuvem
              </button>
              <button
                onClick={handleLoadFromCloud}
                disabled={busy || !cloud}
                className="rounded-lg border-2 border-amber-400 bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-100 disabled:opacity-40"
              >
                ⬇️ Carregar da nuvem
              </button>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-sky-400/30 bg-sky-500/5 px-3 py-2 text-xs">
              <span>Auto-sync ao fechar o jogo <span className="opacity-60">(experimental)</span></span>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => handleAutoSyncChange(e.target.checked)}
              />
            </label>

            <BackupTools onExport={handleExport} onImport={() => fileRef.current?.click()} />
          </div>
        )}

        {user && phase === "conflict" && cloudSummary && (
          <div className="space-y-3">
            <p className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-sm">
              ⚠️ Confirme a substituição. Um backup do save atual será criado antes.
              {conflictWinner > 0 && <> A versão da <b>nuvem</b> parece mais avançada.</>}
              {conflictWinner < 0 && <> Seu save <b>local</b> parece mais avançado.</>}
              {conflictWinner === 0 && <> Ambos parecem equivalentes.</>}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <SummaryCard title="📱 Local (atual)" summary={localSummary} highlight={conflictWinner < 0} />
              <SummaryCard title="☁️ Nuvem" summary={cloudSummary} highlight={conflictWinner > 0} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPhase("idle")}
                className="rounded-lg border border-sky-400/40 px-3 py-2 text-xs text-sky-200"
              >
                Manter local
              </button>
              <button
                onClick={() => void applyCloudSave()}
                disabled={busy}
                className="rounded-lg border-2 border-amber-400 bg-amber-500/30 px-3 py-2 text-xs font-bold text-amber-50 disabled:opacity-60"
              >
                Aplicar da nuvem
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImportFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  title, summary, empty, highlight,
}: { title: string; summary: SaveSummary | null; empty?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-xs ${highlight ? "border-emerald-400 bg-emerald-500/10" : "border-sky-400/30 bg-sky-500/5"}`}>
      <div className="mb-1 text-[11px] font-bold text-sky-200">{title}</div>
      {summary ? (
        <ul className="space-y-0.5 opacity-90">
          <li>Level: <b>{summary.level}</b></li>
          <li>Stage: <b>{summary.stage}</b> · Max: <b>{summary.maxStage}</b></li>
          <li>Rebirth: <b>{summary.prestigeLevel}</b></li>
          <li>💎 {summary.gems.toLocaleString("pt-BR")} · ✨ {summary.essence.toLocaleString("pt-BR")}</li>
          <li className="text-[10px] opacity-60">{new Date(summary.updatedAt).toLocaleString("pt-BR")}</li>
        </ul>
      ) : (
        <div className="text-[11px] opacity-60">{empty ?? "—"}</div>
      )}
    </div>
  );
}

function BackupTools({ onExport, onImport }: { onExport: () => void; onImport: () => void }) {
  return (
    <div className="rounded-lg border border-sky-400/30 bg-sky-500/5 p-3">
      <div className="mb-2 text-[11px] font-bold text-sky-200">📦 Backup manual</div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onExport} className="rounded border border-sky-400/40 px-2 py-1 text-[11px] text-sky-100">
          Exportar JSON
        </button>
        <button onClick={onImport} className="rounded border border-sky-400/40 px-2 py-1 text-[11px] text-sky-100">
          Importar JSON
        </button>
      </div>
    </div>
  );
}
