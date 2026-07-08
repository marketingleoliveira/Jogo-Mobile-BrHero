// Mock store for Admin CMS - Codes/Redeem module.
// Ainda não conectado a Supabase. Persiste em localStorage.
import { guard } from "./rbac";
import { logAction } from "./audit-central";


export interface CodeRewards {
  gold: number;
  gems: number;
  essence: number;
  chest: string;       // ex: "Baú Épico"
  item: string;
  skin: string;
  cosmetic: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  active: boolean;
  startsAt: string | null; // ISO
  endsAt: string | null;   // ISO
  totalLimit: number;      // 0 = ilimitado
  perPlayerLimit: number;  // >=1
  uses: number;
  rewards: CodeRewards;
  createdAt: string;
  updatedAt: string;
}

export interface CodeAuditLog {
  id: string;
  date: string;
  admin: string;
  action: "create" | "update" | "toggle" | "delete";
  code: string;
  before: Partial<RedeemCode> | null;
  after: Partial<RedeemCode> | null;
  reason: string;
}

const STORAGE_KEY = "brhero_admin_codes_v1";
const CURRENT_ADMIN = "GM.Root";

interface Store { codes: RedeemCode[]; logs: CodeAuditLog[]; }

export const emptyRewards = (): CodeRewards => ({
  gold: 0, gems: 0, essence: 0, chest: "", item: "", skin: "", cosmetic: "",
});

const now = () => new Date().toISOString();

function seed(): RedeemCode[] {
  const t = now();
  return [
    { id: "C-BETA100", code: "BETA100", active: true, startsAt: null, endsAt: null,
      totalLimit: 0, perPlayerLimit: 1, uses: 812,
      rewards: { ...emptyRewards(), gems: 100 }, createdAt: t, updatedAt: t },
    { id: "C-BRHERO", code: "BRHERO", active: true, startsAt: null, endsAt: null,
      totalLimit: 0, perPlayerLimit: 1, uses: 610,
      rewards: { ...emptyRewards(), gold: 50_000, chest: "Baú Épico" }, createdAt: t, updatedAt: t },
    { id: "C-FUNDADOR", code: "FUNDADOR", active: true, startsAt: null, endsAt: null,
      totalLimit: 1000, perPlayerLimit: 1, uses: 390,
      rewards: { ...emptyRewards(), cosmetic: "Aura Lendária" }, createdAt: t, updatedAt: t },
  ];
}

function load(): Store {
  if (typeof window === "undefined") return { codes: seed(), logs: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch { /* ignore */ }
  const s: Store = { codes: seed(), logs: [] };
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

export function subscribeCodes(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function getCodes() { return store.codes; }
export function getCodeLogs() { return store.logs; }

function pushLog(entry: Omit<CodeAuditLog, "id" | "date" | "admin">) {
  store.logs = [
    { id: `L-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      date: now(), admin: CURRENT_ADMIN, ...entry },
    ...store.logs,
  ].slice(0, 500);
}

export interface CodeInput {
  code: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  totalLimit: number;
  perPlayerLimit: number;
  rewards: CodeRewards;
}

export const codeActions = {
  create(input: CodeInput, reason: string) {
    guard("codes", "create");
    const code = input.code.trim().toUpperCase();
    if (!code) throw new Error("Código vazio");
    if (store.codes.some((c) => c.code === code)) throw new Error("Código já existe");
    const t = now();
    const created: RedeemCode = {
      id: `C-${code}-${Date.now().toString(36)}`,
      code, active: input.active,
      startsAt: input.startsAt, endsAt: input.endsAt,
      totalLimit: Math.max(0, input.totalLimit),
      perPlayerLimit: Math.max(1, input.perPlayerLimit),
      uses: 0, rewards: { ...input.rewards },
      createdAt: t, updatedAt: t,
    };
    store.codes = [created, ...store.codes];
    pushLog({ action: "create", code, before: null, after: created, reason });
    logAction({ module: "codes", action: "create", target: code, before: null, after: created, reason });
    emit();
    return created;
  },
  update(id: string, input: CodeInput, reason: string) {
    guard("codes", "edit");
    const idx = store.codes.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const before = store.codes[idx];
    const code = input.code.trim().toUpperCase() || before.code;
    if (code !== before.code && store.codes.some((c) => c.code === code)) throw new Error("Código já existe");
    const after: RedeemCode = {
      ...before, code, active: input.active,
      startsAt: input.startsAt, endsAt: input.endsAt,
      totalLimit: Math.max(0, input.totalLimit),
      perPlayerLimit: Math.max(1, input.perPlayerLimit),
      rewards: { ...input.rewards },
      updatedAt: now(),
    };
    store.codes = store.codes.map((c, i) => (i === idx ? after : c));
    pushLog({ action: "update", code: after.code, before, after, reason });
    logAction({ module: "codes", action: "update", target: after.code, before, after, reason });
    emit();
  },
  toggle(id: string, reason: string) {
    guard("codes", "edit");
    const idx = store.codes.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const before = store.codes[idx];
    const after: RedeemCode = { ...before, active: !before.active, updatedAt: now() };
    store.codes = store.codes.map((c, i) => (i === idx ? after : c));
    pushLog({ action: "toggle", code: after.code, before: { active: before.active }, after: { active: after.active }, reason });
    logAction({ module: "codes", action: "toggle", target: after.code, before: { active: before.active }, after: { active: after.active }, reason });
    emit();
  },
  remove(id: string, reason: string) {
    guard("codes", "delete");
    const target = store.codes.find((c) => c.id === id);
    if (!target) return;
    store.codes = store.codes.filter((c) => c.id !== id);
    pushLog({ action: "delete", code: target.code, before: target, after: null, reason });
    logAction({ module: "codes", action: "delete", target: target.code, before: target, after: null, reason });
    emit();
  },
};


export function codeStatus(c: RedeemCode): "active" | "inactive" | "scheduled" | "expired" | "exhausted" {
  const t = Date.now();
  if (!c.active) return "inactive";
  if (c.totalLimit > 0 && c.uses >= c.totalLimit) return "exhausted";
  if (c.startsAt && new Date(c.startsAt).getTime() > t) return "scheduled";
  if (c.endsAt   && new Date(c.endsAt).getTime()   < t) return "expired";
  return "active";
}

// ---------------- Supabase sync (Fase 2) ----------------
import { hydrateModule, remoteUpsert, remoteDelete } from "./supabase-module-store";

void hydrateModule<RedeemCode>("codes", (list) => {
  if (list.length === 0) return;
  store = { ...store, codes: list };
  emit();
});

const _origCreateCode = codeActions.create;
const _origUpdateCode = codeActions.update;
const _origToggleCode = codeActions.toggle;
const _origRemoveCode = codeActions.remove;
codeActions.create = (input, reason) => {
  const r = _origCreateCode(input, reason);
  if (r) void remoteUpsert("codes", r.id, r);
  return r;
};
codeActions.update = (id, input, reason) => {
  _origUpdateCode(id, input, reason);
  const r = store.codes.find((c) => c.id === id);
  if (r) void remoteUpsert("codes", r.id, r);
};
codeActions.toggle = (id, reason) => {
  _origToggleCode(id, reason);
  const r = store.codes.find((c) => c.id === id);
  if (r) void remoteUpsert("codes", r.id, r);
};
codeActions.remove = (id, reason) => {
  _origRemoveCode(id, reason);
  void remoteDelete("codes", id);
};
