// RBAC mock — perfis administrativos e matriz de permissões.
// Persistido em localStorage. Preparado para migração ao Supabase.

export type AdminRole = "super_admin" | "game_master" | "support" | "moderator" | "financial";
export type AdminPermission = "view" | "create" | "edit" | "delete" | "critical";
export type AdminModule =
  | "players" | "codes" | "liveops" | "shop"
  | "items" | "balancing" | "economy" | "events" | "logs";

export interface AdminProfile {
  id: string;
  name: string;
  role: AdminRole;
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  game_master: "Game Master",
  support: "Suporte",
  moderator: "Moderador",
  financial: "Financeiro",
};

export const MODULE_LABEL: Record<AdminModule, string> = {
  players: "Jogadores", codes: "Códigos", liveops: "LiveOps", shop: "Loja",
  items: "Itens", balancing: "Balanceamento", economy: "Economia",
  events: "Eventos", logs: "Logs",
};

const ALL_PERMS: AdminPermission[] = ["view", "create", "edit", "delete", "critical"];
const ALL_MODULES: AdminModule[] = [
  "players","codes","liveops","shop","items","balancing","economy","events","logs",
];

type Matrix = Record<AdminRole, Partial<Record<AdminModule, AdminPermission[]>>>;

const full = (): Partial<Record<AdminModule, AdminPermission[]>> =>
  Object.fromEntries(ALL_MODULES.map((m) => [m, [...ALL_PERMS]]));

export const PERMISSION_MATRIX: Matrix = {
  super_admin: full(),
  game_master: {
    players:    ["view", "edit", "critical"],
    codes:      ["view", "create", "edit", "delete"],
    liveops:    ["view", "create", "edit", "delete", "critical"],
    shop:       ["view", "create", "edit", "delete"],
    items:      ["view", "create", "edit", "delete"],
    balancing:  ["view", "edit"],
    economy:    ["view"],
    events:     ["view", "create", "edit"],
    logs:       ["view"],
  },
  support: {
    players:    ["view", "edit"],
    codes:      ["view"],
    liveops:    ["view"],
    shop:       ["view"],
    items:      ["view"],
    balancing:  ["view"],
    economy:    ["view"],
    events:     ["view"],
    logs:       ["view"],
  },
  moderator: {
    players:    ["view", "edit", "critical"],
    codes:      ["view"],
    liveops:    ["view"],
    shop:       ["view"],
    items:      ["view"],
    balancing:  [],
    economy:    [],
    events:     ["view"],
    logs:       ["view"],
  },
  financial: {
    players:    ["view"],
    codes:      ["view", "create", "edit"],
    liveops:    ["view"],
    shop:       ["view", "create", "edit", "delete"],
    items:      ["view"],
    balancing:  ["view"],
    economy:    ["view", "edit"],
    events:     ["view"],
    logs:       ["view"],
  },
};

// ---------- Current admin profile store ----------
const STORAGE_KEY = "brhero_admin_current_profile_v1";

const DEFAULT_PROFILES: AdminProfile[] = [
  { id: "A-root",     name: "GM.Root",        role: "super_admin" },
  { id: "A-mestre",   name: "Mestre.Jogo",    role: "game_master" },
  { id: "A-suporte",  name: "Suporte.Beta",   role: "support" },
  { id: "A-mod",      name: "Mod.Carlos",     role: "moderator" },
  { id: "A-financ",   name: "Fin.Ana",        role: "financial" },
];

export const AVAILABLE_PROFILES = DEFAULT_PROFILES;

let current: AdminProfile = DEFAULT_PROFILES[0];

function loadCurrent(): AdminProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILES[0];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const id = JSON.parse(raw) as string;
      const p = DEFAULT_PROFILES.find((x) => x.id === id);
      if (p) return p;
    }
  } catch { /* ignore */ }
  return DEFAULT_PROFILES[0];
}
current = loadCurrent();

const listeners = new Set<() => void>();
export function subscribeAdmin(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function getCurrentAdmin(): AdminProfile { return current; }
export function setCurrentAdmin(id: string) {
  const p = DEFAULT_PROFILES.find((x) => x.id === id);
  if (!p) return;
  current = p;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(id)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

// ---------- Permission API ----------
export function can(mod: AdminModule, perm: AdminPermission, role: AdminRole = current.role): boolean {
  const perms = PERMISSION_MATRIX[role][mod];
  return !!perms && perms.includes(perm);
}

export class PermissionError extends Error {
  constructor(public mod: AdminModule, public perm: AdminPermission) {
    super(`Permissão negada: ${ROLE_LABEL[current.role]} não pode "${perm}" em ${MODULE_LABEL[mod]}`);
  }
}

export function guard(mod: AdminModule, perm: AdminPermission): void {
  if (!can(mod, perm)) throw new PermissionError(mod, perm);
}
