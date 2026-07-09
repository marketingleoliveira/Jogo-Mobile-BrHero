// Mock data store for Admin CMS - Players module
// Arquitetura preparada para futuramente ser substituída por Supabase.
// NÃO afeta o game.tsx real.
import { guard } from "./rbac";
import { logAction } from "./audit-central";


export type PlayerStatus = "active" | "suspended" | "banned";

export interface MockPlayer {
  id: string;
  nickname: string;
  email: string;
  googleId: string;
  status: PlayerStatus;
  level: number;
  stage: number;
  maxStage: number;
  rebirths: number;
  gold: number;
  gems: number;
  essence: number;
  pets: string[];
  runes: string[];
  skins: string[];
  cosmetics: string[];
  guild: string | null;
  arenaRank: number;
  towerBest: number;
  redeemUsed: string[];
  lastSeen: string;
}

export interface AuditLog {
  id: string;
  date: string;
  admin: string;
  action: string;
  player: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string;
}

const STORAGE_KEY = "brhero_admin_mock_v2";
const CURRENT_ADMIN = "GM.Root";

interface Store {
  players: MockPlayer[];
  logs: AuditLog[];
}

// Sem dados fake: a lista fica vazia até integrarmos com player_saves real.
const seed = (): MockPlayer[] => [];

function load(): Store {
  if (typeof window === "undefined") return { players: seed(), logs: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch { /* ignore */ }
  const s: Store = { players: seed(), logs: [] };
  save(s);
  return s;
}

function save(s: Store) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

let store: Store = load();
const listeners = new Set<() => void>();
const emit = () => { save(store); listeners.forEach((l) => l()); };

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function getPlayers() { return store.players; }
export function getLogs() { return store.logs; }

export function searchPlayers(q: string): MockPlayer[] {
  const s = q.trim().toLowerCase();
  if (!s) return store.players;
  return store.players.filter(
    (p) => p.id.toLowerCase().includes(s)
      || p.nickname.toLowerCase().includes(s)
      || p.email.toLowerCase().includes(s)
      || p.googleId.toLowerCase().includes(s),
  );
}

function pushLog(entry: Omit<AuditLog, "id" | "date" | "admin">) {
  store.logs = [
    { id: `L-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      date: new Date().toISOString(), admin: CURRENT_ADMIN, ...entry },
    ...store.logs,
  ].slice(0, 500);
}

function mutate(playerId: string, action: string, reason: string, fn: (p: MockPlayer) => Partial<MockPlayer>) {
  const critical = action === "suspend" || action === "ban" || action === "unban" || action === "reset";
  guard("players", critical ? "critical" : "edit");
  const idx = store.players.findIndex((p) => p.id === playerId);
  if (idx < 0) return;
  const before = { ...store.players[idx] };
  const patch = fn(store.players[idx]);
  const after = { ...before, ...patch };
  store.players = store.players.map((p, i) => (i === idx ? after : p));
  const beforeChanged = pickChanged(before, patch);
  pushLog({ action, player: `${after.nickname} (${after.id})`, before: beforeChanged, after: patch as Record<string, unknown>, reason });
  logAction({ module: "players", action, target: `${after.nickname} (${after.id})`, before: beforeChanged, after: patch, reason });
  emit();
}


function pickChanged(before: MockPlayer, patch: Partial<MockPlayer>) {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(patch) as (keyof MockPlayer)[]) out[k] = before[k];
  return out;
}

export const adminActions = {
  addGold:    (id: string, amount: number, reason: string) => mutate(id, "add_gold",    reason, (p) => ({ gold: p.gold + amount })),
  addGems:    (id: string, amount: number, reason: string) => mutate(id, "add_gems",    reason, (p) => ({ gems: p.gems + amount })),
  addEssence: (id: string, amount: number, reason: string) => mutate(id, "add_essence", reason, (p) => ({ essence: p.essence + amount })),
  addItem:    (id: string, item: string,   reason: string) => mutate(id, "add_item",    reason, (p) => ({ cosmetics: [...p.cosmetics, item] })),
  suspend:    (id: string, reason: string) => mutate(id, "suspend", reason, () => ({ status: "suspended" as PlayerStatus })),
  ban:        (id: string, reason: string) => mutate(id, "ban",     reason, () => ({ status: "banned"    as PlayerStatus })),
  unban:      (id: string, reason: string) => mutate(id, "unban",   reason, () => ({ status: "active"    as PlayerStatus })),
  reset: (id: string, reason: string) => mutate(id, "reset", reason, () => ({
    level: 1, stage: 1, maxStage: 1, rebirths: 0,
    gold: 0, gems: 0, essence: 0,
    pets: [], runes: [], skins: [], cosmetics: [],
    guild: null, arenaRank: 9999, towerBest: 0, redeemUsed: [],
  })),
};
