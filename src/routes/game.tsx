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
  version: number;
};

const STORAGE_KEY = "hero-rise-idle-v3";

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
  return Math.floor(d.costBase * Math.pow(d.costMul, level));
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

// Enemy for stage
function enemyForStage(stage: number) {
  const isBoss = stage % 10 === 0;
  const mult = isBoss ? 4 : 1;
  const hp = Math.floor((80 + stage * 45 + Math.pow(stage, 1.6) * 4) * mult);
  const atk = Math.floor((6 + stage * 3 + Math.pow(stage, 1.35)) * mult);
  const def = Math.floor(2 + stage * 0.7);
  const gold = Math.floor((10 + stage * 6) * (isBoss ? 6 : 1));
  const xp = Math.floor((14 + stage * 5) * (isBoss ? 5 : 1));
  const gems = isBoss ? Math.max(1, Math.floor(stage / 10)) : 0;
  return { hp, atk, def, gold, xp, gems, isBoss };
}

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
    version: 3,
  };
}

function loadSave(): SaveState {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 3) return defaultSave();
    const base = defaultSave();
    for (const k of ATTR_ORDER) {
      if (!parsed.attrs?.[k]) parsed.attrs[k] = { level: 0 };
    }
    if (!parsed.equipment) parsed.equipment = emptyEquipment();
    if (!Array.isArray(parsed.inventory)) parsed.inventory = [];
    if (typeof parsed.pvpWins !== "number") parsed.pvpWins = 0;
    return { ...base, ...parsed, attrs: parsed.attrs };

  } catch {
    return defaultSave();
  }
}

// -------- Route --------
export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Hero Rise Idle — RPG Mobile" },
      {
        name: "description",
        content:
          "Idle RPG mobile vertical. Batalha automática, evolução constante de atributos e progressão viciante.",
      },
      { property: "og:title", content: "Hero Rise Idle — RPG Mobile" },
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
  const [modal, setModal] = useState<"equip" | "arena" | null>(null);
  const prevLevelRef = useRef(1);


  // Init
  useEffect(() => {
    const s = loadSave();
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
    // rewards
    let level = cur.level;
    let xp = cur.xp + enemy.xp;
    while (xp >= xpForLevel(level)) {
      xp -= xpForLevel(level);
      level += 1;
    }
    // loot: bosses always drop, normal enemies 12% chance (once equipment is unlocked)
    const canDrop = level >= 3 || cur.level >= 3;
    const drop = canDrop && (enemy.isBoss || Math.random() < 0.12)
      ? rollItem(SLOTS[Math.floor(Math.random() * SLOTS.length)].key, cur.stage)
      : null;
    if (drop) flashToast(`📦 ${drop.rarity} ${SLOTS.find(s => s.key === drop.slot)!.label}`);
    const next: SaveState = {
      ...cur,
      xp,
      level,
      gold: cur.gold + enemy.gold,
      gems: cur.gems + enemy.gems,
      stage: cur.stage + 1,
      inventory: drop ? [...cur.inventory, drop].slice(-60) : cur.inventory,
    };
    setSave(next);
    saveRef.current = next;

    // new enemy
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



  const stats = useMemo(() => (save ? computeStats(save) : null), [save]);
  const biome = useMemo(() => biomeFor(save?.stage ?? 1), [save?.stage]);
  const nextUnlock = useMemo(
    () => UNLOCKS.find((u) => u.level > (save?.level ?? 1)),
    [save?.level],
  );

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
              <CartoonPill
                color="emerald"
                icon={<div className="h-3.5 w-3 rounded-full bg-emerald-400 shadow-[inset_-1px_-1px_0_rgba(0,0,0,0.3)]" />}
                value={fmt(save.gems)}
              />
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full border-2 border-[#1A0F08] bg-[#1A0F08]">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-yellow-400 transition-all"
                style={{ width: `${(save.xp / xpNeed) * 100}%` }}
              />
            </div>
          </div>

          {/* VIP/Pass stack */}
          <div className="flex flex-col gap-1">
            <QuickCartoonBtn icon={<Crown className="h-3 w-3" />} label="TOP" onClick={() => flashToast("VIP em breve")} />
            <QuickCartoonBtn icon={<Ticket className="h-3 w-3" />} label="PASS" onClick={() => flashToast("Passe em breve")} />
          </div>
        </div>
      </header>

      {/* ===== Battle arena ===== */}
      <section
        className={`relative h-56 overflow-hidden bg-gradient-to-b ${biome.bg} border-b-4 border-[#1A0F08]`}
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
        <style>{`@keyframes floatUp{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-40px);opacity:0}}`}</style>
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
        <TabBtn active label="STAT" />
        <TabBtn label="BLESSING" locked />
        <TabBtn label="LIMITLESS" locked />
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
              className="flex items-center gap-3 rounded-3xl border-t-4 border-b-4 border-t-[#795548] border-b-[#1A0F08] bg-[#5D4037] p-2 shadow-lg"
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
          label="Hero"
          onClick={() => setModal("equip")}
          badge={save.inventory.length || undefined}
        />
        <TabBarItem
          icon="✨"
          label="Skill"
          onClick={() => flashToast("Skills — auto")}
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
            BATTLE
          </span>
        </button>
        <TabBarItem
          icon="🏰"
          label="Dungeon"
          locked={save.level < 10}
          unlockLv={10}
          onClick={() => flashToast("Dungeon em breve")}
        />
        <TabBarItem
          icon="🛒"
          label="Store"
          locked={save.level < 50}
          unlockLv={50}
          onClick={() => setModal("arena")}
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
  return {
    atk: attrValue("atk", s.attrs.atk.level) + eq.atk,
    hp: attrValue("hp", s.attrs.hp.level) + eq.hp,
    regen: attrValue("regen", s.attrs.regen.level),
    critDmg: attrValue("critDmg", s.attrs.critDmg.level),
    critChance: attrValue("critChance", s.attrs.critChance.level),
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
