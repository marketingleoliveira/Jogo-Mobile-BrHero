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
    const next: SaveState = {
      ...cur,
      xp,
      level,
      gold: cur.gold + enemy.gold,
      gems: cur.gems + enemy.gems,
      stage: cur.stage + 1,
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

  const stats = useMemo(() => (save ? computeStats(save) : null), [save]);
  const biome = useMemo(() => biomeFor(save?.stage ?? 1), [save?.stage]);
  const nextUnlock = useMemo(
    () => UNLOCKS.find((u) => u.level > (save?.level ?? 1)),
    [save?.level],
  );

  if (!save || !stats || !enemyRef.current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Carregando…
      </div>
    );
  }

  const enemy = enemyRef.current;
  const xpNeed = xpForLevel(save.level);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-950 text-slate-100 select-none">
      {/* ===== Top HUD ===== */}
      <header className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        {/* Row 1: avatar + level + xp + home */}
        <div className="flex items-center gap-2 px-3 pt-2">
          <Link
            to="/"
            aria-label="Início"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-slate-900 shadow ring-2 ring-amber-300/40"
          >
            <Home className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-sm font-black truncate ${
                  levelFlash ? "animate-pulse text-amber-300" : ""
                }`}
              >
                Herói · Lv {save.level}
              </span>
              <span className="text-[10px] text-slate-400 tabular-nums">
                {save.xp}/{xpNeed} XP
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all"
                style={{ width: `${(save.xp / xpNeed) * 100}%` }}
              />
            </div>
          </div>
        </div>
        {/* Row 2: currencies + stage */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 px-3 py-2 text-xs">
          <Pill icon={<Coins className="h-3.5 w-3.5 text-amber-400" />} value={fmt(save.gold)} />
          <Pill icon={<Gem className="h-3.5 w-3.5 text-fuchsia-400" />} value={fmt(save.gems)} />
          <Pill
            icon={<Trophy className="h-3.5 w-3.5 text-sky-400" />}
            value={`Fase ${save.stage}`}
          />
        </div>
        {/* Row 3: quick actions VIP / Pass / Events */}
        <div className="flex items-center gap-2 px-3 pb-2">
          <QuickBtn
            icon={<Crown className="h-3.5 w-3.5" />}
            label="VIP"
            onClick={() => flashToast("VIP em breve")}
          />
          <QuickBtn
            icon={<Ticket className="h-3.5 w-3.5" />}
            label="Passe"
            onClick={() => flashToast("Passe em breve")}
          />
          <QuickBtn
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Eventos"
            onClick={() => flashToast("Eventos em breve")}
          />
        </div>
      </header>

      {/* ===== Battle arena ===== */}
      <section
        className={`relative h-64 overflow-hidden bg-gradient-to-b ${biome.bg}`}
        aria-label="Campo de batalha"
      >
        {/* biome label */}
        <div className="absolute left-2 top-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80">
          {biome.name}
        </div>
        {/* stage badge */}
        <div className="absolute right-2 top-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white/80">
          {enemy.isBoss ? "👑 CHEFE" : `Estágio ${save.stage}`}
        </div>

        {/* clouds/particles (simple) */}
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <div className="absolute left-4 top-8 h-4 w-16 rounded-full bg-white blur-md" />
          <div className="absolute right-8 top-14 h-3 w-10 rounded-full bg-white blur-md" />
        </div>

        {/* Hero */}
        <div
          className={`absolute bottom-14 left-6 flex flex-col items-center ${
            heroHit ? "translate-x-1" : ""
          } transition-transform`}
        >
          <div className="text-5xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">🧝‍♂️</div>
          <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all"
              style={{ width: `${(heroHp / stats.hp) * 100}%` }}
            />
          </div>
          <div className="mt-0.5 text-[9px] tabular-nums text-white/80">
            {fmt(heroHp)}/{fmt(stats.hp)}
          </div>
        </div>

        {/* Enemy */}
        <div
          className={`absolute bottom-14 right-6 flex flex-col items-center ${
            enemyHit ? "-translate-x-1" : ""
          } ${enemyDying ? "opacity-0 scale-50" : ""} transition-all duration-200`}
        >
          <div
            className={`drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] ${
              enemy.isBoss ? "text-6xl" : "text-5xl"
            }`}
          >
            {enemy.isBoss ? "🐲" : pickEnemyEmoji(save.stage)}
          </div>
          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-red-400 transition-all"
              style={{ width: `${(enemyHp / enemy.hp) * 100}%` }}
            />
          </div>
          <div className="mt-0.5 text-[9px] tabular-nums text-white/80">
            {fmt(enemyHp)}/{fmt(enemy.hp)}
          </div>
        </div>

        {/* ground */}
        <div className={`absolute bottom-0 left-0 right-0 h-14 ${biome.ground} opacity-70`} />

        {/* damage numbers */}
        {damages.map((d) => (
          <span
            key={d.id}
            className={`pointer-events-none absolute animate-[floatUp_0.9s_ease-out_forwards] text-sm font-black tabular-nums drop-shadow ${
              d.from === "hero"
                ? d.crit
                  ? "text-yellow-300 text-lg"
                  : "text-white"
                : "text-rose-400"
            }`}
            style={{ left: `${d.x}%`, top: `${d.y}%` }}
          >
            {d.crit ? `✦${d.value}` : d.value}
          </span>
        ))}
        <style>{`@keyframes floatUp{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-32px);opacity:0}}`}</style>
      </section>

      {/* ===== Skill bar ===== */}
      <section className="grid grid-cols-4 gap-2 border-b border-slate-800 bg-slate-900/60 px-3 py-2">
        {SKILLS.map((sk, i) => {
          const locked = save.level < sk.unlock;
          return (
            <button
              key={sk.name}
              disabled={locked}
              onClick={() => flashToast(`${sk.name} (auto)`)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-[10px] font-semibold ${
                locked
                  ? "border-slate-800 bg-slate-900 text-slate-600"
                  : i === 3
                    ? "border-amber-400/60 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 animate-pulse"
                    : "border-slate-700 bg-slate-800 text-slate-100"
              }`}
            >
              {locked ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span className="mt-0.5">Lv {sk.unlock}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span className="mt-0.5 truncate">{sk.name}</span>
                </>
              )}
            </button>
          );
        })}
      </section>

      {/* ===== Next unlock strip ===== */}
      {nextUnlock && (
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/40 px-3 py-1.5 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5">
            {nextUnlock.icon}
            Próximo: <span className="font-semibold text-slate-100">{nextUnlock.label}</span>
          </span>
          <span className="text-slate-500">Lv {nextUnlock.level}</span>
        </div>
      )}

      {/* ===== Attributes panel ===== */}
      <section className="flex-1 space-y-2 px-3 py-3 pb-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Atributos
          </h2>
          <span className="text-[10px] text-slate-500">Toque para evoluir</span>
        </div>
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
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2"
            >
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-800 ${d.color}`}>
                {d.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-semibold text-slate-100">{d.label}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">Lv.{lvl}</span>
                </div>
                <div className="mt-0.5 text-[11px] tabular-nums text-slate-300">
                  <span className="font-bold text-slate-100">{format(cur)}</span>
                  <span className="mx-1 text-slate-500">→</span>
                  <span className="text-emerald-300">{format(nxt)}</span>
                </div>
              </div>
              <button
                onClick={() => upgrade(key)}
                disabled={!can}
                className={`flex shrink-0 flex-col items-center justify-center rounded-lg px-3 py-1.5 text-[11px] font-bold transition-transform active:scale-95 ${
                  can
                    ? "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                <span className="flex items-center gap-1 leading-none">
                  <ChevronUp className="h-3 w-3" />
                  Upgrade
                </span>
                <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold leading-none">
                  <Coins className="h-2.5 w-2.5" />
                  {fmt(cost)}
                </span>
              </button>
            </div>
          );
        })}

        {/* Reset (debug) */}
        <button
          onClick={() => {
            if (!confirm("Resetar progresso?")) return;
            const s = defaultSave();
            setSave(s);
            saveRef.current = s;
            respawn();
            flashToast("Progresso resetado");
          }}
          className="mt-4 w-full rounded-lg border border-slate-800 bg-slate-900 py-2 text-[10px] text-slate-500 hover:text-slate-300"
        >
          Resetar progresso (beta)
        </button>
      </section>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-30 flex justify-center px-4">
          <div className="rounded-full bg-slate-800/95 px-4 py-2 text-sm font-medium text-white shadow-xl ring-1 ring-white/10">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

// -------- Sub-components --------
function Pill({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-1 rounded-full border border-slate-800 bg-slate-900 px-2 py-1">
      {icon}
      <span className="truncate font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function QuickBtn({
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
      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-800 bg-gradient-to-b from-slate-800 to-slate-900 px-2 py-1.5 text-[10px] font-semibold text-slate-200 active:scale-95"
    >
      {icon}
      {label}
    </button>
  );
}

// -------- Derived stats --------
function computeStats(s: SaveState) {
  return {
    atk: attrValue("atk", s.attrs.atk.level),
    hp: attrValue("hp", s.attrs.hp.level),
    regen: attrValue("regen", s.attrs.regen.level),
    critDmg: attrValue("critDmg", s.attrs.critDmg.level),
    critChance: attrValue("critChance", s.attrs.critChance.level),
    atkSpeed: attrValue("atkSpeed", s.attrs.atkSpeed.level),
    lifesteal: attrValue("lifesteal", s.attrs.lifesteal.level),
    penetration: attrValue("penetration", s.attrs.penetration.level),
    defense: attrValue("defense", s.attrs.defense.level),
  };
}

function pickEnemyEmoji(stage: number) {
  const pool = ["👹", "👺", "🧟", "👻", "🦇", "🐍", "🕷️", "🐺", "🦂", "🐗"];
  return pool[stage % pool.length];
}
