// Hero Rise — MVP game engine (client-side, localStorage)

export type Rarity = "common" | "uncommon" | "rare" | "epic";

export type Equipment = {
  id: string;
  name: string;
  slot: "weapon" | "armor" | "trinket";
  rarity: Rarity;
  atk: number;
  def: number;
  hp: number;
  equipped: boolean;
};

export type Mission = {
  id: string;
  label: string;
  goal: number;
  progress: number;
  reward: { coins: number; crystals: number; xp: number };
  claimed: boolean;
};

export type Achievement = {
  id: string;
  label: string;
  goal: number;
  progress: number;
  reward: { coins: number; crystals: number };
  claimed: boolean;
};

export type Hero = {
  name: string;
  level: number;
  xp: number;
  baseAtk: number;
  baseDef: number;
  baseHp: number;
  speed: number;
  crit: number; // percent
};

export type GameState = {
  hero: Hero;
  stage: number;
  coins: number;
  crystals: number;
  energy: number;
  maxEnergy: number;
  lastEnergyTick: number; // ms
  inventory: Equipment[];
  missions: Mission[];
  achievements: Achievement[];
  unlocked: {
    equipment: boolean;
    upgrades: boolean;
    missions: boolean;
    chests: boolean;
    arena: boolean;
    clan: boolean;
    multiplayer: boolean;
  };
  stats: {
    battlesWon: number;
    bossesDefeated: number;
    coinsEarned: number;
    chestsOpened: number;
  };
  version: number;
};

const STORAGE_KEY = "hero-rise-save-v1";
export const ENERGY_REGEN_MS = 60_000; // 1 energy per minute

export function xpForLevel(level: number): number {
  return Math.floor(20 * Math.pow(level, 1.5));
}

export function enemyForStage(stage: number) {
  const isBoss = stage % 5 === 0;
  const mult = isBoss ? 2.4 : 1;
  const hp = Math.floor((30 + stage * 14) * mult);
  const atk = Math.floor((5 + stage * 2.2) * mult);
  const def = Math.floor((2 + stage * 0.9) * mult);
  const coins = Math.floor((8 + stage * 3) * (isBoss ? 3 : 1));
  const xp = Math.floor((12 + stage * 4) * (isBoss ? 2.5 : 1));
  const crystals = isBoss ? Math.max(1, Math.floor(stage / 5)) : 0;
  return {
    name: isBoss ? `Chefe do Estágio ${stage}` : `Inimigo ${stage}`,
    hp,
    atk,
    def,
    coins,
    xp,
    crystals,
    isBoss,
  };
}

export function equippedTotals(inv: Equipment[]) {
  return inv
    .filter((e) => e.equipped)
    .reduce(
      (acc, e) => ({
        atk: acc.atk + e.atk,
        def: acc.def + e.def,
        hp: acc.hp + e.hp,
      }),
      { atk: 0, def: 0, hp: 0 },
    );
}

export function heroTotals(state: GameState) {
  const eq = equippedTotals(state.inventory);
  return {
    atk: state.hero.baseAtk + eq.atk,
    def: state.hero.baseDef + eq.def,
    hp: state.hero.baseHp + eq.hp,
    speed: state.hero.speed,
    crit: state.hero.crit,
  };
}

export function unlocksFor(level: number) {
  return {
    equipment: level >= 2,
    upgrades: level >= 3,
    missions: level >= 5,
    chests: level >= 8,
    arena: level >= 10,
    clan: level >= 15,
    multiplayer: level >= 20,
  };
}

function defaultMissions(): Mission[] {
  return [
    {
      id: "win3",
      label: "Vença 3 batalhas",
      goal: 3,
      progress: 0,
      reward: { coins: 80, crystals: 2, xp: 40 },
      claimed: false,
    },
    {
      id: "win10",
      label: "Vença 10 batalhas",
      goal: 10,
      progress: 0,
      reward: { coins: 250, crystals: 5, xp: 120 },
      claimed: false,
    },
    {
      id: "boss1",
      label: "Derrote 1 chefe",
      goal: 1,
      progress: 0,
      reward: { coins: 300, crystals: 8, xp: 200 },
      claimed: false,
    },
  ];
}

function defaultAchievements(): Achievement[] {
  return [
    {
      id: "first_blood",
      label: "Primeira vitória",
      goal: 1,
      progress: 0,
      reward: { coins: 50, crystals: 1 },
      claimed: false,
    },
    {
      id: "rich",
      label: "Acumule 1000 moedas ganhas",
      goal: 1000,
      progress: 0,
      reward: { coins: 200, crystals: 3 },
      claimed: false,
    },
    {
      id: "slayer",
      label: "Derrote 25 inimigos",
      goal: 25,
      progress: 0,
      reward: { coins: 400, crystals: 5 },
      claimed: false,
    },
    {
      id: "boss_hunter",
      label: "Derrote 5 chefes",
      goal: 5,
      progress: 0,
      reward: { coins: 600, crystals: 10 },
      claimed: false,
    },
  ];
}

export function newGame(): GameState {
  return {
    hero: {
      name: "Herói",
      level: 1,
      xp: 0,
      baseAtk: 10,
      baseDef: 4,
      baseHp: 60,
      speed: 10,
      crit: 5,
    },
    stage: 1,
    coins: 0,
    crystals: 5,
    energy: 20,
    maxEnergy: 20,
    lastEnergyTick: Date.now(),
    inventory: [],
    missions: defaultMissions(),
    achievements: defaultAchievements(),
    unlocked: unlocksFor(1),
    stats: {
      battlesWon: 0,
      bossesDefeated: 0,
      coinsEarned: 0,
      chestsOpened: 0,
    },
    version: 1,
  };
}

export function loadGame(): GameState {
  if (typeof window === "undefined") return newGame();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return newGame();
    const parsed = JSON.parse(raw) as GameState;
    // energy regen since last visit
    const now = Date.now();
    const elapsed = now - (parsed.lastEnergyTick ?? now);
    const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
    if (gained > 0 && parsed.energy < parsed.maxEnergy) {
      parsed.energy = Math.min(parsed.maxEnergy, parsed.energy + gained);
      parsed.lastEnergyTick = now;
    }
    return parsed;
  } catch {
    return newGame();
  }
}

export function saveGame(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function resetGame(): GameState {
  const s = newGame();
  saveGame(s);
  return s;
}

// ---- Equipment generation ----
const RARITY_MULT: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.6,
  rare: 2.4,
  epic: 3.6,
};
const WEAPON_NAMES = ["Adaga", "Espada", "Machado", "Lâmina", "Cimitarra"];
const ARMOR_NAMES = ["Túnica", "Armadura", "Cota de Malha", "Peitoral"];
const TRINKET_NAMES = ["Amuleto", "Anel", "Pingente", "Talismã"];

export function rollEquipment(stage: number): Equipment {
  const r = Math.random();
  const rarity: Rarity =
    r < 0.6 ? "common" : r < 0.87 ? "uncommon" : r < 0.98 ? "rare" : "epic";
  const slotR = Math.random();
  const slot: Equipment["slot"] =
    slotR < 0.5 ? "weapon" : slotR < 0.8 ? "armor" : "trinket";
  const mult = RARITY_MULT[rarity];
  const base = 2 + stage * 0.8;
  const name =
    slot === "weapon"
      ? WEAPON_NAMES[Math.floor(Math.random() * WEAPON_NAMES.length)]
      : slot === "armor"
        ? ARMOR_NAMES[Math.floor(Math.random() * ARMOR_NAMES.length)]
        : TRINKET_NAMES[Math.floor(Math.random() * TRINKET_NAMES.length)];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: `${name} ${rarity === "common" ? "" : `(${rarity})`}`.trim(),
    slot,
    rarity,
    atk: slot === "weapon" ? Math.floor(base * mult) : Math.floor(base * mult * 0.2),
    def: slot === "armor" ? Math.floor(base * mult) : Math.floor(base * mult * 0.2),
    hp: slot === "trinket" ? Math.floor(base * mult * 4) : Math.floor(base * mult),
    equipped: false,
  };
}

// ---- Battle simulation (deterministic-ish) ----
export type BattleLog = {
  turn: number;
  attacker: "hero" | "enemy";
  damage: number;
  crit: boolean;
  heroHp: number;
  enemyHp: number;
};

export type BattleResult = {
  win: boolean;
  log: BattleLog[];
  rewards: { xp: number; coins: number; crystals: number; drop?: Equipment };
};

export function simulateBattle(state: GameState): BattleResult {
  const totals = heroTotals(state);
  const enemy = enemyForStage(state.stage);
  let heroHp = totals.hp;
  let enemyHp = enemy.hp;
  const log: BattleLog[] = [];
  let turn = 0;
  const heroFirst = totals.speed >= 10;
  while (heroHp > 0 && enemyHp > 0 && turn < 50) {
    turn++;
    const order: Array<"hero" | "enemy"> = heroFirst
      ? ["hero", "enemy"]
      : ["enemy", "hero"];
    for (const who of order) {
      if (heroHp <= 0 || enemyHp <= 0) break;
      if (who === "hero") {
        const crit = Math.random() * 100 < totals.crit;
        const raw = Math.max(1, totals.atk - enemy.def);
        const dmg = Math.floor(raw * (crit ? 2 : 1) * (0.9 + Math.random() * 0.2));
        enemyHp -= dmg;
        log.push({ turn, attacker: "hero", damage: dmg, crit, heroHp, enemyHp: Math.max(0, enemyHp) });
      } else {
        const raw = Math.max(1, enemy.atk - totals.def);
        const dmg = Math.floor(raw * (0.9 + Math.random() * 0.2));
        heroHp -= dmg;
        log.push({ turn, attacker: "enemy", damage: dmg, crit: false, heroHp: Math.max(0, heroHp), enemyHp });
      }
    }
  }
  const win = enemyHp <= 0 && heroHp > 0;
  const rewards = win
    ? {
        xp: enemy.xp,
        coins: enemy.coins,
        crystals: enemy.crystals,
        drop: Math.random() < (enemy.isBoss ? 1 : 0.25) ? rollEquipment(state.stage) : undefined,
      }
    : { xp: Math.floor(enemy.xp * 0.15), coins: 0, crystals: 0 };
  return { win, log, rewards };
}

export function applyBattleResult(state: GameState, result: BattleResult): GameState {
  const s: GameState = structuredClone(state);
  s.hero.xp += result.rewards.xp;
  s.coins += result.rewards.coins;
  s.crystals += result.rewards.crystals;
  s.stats.coinsEarned += result.rewards.coins;
  if (result.rewards.drop) s.inventory.push(result.rewards.drop);
  if (result.win) {
    s.stats.battlesWon += 1;
    const enemy = enemyForStage(s.stage);
    if (enemy.isBoss) s.stats.bossesDefeated += 1;
    s.stage += 1;
    // mission progress
    for (const m of s.missions) {
      if (m.claimed) continue;
      if (m.id === "win3" || m.id === "win10") m.progress = Math.min(m.goal, m.progress + 1);
      if (m.id === "boss1" && enemy.isBoss) m.progress = Math.min(m.goal, m.progress + 1);
    }
    for (const a of s.achievements) {
      if (a.claimed) continue;
      if (a.id === "first_blood" || a.id === "slayer") a.progress = Math.min(a.goal, a.progress + 1);
      if (a.id === "boss_hunter" && enemy.isBoss) a.progress = Math.min(a.goal, a.progress + 1);
    }
  }
  // achievement: coins earned
  const richA = s.achievements.find((a) => a.id === "rich");
  if (richA && !richA.claimed) richA.progress = Math.min(richA.goal, s.stats.coinsEarned);

  // Level up loop
  while (s.hero.xp >= xpForLevel(s.hero.level)) {
    s.hero.xp -= xpForLevel(s.hero.level);
    s.hero.level += 1;
    s.hero.baseAtk += 2;
    s.hero.baseDef += 1;
    s.hero.baseHp += 12;
    s.maxEnergy += 1;
    s.energy = s.maxEnergy;
  }
  s.unlocked = unlocksFor(s.hero.level);
  return s;
}

// Upgrade costs
export function upgradeCost(stat: "atk" | "def" | "hp" | "speed" | "crit", hero: Hero): number {
  const base = {
    atk: hero.baseAtk * 8,
    def: hero.baseDef * 10,
    hp: hero.baseHp * 2,
    speed: hero.speed * 15,
    crit: (hero.crit + 1) * 30,
  } as const;
  return Math.max(20, Math.floor(base[stat]));
}
