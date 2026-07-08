// Mock store for Admin CMS - Shop module.
// Ainda não conectado a Supabase nem a pagamentos reais. Persiste em localStorage.
import { guard } from "./rbac";
import { logAction } from "./audit-central";


export type ShopItemType =
  | "gems" | "gold" | "chest" | "energy"
  | "pet" | "rune" | "skin" | "cosmetic" | "bundle";

export type ShopCurrency = "gems" | "gold" | "essence" | "brl";
export type ShopRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export interface ShopItem {
  id: string;
  name: string;
  type: ShopItemType;
  price: number;
  currency: ShopCurrency;
  quantity: number;       // estoque total; 0 = ilimitado
  perPlayerLimit: number; // >= 1
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  featured: boolean;
  rarity: ShopRarity;
  reward: string;         // descrição da recompensa entregue
  sold: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopAuditLog {
  id: string;
  date: string;
  admin: string;
  action: "create" | "update" | "toggle" | "delete";
  item: string;
  before: Partial<ShopItem> | null;
  after: Partial<ShopItem> | null;
  reason: string;
}

const STORAGE_KEY = "brhero_admin_shop_v1";
const CURRENT_ADMIN = "GM.Root";

interface Store { items: ShopItem[]; logs: ShopAuditLog[]; }

const now = () => new Date().toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();

export const SHOP_TYPE_LABEL: Record<ShopItemType, string> = {
  gems: "Cristais", gold: "Ouro", chest: "Baú", energy: "Energia/Chaves",
  pet: "Pet", rune: "Runa", skin: "Skin", cosmetic: "Cosmético", bundle: "Bundle",
};
export const SHOP_TYPES: ShopItemType[] = [
  "gems", "gold", "chest", "energy", "pet", "rune", "skin", "cosmetic", "bundle",
];

export const CURRENCY_LABEL: Record<ShopCurrency, string> = {
  gems: "Cristais", gold: "Ouro", essence: "Essência", brl: "R$ (BRL)",
};
export const CURRENCIES: ShopCurrency[] = ["gems", "gold", "essence", "brl"];

export const RARITY_LABEL: Record<ShopRarity, string> = {
  common: "Comum", uncommon: "Incomum", rare: "Raro",
  epic: "Épico", legendary: "Lendário", mythic: "Mítico",
};
export const RARITIES: ShopRarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];

function seed(): ShopItem[] {
  const t = now();
  return [
    { id: "S-1", name: "Pacote 500 Cristais", type: "gems", price: 990, currency: "brl",
      quantity: 0, perPlayerLimit: 99, startsAt: null, endsAt: null,
      active: true, featured: true, rarity: "epic", reward: "500 cristais",
      sold: 128, createdAt: t, updatedAt: t },
    { id: "S-2", name: "Baú Épico Semanal", type: "chest", price: 250, currency: "gems",
      quantity: 500, perPlayerLimit: 1, startsAt: inDays(-1), endsAt: inDays(6),
      active: true, featured: true, rarity: "legendary", reward: "1x Baú Épico",
      sold: 88, createdAt: t, updatedAt: t },
    { id: "S-3", name: "Skin Brasil", type: "skin", price: 1500, currency: "gems",
      quantity: 0, perPlayerLimit: 1, startsAt: inDays(3), endsAt: inDays(10),
      active: true, featured: false, rarity: "mythic", reward: "Skin Brasil (cosmético)",
      sold: 0, createdAt: t, updatedAt: t },
  ];
}

function load(): Store {
  if (typeof window === "undefined") return { items: seed(), logs: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch { /* ignore */ }
  const s: Store = { items: seed(), logs: [] };
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

export function subscribeShop(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function getShopItems() { return store.items; }
export function getShopLogs() { return store.logs; }

function pushLog(entry: Omit<ShopAuditLog, "id" | "date" | "admin">) {
  store.logs = [
    { id: `L-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: now(), admin: CURRENT_ADMIN, ...entry },
    ...store.logs,
  ].slice(0, 500);
}

export interface ShopInput {
  name: string;
  type: ShopItemType;
  price: number;
  currency: ShopCurrency;
  quantity: number;
  perPlayerLimit: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  featured: boolean;
  rarity: ShopRarity;
  reward: string;
}

const sanitize = (i: ShopInput): Omit<ShopItem, "id" | "sold" | "createdAt" | "updatedAt"> => ({
  name: i.name.trim(),
  type: i.type,
  price: Math.max(0, i.price),
  currency: i.currency,
  quantity: Math.max(0, i.quantity),
  perPlayerLimit: Math.max(1, i.perPlayerLimit),
  startsAt: i.startsAt,
  endsAt: i.endsAt,
  active: i.active,
  featured: i.featured,
  rarity: i.rarity,
  reward: i.reward.trim(),
});

export const shopActions = {
  create(input: ShopInput, reason: string) {
    guard("shop", "create");
    const base = sanitize(input);
    if (!base.name) throw new Error("Nome obrigatório");
    const t = now();
    const created: ShopItem = {
      id: `S-${Date.now().toString(36)}`,
      ...base, sold: 0, createdAt: t, updatedAt: t,
    };
    store.items = [created, ...store.items];
    pushLog({ action: "create", item: created.name, before: null, after: created, reason });
    logAction({ module: "shop", action: "create", target: created.name, before: null, after: created, reason });
    emit();
    return created;
  },
  update(id: string, input: ShopInput, reason: string) {
    guard("shop", "edit");
    const idx = store.items.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const before = store.items[idx];
    const base = sanitize(input);
    if (!base.name) throw new Error("Nome obrigatório");
    const after: ShopItem = { ...before, ...base, updatedAt: now() };
    store.items = store.items.map((c, i) => (i === idx ? after : c));
    pushLog({ action: "update", item: after.name, before, after, reason });
    logAction({ module: "shop", action: "update", target: after.name, before, after, reason });
    emit();
  },
  toggle(id: string, reason: string) {
    guard("shop", "edit");
    const idx = store.items.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const before = store.items[idx];
    const after: ShopItem = { ...before, active: !before.active, updatedAt: now() };
    store.items = store.items.map((c, i) => (i === idx ? after : c));
    pushLog({ action: "toggle", item: after.name, before: { active: before.active }, after: { active: after.active }, reason });
    logAction({ module: "shop", action: "toggle", target: after.name, before: { active: before.active }, after: { active: after.active }, reason });
    emit();
  },
  remove(id: string, reason: string) {
    guard("shop", "delete");
    const target = store.items.find((c) => c.id === id);
    if (!target) return;
    store.items = store.items.filter((c) => c.id !== id);
    pushLog({ action: "delete", item: target.name, before: target, after: null, reason });
    logAction({ module: "shop", action: "delete", target: target.name, before: target, after: null, reason });
    emit();
  },
};


export type ShopStatus = "active" | "scheduled" | "expired" | "inactive" | "sold_out";

export function shopStatus(c: ShopItem): ShopStatus {
  const t = Date.now();
  if (!c.active) return "inactive";
  if (c.quantity > 0 && c.sold >= c.quantity) return "sold_out";
  if (c.startsAt && new Date(c.startsAt).getTime() > t) return "scheduled";
  if (c.endsAt && new Date(c.endsAt).getTime() < t) return "expired";
  return "active";
}
