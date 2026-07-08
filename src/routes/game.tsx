import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Coins,
  Gem,
  Crown,
  Ticket,
  Calendar,
  Home,
  Sword,
  Shield,
  Heart,
  Zap,
  Flame,
  Target,
  Percent,
  Gauge,
  Droplet,
  ShieldPlus,
  Sparkles,
  Lock,
  ChevronUp,
  Trophy,
  Package,
  Users,
} from "lucide-react";
import heroSprite from "@/assets/sprite-hero.png";
import goblinSprite from "@/assets/sprite-goblin.png";
import slimeSprite from "@/assets/sprite-slime.png";
import skeletonSprite from "@/assets/sprite-skeleton.png";
import bossDragonSprite from "@/assets/sprite-boss-dragon.png";
import woodTexture from "@/assets/wood-texture.jpg";

// -------- Types --------
type AttrKey =
  | "atk"
  | "hp"
  | "regen"
  | "critDmg"
  | "critChance"
  | "atkSpeed"
  | "lifesteal"
  | "penetration"
  | "defense";

type Attr = { level: number };

type Rarity = "Comum" | "Raro" | "Épico" | "Lendário" | "Mítico" | "Divino";
type SlotKey = "sword" | "armor" | "helm" | "ring" | "amulet" | "boots";

type Item = {
  id: string;
  slot: SlotKey;
  name: string;
  rarity: Rarity;
  stars: number;
  level: number;
  bonus: { atk: number; hp: number; def: number };
};

type GlobalUpKey = "gold" | "atk" | "hp" | "xp" | "startStage" | "drop" | "crit";

type DailyState = {
  lastClaimDay: string | null; // "YYYY-MM-DD"
  cycleDay: number;            // 0..6 (próximo dia a reivindicar)
  streak: number;              // dias seguidos
  bestStreak: number;
  streakClaimed: number[];     // marcos já reivindicados
};

type FreeChestState = { lastFreeAt: number; lastRareAt: number };

// ===== Missões (Bloco 2 — Fase 2) =====
type MissionKind = "enemies" | "bosses" | "upgrades" | "chests" | "playMinutes";
type MissionReward = { gold: number; gems: number; essence: number; chest: 0 | 1 | 2 };
type Mission = {
  id: string;
  kind: MissionKind;
  goal: number;
  snapshot: number;   // valor do contador no momento da criação
  reward: MissionReward;
  claimed: boolean;
};
type MissionsState = {
  daily: Mission[];
  weekly: Mission[];
  dailyKey: string;
  weeklyKey: string;
};
type Counters = {
  enemies: number;
  bosses: number;
  upgrades: number;
  chests: number;
  playMs: number;
};

type SaveState = {
  level: number;
  xp: number;
  gold: number;
  gems: number;
  stage: number;
  attrs: Record<AttrKey, Attr>;
  equipment: Record<SlotKey, Item | null>;
  inventory: Item[];
  pvpWins: number;
  // Prestige / Rebirth
  essence: number;
  prestigeLevel: number;
  maxStage: number;
  globalUp: Record<GlobalUpKey, number>;
  // Retenção (Fase 2)
  daily: DailyState;
  freeChest: FreeChestState;
  lastSeenAt: number;
  // Missões (Fase 2 — Bloco 2)
  counters: Counters;
  missions: MissionsState;
  version: number;
};

const STORAGE_KEY = "hero-rise-idle-v4";
const SAVE_VERSION = 6;
const PRESTIGE_UNLOCK_STAGE = 75;

// ===== Retenção: tempo =====
const FREE_CHEST_MS = 4 * 60 * 60 * 1000;   // 4h
const RARE_CHEST_MS = 24 * 60 * 60 * 1000;  // 24h
const OFFLINE_MAX_MS = 8 * 60 * 60 * 1000;  // 8h
const STREAK_MILESTONES = [7, 14, 30, 60, 100] as const;

// ===== Missões =====
function weekKey(d = new Date()) {
  // ISO-week style YYYY-Www
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const MISSION_LABELS: Record<MissionKind, (n: number) => string> = {
  enemies: (n) => `Derrote ${n} inimigos`,
  bosses: (n) => `Derrote ${n} chefes`,
  upgrades: (n) => `Evolua ${n} atributos`,
  chests: (n) => `Abra ${n} baús`,
  playMinutes: (n) => `Jogue ${n} minutos`,
};
const MISSION_ICONS: Record<MissionKind, string> = {
  enemies: "⚔️", bosses: "👑", upgrades: "⬆️", chests: "📦", playMinutes: "⏱️",
};

type MissionSpec = { kind: MissionKind; base: number; scale: number };
const DAILY_POOL: MissionSpec[] = [
  { kind: "enemies", base: 30, scale: 3 },
  { kind: "bosses", base: 2, scale: 0.3 },
  { kind: "upgrades", base: 3, scale: 0.2 },
  { kind: "chests", base: 1, scale: 0.05 },
  { kind: "playMinutes", base: 10, scale: 0 },
];
const WEEKLY_POOL: MissionSpec[] = [
  { kind: "enemies", base: 300, scale: 20 },
  { kind: "bosses", base: 15, scale: 1.5 },
  { kind: "upgrades", base: 25, scale: 1 },
  { kind: "chests", base: 8, scale: 0.3 },
  { kind: "playMinutes", base: 60, scale: 0 },
];

function counterOf(c: Counters, k: MissionKind): number {
  if (k === "playMinutes") return Math.floor(c.playMs / 60000);
  return c[k];
}

function makeMission(spec: MissionSpec, stage: number, counters: Counters, weekly: boolean): Mission {
  const goal = Math.max(1, Math.floor(spec.base + spec.scale * stage));
  const mult = weekly ? 10 : 1;
  return {
    id: `${spec.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind: spec.kind,
    goal,
    snapshot: counterOf(counters, spec.kind),
    reward: weekly
      ? { gold: goal * 20, gems: 15 + Math.floor(goal / 20), essence: 2, chest: 2 }
      : { gold: goal * 8,  gems: 5 + Math.floor(goal / 20), essence: 0, chest: goal >= 5 ? 1 : 0 },
    claimed: false,
  };
}

function pickN<T>(arr: T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

function generateDaily(stage: number, counters: Counters): Mission[] {
  const n = 3 + Math.floor(Math.random() * 3); // 3..5
  return pickN(DAILY_POOL, Math.min(n, DAILY_POOL.length)).map((s) => makeMission(s, stage, counters, false));
}
function generateWeekly(stage: number, counters: Counters): Mission[] {
  return pickN(WEEKLY_POOL, 4).map((s) => makeMission(s, stage, counters, true));
}
function emptyCounters(): Counters {
  return { enemies: 0, bosses: 0, upgrades: 0, chests: 0, playMs: 0 };
}
function emptyMissions(): MissionsState {
  return { daily: [], weekly: [], dailyKey: "", weeklyKey: "" };
}

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = Date.UTC(ay, am - 1, ad);
  const db = Date.UTC(by, bm - 1, bd);
  return Math.round((db - da) / 86400000);
}

// Recompensas do ciclo diário (7 dias). Escalam com stage/prestige.
type DailyReward =
  | { kind: "gold"; label: string; icon: string; amount: (s: SaveState) => number }
  | { kind: "gems"; label: string; icon: string; amount: (s: SaveState) => number }
  | { kind: "chest"; label: string; icon: string; tier: "common" | "epic" | "legendary" }
  | { kind: "essence"; label: string; icon: string; amount: (s: SaveState) => number };

const DAILY_CYCLE: DailyReward[] = [
  { kind: "gold",    label: "Ouro",           icon: "🪙", amount: (s) => 200 + s.stage * 30 },
  { kind: "gems",    label: "Cristais",       icon: "💎", amount: () => 15 },
  { kind: "chest",   label: "Baú Comum",      icon: "📦", tier: "common" },
  { kind: "gold",    label: "Ouro em Dobro",  icon: "🪙", amount: (s) => 500 + s.stage * 60 },
  { kind: "chest",   label: "Baú Épico",      icon: "🎁", tier: "epic" },
  { kind: "gems",    label: "Cristais+",      icon: "💎", amount: () => 40 },
  { kind: "chest",   label: "Baú Lendário",   icon: "👑", tier: "legendary" },
];

function streakRewardFor(day: number) {
  // Escalonamento: gold + gems + (essência a partir de 30)
  return {
    gold: 500 * day,
    gems: 20 + day * 2,
    essence: day >= 30 ? Math.floor(day / 10) : 0,
  };
}

const SLOTS: Array<{ key: SlotKey; label: string; emoji: string }> = [
  { key: "sword", label: "Espada", emoji: "⚔️" },
  { key: "armor", label: "Armadura", emoji: "🛡️" },
  { key: "helm", label: "Capacete", emoji: "⛑️" },
  { key: "ring", label: "Anel", emoji: "💍" },
  { key: "amulet", label: "Amuleto", emoji: "📿" },
  { key: "boots", label: "Botas", emoji: "🥾" },
];

const RARITIES: Array<{ name: Rarity; mult: number; chance: number; color: string }> = [
  { name: "Comum", mult: 1, chance: 0.5, color: "text-slate-300 border-slate-600" },
  { name: "Raro", mult: 1.8, chance: 0.25, color: "text-sky-300 border-sky-500/60" },
  { name: "Épico", mult: 3, chance: 0.14, color: "text-fuchsia-300 border-fuchsia-500/60" },
  { name: "Lendário", mult: 5, chance: 0.07, color: "text-amber-300 border-amber-400/70" },
  { name: "Mítico", mult: 8, chance: 0.03, color: "text-rose-300 border-rose-400/70" },
  { name: "Divino", mult: 14, chance: 0.01, color: "text-emerald-300 border-emerald-300/80" },
];

function rollRarity(): Rarity {
  const r = Math.random();
  let acc = 0;
  for (const rr of RARITIES) {
    acc += rr.chance;
    if (r <= acc) return rr.name;
  }
  return "Comum";
}

function rollItem(slot: SlotKey, stage: number): Item {
  const rarity = rollRarity();
  const mult = RARITIES.find((r) => r.name === rarity)!.mult;
  const base = 5 + stage * 2;
  const slotInfo = SLOTS.find((s) => s.key === slot)!;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slot,
    name: `${slotInfo.label}`,
    rarity,
    stars: 1 + Math.floor(Math.random() * 3),
    level: 1,
    bonus: {
      atk: slot === "sword" ? Math.floor(base * mult) : Math.floor(base * mult * 0.15),
      hp: slot === "amulet" || slot === "armor" ? Math.floor(base * mult * 5) : Math.floor(base * mult),
      def: slot === "armor" || slot === "helm" ? Math.floor(base * mult) : Math.floor(base * mult * 0.2),
    },
  };
}

function emptyEquipment(): Record<SlotKey, Item | null> {
  return { sword: null, armor: null, helm: null, ring: null, amulet: null, boots: null };
}

function equipmentBonus(eq: Record<SlotKey, Item | null>) {
  let atk = 0, hp = 0, def = 0;
  for (const k of Object.keys(eq) as SlotKey[]) {
    const i = eq[k];
    if (!i) continue;
    atk += i.bonus.atk;
    hp += i.bonus.hp;
    def += i.bonus.def;
  }
  return { atk, hp, def };
}


// -------- Attribute definitions --------
const ATTR_DEFS: Record<
  AttrKey,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    unit?: string;
    base: number;
    inc: number;
    costBase: number;
    costMul: number;
    format?: (v: number) => string;
  }
> = {
  atk: {
    label: "ATK",
    icon: <Sword className="h-4 w-4" />,
    color: "text-rose-400",
    base: 12,
    inc: 6,
    costBase: 40,
    costMul: 1.11,
  },
  hp: {
    label: "HP",
    icon: <Heart className="h-4 w-4" />,
    color: "text-emerald-400",
    base: 120,
    inc: 30,
    costBase: 45,
    costMul: 1.11,
  },
  regen: {
    label: "Regeneração",
    icon: <ShieldPlus className="h-4 w-4" />,
    color: "text-lime-400",
    base: 1,
    inc: 1,
    costBase: 60,
    costMul: 1.13,
    format: (v) => `${v}/s`,
  },
  critDmg: {
    label: "Dano Crítico",
    icon: <Flame className="h-4 w-4" />,
    color: "text-orange-400",
    base: 150,
    inc: 10,
    costBase: 80,
    costMul: 1.14,
    format: (v) => `${v}%`,
  },
  critChance: {
    label: "Chance Crítica",
    icon: <Target className="h-4 w-4" />,
    color: "text-amber-400",
    base: 5,
    inc: 1,
    costBase: 120,
    costMul: 1.16,
    format: (v) => `${Math.min(80, v)}%`,
  },
  atkSpeed: {
    label: "Vel. de Ataque",
    icon: <Gauge className="h-4 w-4" />,
    color: "text-sky-400",
    base: 100,
    inc: 4,
    costBase: 100,
    costMul: 1.15,
    format: (v) => `${(v / 100).toFixed(2)}x`,
  },
  lifesteal: {
    label: "Roubo de Vida",
    icon: <Droplet className="h-4 w-4" />,
    color: "text-red-400",
    base: 0,
    inc: 1,
    costBase: 140,
    costMul: 1.17,
    format: (v) => `${Math.min(60, v)}%`,
  },
  penetration: {
    label: "Penetração",
    icon: <Zap className="h-4 w-4" />,
    color: "text-fuchsia-400",
    base: 0,
    inc: 2,
    costBase: 90,
    costMul: 1.14,
  },
  defense: {
    label: "Defesa",
    icon: <Shield className="h-4 w-4" />,
    color: "text-slate-300",
    base: 5,
    inc: 2,
    costBase: 55,
    costMul: 1.12,
  },
};

const ATTR_ORDER: AttrKey[] = [
  "atk",
  "hp",
  "regen",
  "critDmg",
  "critChance",
  "atkSpeed",
  "lifesteal",
  "penetration",
  "defense",
];

function attrValue(key: AttrKey, level: number) {
  const d = ATTR_DEFS[key];
  return d.base + d.inc * level;
}
function attrCost(key: AttrKey, level: number) {
  const d = ATTR_DEFS[key];
  // Soft-cap: costMul aplicado só até level 80; depois cresce a taxa reduzida
  // para manter upgrades viáveis até late game (Lv 200-500).
  const capped = Math.min(level, 80);
  const overflow = Math.max(0, level - 80);
  return Math.floor(d.costBase * Math.pow(d.costMul, capped) * Math.pow(1.055, overflow));
}
function fmt(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return `${Math.floor(n)}`;
}

// -------- Progression / unlocks --------
const UNLOCKS: Array<{ level: number; label: string; icon: React.ReactNode }> = [
  { level: 3, label: "Equipamentos", icon: <Shield className="h-3 w-3" /> },
  { level: 5, label: "Habilidades", icon: <Sparkles className="h-3 w-3" /> },
  { level: 10, label: "Dungeon", icon: <Trophy className="h-3 w-3" /> },
  { level: 15, label: "Pets", icon: <Package className="h-3 w-3" /> },
  { level: 20, label: "Bênçãos", icon: <ShieldPlus className="h-3 w-3" /> },
  { level: 25, label: "Guilda", icon: <Users className="h-3 w-3" /> },
  { level: 30, label: "Arena PvP", icon: <Sword className="h-3 w-3" /> },
  { level: 40, label: "Eventos", icon: <Calendar className="h-3 w-3" /> },
  { level: 50, label: "Multiplayer", icon: <Crown className="h-3 w-3" /> },
];

const SKILLS = [
  { name: "Ataque", unlock: 1 },
  { name: "Golpe", unlock: 5 },
  { name: "Fúria", unlock: 20 },
  { name: "Ultimate", unlock: 40 },
];

// Biomes by stage
function biomeFor(stage: number) {
  const list = [
    { name: "Floresta", bg: "from-emerald-900 via-emerald-800 to-emerald-950", ground: "bg-emerald-950" },
    { name: "Caverna", bg: "from-slate-800 via-slate-900 to-black", ground: "bg-slate-950" },
    { name: "Deserto", bg: "from-amber-700 via-amber-800 to-orange-950", ground: "bg-amber-950" },
    { name: "Vulcão", bg: "from-red-800 via-orange-900 to-black", ground: "bg-red-950" },
    { name: "Castelo", bg: "from-indigo-800 via-slate-800 to-slate-950", ground: "bg-indigo-950" },
    { name: "Inferno", bg: "from-rose-900 via-red-950 to-black", ground: "bg-rose-950" },
    { name: "Céu", bg: "from-sky-500 via-indigo-600 to-indigo-900", ground: "bg-indigo-800" },
  ];
  const idx = Math.min(list.length - 1, Math.floor((stage - 1) / 10));
  return list[idx];
}

// XP curve
function xpForLevel(level: number) {
  return Math.floor(30 * Math.pow(level, 1.55));
}

// Enemy for stage — smooth curve tuned for Lv 1-500+
// Uses tiered growth: linear + soft exponential so late-game stays challenging
// but not impossible; gold scales in lockstep so upgrade costs remain viable.
function enemyForStage(stage: number) {
  const isBoss = stage % 10 === 0;
  const mult = isBoss ? 3.5 : 1;
  const expo = Math.pow(1.045, stage); // ~1.045^stage soft exponential
  const hp = Math.floor((60 + stage * 25) * expo * mult);
  const atk = Math.floor((5 + stage * 2) * Math.pow(1.035, stage) * mult);
  const def = Math.floor(2 + stage * 0.6);
  const gold = Math.floor((8 + stage * 5) * Math.pow(1.042, stage) * (isBoss ? 5 : 1));
  const xp = Math.floor((14 + stage * 4) * (isBoss ? 5 : 1));
  const gems = isBoss ? Math.max(1, Math.floor(stage / 10)) : 0;
  return { hp, atk, def, gold, xp, gems, isBoss };
}

// ==== Prestige / Rebirth ====
const GLOBAL_UP_DEFS: Record<GlobalUpKey, { label: string; icon: string; perLevel: number; costBase: number; costMul: number; max: number; suffix?: string }> = {
  gold:       { label: "Ouro Global",    icon: "🪙", perLevel: 0.10, costBase: 1, costMul: 1.6, max: 50, suffix: "%" },
  atk:        { label: "ATK Global",     icon: "⚔️", perLevel: 0.08, costBase: 2, costMul: 1.7, max: 50, suffix: "%" },
  hp:         { label: "HP Global",      icon: "❤️", perLevel: 0.08, costBase: 2, costMul: 1.7, max: 50, suffix: "%" },
  xp:         { label: "XP Global",      icon: "✨", perLevel: 0.10, costBase: 1, costMul: 1.6, max: 40, suffix: "%" },
  startStage: { label: "Estágio Inicial",icon: "🚀", perLevel: 5,    costBase: 3, costMul: 2.0, max: 40, suffix: " estágios" },
  drop:       { label: "Drop Global",    icon: "📦", perLevel: 0.05, costBase: 2, costMul: 1.7, max: 30, suffix: "%" },
  crit:       { label: "Crítico Global", icon: "💥", perLevel: 0.03, costBase: 2, costMul: 1.7, max: 30, suffix: "%" },
};

function emptyGlobalUp(): Record<GlobalUpKey, number> {
  return { gold: 0, atk: 0, hp: 0, xp: 0, startStage: 0, drop: 0, crit: 0 };
}

function globalUpCost(key: GlobalUpKey, level: number) {
  const d = GLOBAL_UP_DEFS[key];
  return Math.ceil(d.costBase * Math.pow(d.costMul, level));
}

// Essence earned by rebirth. Curve: sqrt-based so early prestiges reward, later scale.
function essenceForRebirth(stage: number) {
  if (stage < PRESTIGE_UNLOCK_STAGE) return 0;
  return Math.floor(Math.pow((stage - PRESTIGE_UNLOCK_STAGE) / 20 + 1, 1.4));
}

// ==== Crystal packs (MOCK: sem cobrança real; Stripe/Play depois) ====
type CrystalPack = { id: string; gems: number; bonus: number; priceBRL: number; tag?: string };
const CRYSTAL_PACKS: CrystalPack[] = [
  { id: "starter",  gems: 80,   bonus: 0,   priceBRL: 4.90 },
  { id: "popular",  gems: 250,  bonus: 50,  priceBRL: 14.90, tag: "popular" },
  { id: "big",      gems: 600,  bonus: 200, priceBRL: 29.90, tag: "melhor valor" },
  { id: "whale",    gems: 1500, bonus: 800, priceBRL: 69.90, tag: "mega bônus" },
];

function defaultSave(): SaveState {
  return {
    level: 1,
    xp: 0,
    gold: 0,
    gems: 10,
    stage: 1,
    attrs: Object.fromEntries(ATTR_ORDER.map((k) => [k, { level: 0 }])) as Record<AttrKey, Attr>,
    equipment: emptyEquipment(),
    inventory: [],
    pvpWins: 0,
    essence: 0,
    prestigeLevel: 0,
    maxStage: 1,
    globalUp: emptyGlobalUp(),
    daily: { lastClaimDay: null, cycleDay: 0, streak: 0, bestStreak: 0, streakClaimed: [] },
    freeChest: { lastFreeAt: 0, lastRareAt: 0 },
    lastSeenAt: Date.now(),
    counters: emptyCounters(),
    missions: emptyMissions(),
    version: SAVE_VERSION,
  };
}

function loadSave(): SaveState {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    // Version bump wipes old saves during beta rebalance
    if (parsed.version !== SAVE_VERSION) return defaultSave();
    const base = defaultSave();
    const merged: SaveState = {
      ...base,
      ...parsed,
      attrs: { ...base.attrs, ...(parsed.attrs ?? {}) } as Record<AttrKey, Attr>,
      equipment: { ...emptyEquipment(), ...(parsed.equipment ?? {}) },
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      globalUp: { ...emptyGlobalUp(), ...(parsed.globalUp ?? {}) },
      daily: { ...base.daily, ...(parsed.daily ?? {}), streakClaimed: Array.isArray(parsed.daily?.streakClaimed) ? parsed.daily.streakClaimed : [] },
      freeChest: { ...base.freeChest, ...(parsed.freeChest ?? {}) },
      lastSeenAt: typeof parsed.lastSeenAt === "number" ? parsed.lastSeenAt : Date.now(),
      counters: { ...emptyCounters(), ...(parsed.counters ?? {}) },
      missions: {
        ...emptyMissions(),
        ...(parsed.missions ?? {}),
        daily: Array.isArray(parsed.missions?.daily) ? parsed.missions.daily : [],
        weekly: Array.isArray(parsed.missions?.weekly) ? parsed.missions.weekly : [],
      },
    };
    for (const k of ATTR_ORDER) {
      if (!merged.attrs[k]) merged.attrs[k] = { level: 0 };
    }
    return merged;
  } catch {
    return defaultSave();
  }
}

// -------- Route --------
export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "BRHero — O 1º RPG IDLE Brasileiro" },
      {
        name: "description",
        content:
          "Idle RPG mobile vertical. Batalha automática, evolução constante de atributos e progressão viciante.",
      },
      { property: "og:title", content: "BRHero — O 1º RPG IDLE Brasileiro" },
      {
        property: "og:description",
        content: "Idle RPG mobile. Suba de nível, colete ouro e derrote chefes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
    ],
  }),
  component: GamePage,
});

// -------- Combat state (refs, not React state, for perf) --------
type DamageNumber = {
  id: number;
  x: number;
  y: number;
  value: string;
  crit: boolean;
  from: "hero" | "enemy";
};

function GamePage() {
  const [save, setSave] = useState<SaveState | null>(null);
  const saveRef = useRef<SaveState | null>(null);
  const [heroHp, setHeroHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const enemyRef = useRef<ReturnType<typeof enemyForStage> | null>(null);
  const heroHpRef = useRef(0);
  const enemyHpRef = useRef(0);
  const heroCdRef = useRef(0);
  const enemyCdRef = useRef(0);
  const regenAccRef = useRef(0);
  const [damages, setDamages] = useState<DamageNumber[]>([]);
  const dmgIdRef = useRef(1);
  const [heroHit, setHeroHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [enemyDying, setEnemyDying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [levelFlash, setLevelFlash] = useState(false);
  const [bgCache, setBgCache] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<"equip" | "arena" | "store" | "rebirth" | "crystals" | "daily" | null>(null);
  const [offlineReport, setOfflineReport] = useState<{ ms: number; gold: number; xp: number; drops: number } | null>(null);
  const prevLevelRef = useRef(1);


  // Init
  useEffect(() => {
    const s = loadSave();
    // ==== Recompensas Offline ====
    const now = Date.now();
    const elapsed = Math.max(0, Math.min(OFFLINE_MAX_MS, now - (s.lastSeenAt ?? now)));
    if (elapsed > 60_000) {
      // Aproximação: 1 batalha ~ 2s no estágio atual
      const battles = Math.floor(elapsed / 2000);
      const enemy = enemyForStage(s.stage);
      const goldMul = 1 + (s.globalUp?.gold ?? 0) * GLOBAL_UP_DEFS.gold.perLevel;
      const xpMul = 1 + (s.globalUp?.xp ?? 0) * GLOBAL_UP_DEFS.xp.perLevel;
      const gold = Math.floor(battles * enemy.gold * 0.4 * goldMul);
      const xp = Math.floor(battles * enemy.xp * 0.4 * xpMul);
      const drops = Math.min(20, Math.floor(battles * 0.02));
      s.gold += gold;
      s.xp += xp;
      // Level up
      while (s.xp >= xpForLevel(s.level)) { s.xp -= xpForLevel(s.level); s.level += 1; }
      for (let i = 0; i < drops; i++) {
        const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)].key;
        s.inventory = [...s.inventory, rollItem(slot, s.stage)].slice(-60);
      }
      s.lastSeenAt = now;
      setOfflineReport({ ms: elapsed, gold, xp, drops });
    } else {
      s.lastSeenAt = now;
    }
    // ==== Rotação de missões ====
    const dk = todayKey();
    const wk = weekKey();
    if (s.missions.dailyKey !== dk || s.missions.daily.length === 0) {
      s.missions = { ...s.missions, daily: generateDaily(s.stage, s.counters), dailyKey: dk };
    }
    if (s.missions.weeklyKey !== wk || s.missions.weekly.length === 0) {
      s.missions = { ...s.missions, weekly: generateWeekly(s.stage, s.counters), weeklyKey: wk };
    }
    setSave(s);
    saveRef.current = s;
    const stats = computeStats(s);
    heroHpRef.current = stats.hp;
    setHeroHp(stats.hp);
    const e = enemyForStage(s.stage);
    enemyRef.current = e;
    enemyHpRef.current = e.hp;
    setEnemyHp(e.hp);
    prevLevelRef.current = s.level;
  }, []);

  // Marca "visto agora" a cada 30s, contabiliza playtime e checa rotação de missões
  useEffect(() => {
    const iv = setInterval(() => {
      setSave((p) => {
        if (!p) return p;
        const dk = todayKey();
        const wk = weekKey();
        let missions = p.missions;
        if (missions.dailyKey !== dk) {
          missions = { ...missions, daily: generateDaily(p.stage, p.counters), dailyKey: dk };
        }
        if (missions.weeklyKey !== wk) {
          missions = { ...missions, weekly: generateWeekly(p.stage, p.counters), weeklyKey: wk };
        }
        return {
          ...p,
          lastSeenAt: Date.now(),
          counters: { ...p.counters, playMs: p.counters.playMs + 30_000 },
          missions,
        };
      });
    }, 30_000);
    const onHide = () => {
      const cur = saveRef.current;
      if (!cur) return;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, lastSeenAt: Date.now() })); } catch {}
    };
    window.addEventListener("beforeunload", onHide);
    window.addEventListener("visibilitychange", onHide);
    return () => { clearInterval(iv); window.removeEventListener("beforeunload", onHide); window.removeEventListener("visibilitychange", onHide); };
  }, []);

  // Persist (debounced-ish via effect on save)
  useEffect(() => {
    if (save) {
      saveRef.current = save;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
      } catch {}
    }
  }, [save]);

  // Level up detection
  useEffect(() => {
    if (!save) return;
    if (save.level > prevLevelRef.current) {
      setLevelFlash(true);
      setTimeout(() => setLevelFlash(false), 900);
      const newly = UNLOCKS.find(
        (u) => u.level > prevLevelRef.current && u.level <= save.level,
      );
      if (newly) flashToast(`🎉 Desbloqueado: ${newly.label}`);
      prevLevelRef.current = save.level;
    }
  }, [save?.level]);

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  // Combat loop
  useEffect(() => {
    if (!save) return;
    const TICK = 100; // ms
    const interval = setInterval(() => {
      const s = saveRef.current;
      if (!s) return;
      const stats = computeStats(s);
      const enemy = enemyRef.current;
      if (!enemy) return;

      // Regen
      regenAccRef.current += TICK;
      if (regenAccRef.current >= 1000) {
        regenAccRef.current = 0;
        if (heroHpRef.current > 0 && heroHpRef.current < stats.hp) {
          heroHpRef.current = Math.min(stats.hp, heroHpRef.current + stats.regen);
          setHeroHp(heroHpRef.current);
        }
      }

      // Hero attack
      heroCdRef.current -= TICK;
      const heroInterval = 1000 / (stats.atkSpeed / 100);
      if (heroCdRef.current <= 0 && enemyHpRef.current > 0 && heroHpRef.current > 0) {
        heroCdRef.current = heroInterval;
        const crit = Math.random() * 100 < Math.min(80, stats.critChance);
        const effDef = Math.max(0, enemy.def - stats.penetration);
        let dmg = Math.max(1, stats.atk - effDef);
        if (crit) dmg = Math.floor(dmg * (stats.critDmg / 100));
        dmg = Math.floor(dmg * (0.92 + Math.random() * 0.16));
        enemyHpRef.current = Math.max(0, enemyHpRef.current - dmg);
        setEnemyHp(enemyHpRef.current);
        setEnemyHit(true);
        setTimeout(() => setEnemyHit(false), 120);
        spawnDamage(dmg, crit, "hero");
        // lifesteal
        if (stats.lifesteal > 0) {
          const heal = Math.floor((dmg * Math.min(60, stats.lifesteal)) / 100);
          if (heal > 0) {
            heroHpRef.current = Math.min(stats.hp, heroHpRef.current + heal);
            setHeroHp(heroHpRef.current);
          }
        }
      }

      // Enemy attack
      enemyCdRef.current -= TICK;
      if (enemyCdRef.current <= 0 && heroHpRef.current > 0 && enemyHpRef.current > 0) {
        enemyCdRef.current = 1400;
        let dmg = Math.max(1, enemy.atk - stats.defense);
        dmg = Math.floor(dmg * (0.92 + Math.random() * 0.16));
        heroHpRef.current = Math.max(0, heroHpRef.current - dmg);
        setHeroHp(heroHpRef.current);
        setHeroHit(true);
        setTimeout(() => setHeroHit(false), 120);
        spawnDamage(dmg, false, "enemy");
      }

      // Enemy killed
      if (enemyHpRef.current <= 0) {
        setEnemyDying(true);
        setTimeout(() => setEnemyDying(false), 250);
        onEnemyKilled();
      }

      // Hero died — respawn with full hp, retreat 1 stage (min 1)
      if (heroHpRef.current <= 0) {
        const cur = saveRef.current;
        if (cur) {
          const newStage = Math.max(1, cur.stage - 1);
          const next = { ...cur, stage: newStage };
          setSave(next);
          saveRef.current = next;
        }
        respawn();
      }
    }, TICK);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save !== null]);

  const spawnDamage = (value: number, crit: boolean, from: "hero" | "enemy") => {
    const id = dmgIdRef.current++;
    const d: DamageNumber = {
      id,
      x: from === "hero" ? 60 + Math.random() * 20 : 20 + Math.random() * 20,
      y: 30 + Math.random() * 20,
      value: fmt(value),
      crit,
      from,
    };
    setDamages((prev) => [...prev.slice(-12), d]);
    setTimeout(() => {
      setDamages((prev) => prev.filter((x) => x.id !== id));
    }, 900);
  };

  const respawn = () => {
    const s = saveRef.current;
    if (!s) return;
    const stats = computeStats(s);
    heroHpRef.current = stats.hp;
    setHeroHp(stats.hp);
    const e = enemyForStage(s.stage);
    enemyRef.current = e;
    enemyHpRef.current = e.hp;
    setEnemyHp(e.hp);
    heroCdRef.current = 200;
    enemyCdRef.current = 700;
  };

  const onEnemyKilled = () => {
    const cur = saveRef.current;
    if (!cur) return;
    const enemy = enemyRef.current;
    if (!enemy) return;
    // Global prestige bonuses
    const goldMul = 1 + (cur.globalUp?.gold ?? 0) * GLOBAL_UP_DEFS.gold.perLevel;
    const xpMul = 1 + (cur.globalUp?.xp ?? 0) * GLOBAL_UP_DEFS.xp.perLevel;
    const gainedGold = Math.floor(enemy.gold * goldMul);
    const gainedXp = Math.floor(enemy.xp * xpMul);
    let level = cur.level;
    let xp = cur.xp + gainedXp;
    while (xp >= xpForLevel(level)) {
      xp -= xpForLevel(level);
      level += 1;
    }
    const canDrop = level >= 3 || cur.level >= 3;
    const dropBonus = (cur.globalUp?.drop ?? 0) * GLOBAL_UP_DEFS.drop.perLevel;
    const drop = canDrop && (enemy.isBoss || Math.random() < 0.12 + dropBonus)
      ? rollItem(SLOTS[Math.floor(Math.random() * SLOTS.length)].key, cur.stage)
      : null;
    if (drop) flashToast(`📦 ${drop.rarity} ${SLOTS.find(s => s.key === drop.slot)!.label}`);
    const nextStage = cur.stage + 1;
    const next: SaveState = {
      ...cur,
      xp,
      level,
      gold: cur.gold + gainedGold,
      gems: cur.gems + enemy.gems,
      stage: nextStage,
      maxStage: Math.max(cur.maxStage ?? 1, nextStage),
      inventory: drop ? [...cur.inventory, drop].slice(-60) : cur.inventory,
      counters: {
        ...cur.counters,
        enemies: cur.counters.enemies + 1,
        bosses: cur.counters.bosses + (enemy.isBoss ? 1 : 0),
      },
    };
    setSave(next);
    saveRef.current = next;

    const e = enemyForStage(next.stage);
    enemyRef.current = e;
    enemyHpRef.current = e.hp;
    setEnemyHp(e.hp);
    heroCdRef.current = 300;
    enemyCdRef.current = 900;
  };

  const upgrade = (key: AttrKey) => {
    setSave((prev) => {
      if (!prev) return prev;
      const cost = attrCost(key, prev.attrs[key].level);
      if (prev.gold < cost) {
        flashToast("Ouro insuficiente");
        return prev;
      }
      const next: SaveState = {
        ...prev,
        gold: prev.gold - cost,
        attrs: {
          ...prev.attrs,
          [key]: { level: prev.attrs[key].level + 1 },
        },
      };
      saveRef.current = next;
      // if hp upgraded, keep ratio
      if (key === "hp") {
        const oldStats = computeStats(prev);
        const newStats = computeStats(next);
        const ratio = heroHpRef.current / oldStats.hp;
        heroHpRef.current = Math.floor(newStats.hp * ratio) + (newStats.hp - oldStats.hp);
        heroHpRef.current = Math.min(newStats.hp, heroHpRef.current);
        setHeroHp(heroHpRef.current);
      }
      return next;
    });
  };

  const equipItem = (item: Item) => {
    setSave((prev) => {
      if (!prev) return prev;
      const current = prev.equipment[item.slot];
      const equipment = { ...prev.equipment, [item.slot]: item };
      const inventory = prev.inventory.filter((i) => i.id !== item.id);
      if (current) inventory.push(current);
      return { ...prev, equipment, inventory };
    });
  };

  const unequipItem = (slot: SlotKey) => {
    setSave((prev) => {
      if (!prev || !prev.equipment[slot]) return prev;
      const item = prev.equipment[slot]!;
      return {
        ...prev,
        equipment: { ...prev.equipment, [slot]: null },
        inventory: [...prev.inventory, item],
      };
    });
  };

  const sellItem = (id: string) => {
    setSave((prev) => {
      if (!prev) return prev;
      const item = prev.inventory.find((i) => i.id === id);
      if (!item) return prev;
      const gain = Math.floor(50 * (RARITIES.find((r) => r.name === item.rarity)?.mult ?? 1));
      flashToast(`+${fmt(gain)} 🪙`);
      return {
        ...prev,
        gold: prev.gold + gain,
        inventory: prev.inventory.filter((i) => i.id !== id),
      };
    });
  };

  const doPvp = () => {
    setSave((prev) => {
      if (!prev) return prev;
      // simulated: 65% win based on our power vs random opponent power
      const s = computeStats(prev);
      const our = s.atk * 3 + s.hp + s.defense * 2;
      const opp = our * (0.7 + Math.random() * 0.6);
      const win = our >= opp;
      const reward = win ? { gold: 500 + prev.level * 40, gems: 3 } : { gold: 100, gems: 1 };
      flashToast(win ? `🏆 Vitória! +${reward.gems}💎` : "😞 Derrota — mas ganhou consolação");
      return {
        ...prev,
        gold: prev.gold + reward.gold,
        gems: prev.gems + reward.gems,
        pvpWins: prev.pvpWins + (win ? 1 : 0),
      };
    });
  };

  // ==== Store: pay-to-fast (never pay-to-win) ====
  const buyStoreItem = useCallback((id: string) => {
    setSave((prev) => {
      if (!prev) return prev;
      const pack = STORE_ITEMS.find((p) => p.id === id);
      if (!pack) return prev;
      if (prev.gems < pack.cost) {
        flashToast("💎 Cristais insuficientes");
        return prev;
      }
      let next: SaveState = { ...prev, gems: prev.gems - pack.cost };
      switch (pack.kind) {
        case "gold": {
          // convert gems → gold based on current stage (scales so it stays useful)
          const gold = pack.amount * (10 + next.stage * 3);
          next = { ...next, gold: next.gold + gold };
          flashToast(`+${fmt(gold)} 🪙`);
          break;
        }
        case "chest": {
          // random equipment for a random slot at current stage
          const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)].key;
          const item = rollItem(slot, next.stage);
          next = { ...next, inventory: [...next.inventory, item].slice(-60) };
          flashToast(`📦 ${item.rarity} ${SLOTS.find((s) => s.key === slot)!.label}`);
          break;
        }
        case "heal": {
          const stats = computeStats(next);
          heroHpRef.current = stats.hp;
          setHeroHp(stats.hp);
          flashToast("❤️ HP totalmente restaurado");
          break;
        }
        case "fastforward": {
          // simulate N stages of gold rewards without changing stage (pay-to-fast catch-up)
          let totalGold = 0;
          for (let i = 0; i < pack.amount; i++) {
            const e = enemyForStage(next.stage + i);
            totalGold += e.gold;
          }
          next = { ...next, gold: next.gold + totalGold };
          flashToast(`⏩ Recompensas equivalentes a ${pack.amount} batalhas: +${fmt(totalGold)} 🪙`);
          break;
        }
      }
      return next;
    });
  }, [flashToast]);

  // ==== Prestige / Rebirth ====
  const doRebirth = useCallback(() => {
    setSave((prev) => {
      if (!prev) return prev;
      if (prev.stage < PRESTIGE_UNLOCK_STAGE) {
        flashToast(`🔒 Rebirth libera no estágio ${PRESTIGE_UNLOCK_STAGE}`);
        return prev;
      }
      const gained = essenceForRebirth(prev.stage);
      const startStage = 1 + (prev.globalUp?.startStage ?? 0) * GLOBAL_UP_DEFS.startStage.perLevel;
      const fresh = defaultSave();
      const next: SaveState = {
        ...fresh,
        // Preservado entre prestígios
        gems: prev.gems,
        essence: prev.essence + gained,
        prestigeLevel: prev.prestigeLevel + 1,
        maxStage: prev.maxStage,
        globalUp: prev.globalUp,
        stage: startStage,
      };
      flashToast(`🌟 Renasceu! +${gained} Essência (Prestígio ${next.prestigeLevel})`);
      // reset combat
      const stats = computeStats(next);
      heroHpRef.current = stats.hp;
      setHeroHp(stats.hp);
      const e = enemyForStage(next.stage);
      enemyRef.current = e;
      enemyHpRef.current = e.hp;
      setEnemyHp(e.hp);
      prevLevelRef.current = 1;
      return next;
    });
  }, [flashToast]);

  const buyGlobalUp = useCallback((key: GlobalUpKey) => {
    setSave((prev) => {
      if (!prev) return prev;
      const lvl = prev.globalUp[key] ?? 0;
      const def = GLOBAL_UP_DEFS[key];
      if (lvl >= def.max) { flashToast("🌟 Nível máximo"); return prev; }
      const cost = globalUpCost(key, lvl);
      if (prev.essence < cost) { flashToast("✨ Essência insuficiente"); return prev; }
      flashToast(`🌟 ${def.label} +1`);
      return { ...prev, essence: prev.essence - cost, globalUp: { ...prev.globalUp, [key]: lvl + 1 } };
    });
  }, [flashToast]);

  // ==== Crystal packs (MOCK — sem cobrança real) ====
  const buyCrystalPack = useCallback((id: string) => {
    const pack = CRYSTAL_PACKS.find((p) => p.id === id);
    if (!pack) return;
    setSave((prev) => prev ? { ...prev, gems: prev.gems + pack.gems + pack.bonus } : prev);
    flashToast(`💎 +${pack.gems + pack.bonus} cristais (mock — Stripe em breve)`);
  }, [flashToast]);


  // ==== Retenção: helpers de reivindicação ====
  const applyReward = useCallback((next: SaveState, r: DailyReward): { next: SaveState; msg: string } => {
    if (r.kind === "gold") {
      const amt = r.amount(next);
      return { next: { ...next, gold: next.gold + amt }, msg: `🪙 +${fmt(amt)} ouro` };
    }
    if (r.kind === "gems") {
      const amt = r.amount(next);
      return { next: { ...next, gems: next.gems + amt }, msg: `💎 +${amt} cristais` };
    }
    if (r.kind === "essence") {
      const amt = r.amount(next);
      return { next: { ...next, essence: next.essence + amt }, msg: `✨ +${amt} essência` };
    }
    // chest
    const bonusStage = r.tier === "common" ? 0 : r.tier === "epic" ? 2 : 5;
    const count = r.tier === "legendary" ? 2 : 1;
    let inv = next.inventory;
    for (let i = 0; i < count; i++) {
      const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)].key;
      inv = [...inv, rollItem(slot, next.stage + bonusStage)].slice(-60);
    }
    return { next: { ...next, inventory: inv }, msg: `${r.icon} ${r.label} aberto!` };
  }, []);

  const claimDaily = useCallback(() => {
    setSave((prev) => {
      if (!prev) return prev;
      const today = todayKey();
      if (prev.daily.lastClaimDay === today) { flashToast("✅ Já reivindicado hoje"); return prev; }
      const gap = prev.daily.lastClaimDay ? daysBetween(prev.daily.lastClaimDay, today) : 999;
      const streak = gap === 1 ? prev.daily.streak + 1 : 1;
      const cycleDay = prev.daily.cycleDay % DAILY_CYCLE.length;
      const reward = DAILY_CYCLE[cycleDay];
      const { next, msg } = applyReward(prev, reward);
      flashToast(msg);
      return {
        ...next,
        daily: {
          ...prev.daily,
          lastClaimDay: today,
          cycleDay: (cycleDay + 1) % DAILY_CYCLE.length,
          streak,
          bestStreak: Math.max(prev.daily.bestStreak, streak),
        },
      };
    });
  }, [applyReward, flashToast]);

  const claimStreak = useCallback((milestone: number) => {
    setSave((prev) => {
      if (!prev) return prev;
      if (prev.daily.streak < milestone) { flashToast(`🔥 Precisa de ${milestone} dias seguidos`); return prev; }
      if (prev.daily.streakClaimed.includes(milestone)) { flashToast("✅ Já reivindicado"); return prev; }
      const r = streakRewardFor(milestone);
      flashToast(`🏆 Marco ${milestone}d! +${fmt(r.gold)} 🪙 +${r.gems} 💎${r.essence ? ` +${r.essence} ✨` : ""}`);
      return {
        ...prev,
        gold: prev.gold + r.gold,
        gems: prev.gems + r.gems,
        essence: prev.essence + r.essence,
        daily: { ...prev.daily, streakClaimed: [...prev.daily.streakClaimed, milestone] },
      };
    });
  }, [flashToast]);

  const claimFreeChest = useCallback((tier: "free" | "rare") => {
    setSave((prev) => {
      if (!prev) return prev;
      const now = Date.now();
      const cd = tier === "free" ? FREE_CHEST_MS : RARE_CHEST_MS;
      const last = tier === "free" ? prev.freeChest.lastFreeAt : prev.freeChest.lastRareAt;
      if (now - last < cd) { flashToast("⏳ Ainda em recarga"); return prev; }
      const bonusStage = tier === "rare" ? 3 : 0;
      const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)].key;
      const item = rollItem(slot, prev.stage + bonusStage);
      flashToast(`${tier === "rare" ? "🎁" : "📦"} ${item.rarity} ${SLOTS.find(s => s.key === slot)!.label}`);
      return {
        ...prev,
        inventory: [...prev.inventory, item].slice(-60),
        freeChest: tier === "free"
          ? { ...prev.freeChest, lastFreeAt: now }
          : { ...prev.freeChest, lastRareAt: now },
      };
    });
  }, [flashToast]);

  const closeOfflineReport = useCallback(() => setOfflineReport(null), []);


  const stats = useMemo(() => (save ? computeStats(save) : null), [save]);
  const biome = useMemo(() => biomeFor(save?.stage ?? 1), [save?.stage]);
  const nextUnlock = useMemo(
    () => UNLOCKS.find((u) => u.level > (save?.level ?? 1)),
    [save?.level],
  );

  // Load cached AI backgrounds from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hero-rise-bg-cache-v1");
      if (raw) setBgCache(JSON.parse(raw));
    } catch {}
  }, []);

  // Fetch AI-generated background per biome (dynamic, cached)
  useEffect(() => {
    if (!save) return;
    if (bgCache[biome.name]) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/generate-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ biome: biome.name, stage: save.stage }),
        });
        if (!res.ok) return;
        const { dataUrl } = (await res.json()) as { dataUrl: string };
        if (cancelled || !dataUrl) return;
        setBgCache((prev) => {
          const next = { ...prev, [biome.name]: dataUrl };
          try {
            localStorage.setItem("hero-rise-bg-cache-v1", JSON.stringify(next));
          } catch {}
          return next;
        });
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [biome.name, save?.stage, bgCache]);

  if (!save || !stats || !enemyRef.current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1A0F08] text-amber-300 font-cartoon">
        Carregando…
      </div>
    );
  }

  const enemy = enemyRef.current;
  const xpNeed = xpForLevel(save.level);

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#2D1B0E] text-white select-none"
      style={{ fontFamily: "'Fredoka', system-ui, sans-serif" }}
    >
      {/* ===== Top HUD ===== */}
      <header className="relative bg-gradient-to-b from-[#3E2723] to-[#2D1B0E] border-b-4 border-[#8B4513] px-3 pt-2 pb-2">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <Link
            to="/"
            aria-label="Início"
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 border-[#8B4513] bg-gradient-to-br from-amber-300 to-orange-500 text-amber-950 shadow-lg active:translate-y-0.5"
          >
            <Home className="h-4 w-4" strokeWidth={3} />
            <span
              className="absolute -bottom-1 -right-1 rounded-full border-2 border-[#8B4513] bg-[#2D1B0E] px-1 py-0 text-[9px] font-bold text-amber-300"
              style={{ fontFamily: "'Luckiest Guy', cursive" }}
            >
              Lv{save.level}
            </span>
          </Link>

          {/* Currencies */}
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex gap-2">
              <CartoonPill
                color="amber"
                icon={<div className="h-3.5 w-3.5 rotate-45 rounded-sm bg-amber-400 shadow-[inset_-1px_-1px_0_rgba(0,0,0,0.3)]" />}
                value={fmt(save.gold)}
              />
              <button onClick={() => setModal("crystals")} className="active:scale-95" title="Comprar cristais">
                <CartoonPill
                  color="emerald"
                  icon={<div className="h-3.5 w-3 rounded-full bg-emerald-400 shadow-[inset_-1px_-1px_0_rgba(0,0,0,0.3)]" />}
                  value={fmt(save.gems)}
                />
              </button>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full border-2 border-[#1A0F08] bg-[#1A0F08]">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-yellow-400 transition-all"
                style={{ width: `${(save.xp / xpNeed) * 100}%` }}
              />
            </div>
          </div>

          {/* Rebirth + Pass stack */}
          <div className="flex flex-col gap-1">
            <QuickCartoonBtn
              icon={<Sparkles className="h-3 w-3" />}
              label={save.stage >= PRESTIGE_UNLOCK_STAGE ? "REBIRTH" : "🔒"}
              onClick={() => setModal("rebirth")}
            />
            <QuickCartoonBtn icon={<Calendar className="h-3 w-3" />} label="DIÁRIO" onClick={() => setModal("daily")} />
            <QuickCartoonBtn icon={<Ticket className="h-3 w-3" />} label="PASSE" onClick={() => flashToast("Passe em breve")} />
          </div>
        </div>
      </header>

      {/* ===== Battle arena ===== */}
      <section
        className={`relative h-56 overflow-hidden bg-gradient-to-b ${biome.bg} border-b-4 border-[#1A0F08]`}
        style={
          bgCache[biome.name]
            ? {
                backgroundImage: `url(${bgCache[biome.name]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
        aria-label="Campo de batalha"
      >
        {/* stage banner */}
        <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border-2 border-black/60 bg-black/50 px-4 py-0.5 backdrop-blur-sm">
          <span
            className="text-sm tracking-wider text-amber-100 drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            {biome.name.toUpperCase()}: {Math.floor((save.stage - 1) / 10) + 1}-{((save.stage - 1) % 10) + 1}
          </span>
        </div>
        {enemy.isBoss && (
          <div
            className="absolute right-2 top-12 rounded-lg border-2 border-amber-950 bg-amber-500 px-2 py-0.5 text-[10px] text-amber-950 shadow"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            👑 BOSS
          </div>
        )}

        {/* clouds */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
          <div className="absolute left-4 top-8 h-4 w-16 rounded-full bg-white blur-md" />
          <div className="absolute right-8 top-14 h-3 w-10 rounded-full bg-white blur-md" />
        </div>

        {/* Hero */}
        <div
          className={`absolute bottom-10 left-6 flex flex-col items-center ${
            heroHit ? "translate-x-1" : ""
          } transition-transform`}
        >
          <div className="mb-1 h-2 w-16 overflow-hidden rounded-full border-2 border-black/60 bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all"
              style={{ width: `${(heroHp / stats.hp) * 100}%` }}
            />
          </div>
          <img
            src={heroSprite}
            alt="Herói"
            className={`h-20 w-20 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] ${levelFlash ? "animate-[heroBounce_0.9s_ease-out]" : ""}`}
            draggable={false}
          />
          <div className="mt-0.5 text-[9px] tabular-nums text-white/90 font-bold">
            {fmt(heroHp)}/{fmt(stats.hp)}
          </div>
        </div>

        {/* Enemy */}
        <div
          className={`absolute bottom-10 right-6 flex flex-col items-center ${
            enemyHit ? "-translate-x-1" : ""
          } ${enemyDying ? "opacity-0 scale-50" : ""} transition-all duration-200`}
        >
          <div className="mb-1 h-2 w-20 overflow-hidden rounded-full border-2 border-black/60 bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-red-400 transition-all"
              style={{ width: `${(enemyHp / enemy.hp) * 100}%` }}
            />
          </div>
          <img
            src={enemy.isBoss ? bossDragonSprite : pickEnemySprite(save.stage)}
            alt={enemy.isBoss ? "Chefe" : "Inimigo"}
            className={`object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] ${enemy.isBoss ? "h-24 w-24" : "h-20 w-20"} ${enemyHit ? "animate-[shake_0.15s]" : ""}`}
            draggable={false}
          />
          <div className="mt-0.5 text-[9px] tabular-nums text-white/90 font-bold">
            {fmt(enemyHp)}/{fmt(enemy.hp)}
          </div>
        </div>

        {/* ground grass strip */}
        <div className="absolute bottom-6 left-0 right-0 h-2 bg-emerald-400/70 rounded-full scale-x-110" />
        <div className={`absolute bottom-0 left-0 right-0 h-8 ${biome.ground} border-t-4 border-emerald-950`} />

        {/* damage numbers */}
        {damages.map((d) => (
          <span
            key={d.id}
            className={`pointer-events-none absolute animate-[floatUp_0.9s_ease-out_forwards] tabular-nums drop-shadow-[0_2px_0_rgba(0,0,0,0.6)] ${
              d.from === "hero"
                ? d.crit
                  ? "text-yellow-300 text-2xl"
                  : "text-white text-lg"
                : "text-rose-400 text-base"
            }`}
            style={{ left: `${d.x}%`, top: `${d.y}%`, fontFamily: "'Luckiest Guy', cursive" }}
          >
            {d.crit ? `✦${d.value}` : d.value}
          </span>
        ))}
        <style>{`
          @keyframes floatUp{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-40px);opacity:0}}
          @keyframes heroBounce{0%,100%{transform:translateY(0) scale(1)}20%{transform:translateY(-18px) scale(1.15)}45%{transform:translateY(0) scale(0.92)}65%{transform:translateY(-8px) scale(1.05)}85%{transform:translateY(0) scale(0.98)}}
          @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
          @keyframes levelPop{0%{transform:scale(0.5) rotate(-8deg);opacity:0}60%{transform:scale(1.15) rotate(4deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
        `}</style>
      </section>

      {/* ===== Skill bar (wood frames) ===== */}
      <section className="relative -mt-4 z-10 flex gap-2 overflow-x-auto px-3 pb-2 no-scrollbar">
        {SKILLS.map((sk, i) => {
          const locked = save.level < sk.unlock;
          const colors = ["bg-orange-400", "bg-red-400", "bg-blue-400", "bg-purple-400"];
          return (
            <button
              key={sk.name}
              disabled={locked}
              onClick={() => flashToast(`${sk.name} (auto)`)}
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-4 p-1 shadow-lg active:translate-y-0.5 ${
                locked
                  ? "border-[#1A0F08] bg-[#3E2723]"
                  : `border-[#5D2E0C] bg-[#8B4513] ${i === 3 ? "animate-pulse ring-2 ring-amber-300" : ""}`
              }`}
              aria-label={sk.name}
            >
              {locked ? (
                <Lock className="h-4 w-4 text-amber-900/50" />
              ) : (
                <div className={`h-full w-full rounded-md ${colors[i] ?? "bg-emerald-400"} shadow-inner grid place-items-center`}>
                  <Sparkles className="h-4 w-4 text-white/90" strokeWidth={2.5} />
                </div>
              )}
            </button>
          );
        })}
        {/* passive slots */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-4 border-[#1A0F08] bg-[#3E2723]">
          <Lock className="h-4 w-4 text-amber-900/50" />
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-4 border-[#1A0F08] bg-[#3E2723]">
          <Lock className="h-4 w-4 text-amber-900/50" />
        </div>
      </section>

      {/* ===== Tabs ===== */}
      <div className="flex gap-2 px-3 mb-2">
        <TabBtn active label="ATRIBUTOS" />
        <TabBtn label="BÊNÇÃOS" locked />
        <TabBtn label="ILIMITADO" locked />
      </div>

      {/* ===== Next unlock strip ===== */}
      {nextUnlock && (
        <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-lg border-2 border-[#5D2E0C] bg-[#3E2723] px-3 py-1 text-[11px] text-amber-200">
          <span className="flex items-center gap-1.5">
            {nextUnlock.icon}
            Próximo: <span className="font-bold text-amber-100">{nextUnlock.label}</span>
          </span>
          <span
            className="text-amber-400"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            Lv {nextUnlock.level}
          </span>
        </div>
      )}

      {/* ===== Attributes panel (brick style) ===== */}
      <section className="flex-1 space-y-2 px-3 pb-28">
        {ATTR_ORDER.map((key) => {
          const d = ATTR_DEFS[key];
          const lvl = save.attrs[key].level;
          const cur = attrValue(key, lvl);
          const nxt = attrValue(key, lvl + 1);
          const cost = attrCost(key, lvl);
          const can = save.gold >= cost;
          const format = d.format ?? ((v: number) => `${v}`);
          return (
            <div
              key={key}
              className="flex items-center gap-3 rounded-3xl border-4 border-[#3E2010] bg-[#5D4037] p-2 shadow-lg"
              style={{
                borderImage: `url(${woodTexture}) 40 round`,
                backgroundImage: `linear-gradient(rgba(93,64,55,0.72), rgba(62,39,35,0.88)), url(${woodTexture})`,
                backgroundSize: "cover",
              }}
            >
              {/* Icon block */}
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-4 border-[#1A0F08] bg-[#3E2723]">
                <div className={d.color}>{d.icon}</div>
                <span className="mt-0 text-[8px] font-bold text-amber-200/70 leading-none">Lv.{lvl}</span>
              </div>

              {/* Values */}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-amber-200 uppercase tracking-wide">
                  {d.label}
                </div>
                <div
                  className="flex items-center gap-1.5 text-base tabular-nums text-white"
                  style={{ fontFamily: "'Luckiest Guy', cursive" }}
                >
                  <span>{format(cur)}</span>
                  <span className="text-[10px] text-amber-500/60">▶</span>
                  <span className="text-emerald-300">{format(nxt)}</span>
                </div>
              </div>

              {/* Upgrade button */}
              <button
                onClick={() => upgrade(key)}
                disabled={!can}
                className={`flex h-14 shrink-0 flex-col items-center justify-center rounded-2xl border-b-4 px-3 transition-transform active:translate-y-1 active:border-b-0 ${
                  can
                    ? "border-green-900 bg-[#4CAF50] text-white"
                    : "border-[#1A0F08] bg-[#3E2723] text-amber-900/60"
                }`}
              >
                <div className="text-[10px] font-bold leading-none">UPGRADE</div>
                <div
                  className="mt-0.5 flex items-center gap-1 text-xs leading-none"
                  style={{ fontFamily: "'Luckiest Guy', cursive" }}
                >
                  <div className="h-2.5 w-2.5 rotate-45 rounded-sm bg-amber-400" />
                  {fmt(cost)}
                </div>
              </button>
            </div>
          );
        })}

        {/* Reset */}
        <button
          onClick={() => {
            if (!confirm("Resetar progresso?")) return;
            const s = defaultSave();
            setSave(s);
            saveRef.current = s;
            respawn();
            flashToast("Progresso resetado");
          }}
          className="mt-4 w-full rounded-lg border-2 border-[#5D2E0C] bg-[#3E2723] py-2 text-[10px] text-amber-200/50 hover:text-amber-200"
        >
          Resetar progresso (beta)
        </button>
      </section>

      {/* ===== Bottom tab bar ===== */}
      <nav className="fixed bottom-0 left-1/2 z-30 flex h-20 w-full max-w-md -translate-x-1/2 items-end justify-around border-t-4 border-[#8B4513] bg-[#3E2723] px-2 pb-2 pt-1">
        <TabBarItem
          icon="🧑‍🎤"
          label="Herói"
          onClick={() => setModal("equip")}
          badge={save.inventory.length || undefined}
        />
        <TabBarItem
          icon="✨"
          label="Habilidades"
          onClick={() => flashToast("Habilidades — automáticas")}
        />
        {/* Center Battle */}
        <button
          onClick={() => flashToast("⚔️ Batalha automática!")}
          className="-mt-8 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-4 border-[#E65100] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] shadow-[0_6px_0_#B34700] active:translate-y-1 active:shadow-[0_2px_0_#B34700]"
        >
          <Sword className="h-8 w-8 text-amber-950" strokeWidth={2.5} />
          <span
            className="text-xs tracking-widest text-amber-950"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            BATALHA
          </span>
        </button>
        <TabBarItem
          icon="🏰"
          label="Masmorra"
          locked={save.level < 10}
          unlockLv={10}
          onClick={() => flashToast("Masmorra em breve")}
        />
        <TabBarItem
          icon="🛒"
          label="Loja"
          onClick={() => setModal("store")}
        />
      </nav>

      {/* ===== Modals ===== */}
      {modal === "equip" && (
        <EquipmentModal
          save={save}
          onClose={() => setModal(null)}
          onEquip={equipItem}
          onUnequip={unequipItem}
          onSell={sellItem}
        />
      )}
      {modal === "arena" && (
        <ArenaModal save={save} onClose={() => setModal(null)} onFight={doPvp} />
      )}
      {modal === "store" && (
        <StoreModal
          save={save}
          onClose={() => setModal(null)}
          onBuy={buyStoreItem}
        />
      )}
      {modal === "rebirth" && (
        <RebirthModal
          save={save}
          onClose={() => setModal(null)}
          onRebirth={doRebirth}
          onBuyUp={buyGlobalUp}
        />
      )}
      {modal === "crystals" && (
        <CrystalsModal
          save={save}
          onClose={() => setModal(null)}
          onBuy={buyCrystalPack}
        />
      )}
      {modal === "daily" && (
        <DailyModal
          save={save}
          onClose={() => setModal(null)}
          onClaimDaily={claimDaily}
          onClaimStreak={claimStreak}
          onClaimChest={claimFreeChest}
        />
      )}
      {offlineReport && (
        <OfflineModal report={offlineReport} onClose={closeOfflineReport} />
      )}





      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4">
          <div
            className="rounded-full border-2 border-[#1A0F08] bg-[#5D4037] px-4 py-2 text-sm text-amber-100 shadow-xl"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            {toast}
          </div>
        </div>
      )}

      <TutorialOverlay />
    </div>
  );
}

// -------- Tutorial --------
const TUTORIAL_KEY = "hero-rise-tutorial-v1";
const TUTORIAL_STEPS = [
  {
    title: "Bem-vindo, herói! 👋",
    body: "BRHero é o primeiro RPG idle brasileiro: seu personagem batalha sozinho. Você evolui os atributos e observa a força crescer!",
  },
  {
    title: "Batalhas automáticas ⚔️",
    body: "Seu herói ataca inimigos sem parar. A cada vitória você ganha ouro e XP. A cada 10 estágios, enfrenta um chefão.",
  },
  {
    title: "Evolua atributos 💪",
    body: "Use o ouro para melhorar ATK, HP, Crítico e mais. Cada ponto deixa você mais forte para avançar de estágio.",
  },
  {
    title: "Desbloqueios 🔓",
    body: "Novas funções abrem conforme você sobe de nível: Equipamentos (Lv 3), Habilidades (Lv 5), Masmorra (Lv 10), PvP (Lv 30) e Multiplayer (Lv 50).",
  },
  {
    title: "Tudo pronto! 🚀",
    body: "Toque em BATALHA para começar. Boa sorte na sua jornada!",
  },
];

function TutorialOverlay() {
  const [step, setStep] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(TUTORIAL_KEY)) setStep(0);
  }, []);
  if (step === null) return null;
  const s = TUTORIAL_STEPS[step];
  const finish = () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    setStep(null);
  };
  const next = () => {
    if (step >= TUTORIAL_STEPS.length - 1) finish();
    else setStep(step + 1);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div
        className="w-full max-w-sm rounded-3xl border-4 border-[#8B4513] bg-gradient-to-b from-[#FFF3E0] to-[#FFE0B2] p-6 text-center text-[#3E2723] shadow-2xl"
      >
        <div className="mb-1 text-xs font-bold tracking-widest text-[#8B4513]">
          TUTORIAL {step + 1}/{TUTORIAL_STEPS.length}
        </div>
        <h2
          className="mb-3 text-2xl"
          style={{ fontFamily: "'Luckiest Guy', cursive" }}
        >
          {s.title}
        </h2>
        <p className="mb-5 text-sm leading-relaxed">{s.body}</p>
        <div className="flex gap-2">
          <button
            onClick={finish}
            className="flex-1 rounded-xl border-2 border-[#8B4513] bg-white/60 py-2 text-sm font-bold text-[#5D4037]"
          >
            Pular
          </button>
          <button
            onClick={next}
            className="flex-[2] rounded-xl border-4 border-[#B34700] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] py-2 text-sm font-black text-amber-950 shadow-[0_4px_0_#B34700] active:translate-y-1 active:shadow-[0_1px_0_#B34700]"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            {step >= TUTORIAL_STEPS.length - 1 ? "COMEÇAR!" : "PRÓXIMO"}
          </button>
        </div>
      </div>
    </div>
  );
}



// -------- Sub-components --------
function CartoonPill({
  icon,
  value,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  color: "amber" | "emerald";
}) {
  const ring = color === "amber" ? "border-amber-800" : "border-emerald-800";
  return (
    <div className={`flex flex-1 items-center gap-1 rounded-full border-2 ${ring} bg-[#1A0F08]/80 px-2 py-0.5`}>
      {icon}
      <span
        className="truncate text-xs text-amber-100 tabular-nums"
        style={{ fontFamily: "'Luckiest Guy', cursive" }}
      >
        {value}
      </span>
    </div>
  );
}

function QuickCartoonBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-full border-2 border-amber-900 bg-gradient-to-b from-amber-500 to-orange-600 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow active:translate-y-0.5"
    >
      {icon}
      {label}
    </button>
  );
}

function TabBtn({ label, active, locked }: { label: string; active?: boolean; locked?: boolean }) {
  return (
    <button
      disabled={locked}
      className={`flex-1 rounded-2xl border-b-4 py-2 text-xs tracking-wider shadow active:translate-y-0.5 active:border-b-0 ${
        active
          ? "border-red-950 bg-[#D32F2F] text-white"
          : locked
            ? "border-stone-950 bg-[#5D4037] text-amber-200/40"
            : "border-stone-950 bg-[#795548] text-amber-200/70"
      }`}
      style={{ fontFamily: "'Luckiest Guy', cursive" }}
    >
      {label}
    </button>
  );
}

function TabBarItem({
  icon,
  label,
  onClick,
  locked,
  unlockLv,
  badge,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  locked?: boolean;
  unlockLv?: number;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`relative flex flex-1 flex-col items-center justify-end gap-0.5 pb-1 ${
        locked ? "opacity-40" : ""
      }`}
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-[#1A0F08] bg-[#5D4037] text-xl shadow-inner">
        {locked ? <Lock className="h-4 w-4 text-amber-900" /> : icon}
      </div>
      <span className="text-[9px] font-bold uppercase text-amber-200/80">
        {locked ? `Lv${unlockLv}` : label}
      </span>
      {!locked && badge !== undefined && (
        <span className="absolute right-1 top-0 grid h-4 min-w-4 place-items-center rounded-full border-2 border-[#3E2723] bg-rose-500 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}


// -------- Derived stats --------
function computeStats(s: SaveState) {
  const eq = equipmentBonus(s.equipment);
  const atkBonus = 1 + (s.globalUp?.atk ?? 0) * GLOBAL_UP_DEFS.atk.perLevel;
  const hpBonus = 1 + (s.globalUp?.hp ?? 0) * GLOBAL_UP_DEFS.hp.perLevel;
  return {
    atk: Math.floor((attrValue("atk", s.attrs.atk.level) + eq.atk) * atkBonus),
    hp: Math.floor((attrValue("hp", s.attrs.hp.level) + eq.hp) * hpBonus),
    regen: attrValue("regen", s.attrs.regen.level),
    critDmg: attrValue("critDmg", s.attrs.critDmg.level),
    critChance: attrValue("critChance", s.attrs.critChance.level) + (s.globalUp?.crit ?? 0) * GLOBAL_UP_DEFS.crit.perLevel * 100,
    atkSpeed: attrValue("atkSpeed", s.attrs.atkSpeed.level),
    lifesteal: attrValue("lifesteal", s.attrs.lifesteal.level),
    penetration: attrValue("penetration", s.attrs.penetration.level),
    defense: attrValue("defense", s.attrs.defense.level) + eq.def,
  };
}

function MenuBtn({
  locked,
  unlockLv,
  icon,
  label,
  badge,
  onClick,
}: {
  locked: boolean;
  unlockLv: number;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`relative flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold active:scale-95 ${
        locked
          ? "border-slate-800 bg-slate-900 text-slate-600"
          : "border-indigo-500/50 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white shadow"
      }`}
    >
      {locked ? <Lock className="h-4 w-4" /> : icon}
      <span>{locked ? `${label} · Lv ${unlockLv}` : label}</span>
      {!locked && badge !== undefined && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border-t border-slate-700 bg-slate-950 shadow-2xl animate-[slideUp_0.25s_ease-out]">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-black text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700"
          >
            Fechar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

function EquipmentModal({
  save,
  onClose,
  onEquip,
  onUnequip,
  onSell,
}: {
  save: SaveState;
  onClose: () => void;
  onEquip: (item: Item) => void;
  onUnequip: (slot: SlotKey) => void;
  onSell: (id: string) => void;
}) {
  const bonus = equipmentBonus(save.equipment);
  return (
    <ModalShell title="Equipamentos" onClose={onClose}>
      {/* equipped slots */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {SLOTS.map((s) => {
          const item = save.equipment[s.key];
          const color = item ? RARITIES.find((r) => r.name === item.rarity)!.color : "border-slate-800 text-slate-500";
          return (
            <button
              key={s.key}
              onClick={() => item && onUnequip(s.key)}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 bg-slate-900/60 p-1 text-[10px] ${color}`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="truncate font-bold">{s.label}</span>
              {item && <span className="text-[9px] opacity-80">{item.rarity}</span>}
            </button>
          );
        })}
      </div>
      <div className="mb-3 flex items-center justify-around rounded-lg bg-slate-900 py-2 text-[11px] text-slate-300">
        <span>ATK <span className="font-bold text-rose-300">+{fmt(bonus.atk)}</span></span>
        <span>HP <span className="font-bold text-emerald-300">+{fmt(bonus.hp)}</span></span>
        <span>DEF <span className="font-bold text-sky-300">+{fmt(bonus.def)}</span></span>
      </div>

      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        Inventário ({save.inventory.length})
      </h3>
      {save.inventory.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-800 py-6 text-center text-xs text-slate-500">
          Vença inimigos e chefes para ganhar equipamentos.
        </p>
      )}
      <div className="space-y-2">
        {save.inventory.map((item) => {
          const slotInfo = SLOTS.find((s) => s.key === item.slot)!;
          const color = RARITIES.find((r) => r.name === item.rarity)!.color;
          return (
            <div
              key={item.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border ${color} bg-slate-900/60 px-2 py-2`}
            >
              <span className="text-2xl">{slotInfo.emoji}</span>
              <div className="min-w-0 text-[11px]">
                <div className="flex items-center gap-1 font-bold">
                  <span className="truncate">{slotInfo.label}</span>
                  <span className="opacity-70">·</span>
                  <span className="truncate">{item.rarity}</span>
                  <span className="text-amber-300">{"★".repeat(item.stars)}</span>
                </div>
                <div className="text-[10px] text-slate-400 tabular-nums">
                  +{item.bonus.atk} ATK · +{item.bonus.hp} HP · +{item.bonus.def} DEF
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => onEquip(item)}
                  className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white active:scale-95"
                >
                  Equipar
                </button>
                <button
                  onClick={() => onSell(item.id)}
                  className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300 active:scale-95"
                >
                  Vender
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

function ArenaModal({
  save,
  onClose,
  onFight,
}: {
  save: SaveState;
  onClose: () => void;
  onFight: () => void;
}) {
  return (
    <ModalShell title="Arena dos Heróis · Beta" onClose={onClose}>
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-indigo-700 to-purple-900 p-4 text-center text-white">
        <Crown className="mx-auto mb-2 h-8 w-8 text-amber-300" />
        <div className="text-lg font-black">Multiplayer Beta</div>
        <div className="text-[11px] opacity-80">
          PvP assíncrono contra outros heróis (simulado).
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[11px]">
        <div className="rounded-lg bg-slate-900 py-2">
          <div className="text-[10px] text-slate-500">Vitórias</div>
          <div className="text-lg font-black text-amber-300">{save.pvpWins}</div>
        </div>
        <div className="rounded-lg bg-slate-900 py-2">
          <div className="text-[10px] text-slate-500">Rank</div>
          <div className="text-lg font-black text-sky-300">
            {save.pvpWins < 5 ? "Bronze" : save.pvpWins < 20 ? "Prata" : save.pvpWins < 50 ? "Ouro" : "Diamante"}
          </div>
        </div>
        <div className="rounded-lg bg-slate-900 py-2">
          <div className="text-[10px] text-slate-500">Nível</div>
          <div className="text-lg font-black text-emerald-300">{save.level}</div>
        </div>
      </div>

      <button
        onClick={onFight}
        className="mb-3 w-full rounded-xl bg-gradient-to-b from-rose-500 to-red-700 py-3 text-sm font-black text-white shadow-lg active:scale-95"
      >
        ⚔️ Procurar Oponente
      </button>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400">
        <p className="mb-1 font-bold text-slate-300">Em breve:</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>Ranking global online</li>
          <li>Guildas e chat</li>
          <li>Desafios semanais</li>
          <li>Recompensas de temporada</li>
        </ul>
      </div>
    </ModalShell>
  );
}




function pickEnemySprite(stage: number) {
  const pool = [goblinSprite, slimeSprite, skeletonSprite];
  return pool[stage % pool.length];
}

// ==================== STORE (Pay-to-fast) ====================
// Regra de design: nada aqui empurra o jogador direto pra frente em stats
// permanentes. Só acelera o que ele já pode conseguir jogando. NUNCA vender:
// atributos permanentes, XP direto, avanço automático de estágio.
type StoreItem = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  cost: number;
  amount: number;
  kind: "gold" | "chest" | "heal" | "fastforward";
  tag?: "popular" | "melhor" | "grátis";
};

const STORE_ITEMS: StoreItem[] = [
  {
    id: "gold-small",
    icon: "🪙",
    title: "Saco de Ouro",
    desc: "Bônus de ouro escalonado pelo estágio atual.",
    cost: 5,
    amount: 50,
    kind: "gold",
  },
  {
    id: "gold-big",
    icon: "💰",
    title: "Baú de Ouro",
    desc: "5x mais ouro. Ótimo pra desbloquear atributos.",
    cost: 20,
    amount: 250,
    kind: "gold",
    tag: "popular",
  },
  {
    id: "heal",
    icon: "❤️‍🩹",
    title: "Poção Instantânea",
    desc: "Restaura 100% do HP na hora.",
    cost: 3,
    amount: 1,
    kind: "heal",
  },
  {
    id: "chest-common",
    icon: "📦",
    title: "Baú Comum",
    desc: "1 equipamento aleatório do estágio atual.",
    cost: 15,
    amount: 1,
    kind: "chest",
  },
  {
    id: "chest-epic",
    icon: "🎁",
    title: "Baú Épico",
    desc: "1 equipamento aleatório do estágio +2.",
    cost: 45,
    amount: 1,
    kind: "chest",
    tag: "melhor",
  },
  {
    id: "ff-10",
    icon: "⏩",
    title: "Recompensas Idle x10",
    desc: "Ganhe ouro equivalente a 10 batalhas futuras (sem pular estágio).",
    cost: 25,
    amount: 10,
    kind: "fastforward",
  },
  {
    id: "ff-50",
    icon: "⏭️",
    title: "Recompensas Idle x50",
    desc: "Ganhe ouro equivalente a 50 batalhas futuras.",
    cost: 100,
    amount: 50,
    kind: "fastforward",
  },
];

function StoreModal({
  save,
  onClose,
  onBuy,
}: {
  save: SaveState;
  onClose: () => void;
  onBuy: (id: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-4 border-[#f5c542] bg-gradient-to-b from-[#0a1c3a] to-[#152b5c] p-5 text-[#e8ecf1] shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-2xl text-[#f5c542]"
            style={{ fontFamily: "'Lilita One', cursive" }}
          >
            🛒 Loja
          </h2>
          <button
            onClick={onClose}
            className="rounded-full border border-[#f5c542]/40 px-3 py-1 text-xs text-[#f5c542]"
          >
            Fechar
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between rounded-xl border-2 border-[#f5c542]/40 bg-[#0a1c3a]/70 px-3 py-2 text-sm">
          <span>💎 Cristais: <b className="text-[#f5c542]">{fmt(save.gems)}</b></span>
          <span>🪙 Ouro: <b className="text-[#f5c542]">{fmt(save.gold)}</b></span>
        </div>

        <p className="mb-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-2 text-[11px] text-emerald-200">
          ⚖️ <b>100% Pay-to-Fast:</b> a loja só vende ouro, baús e acelerações
          — nunca atributos, XP direto ou avanço automático de estágio. Todo
          jogador free pode chegar aos mesmos stats.
        </p>

        <div className="space-y-2">
          {STORE_ITEMS.map((item) => {
            const cantAfford = save.gems < item.cost;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border-2 border-[#f5c542]/30 bg-[#152b5c]/60 p-3"
              >
                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <div
                    className="flex items-center gap-2 text-sm text-[#f5c542]"
                    style={{ fontFamily: "'Lilita One', cursive" }}
                  >
                    {item.title}
                    {item.tag && (
                      <span className="rounded-full bg-[#f5c542] px-2 py-[1px] text-[9px] uppercase text-[#0a1c3a]">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#e8ecf1]/70">{item.desc}</div>
                </div>
                <button
                  onClick={() => onBuy(item.id)}
                  disabled={cantAfford}
                  className={`rounded-lg border-2 px-3 py-2 text-xs ${
                    cantAfford
                      ? "border-slate-600 bg-slate-800 text-slate-500"
                      : "border-[#f5c542] bg-gradient-to-b from-[#f5c542] to-[#d4a02a] text-[#0a1c3a]"
                  }`}
                  style={{ fontFamily: "'Lilita One', cursive" }}
                >
                  💎 {item.cost}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[10px] text-[#e8ecf1]/50">
          Ganhe 💎 derrotando chefões (a cada 10 estágios) e vencendo no PvP.
        </p>
      </div>
    </div>
  );
}


// -------- Rebirth Modal (Prestígio) --------
function RebirthModal({
  save,
  onClose,
  onRebirth,
  onBuyUp,
}: {
  save: SaveState;
  onClose: () => void;
  onRebirth: () => void;
  onBuyUp: (key: GlobalUpKey) => void;
}) {
  const canRebirth = save.stage >= PRESTIGE_UNLOCK_STAGE;
  const gain = essenceForRebirth(save.stage);
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm sm:items-center sm:justify-center" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border-4 border-[#f5c542] bg-gradient-to-b from-[#1a0d3a] to-[#2b1560] p-5 text-[#e8ecf1] shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl text-[#f5c542]" style={{ fontFamily: "'Lilita One', cursive" }}>
            🌟 Rebirth
          </h2>
          <button onClick={onClose} className="rounded-full border border-[#f5c542]/40 px-3 py-1 text-xs text-[#f5c542]">
            Fechar
          </button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl border-2 border-[#f5c542]/40 bg-black/30 px-3 py-2 text-center text-xs">
          <div><div className="text-[10px] opacity-70">Prestígio</div><b className="text-[#f5c542]">{save.prestigeLevel}</b></div>
          <div><div className="text-[10px] opacity-70">Essência ✨</div><b className="text-[#f5c542]">{fmt(save.essence)}</b></div>
          <div><div className="text-[10px] opacity-70">Recorde</div><b className="text-[#f5c542]">Etp {save.maxStage}</b></div>
        </div>

        <div className="mb-3 rounded-lg border border-[#f5c542]/30 bg-[#f5c542]/10 p-3 text-xs">
          <b>Como funciona:</b> ao atingir o estágio {PRESTIGE_UNLOCK_STAGE}+, você pode renascer.
          Perde progresso de nível, atributos, ouro e equipamentos, mas ganha <b>Essência ✨</b>
          para comprar bônus permanentes que aceleram cada nova jornada.
          <div className="mt-2 opacity-80">Cristais 💎 e melhorias globais são mantidos.</div>
        </div>

        <button
          onClick={() => { if (canRebirth) { onRebirth(); onClose(); } }}
          disabled={!canRebirth}
          className={`mb-4 w-full rounded-xl border-4 py-3 text-sm ${
            canRebirth
              ? "border-[#f5c542] bg-gradient-to-b from-[#f5c542] to-[#d4a02a] text-[#1a0d3a] shadow-[0_4px_0_#8a6a1a] active:translate-y-[2px] active:shadow-[0_2px_0_#8a6a1a]"
              : "border-slate-600 bg-slate-800 text-slate-500"
          }`}
          style={{ fontFamily: "'Lilita One', cursive" }}
        >
          {canRebirth
            ? `🌟 Renascer agora — +${gain} ✨`
            : `🔒 Alcance o estágio ${PRESTIGE_UNLOCK_STAGE} (${save.stage}/${PRESTIGE_UNLOCK_STAGE})`}
        </button>

        <h3 className="mb-2 text-sm text-[#f5c542]" style={{ fontFamily: "'Lilita One', cursive" }}>
          Melhorias Permanentes
        </h3>
        <div className="space-y-2">
          {(Object.keys(GLOBAL_UP_DEFS) as GlobalUpKey[]).map((key) => {
            const def = GLOBAL_UP_DEFS[key];
            const lvl = save.globalUp[key] ?? 0;
            const cost = globalUpCost(key, lvl);
            const cur = lvl * def.perLevel;
            const maxed = lvl >= def.max;
            const cant = save.essence < cost;
            return (
              <div key={key} className="flex items-center gap-3 rounded-xl border-2 border-[#f5c542]/30 bg-black/30 p-2">
                <div className="text-2xl">{def.icon}</div>
                <div className="flex-1">
                  <div className="text-xs text-[#f5c542]" style={{ fontFamily: "'Lilita One', cursive" }}>
                    {def.label} <span className="text-[10px] opacity-70">Lv {lvl}/{def.max}</span>
                  </div>
                  <div className="text-[10px] opacity-80">
                    Atual: +{def.suffix === "%" ? Math.round(cur * 100) : cur}{def.suffix ?? ""}
                  </div>
                </div>
                <button
                  onClick={() => onBuyUp(key)}
                  disabled={maxed || cant}
                  className={`rounded-lg border-2 px-2 py-1 text-[11px] ${
                    maxed || cant
                      ? "border-slate-600 bg-slate-800 text-slate-500"
                      : "border-[#f5c542] bg-gradient-to-b from-[#f5c542] to-[#d4a02a] text-[#1a0d3a]"
                  }`}
                  style={{ fontFamily: "'Lilita One', cursive" }}
                >
                  {maxed ? "MAX" : `✨ ${cost}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------- Crystals Modal (pacotes mock) --------
function CrystalsModal({
  save,
  onClose,
  onBuy,
}: {
  save: SaveState;
  onClose: () => void;
  onBuy: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm sm:items-center sm:justify-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-4 border-emerald-400 bg-gradient-to-b from-[#0a1c3a] to-[#0d2b4a] p-5 text-[#e8ecf1] shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl text-emerald-300" style={{ fontFamily: "'Lilita One', cursive" }}>
            💎 Cristais
          </h2>
          <button onClick={onClose} className="rounded-full border border-emerald-400/40 px-3 py-1 text-xs text-emerald-300">
            Fechar
          </button>
        </div>

        <div className="mb-3 rounded-xl border-2 border-emerald-400/40 bg-black/30 px-3 py-2 text-sm">
          💎 Saldo: <b className="text-emerald-300">{fmt(save.gems)}</b>
        </div>

        <p className="mb-3 rounded-lg border border-amber-400/40 bg-amber-500/10 p-2 text-[11px] text-amber-200">
          ⚠️ <b>Beta:</b> os pacotes abaixo são <b>gratuitos</b> por enquanto (mock).
          Preços em R$ são apenas de referência para a monetização final via Google Play / Stripe.
        </p>

        <div className="space-y-2">
          {CRYSTAL_PACKS.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border-2 border-emerald-400/30 bg-[#0a1c3a]/70 p-3">
              <div className="text-3xl">💎</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-emerald-300" style={{ fontFamily: "'Lilita One', cursive" }}>
                  {p.gems} cristais
                  {p.bonus > 0 && <span className="rounded-full bg-emerald-400 px-2 py-[1px] text-[9px] uppercase text-[#0a1c3a]">+{p.bonus} bônus</span>}
                  {p.tag && <span className="rounded-full bg-amber-400 px-2 py-[1px] text-[9px] uppercase text-[#0a1c3a]">{p.tag}</span>}
                </div>
                <div className="text-[11px] opacity-70">R$ {p.priceBRL.toFixed(2).replace(".", ",")}</div>
              </div>
              <button
                onClick={() => onBuy(p.id)}
                className="rounded-lg border-2 border-emerald-400 bg-gradient-to-b from-emerald-400 to-emerald-600 px-3 py-2 text-xs text-[#0a1c3a]"
                style={{ fontFamily: "'Lilita One', cursive" }}
              >
                RESGATAR
              </button>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[10px] opacity-50">
          Filosofia: <b>Pay-to-Fast</b>. Todo jogador free tem acesso ao mesmo teto de poder.
        </p>
      </div>
    </div>
  );
}

// -------- Daily / Streak / Free Chests Modal --------
function DailyModal({
  save,
  onClose,
  onClaimDaily,
  onClaimStreak,
  onClaimChest,
}: {
  save: SaveState;
  onClose: () => void;
  onClaimDaily: () => void;
  onClaimStreak: (m: number) => void;
  onClaimChest: (tier: "free" | "rare") => void;
}) {
  const today = todayKey();
  const claimedToday = save.daily.lastClaimDay === today;
  const now = Date.now();
  const freeLeft = Math.max(0, FREE_CHEST_MS - (now - save.freeChest.lastFreeAt));
  const rareLeft = Math.max(0, RARE_CHEST_MS - (now - save.freeChest.lastRareAt));
  const fmtCd = (ms: number) => {
    if (ms <= 0) return "PRONTO";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>📅 Diário</h2>
          <div className="text-xs opacity-70">🔥 Streak: <b className="text-[#f5c542]">{save.daily.streak}d</b> · Melhor: {save.daily.bestStreak}d</div>
        </div>

        {/* Ciclo de 7 dias */}
        <div className="mb-3 rounded-xl border-2 border-[#1A0F08] bg-[#2A1810] p-2">
          <div className="mb-2 text-[11px] opacity-80">Login diário (7 dias) — próximo: <b>Dia {save.daily.cycleDay + 1}</b></div>
          <div className="grid grid-cols-7 gap-1">
            {DAILY_CYCLE.map((r, i) => {
              const isNext = i === save.daily.cycleDay && !claimedToday;
              const isDone = i < save.daily.cycleDay || (i === save.daily.cycleDay && claimedToday);
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center rounded-lg border-2 p-1 text-center text-[9px] ${
                    isNext ? "border-[#f5c542] bg-[#5D4037] animate-pulse" : isDone ? "border-emerald-700 bg-emerald-950/50 opacity-60" : "border-[#1A0F08] bg-[#3E2723]"
                  }`}
                >
                  <div className="text-lg">{r.icon}</div>
                  <div className="opacity-70">D{i + 1}</div>
                  {isDone && <div className="text-emerald-400">✓</div>}
                </div>
              );
            })}
          </div>
          <button
            onClick={onClaimDaily}
            disabled={claimedToday}
            className={`mt-2 w-full rounded-lg border-2 border-[#1A0F08] py-2 text-sm font-black ${
              claimedToday ? "bg-[#3E2723] opacity-50" : "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950 active:translate-y-0.5"
            }`}
          >
            {claimedToday ? "✅ Reivindicado hoje" : `Reivindicar ${DAILY_CYCLE[save.daily.cycleDay].label}`}
          </button>
        </div>

        {/* Streak marcos */}
        <div className="mb-3 rounded-xl border-2 border-[#1A0F08] bg-[#2A1810] p-2">
          <div className="mb-2 text-[11px] opacity-80">🔥 Marcos de Streak</div>
          <div className="grid grid-cols-5 gap-1">
            {STREAK_MILESTONES.map((m) => {
              const claimed = save.daily.streakClaimed.includes(m);
              const ready = save.daily.streak >= m && !claimed;
              const r = streakRewardFor(m);
              return (
                <button
                  key={m}
                  onClick={() => onClaimStreak(m)}
                  disabled={!ready}
                  className={`flex flex-col items-center rounded-lg border-2 p-1 text-[9px] ${
                    claimed ? "border-emerald-700 bg-emerald-950/50 opacity-50"
                      : ready ? "border-[#f5c542] bg-[#5D4037] animate-pulse"
                      : "border-[#1A0F08] bg-[#3E2723] opacity-60"
                  }`}
                >
                  <div className="text-sm font-black">{m}d</div>
                  <div className="opacity-80">🪙{fmt(r.gold)}</div>
                  <div className="opacity-80">💎{r.gems}{r.essence ? ` ✨${r.essence}` : ""}</div>
                  {claimed && <div className="text-emerald-400">✓</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Baús grátis */}
        <div className="mb-3 rounded-xl border-2 border-[#1A0F08] bg-[#2A1810] p-2">
          <div className="mb-2 text-[11px] opacity-80">🎁 Baús gratuitos</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onClaimChest("free")}
              disabled={freeLeft > 0}
              className={`rounded-lg border-2 border-[#1A0F08] p-2 text-xs ${freeLeft <= 0 ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950" : "bg-[#3E2723] opacity-60"}`}
            >
              <div className="text-2xl">📦</div>
              <div className="font-black">Baú Grátis</div>
              <div className="opacity-80">{fmtCd(freeLeft)}</div>
              <div className="opacity-60">a cada 4h</div>
            </button>
            <button
              onClick={() => onClaimChest("rare")}
              disabled={rareLeft > 0}
              className={`rounded-lg border-2 border-[#1A0F08] p-2 text-xs ${rareLeft <= 0 ? "bg-gradient-to-b from-purple-400 to-purple-600 text-white" : "bg-[#3E2723] opacity-60"}`}
            >
              <div className="text-2xl">🎁</div>
              <div className="font-black">Baú Raro</div>
              <div className="opacity-80">{fmtCd(rareLeft)}</div>
              <div className="opacity-60">a cada 24h</div>
            </button>
          </div>
        </div>

        <button onClick={onClose} className="w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Offline Rewards Modal --------
function OfflineModal({
  report,
  onClose,
}: {
  report: { ms: number; gold: number; xp: number; drops: number };
  onClose: () => void;
}) {
  const h = Math.floor(report.ms / 3600000);
  const m = Math.floor((report.ms % 3600000) / 60000);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border-4 border-[#8B4513] bg-gradient-to-b from-[#5D4037] to-[#3E2723] p-5 text-center text-amber-100"
      >
        <div className="text-4xl">🌙</div>
        <h2 className="mt-1 text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>Bem-vindo de volta!</h2>
        <p className="mt-1 text-xs opacity-80">Seu herói continuou lutando por {h > 0 ? `${h}h ` : ""}{m}m</p>
        <div className="mt-3 space-y-1 rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-3 text-sm">
          <div>🪙 +{fmt(report.gold)} ouro</div>
          <div>✨ +{fmt(report.xp)} XP</div>
          {report.drops > 0 && <div>📦 +{report.drops} equipamentos</div>}
        </div>
        <p className="mt-2 text-[10px] opacity-60">Limite offline: 8h (Fase beta)</p>
        <button
          onClick={onClose}
          className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] py-2 font-black text-amber-950 active:translate-y-0.5"
        >
          Coletar
        </button>
      </div>
    </div>
  );
}
