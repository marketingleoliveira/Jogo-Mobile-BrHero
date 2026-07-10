// Fase 3 · Bloco 4b — Cloud save (opt-in, seguro, com backup).
// Regras:
//  - Nunca sobrescrever save local sem confirmação / backup.
//  - Sempre preferir o save mais avançado em auto-sync.
//  - Fallback total ao localStorage quando não logado ou offline.
//  - Não altera a estrutura do save do jogo.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AUTO_SYNC_KEY = "brhero_cloud_autosync_v1";
const LOCAL_BACKUP_KEY = "brhero_local_save_backups_v1";
const MAX_LOCAL_BACKUPS = 20;

export interface SaveSummary {
  level: number;
  stage: number;
  maxStage: number;
  prestigeLevel: number;
  gems: number;
  essence: number;
  updatedAt: string; // ISO
}

export interface CloudSaveRow {
  save_data: unknown;
  save_version: number;
  level: number;
  stage: number;
  max_stage: number;
  prestige_level: number;
  gems: number;
  essence: number;
  client_updated_at: string;
  updated_at: string;
}

export interface CloudUser {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
}

// -------- Auth --------
export async function getCloudUser(): Promise<CloudUser | null> {
  try {
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (!u) return null;
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
    return {
      id: u.id,
      email: u.email ?? null,
      displayName: (meta.full_name as string) || (meta.name as string) || u.email || "Herói",
      avatarUrl: (meta.avatar_url as string) || null,
    };
  } catch {
    return null;
  }
}

export function subscribeAuth(cb: (u: CloudUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange(() => {
    void getCloudUser().then(cb);
  });
  return () => { data.subscription.unsubscribe(); };
}

export async function signOut(): Promise<void> {
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
}

// -------- Stage <-> "bloco-andar" (regra ÚNICA usada por HUD e admin) --------
// Convenção: stage bruto = (bloco - 1) * 10 + andar; andar ∈ [1..10].
// Ex.: 91 -> "10-1", 9 -> "1-9".
export function stageToBlockFloor(stage: number): { block: number; floor: number } {
  const s = Math.max(1, Math.floor(stage));
  return { block: Math.floor((s - 1) / 10) + 1, floor: ((s - 1) % 10) + 1 };
}
export function formatStage(stage: number): string {
  const { block, floor } = stageToBlockFloor(stage);
  return `${block}-${floor}`;
}
/** Converte "10-1" para 91. Retorna null se inválido. */
export function parseStageLabel(text: string): number | null {
  const m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(text);
  if (!m) return null;
  const b = parseInt(m[1], 10);
  const f = parseInt(m[2], 10);
  if (!b || b < 1 || !f || f < 1 || f > 10) return null;
  return (b - 1) * 10 + f;
}

// -------- Save summary helpers --------
type MinimalSave = {
  level?: number; stage?: number; maxStage?: number; prestigeLevel?: number;
  gems?: number; essence?: number; lastSeenAt?: number;
};

export function summarize(save: unknown, updatedAtISO?: string): SaveSummary {
  const s = (save ?? {}) as MinimalSave;
  return {
    level: s.level ?? 1,
    stage: s.stage ?? 1,
    maxStage: s.maxStage ?? 1,
    prestigeLevel: s.prestigeLevel ?? 0,
    gems: s.gems ?? 0,
    essence: s.essence ?? 0,
    updatedAt: updatedAtISO ?? new Date(s.lastSeenAt ?? Date.now()).toISOString(),
  };
}

/**
 * Retorna >0 se `a` é mais avançado, <0 se `b` é mais avançado, 0 se equivalentes.
 * Ordem de importância: prestigeLevel > maxStage > level > stage > gems > essence > updatedAt.
 */
export function compareSaves(a: SaveSummary, b: SaveSummary): number {
  const keys: (keyof SaveSummary)[] = ["prestigeLevel", "maxStage", "level", "stage", "gems", "essence"];
  for (const k of keys) {
    const diff = (a[k] as number) - (b[k] as number);
    if (diff !== 0) return diff;
  }
  return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
}

// -------- Cloud CRUD --------
export async function loadCloudSave(userId: string): Promise<CloudSaveRow | null> {
  const { data, error } = await supabase
    .from("player_saves")
    .select("save_data,save_version,level,stage,max_stage,prestige_level,gems,essence,client_updated_at,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as CloudSaveRow | null) ?? null;
}

export async function saveCloudSave(userId: string, save: unknown): Promise<string> {
  const s = summarize(save);
  const payload = {
    user_id: userId,
    save_data: save as never,
    save_version: 1,
    level: s.level, stage: s.stage, max_stage: s.maxStage,
    prestige_level: s.prestigeLevel, gems: s.gems, essence: s.essence,
    client_updated_at: s.updatedAt,
  };
  const { data, error } = await supabase
    .from("player_saves")
    .upsert(payload, { onConflict: "user_id" })
    .select("client_updated_at")
    .maybeSingle();
  if (error) throw error;
  return (data?.client_updated_at as string | undefined) ?? s.updatedAt;
}

export async function createCloudBackup(userId: string, save: unknown, reason: string): Promise<void> {
  const s = summarize(save);
  const { error } = await supabase.from("player_save_backups").insert({
    user_id: userId,
    save_data: save as never,
    level: s.level, stage: s.stage, max_stage: s.maxStage,
    prestige_level: s.prestigeLevel, gems: s.gems, essence: s.essence,
    client_updated_at: s.updatedAt,
    reason,
  });
  if (error) throw error;
  // Limpa backups antigos além dos MAX_LOCAL_BACKUPS
  try {
    const { data } = await supabase
      .from("player_save_backups")
      .select("id,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data && data.length > MAX_LOCAL_BACKUPS) {
      const toRemove = data.slice(MAX_LOCAL_BACKUPS).map((r) => r.id);
      await supabase.from("player_save_backups").delete().in("id", toRemove);
    }
  } catch { /* silencioso */ }
}

// -------- Local backup (sempre antes de sobrescrever) --------
interface LocalBackup { at: string; reason: string; summary: SaveSummary; save: unknown }

export function pushLocalBackup(save: unknown, reason: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_BACKUP_KEY);
    const arr: LocalBackup[] = raw ? JSON.parse(raw) : [];
    arr.unshift({ at: new Date().toISOString(), reason, summary: summarize(save), save });
    window.localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(arr.slice(0, MAX_LOCAL_BACKUPS)));
  } catch { /* ignore */ }
}

export function listLocalBackups(): LocalBackup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_BACKUP_KEY);
    return raw ? (JSON.parse(raw) as LocalBackup[]) : [];
  } catch { return []; }
}

// -------- Auto-sync toggle (off por padrão) --------
export function getAutoSyncEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTO_SYNC_KEY) === "1";
}
export function setAutoSyncEnabled(v: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTO_SYNC_KEY, v ? "1" : "0");
}

// -------- Export / Import JSON --------
export function exportSaveJSON(save: unknown): string {
  return JSON.stringify({
    kind: "brhero-save",
    version: 1,
    exportedAt: new Date().toISOString(),
    summary: summarize(save),
    save,
  }, null, 2);
}

export function parseImportedSave(text: string): { save: unknown; summary: SaveSummary } {
  const obj = JSON.parse(text) as { kind?: string; save?: unknown };
  if (!obj || obj.kind !== "brhero-save" || !obj.save) {
    throw new Error("Arquivo inválido — não é um save do BRHero");
  }
  return { save: obj.save, summary: summarize(obj.save) };
}

// -------- Hook: current user --------
export function useCloudUser(): CloudUser | null {
  const [user, setUser] = useState<CloudUser | null>(null);
  useEffect(() => {
    void getCloudUser().then(setUser);
    return subscribeAuth(setUser);
  }, []);
  return user;
}
