// Audit log centralizado — unifica logs de todos os módulos do Admin CMS.
// Persistido em localStorage + dual-write no Supabase quando disponível.

import { getCurrentAdmin, type AdminModule, type AdminRole, ROLE_LABEL } from "./rbac";
import { persistRemoteLog } from "./supabase-admin";

export interface CentralAuditEntry {
  id: string;
  date: string;
  adminId: string;
  adminName: string;
  role: AdminRole;
  roleLabel: string;
  module: AdminModule;
  action: string;   // "create" | "update" | "toggle" | "delete" | "critical:*" | livre
  target: string;
  before: unknown;
  after: unknown;
  reason: string;
}

const STORAGE_KEY = "brhero_admin_audit_central_v1";

interface Store { entries: CentralAuditEntry[]; }

function load(): Store {
  if (typeof window === "undefined") return { entries: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch { /* ignore */ }
  return { entries: [] };
}
function save(s: Store) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

let store: Store = load();
const listeners = new Set<() => void>();
const emit = () => { save(store); listeners.forEach((l) => l()); };

export function subscribeAudit(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function getAudit() { return store.entries; }
export function clearAudit() { store = { entries: [] }; emit(); }

export interface LogInput {
  module: AdminModule;
  action: string;
  target: string;
  before?: unknown;
  after?: unknown;
  reason: string;
}

export function logAction(input: LogInput): CentralAuditEntry {
  const admin = getCurrentAdmin();
  const entry: CentralAuditEntry = {
    id: `A-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString(),
    adminId: admin.id,
    adminName: admin.name,
    role: admin.role,
    roleLabel: ROLE_LABEL[admin.role],
    module: input.module,
    action: input.action,
    target: input.target,
    before: input.before ?? null,
    after: input.after ?? null,
    reason: input.reason,
  };
  store.entries = [entry, ...store.entries].slice(0, 1000);
  emit();
  return entry;
}
