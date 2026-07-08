// Mock store for Admin CMS - LiveOps module.
// Ainda não conectado a Supabase. Persiste em localStorage.
import { guard } from "./rbac";
import { logAction } from "./audit-central";


export type CampaignType =
  | "double_xp"
  | "double_gold"
  | "double_drop"
  | "flash_event"
  | "global_message"
  | "maintenance";

export interface LiveOpsCampaign {
  id: string;
  name: string;
  type: CampaignType;
  startsAt: string | null; // ISO
  endsAt: string | null;   // ISO
  multiplier: number;      // 1 = neutro (usado para tipos multiplicadores)
  message: string;
  active: boolean;
  priority: number;        // 1 (alta) .. 5 (baixa)
  createdAt: string;
  updatedAt: string;
}

export interface LiveOpsAuditLog {
  id: string;
  date: string;
  admin: string;
  action: "create" | "update" | "toggle" | "delete";
  campaign: string;
  before: Partial<LiveOpsCampaign> | null;
  after: Partial<LiveOpsCampaign> | null;
  reason: string;
}

const STORAGE_KEY = "brhero_admin_liveops_v1";
const CURRENT_ADMIN = "GM.Root";

interface Store { campaigns: LiveOpsCampaign[]; logs: LiveOpsAuditLog[]; }

const now = () => new Date().toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();

export const CAMPAIGN_TYPE_LABEL: Record<CampaignType, string> = {
  double_xp: "Double XP",
  double_gold: "Double Gold",
  double_drop: "Double Drop",
  flash_event: "Evento Relâmpago",
  global_message: "Mensagem Global",
  maintenance: "Manutenção Programada",
};

export const CAMPAIGN_TYPES: CampaignType[] = [
  "double_xp", "double_gold", "double_drop",
  "flash_event", "global_message", "maintenance",
];

export const usesMultiplier = (t: CampaignType) =>
  t === "double_xp" || t === "double_gold" || t === "double_drop";

function seed(): LiveOpsCampaign[] {
  const t = now();
  return [
    { id: "LO-1", name: "Double XP Fim de Semana", type: "double_xp",
      startsAt: inDays(-1), endsAt: inDays(2), multiplier: 2, message: "XP em dobro!",
      active: true, priority: 2, createdAt: t, updatedAt: t },
    { id: "LO-2", name: "Copa Brasil", type: "flash_event",
      startsAt: inDays(3), endsAt: inDays(10), multiplier: 1, message: "Prepare-se para a Copa Brasil!",
      active: true, priority: 1, createdAt: t, updatedAt: t },
    { id: "LO-3", name: "Manutenção 08/07", type: "maintenance",
      startsAt: inDays(5), endsAt: inDays(5), multiplier: 1, message: "Servidores em manutenção das 03h às 05h.",
      active: false, priority: 3, createdAt: t, updatedAt: t },
  ];
}

function load(): Store {
  if (typeof window === "undefined") return { campaigns: seed(), logs: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch { /* ignore */ }
  const s: Store = { campaigns: seed(), logs: [] };
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

export function subscribeLiveOps(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function getCampaigns() { return store.campaigns; }
export function getLiveOpsLogs() { return store.logs; }

function pushLog(entry: Omit<LiveOpsAuditLog, "id" | "date" | "admin">) {
  store.logs = [
    { id: `L-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: now(), admin: CURRENT_ADMIN, ...entry },
    ...store.logs,
  ].slice(0, 500);
}

export interface CampaignInput {
  name: string;
  type: CampaignType;
  startsAt: string | null;
  endsAt: string | null;
  multiplier: number;
  message: string;
  active: boolean;
  priority: number;
}

export const liveOpsActions = {
  create(input: CampaignInput, reason: string) {
    guard("liveops", "create");
    const name = input.name.trim();
    if (!name) throw new Error("Nome vazio");
    const t = now();
    const created: LiveOpsCampaign = {
      id: `LO-${Date.now().toString(36)}`,
      name, type: input.type,
      startsAt: input.startsAt, endsAt: input.endsAt,
      multiplier: Math.max(1, input.multiplier),
      message: input.message, active: input.active,
      priority: Math.min(5, Math.max(1, input.priority)),
      createdAt: t, updatedAt: t,
    };
    store.campaigns = [created, ...store.campaigns];
    pushLog({ action: "create", campaign: name, before: null, after: created, reason });
    logAction({ module: "liveops", action: "create", target: name, before: null, after: created, reason });
    emit();
    return created;
  },
  update(id: string, input: CampaignInput, reason: string) {
    guard("liveops", "edit");
    const idx = store.campaigns.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const before = store.campaigns[idx];
    const after: LiveOpsCampaign = {
      ...before,
      name: input.name.trim() || before.name,
      type: input.type,
      startsAt: input.startsAt, endsAt: input.endsAt,
      multiplier: Math.max(1, input.multiplier),
      message: input.message, active: input.active,
      priority: Math.min(5, Math.max(1, input.priority)),
      updatedAt: now(),
    };
    store.campaigns = store.campaigns.map((c, i) => (i === idx ? after : c));
    pushLog({ action: "update", campaign: after.name, before, after, reason });
    logAction({ module: "liveops", action: "update", target: after.name, before, after, reason });
    emit();
  },
  toggle(id: string, reason: string) {
    guard("liveops", "edit");
    const idx = store.campaigns.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const before = store.campaigns[idx];
    const after: LiveOpsCampaign = { ...before, active: !before.active, updatedAt: now() };
    store.campaigns = store.campaigns.map((c, i) => (i === idx ? after : c));
    pushLog({ action: "toggle", campaign: after.name, before: { active: before.active }, after: { active: after.active }, reason });
    logAction({ module: "liveops", action: "toggle", target: after.name, before: { active: before.active }, after: { active: after.active }, reason });
    emit();
  },
  remove(id: string, reason: string) {
    guard("liveops", "delete");
    const target = store.campaigns.find((c) => c.id === id);
    if (!target) return;
    store.campaigns = store.campaigns.filter((c) => c.id !== id);
    pushLog({ action: "delete", campaign: target.name, before: target, after: null, reason });
    logAction({ module: "liveops", action: "delete", target: target.name, before: target, after: null, reason });
    emit();
  },
};


export type CampaignStatus = "active" | "scheduled" | "expired" | "inactive";

export function campaignStatus(c: LiveOpsCampaign): CampaignStatus {
  const t = Date.now();
  if (!c.active) return "inactive";
  if (c.startsAt && new Date(c.startsAt).getTime() > t) return "scheduled";
  if (c.endsAt && new Date(c.endsAt).getTime() < t) return "expired";
  return "active";
}
