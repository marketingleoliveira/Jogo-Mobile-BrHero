// Mock store for Admin CMS - Balancing module.
// Ainda não conectado a Supabase. Persiste em localStorage.
import { guard } from "./rbac";
import { logAction } from "./audit-central";


export interface CurveConfig {
  base: number;       // valor no nível/estágio 1
  growth: number;     // fator multiplicativo por nível
  exponent: number;   // curva: base * growth^lvl * lvl^exponent
}

export interface CostConfig {
  base: number;
  growth: number;
}

export interface RebirthRewards {
  essencePerRebirth: number;
  goldMultiplier: number;
  xpMultiplier: number;
}

export interface BalancingConfig {
  xpCurve: CurveConfig;
  goldCurve: CurveConfig;
  enemyScale: CurveConfig;
  bossScale: CurveConfig;
  towerScale: CurveConfig;
  arenaScale: CurveConfig;
  dungeonScale: CurveConfig;
  upgradeCost: CostConfig;
  petCost: CostConfig;
  runeCost: CostConfig;
  rebirth: RebirthRewards;
}

export interface BalancingAuditLog {
  id: string;
  date: string;
  admin: string;
  section: keyof BalancingConfig;
  before: unknown;
  after: unknown;
  reason: string;
}

const STORAGE_KEY = "brhero_admin_balancing_v1";
const CURRENT_ADMIN = "GM.Root";

export const DEFAULT_CONFIG: BalancingConfig = {
  xpCurve:      { base: 100,  growth: 1.15, exponent: 1.05 },
  goldCurve:    { base: 50,   growth: 1.12, exponent: 1.02 },
  enemyScale:   { base: 100,  growth: 1.10, exponent: 1.00 },
  bossScale:    { base: 1000, growth: 1.18, exponent: 1.10 },
  towerScale:   { base: 500,  growth: 1.08, exponent: 1.05 },
  arenaScale:   { base: 300,  growth: 1.06, exponent: 1.00 },
  dungeonScale: { base: 200,  growth: 1.09, exponent: 1.02 },
  upgradeCost:  { base: 25,   growth: 1.14 },
  petCost:      { base: 500,  growth: 1.20 },
  runeCost:     { base: 750,  growth: 1.22 },
  rebirth:      { essencePerRebirth: 5, goldMultiplier: 1.5, xpMultiplier: 1.25 },
};

interface Store { config: BalancingConfig; logs: BalancingAuditLog[]; }

const now = () => new Date().toISOString();

function load(): Store {
  if (typeof window === "undefined") return { config: DEFAULT_CONFIG, logs: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      // merge defaults for forward-compat
      return { config: { ...DEFAULT_CONFIG, ...parsed.config }, logs: parsed.logs ?? [] };
    }
  } catch { /* ignore */ }
  const s: Store = { config: DEFAULT_CONFIG, logs: [] };
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

export function subscribeBalancing(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function getBalancing() { return store.config; }
export function getBalancingLogs() { return store.logs; }

function pushLog(entry: Omit<BalancingAuditLog, "id" | "date" | "admin">) {
  store.logs = [
    { id: `L-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: now(), admin: CURRENT_ADMIN, ...entry },
    ...store.logs,
  ].slice(0, 500);
}

export const balancingActions = {
  updateSection<K extends keyof BalancingConfig>(
    section: K,
    next: BalancingConfig[K],
    reason: string,
  ) {
    if (!reason.trim()) throw new Error("Motivo obrigatório");
    const before = store.config[section];
    store.config = { ...store.config, [section]: next };
    pushLog({ section, before, after: next, reason: reason.trim() });
    emit();
  },
  resetAll(reason: string) {
    if (!reason.trim()) throw new Error("Motivo obrigatório");
    const before = store.config;
    store.config = DEFAULT_CONFIG;
    pushLog({ section: "xpCurve", before, after: DEFAULT_CONFIG, reason: `RESET GLOBAL — ${reason.trim()}` });
    emit();
  },
};

// ----- Curve helpers -----
export const curveValue = (c: CurveConfig, lvl: number) =>
  c.base * Math.pow(c.growth, Math.max(0, lvl - 1)) * Math.pow(Math.max(1, lvl), c.exponent);

export const costValue = (c: CostConfig, lvl: number) =>
  c.base * Math.pow(c.growth, Math.max(0, lvl - 1));

// ----- Simulator -----
export interface SimulatorInput {
  level: number;
  stage: number;
  rebirth: number;
  pet: number;      // nível do pet (0 = sem pet)
  runes: number;    // nível médio das runas
  guild: number;    // bônus % de guilda (0..100)
  blessings: number;// bônus % de bênçãos (0..100)
}

export interface SimulatorResult {
  heroPower: number;
  killEnemyMs: number;
  killBossMs: number;
  goldPerHour: number;
  xpPerHour: number;
  difficulty: "Fácil" | "Normal" | "Difícil" | "Impossível";
  ratio: number; // heroPower / enemyHp
}

export function simulate(cfg: BalancingConfig, input: SimulatorInput): SimulatorResult {
  const lvl = Math.max(1, input.level);
  const stage = Math.max(1, input.stage);
  const rb = Math.max(0, input.rebirth);

  const petBonus   = 1 + input.pet * 0.03;
  const runeBonus  = 1 + input.runes * 0.04;
  const guildBonus = 1 + input.guild / 100;
  const blessBonus = 1 + input.blessings / 100;
  const rebirthAtk = 1 + rb * (cfg.rebirth.goldMultiplier - 1) * 0.5;

  // Poder do herói (mock): ATK base ~ curva de ouro do level
  const baseAtk = curveValue(cfg.goldCurve, lvl) * 4;
  const heroPower = baseAtk * petBonus * runeBonus * guildBonus * blessBonus * rebirthAtk;

  const enemyHp = curveValue(cfg.enemyScale, stage);
  const bossHp  = curveValue(cfg.bossScale, stage);

  // dps ~ heroPower / 2s
  const dps = heroPower / 2;
  const killEnemyMs = Math.max(50, (enemyHp / dps) * 1000);
  const killBossMs  = Math.max(200, (bossHp  / dps) * 1000);

  const goldPerKill = curveValue(cfg.goldCurve, stage);
  const xpPerKill   = curveValue(cfg.xpCurve,   stage);
  const killsPerHour = 3600_000 / killEnemyMs;

  const goldPerHour = goldPerKill * killsPerHour
    * (1 + rb * (cfg.rebirth.goldMultiplier - 1))
    * guildBonus * blessBonus;
  const xpPerHour = xpPerKill * killsPerHour
    * (1 + rb * (cfg.rebirth.xpMultiplier - 1))
    * blessBonus;

  const ratio = heroPower / enemyHp;
  let difficulty: SimulatorResult["difficulty"];
  if (ratio > 5) difficulty = "Fácil";
  else if (ratio > 1.5) difficulty = "Normal";
  else if (ratio > 0.6) difficulty = "Difícil";
  else difficulty = "Impossível";

  return { heroPower, killEnemyMs, killBossMs, goldPerHour, xpPerHour, difficulty, ratio };
}
