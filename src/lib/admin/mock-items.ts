// Mock store for Admin CMS - Items catalog module.
// Ainda não conectado a Supabase. Persiste em localStorage.

export type ItemType =
  | "equipment" | "pet" | "rune" | "skin" | "cosmetic"
  | "chest" | "title" | "frame" | "aura";

export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export interface ItemAttributes {
  atk?: number;
  def?: number;
  hp?: number;
  crit?: number;
  speed?: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  active: boolean;
  source: string;      // ex.: "Baú Épico", "Arena S1", "Loja BRL"
  dropRate: number;    // % (0..100)
  icon: string;        // emoji ou URL
  attributes: ItemAttributes;
  visualCategory: string; // apenas se cosmético (aura, moldura, etc.)
  createdAt: string;
  updatedAt: string;
}

export interface ItemAuditLog {
  id: string;
  date: string;
  admin: string;
  action: "create" | "update" | "toggle" | "delete";
  item: string;
  before: Partial<CatalogItem> | null;
  after: Partial<CatalogItem> | null;
  reason: string;
}

const STORAGE_KEY = "brhero_admin_items_v1";
const CURRENT_ADMIN = "GM.Root";

interface Store { items: CatalogItem[]; logs: ItemAuditLog[]; }

const now = () => new Date().toISOString();

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  equipment: "Equipamento", pet: "Pet", rune: "Runa", skin: "Skin",
  cosmetic: "Cosmético", chest: "Baú", title: "Título",
  frame: "Moldura", aura: "Aura",
};
export const ITEM_TYPES: ItemType[] = [
  "equipment", "pet", "rune", "skin", "cosmetic", "chest", "title", "frame", "aura",
];

export const RARITY_LABEL: Record<ItemRarity, string> = {
  common: "Comum", uncommon: "Incomum", rare: "Raro",
  epic: "Épico", legendary: "Lendário", mythic: "Mítico",
};
export const RARITIES: ItemRarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];

export const isCosmeticType = (t: ItemType) =>
  t === "skin" || t === "cosmetic" || t === "title" || t === "frame" || t === "aura";
export const hasAttributes = (t: ItemType) =>
  t === "equipment" || t === "pet" || t === "rune";

function seed(): CatalogItem[] {
  const t = now();
  return [
    { id: "I-1", name: "Espada do Cerrado", type: "equipment", rarity: "epic",
      description: "Lâmina forjada nas savanas do Cerrado.", active: true,
      source: "Baú Épico", dropRate: 5, icon: "⚔️",
      attributes: { atk: 240, crit: 12 }, visualCategory: "",
      createdAt: t, updatedAt: t },
    { id: "I-2", name: "Onça Pintada", type: "pet", rarity: "legendary",
      description: "Companheira ágil e feroz.", active: true,
      source: "Evento Copa Brasil", dropRate: 1, icon: "🐆",
      attributes: { atk: 80, speed: 10 }, visualCategory: "",
      createdAt: t, updatedAt: t },
    { id: "I-3", name: "Runa da Mata", type: "rune", rarity: "rare",
      description: "Recupera HP ao derrotar inimigos.", active: true,
      source: "Arena S1", dropRate: 8, icon: "🌿",
      attributes: { hp: 120, def: 20 }, visualCategory: "",
      createdAt: t, updatedAt: t },
    { id: "I-4", name: "Skin Brasil", type: "skin", rarity: "mythic",
      description: "Traje comemorativo verde-amarelo.", active: true,
      source: "Loja BRL", dropRate: 0, icon: "🇧🇷",
      attributes: {}, visualCategory: "Traje completo",
      createdAt: t, updatedAt: t },
    { id: "I-5", name: "Aura Lendária", type: "aura", rarity: "legendary",
      description: "Aura dourada em torno do herói.", active: true,
      source: "Código FUNDADOR", dropRate: 0, icon: "✨",
      attributes: {}, visualCategory: "Aura",
      createdAt: t, updatedAt: t },
    { id: "I-6", name: "Baú Épico", type: "chest", rarity: "epic",
      description: "Contém equipamentos épicos e cristais.", active: true,
      source: "Loja / Recompensas", dropRate: 0, icon: "📦",
      attributes: {}, visualCategory: "",
      createdAt: t, updatedAt: t },
    { id: "I-7", name: "Título: Herói do Brasil", type: "title", rarity: "legendary",
      description: "Título honorário para veteranos.", active: false,
      source: "Ranking Top 10", dropRate: 0, icon: "🏅",
      attributes: {}, visualCategory: "Nameplate",
      createdAt: t, updatedAt: t },
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

export function subscribeItems(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function getCatalogItems() { return store.items; }
export function getItemLogs() { return store.logs; }

function pushLog(entry: Omit<ItemAuditLog, "id" | "date" | "admin">) {
  store.logs = [
    { id: `L-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: now(), admin: CURRENT_ADMIN, ...entry },
    ...store.logs,
  ].slice(0, 500);
}

export interface ItemInput {
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  active: boolean;
  source: string;
  dropRate: number;
  icon: string;
  attributes: ItemAttributes;
  visualCategory: string;
}

const sanitize = (i: ItemInput): Omit<CatalogItem, "id" | "createdAt" | "updatedAt"> => ({
  name: i.name.trim(),
  type: i.type,
  rarity: i.rarity,
  description: i.description.trim(),
  active: i.active,
  source: i.source.trim(),
  dropRate: Math.min(100, Math.max(0, i.dropRate)),
  icon: i.icon.trim() || "❔",
  attributes: hasAttributes(i.type) ? { ...i.attributes } : {},
  visualCategory: isCosmeticType(i.type) ? i.visualCategory.trim() : "",
});

export const itemActions = {
  create(input: ItemInput, reason: string) {
    const base = sanitize(input);
    if (!base.name) throw new Error("Nome obrigatório");
    const t = now();
    const created: CatalogItem = {
      id: `I-${Date.now().toString(36)}`,
      ...base, createdAt: t, updatedAt: t,
    };
    store.items = [created, ...store.items];
    pushLog({ action: "create", item: created.name, before: null, after: created, reason });
    emit();
    return created;
  },
  update(id: string, input: ItemInput, reason: string) {
    const idx = store.items.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const before = store.items[idx];
    const base = sanitize(input);
    if (!base.name) throw new Error("Nome obrigatório");
    const after: CatalogItem = { ...before, ...base, updatedAt: now() };
    store.items = store.items.map((c, i) => (i === idx ? after : c));
    pushLog({ action: "update", item: after.name, before, after, reason });
    emit();
  },
  toggle(id: string, reason: string) {
    const idx = store.items.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const before = store.items[idx];
    const after: CatalogItem = { ...before, active: !before.active, updatedAt: now() };
    store.items = store.items.map((c, i) => (i === idx ? after : c));
    pushLog({
      action: "toggle", item: after.name,
      before: { active: before.active }, after: { active: after.active }, reason,
    });
    emit();
  },
  remove(id: string, reason: string) {
    const target = store.items.find((c) => c.id === id);
    if (!target) return;
    store.items = store.items.filter((c) => c.id !== id);
    pushLog({ action: "delete", item: target.name, before: target, after: null, reason });
    emit();
  },
};
