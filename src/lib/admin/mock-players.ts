// Mock data store for Admin CMS - Players module
// Arquitetura preparada para futuramente ser substituída por Supabase.
// NÃO afeta o game.tsx real.

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

const STORAGE_KEY = "brhero_admin_mock_v1";
const CURRENT_ADMIN = "GM.Root";

interface Store {
  players: MockPlayer[];
  logs: AuditLog[];
}

const seed = (): MockPlayer[] => [
  {
    id: "P-2381", nickname: "GuerreiroBR", email: "guerreiro@brhero.gg", googleId: "gg_1029384",
    status: "active", level: 42, stage: 68, maxStage: 74, rebirths: 2,
    gold: 148_500, gems: 320, essence: 41,
    pets: ["Lobo","Falcão"], runes: ["Runa Ataque Lv3","Runa Vida Lv2"],
    skins: ["Guerreiro Sombrio"], cosmetics: ["Aura Azul","Título Fundador Beta"],
    guild: "Ordem do Cerrado", arenaRank: 128, towerBest: 24,
    redeemUsed: ["BETA100"], lastSeen: "há 3min",
  },
  {
    id: "P-1907", nickname: "LenaFire", email: "lena@brhero.gg", googleId: "gg_5567123",
    status: "active", level: 37, stage: 52, maxStage: 60, rebirths: 1,
    gold: 88_200, gems: 145, essence: 12,
    pets: ["Tigre"], runes: ["Runa Crítica Lv1"],
    skins: [], cosmetics: ["Moldura Brasil"],
    guild: "Chamas do Sul", arenaRank: 342, towerBest: 18,
    redeemUsed: ["BETA100","BRHERO"], lastSeen: "há 12min",
  },
  {
    id: "P-5510", nickname: "TigreDoCerrado", email: "tigre@brhero.gg", googleId: "gg_9928471",
    status: "active", level: 55, stage: 90, maxStage: 112, rebirths: 3,
    gold: 512_000, gems: 890, essence: 128,
    pets: ["Dragão","Lobo","Falcão"], runes: ["Runa Ataque Lv6","Runa Vida Lv5","Runa Crítica Lv4"],
    skins: ["Dragão Ancestral","Guerreiro Sombrio"], cosmetics: ["Aura Lendária","Machado Dourado","Título Fundador Beta"],
    guild: "Ordem do Cerrado", arenaRank: 12, towerBest: 47,
    redeemUsed: ["BETA100","BRHERO","FUNDADOR"], lastSeen: "há 1h",
  },
  {
    id: "P-0921", nickname: "PixelHero", email: "pixel@brhero.gg", googleId: "gg_3341902",
    status: "suspended", level: 19, stage: 22, maxStage: 25, rebirths: 0,
    gold: 4_200, gems: 30, essence: 0,
    pets: [], runes: [],
    skins: [], cosmetics: [],
    guild: null, arenaRank: 2103, towerBest: 5,
    redeemUsed: [], lastSeen: "há 4h",
  },
  {
    id: "P-7712", nickname: "NoxBanido", email: "nox@brhero.gg", googleId: "gg_7781122",
    status: "banned", level: 28, stage: 34, maxStage: 34, rebirths: 0,
    gold: 0, gems: 0, essence: 0,
    pets: [], runes: [], skins: [], cosmetics: [], guild: null,
    arenaRank: 9999, towerBest: 0, redeemUsed: [],
    lastSeen: "há 2d",
  },
];

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
  const idx = store.players.findIndex((p) => p.id === playerId);
  if (idx < 0) return;
  const before = { ...store.players[idx] };
  const patch = fn(store.players[idx]);
  const after = { ...before, ...patch };
  store.players = store.players.map((p, i) => (i === idx ? after : p));
  pushLog({
    action, player: `${after.nickname} (${after.id})`,
    before: pickChanged(before, patch), after: patch as Record<string, unknown>, reason,
  });
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
