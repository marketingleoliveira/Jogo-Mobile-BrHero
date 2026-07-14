import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  LogOut,
  Pencil,
  Maximize,
  Minimize,
} from "lucide-react";
import heroSprite from "@/assets/sprite-hero.png";
import skinClassicSprite from "@/assets/skins/hero-classic.png";
import skinGreenSprite from "@/assets/skins/hero-green.png";
import skinGoldSprite from "@/assets/skins/hero-gold.png";
import skinBrasilSprite from "@/assets/skins/hero-brasil.png";
import skinShadowSprite from "@/assets/skins/hero-shadow.png";
import skinSamuraiSprite from "@/assets/skins/hero-samurai.png";
import skinMagoSprite from "@/assets/skins/hero-mago.png";
import skinArqueiroSprite from "@/assets/skins/hero-arqueiro.png";
import skinPaladinoSprite from "@/assets/skins/hero-paladino.png";
import skinPirataSprite from "@/assets/skins/hero-pirata.png";
import skinVampiroSprite from "@/assets/skins/hero-vampiro.png";
import skinGabiSprite from "@/assets/skins/hero-gabi.png";
import goblinSprite from "@/assets/sprite-goblin.png";
import slimeSprite from "@/assets/sprite-slime.png";
import skeletonSprite from "@/assets/sprite-skeleton.png";
import bossDragonSprite from "@/assets/sprite-boss-dragon.png";
import woodTexture from "@/assets/wood-texture.jpg";
import { resolveRemoteRedeem } from "@/lib/game/remote-codes";
import { captureReferralFromUrl, tryClaimPendingReferral, buildInviteLink, useReferralStats } from "@/lib/game/referrals";
import { supabase as _supaClient } from "@/integrations/supabase/client";
import { getLiveOpsMultipliers, useLiveOps } from "@/lib/game/remote-liveops";
import { useRemoteOffers, type RemoteOffer } from "@/lib/game/remote-shop";

import { WalletHud } from "@/components/game/wallet-hud";
import { useWallet } from "@/lib/game/wallet";
import { ChatPopup } from "@/components/game/chat-popup";

function WalletCornerOverlay() {
  const { wallet, loading } = useWallet();
  const fmt = (n: number) => n.toLocaleString("pt-BR");
  return (
    <div className="pointer-events-none fixed top-2 left-2 z-[60] flex items-center gap-1.5 rounded-full border-2 border-amber-900/70 bg-black/80 px-2.5 py-1 text-xs font-bold shadow-lg backdrop-blur-sm">
      <span className="flex items-center gap-1 text-pink-300" title="Diamantes">
        <Gem className="h-3.5 w-3.5" /> {loading ? "…" : fmt(wallet.gems)}
      </span>
      <span className="mx-0.5 h-3 w-px bg-amber-900/60" />
      <span className="flex items-center gap-1 text-amber-300" title="Moedas">
        <Coins className="h-3.5 w-3.5" /> {loading ? "…" : fmt(wallet.gold)}
      </span>
    </div>
  );
}
import { getCloudUser, saveCloudSave, loadCloudSave, formatStage } from "@/lib/game/cloud-save";
import { useSingleSessionGuard, forceSignOut } from "@/lib/game/single-session";
import { beginSandboxCheckout, beginInfinitepayCheckoutClient, usePaymentsConfig, usePlayerTransactions, type PaymentTransaction } from "@/lib/game/payments";
import { useSandboxDelivery, type ParsedReward } from "@/lib/game/sandbox-purchase";
import { closeNativeAuthBrowser, completeNativeOAuthFromUrl, isBrHeroNativeApp } from "@/lib/native-auth";
import { BiomeBackdrop } from "@/components/game/biome-backdrop";
import biomeFloresta from "@/assets/biome-floresta.jpg";
import biomeCaverna from "@/assets/biome-caverna.jpg";
import biomeDeserto from "@/assets/biome-deserto.jpg";
import biomeVulcao from "@/assets/biome-vulcao.jpg";
import biomeCastelo from "@/assets/biome-castelo.jpg";
import biomeInferno from "@/assets/biome-inferno.jpg";
import biomeCeu from "@/assets/biome-ceu.jpg";

const BIOME_BG: Record<string, string> = {
  Floresta: biomeFloresta,
  Caverna: biomeCaverna,
  Deserto: biomeDeserto,
  Vulcão: biomeVulcao,
  Castelo: biomeCastelo,
  Inferno: biomeInferno,
  Céu: biomeCeu,
};
import {
  fetchArenaOpponents,
  canRefreshOpponents,
  getCurrentUserId,
  pushArenaHistory,
  readArenaHistory,
  type RealArenaOpponent,
  type ArenaHistoryEntry,
} from "@/lib/game/arena-opponents";


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
  // Masmorra (Fase 3 — Bloco 1)
  dungeon: DungeonState;
  // Pets (Fase 3 — Bloco 2)
  pets: Pet[];
  equippedPetId: string | null;
  petFragments: Record<PetKind, number>;
  // Torre Infinita (Fase 3 — Bloco 3)
  tower: TowerState;
  // Bênçãos (Fase 3 — Bloco 4)
  blessings: Record<BlessingKind, number>; // expiresAt (ms) — 0 = inativa
  // Guilda (Fase 3 — Bloco 5)
  guild: GuildState;
  // Arena PvP Assíncrona (Fase 3 — Bloco 6)
  arena: ArenaState;
  // Eventos Sazonais (Fase 3 — Bloco 7)
  event: EventState;
  // Skins / Cosméticos (Fase 3 — Bloco 8)
  skins: SkinsState;
  // Conquistas (Fase 3 — Bloco 9)
  achievements: AchievementsState;
  // Runas / Encantamentos (Fase 3 — Bloco 10)
  runes: RunesState;
  // Cosméticos avançados (Fase 3 — Bloco 11)
  cosmetics: CosmeticsState;
  // Códigos / Redeem (Fase 3 — Bloco 12)
  redeem: RedeemState;
  version: number;
};

type RedeemState = { used: string[] };

type DungeonState = { keys: number; lastKeyAt: number; runs: number };
type DungeonKind = "gold" | "gear" | "essence";

// ===== Pets =====
type PetKind = "wolf" | "fairy" | "owl" | "dragon";
type PetRarity = "Comum" | "Raro" | "Épico" | "Lendário";
type Pet = { id: string; kind: PetKind; rarity: PetRarity; level: number };

// ===== Torre Infinita =====
type TowerState = { bestFloor: number; runs: number; lastRunAt: number };

// ===== Bênçãos =====
type BlessingKind = "gold" | "xp" | "drop" | "atk" | "hp";

// ===== Guilda =====
type GuildId = "leao" | "corvo" | "dragao";
type GuildState = {
  id: GuildId | null;
  joinedAt: number;
  xp: number;
  donationsToday: number;
  lastDonateDay: string | null;
  bossLastAt: number;
  bossKills: number;
  contribWeek: number;
  weekKey: string;
};

// ===== Arena PvP Assíncrona =====
type ArenaState = {
  points: number;
  wins: number;
  losses: number;
  ticketsToday: number;
  lastTicketDay: string | null;
  extraTickets: number; // comprados com cristais
  lastDailyClaim: string | null;
};

// ===== Eventos Sazonais =====
type EventKey = "festival_heroes";
type EventMissionProgress = { id: string; progress: number; claimed: boolean };
type EventState = {
  key: EventKey | null;
  startedAt: number;         // 0 = ainda não iniciado
  medals: number;
  missions: EventMissionProgress[];
};

// ===== Skins / Cosméticos =====
type SkinId = "classic" | "green" | "gold" | "brasil" | "shadow" | "samurai" | "mago" | "arqueiro" | "paladino" | "pirata" | "vampiro" | "gabi";
type SkinsState = { owned: SkinId[]; equipped: SkinId };

// ===== Conquistas / Achievements (Fase 3 — Bloco 9) =====
type AchievementId = string;
type AchievementsState = { claimed: AchievementId[] };

const STORAGE_KEY = "hero-rise-idle-v4";
const SAVE_VERSION = 18;
const PRESTIGE_UNLOCK_STAGE = 75;
const DUNGEON_UNLOCK_LEVEL = 10;
const DUNGEON_MAX_KEYS = 3;
const DUNGEON_KEY_MS = 30 * 60 * 1000; // 1 chave / 30min

const DUNGEON_DEFS: Record<DungeonKind, { label: string; icon: string; desc: string; color: string }> = {
  gold:    { label: "Masmorra de Ouro",        icon: "🪙", desc: "Ouro em massa + baú comum.",        color: "from-amber-500 to-yellow-600" },
  gear:    { label: "Masmorra de Equipamento", icon: "⚔️", desc: "2 equipamentos com bônus de stage.", color: "from-sky-500 to-indigo-600" },
  essence: { label: "Masmorra de Essência",    icon: "✨", desc: "Essência garantida + baú épico.",    color: "from-fuchsia-500 to-purple-700" },
};

function HoldButton({
  onTick,
  disabled,
  className,
  children,
}: {
  onTick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (disabled) return;
    stop();
    tickRef.current();
    let delay = 320;
    const loop = () => {
      tickRef.current();
      delay = Math.max(40, delay - 25);
      timerRef.current = setTimeout(loop, delay);
    };
    timerRef.current = setTimeout(loop, delay);
  }, [disabled, stop]);

  useEffect(() => stop, [stop]);

  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      onPointerDown={(e) => { e.preventDefault(); start(); }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      {children}
    </button>
  );
}

function dungeonKeysNow(d: DungeonState): { keys: number; lastKeyAt: number; nextInMs: number } {
  const now = Date.now();
  const elapsed = now - d.lastKeyAt;
  if (d.keys >= DUNGEON_MAX_KEYS) return { keys: DUNGEON_MAX_KEYS, lastKeyAt: now, nextInMs: 0 };
  const gained = Math.floor(elapsed / DUNGEON_KEY_MS);
  const keys = Math.min(DUNGEON_MAX_KEYS, d.keys + gained);
  const lastKeyAt = gained > 0 ? d.lastKeyAt + gained * DUNGEON_KEY_MS : d.lastKeyAt;
  const nextInMs = keys >= DUNGEON_MAX_KEYS ? 0 : DUNGEON_KEY_MS - (now - lastKeyAt);
  return { keys, lastKeyAt, nextInMs };
}

function emptyDungeon(): DungeonState {
  return { keys: DUNGEON_MAX_KEYS, lastKeyAt: Date.now(), runs: 0 };
}

// ===== Pets =====
const PETS_UNLOCK_LEVEL = 15;
const PET_MAX_LEVEL = 10;
const PET_KINDS: PetKind[] = ["wolf", "fairy", "owl", "dragon"];
const PET_RARITIES: PetRarity[] = ["Comum", "Raro", "Épico", "Lendário"];
const PET_DEFS: Record<PetKind, { label: string; icon: string; desc: string; color: string }> = {
  wolf:   { label: "Lobo",         icon: "🐺", desc: "+ATK",       color: "from-slate-500 to-slate-800" },
  fairy:  { label: "Fada",         icon: "🧚", desc: "+HP/Regen",  color: "from-pink-400 to-fuchsia-600" },
  owl:    { label: "Coruja",       icon: "🦉", desc: "+XP",        color: "from-amber-600 to-yellow-800" },
  dragon: { label: "Dragão Bebê",  icon: "🐉", desc: "+Ouro/Drop", color: "from-emerald-500 to-teal-700" },
};
const PET_RARITY_MULT: Record<PetRarity, number> = { "Comum": 1, "Raro": 1.6, "Épico": 2.4, "Lendário": 3.5 };
// Bônus base (%) por nível 1, escalados por raridade e nível linear
const PET_BASE_PCT: Record<PetKind, { atkMul?: number; hpMul?: number; regenAdd?: number; xpMul?: number; goldMul?: number; dropAdd?: number }> = {
  wolf:   { atkMul: 0.02 },
  fairy:  { hpMul: 0.02, regenAdd: 0.5 },
  owl:    { xpMul: 0.02 },
  dragon: { goldMul: 0.02, dropAdd: 0.005 },
};

function petBonus(save: SaveState) {
  const acc = { atkMul: 1, hpMul: 1, regenAdd: 0, xpMul: 1, goldMul: 1, dropAdd: 0 };
  if (!save.equippedPetId) return acc;
  const p = save.pets.find((x) => x.id === save.equippedPetId);
  if (!p) return acc;
  const base = PET_BASE_PCT[p.kind];
  const mult = PET_RARITY_MULT[p.rarity] * p.level;
  if (base.atkMul) acc.atkMul += base.atkMul * mult;
  if (base.hpMul) acc.hpMul += base.hpMul * mult;
  if (base.regenAdd) acc.regenAdd += base.regenAdd * mult;
  if (base.xpMul) acc.xpMul += base.xpMul * mult;
  if (base.goldMul) acc.goldMul += base.goldMul * mult;
  if (base.dropAdd) acc.dropAdd += base.dropAdd * mult;
  return acc;
}

// Custo de evolução do pet (ouro + fragmentos)
function petUpgradeCost(p: Pet): { gold: number; fragments: number } {
  const rarityMult = PET_RARITY_MULT[p.rarity];
  return {
    gold: Math.floor(500 * Math.pow(1.7, p.level) * rarityMult),
    fragments: Math.floor(5 + p.level * 3 * rarityMult),
  };
}

function craftPetCost(): number { return 50; } // fragmentos para forjar 1 pet Comum daquela espécie

function emptyPetFragments(): Record<PetKind, number> {
  return { wolf: 0, fairy: 0, owl: 0, dragon: 0 };
}
function rollPetRarity(bonus = 0): PetRarity {
  const r = Math.random() - bonus;
  if (r < 0.02) return "Lendário";
  if (r < 0.12) return "Épico";
  if (r < 0.35) return "Raro";
  return "Comum";
}
function makePet(kind: PetKind, rarity: PetRarity): Pet {
  return { id: `pet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind, rarity, level: 1 };
}
// Retorna { pet? | fragments? } — pequena chance de pet inteiro, resto fragmentos
function maybePetDrop(petChance: number, fragBonus = 0): { pet?: Pet; fragKind?: PetKind; fragAmt?: number } {
  const kind = PET_KINDS[Math.floor(Math.random() * PET_KINDS.length)];
  if (Math.random() < petChance) {
    return { pet: makePet(kind, rollPetRarity(fragBonus)) };
  }
  return { fragKind: kind, fragAmt: 5 + Math.floor(Math.random() * 8) };
}

// ===== Torre Infinita =====
const TOWER_UNLOCK_LEVEL = 20;
const TOWER_BOSS_EVERY = 10;
const TOWER_MAX_FLOORS_PER_RUN = 500; // trava de segurança

function emptyTower(): TowerState {
  return { bestFloor: 0, runs: 0, lastRunAt: 0 };
}
// Poder do herói (número comparável) — usa stats já com bônus de pet/prestígio
function heroPower(stats: ReturnType<typeof computeStats>): number {
  const critFactor = 1 + (stats.critChance / 100) * Math.max(0, stats.critDmg / 100 - 1);
  const dps = stats.atk * (stats.atkSpeed || 1) * critFactor * (1 + stats.penetration / 100);
  const tank = stats.hp * (1 + stats.defense / 200) + stats.regen * 20;
  return dps * 3 + tank;
}
function towerRequirement(floor: number, baseStage: number): number {
  // Ancorado no stage atual do jogador para andares iniciais serem factíveis
  const base = 60 * Math.pow(1.18, baseStage);
  return base * Math.pow(1.13, floor);
}
// Simula uma tentativa: retorna andares alcançados (0..N) e se derrotou boss
function simulateTowerRun(save: SaveState): number {
  const stats = computeStats(save);
  const power = heroPower(stats);
  let floor = 0;
  for (let f = 1; f <= TOWER_MAX_FLOORS_PER_RUN; f++) {
    const isBoss = f % TOWER_BOSS_EVERY === 0;
    const req = towerRequirement(f, save.stage) * (isBoss ? 1.6 : 1);
    if (power < req) break;
    floor = f;
  }
  return floor;
}
function towerRewards(floor: number, stage: number, save: SaveState): { gold: number; gems: number; essence: number; chests: number; frag?: { kind: PetKind; amt: number } } {
  const gold = Math.floor(floor * 60 * Math.pow(1.06, stage));
  const gems = Math.floor(floor / 5);
  const essence = Math.floor(floor / 20);
  const chests = Math.floor(floor / 10);
  const frag = floor >= 15 && Math.random() < 0.5
    ? { kind: PET_KINDS[Math.floor(Math.random() * PET_KINDS.length)], amt: Math.max(3, Math.floor(floor / 5)) }
    : undefined;
  void save;
  return { gold, gems, essence, chests, frag };
}

// ===== Bênçãos =====
const BLESSING_UNLOCK_LEVEL = 20;
const BLESSING_DURATIONS = [
  { hours: 2, label: "2h", ms: 2 * 60 * 60 * 1000, goldMul: 1, gemMul: 1 },
  { hours: 4, label: "4h", ms: 4 * 60 * 60 * 1000, goldMul: 1.8, gemMul: 1.8 },
  { hours: 8, label: "8h", ms: 8 * 60 * 60 * 1000, goldMul: 3, gemMul: 3 },
] as const;
const BLESSING_DEFS: Record<BlessingKind, { label: string; icon: string; desc: string; color: string; effectPct: number; baseGold: number; baseGems: number }> = {
  gold: { label: "Bênção do Ouro",       icon: "🪙", desc: "+50% ouro por batalha",      color: "from-amber-500 to-yellow-700",  effectPct: 50, baseGold: 5000, baseGems: 20 },
  xp:   { label: "Bênção da Experiência", icon: "📖", desc: "+50% XP por batalha",       color: "from-sky-500 to-blue-700",      effectPct: 50, baseGold: 5000, baseGems: 20 },
  drop: { label: "Bênção da Forja",       icon: "🔨", desc: "+5% chance de drop",        color: "from-orange-500 to-red-700",    effectPct: 5,  baseGold: 8000, baseGems: 30 },
  atk:  { label: "Bênção do Guerreiro",   icon: "⚔️", desc: "+30% ATK temporário",       color: "from-rose-500 to-pink-700",     effectPct: 30, baseGold: 8000, baseGems: 30 },
  hp:   { label: "Bênção da Vida",        icon: "❤️", desc: "+30% HP e regen temp.",     color: "from-emerald-500 to-green-700", effectPct: 30, baseGold: 8000, baseGems: 30 },
};

function emptyBlessings(): Record<BlessingKind, number> {
  return { gold: 0, xp: 0, drop: 0, atk: 0, hp: 0 };
}
function blessingActive(save: SaveState, kind: BlessingKind, now = Date.now()): boolean {
  return (save.blessings?.[kind] ?? 0) > now;
}
function blessingBonus(save: SaveState) {
  const now = Date.now();
  return {
    goldMul: blessingActive(save, "gold", now) ? 1 + BLESSING_DEFS.gold.effectPct / 100 : 1,
    xpMul:   blessingActive(save, "xp",   now) ? 1 + BLESSING_DEFS.xp.effectPct   / 100 : 1,
    dropAdd: blessingActive(save, "drop", now) ? BLESSING_DEFS.drop.effectPct / 100 : 0,
    atkMul:  blessingActive(save, "atk",  now) ? 1 + BLESSING_DEFS.atk.effectPct  / 100 : 1,
    hpMul:   blessingActive(save, "hp",   now) ? 1 + BLESSING_DEFS.hp.effectPct   / 100 : 1,
    regenMul:blessingActive(save, "hp",   now) ? 1 + BLESSING_DEFS.hp.effectPct   / 100 : 1,
  };
}

// ===== Guilda =====
const GUILD_UNLOCK_LEVEL = 25;
const GUILD_MAX_LEVEL = 20;
const GUILD_DAILY_DONATIONS = 5;
const GUILD_BOSS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // semanal
const GUILD_DEFS: Record<GuildId, { name: string; icon: string; bias: "atk" | "gold" | "xp"; desc: string; color: string }> = {
  leao:   { name: "Leões da Aurora",  icon: "🦁", bias: "atk",  desc: "Bônus extra de ATK.",  color: "from-amber-500 to-orange-700" },
  corvo:  { name: "Corvos da Névoa",  icon: "🐦‍⬛", bias: "xp",   desc: "Bônus extra de XP.",   color: "from-slate-500 to-slate-800" },
  dragao: { name: "Dragões de Rubi",  icon: "🐉", bias: "gold", desc: "Bônus extra de ouro.", color: "from-rose-500 to-red-800" },
};
function emptyGuild(): GuildState {
  return { id: null, joinedAt: 0, xp: 0, donationsToday: 0, lastDonateDay: null, bossLastAt: 0, bossKills: 0, contribWeek: 0, weekKey: "" };
}
function guildLevel(xp: number): number {
  return Math.min(GUILD_MAX_LEVEL, Math.floor(Math.sqrt(Math.max(0, xp) / 500)));
}
function guildXpForLevel(lvl: number): number {
  return lvl * lvl * 500;
}
function guildDonationCost(playerLevel: number, donationsToday: number): number {
  return Math.floor(500 * (playerLevel + 1) * (1 + donationsToday * 0.5));
}
function guildBonus(save: SaveState) {
  const g = save.guild;
  if (!g?.id) return { atkMul: 1, goldMul: 1, xpMul: 1 };
  const lvl = guildLevel(g.xp);
  const base = lvl * 0.005; // 0.5% por nível
  const bias = 0.05 * (lvl / GUILD_MAX_LEVEL); // até +5% no bias
  const def = GUILD_DEFS[g.id];
  return {
    atkMul:  1 + base + (def.bias === "atk"  ? bias : 0),
    goldMul: 1 + base + (def.bias === "gold" ? bias : 0),
    xpMul:   1 + base + (def.bias === "xp"   ? bias : 0),
  };
}

// ===== Arena PvP Assíncrona =====
const ARENA_UNLOCK_LEVEL = 30;
const ARENA_DAILY_TICKETS = 5;
const ARENA_EXTRA_TICKET_COST_GEMS = 20;
const ARENA_DAILY_REWARD_GOLD = 3000;
const ARENA_DAILY_REWARD_GEMS = 10;

type ArenaTier = { key: string; name: string; icon: string; min: number; color: string };
const ARENA_TIERS: ArenaTier[] = [
  { key: "bronze",   name: "Bronze",   icon: "🥉", min: 0,    color: "from-amber-700 to-amber-900" },
  { key: "prata",    name: "Prata",    icon: "🥈", min: 500,  color: "from-slate-400 to-slate-600" },
  { key: "ouro",     name: "Ouro",     icon: "🥇", min: 1500, color: "from-yellow-400 to-amber-600" },
  { key: "diamante", name: "Diamante", icon: "💎", min: 3000, color: "from-cyan-400 to-blue-700" },
  { key: "lenda",    name: "Lenda",    icon: "👑", min: 5000, color: "from-fuchsia-500 to-purple-800" },
];
function arenaTier(points: number): ArenaTier {
  let t = ARENA_TIERS[0]!;
  for (const x of ARENA_TIERS) if (points >= x.min) t = x;
  return t;
}

type ArenaOpponent = {
  name: string; level: number; power: number; guild: string; pet: string; rank: number; rewardGold: number; rewardGems: number; seed: number;
  // Bloco 4.3 — snapshot público (opcional; presente em oponentes reais)
  userId?: string;
  avatar?: string | null;
  title?: string | null;
  skin?: string | null;
  real?: boolean;
};

const ARENA_NAMES = ["Kael", "Vora", "Ryze", "Nyx", "Thara", "Bel", "Cirus", "Draka", "Elyn", "Fenn", "Garro", "Hilda", "Ivar", "Juno", "Krix", "Luma", "Mord", "Nex", "Ora", "Pyra"];
const ARENA_GUILDS = ["Leões", "Corvos", "Dragões", "Independente"];
const ARENA_PETS = ["🐺 Lobo", "🧚 Fada", "🦉 Coruja", "🐲 Dragão"];

function rngFromSeed(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function generateArenaOpponents(save: SaveState): ArenaOpponent[] {
  const heroP = heroPower(computeStats(save));
  const dayNum = Number(todayKey().replace(/-/g, ""));
  const seed = dayNum + (save.arena?.wins ?? 0) * 31 + (save.arena?.losses ?? 0) * 17;
  const rng = rngFromSeed(seed);
  const opps: ArenaOpponent[] = [];
  for (let i = 0; i < 5; i++) {
    const factor = 0.7 + rng() * 0.7; // 0.7x .. 1.4x hero power
    const power = Math.max(50, Math.floor(heroP * factor));
    const level = Math.max(1, Math.floor(save.level * (0.8 + rng() * 0.5)));
    const name = ARENA_NAMES[Math.floor(rng() * ARENA_NAMES.length)]!;
    const guild = ARENA_GUILDS[Math.floor(rng() * ARENA_GUILDS.length)]!;
    const pet = ARENA_PETS[Math.floor(rng() * ARENA_PETS.length)]!;
    const rank = 100 + Math.floor(rng() * 9000);
    const rewardGold = Math.floor(400 * level * factor);
    const rewardGems = 3 + Math.floor(rng() * 5);
    opps.push({ name, level, power, guild, pet, rank, rewardGold, rewardGems, seed: seed + i * 101 });
  }
  return opps;
}

function simulateArenaFight(save: SaveState, opp: ArenaOpponent): { win: boolean; heroPower: number } {
  const p = heroPower(computeStats(save));
  const winChance = Math.max(0.1, Math.min(0.92, p / (p + opp.power)));
  const rng = rngFromSeed(opp.seed + Date.now());
  return { win: rng() < winChance, heroPower: p };
}

function emptyArena(): ArenaState {
  return { points: 0, wins: 0, losses: 0, ticketsToday: 0, lastTicketDay: null, extraTickets: 0, lastDailyClaim: null };
}

function arenaTicketsLeft(a: ArenaState): number {
  const today = todayKey();
  const used = a.lastTicketDay === today ? a.ticketsToday : 0;
  return Math.max(0, ARENA_DAILY_TICKETS - used) + a.extraTickets;
}



// ===== Eventos Sazonais =====
const EVENT_UNLOCK_LEVEL = 10;
const EVENT_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type EventDef = {
  key: EventKey;
  name: string;
  icon: string;
  desc: string;
  medalIcon: string;
  medalName: string;
};
type EventMissionDef = {
  id: string;
  label: string;
  target: number;
  medalReward: number;
  hint: string; // como progride
};
type EventShopItem = {
  id: string;
  label: string;
  icon: string;
  cost: number;
  limitPerEvent: number; // 0 = ilimitado
  desc: string;
};

// Evento ativo — trocar aqui no futuro para rodar outro tema.
const ACTIVE_EVENT: EventDef = {
  key: "festival_heroes",
  name: "Festival dos Heróis",
  icon: "🎉",
  desc: "Ganhe Medalhas em qualquer atividade e troque por prêmios!",
  medalIcon: "🏅",
  medalName: "Medalhas",
};

const EVENT_MISSIONS: EventMissionDef[] = [
  { id: "kill",   label: "Derrotar 200 inimigos",     target: 200, medalReward: 40, hint: "Batalhas normais" },
  { id: "boss",   label: "Derrotar 5 chefes",         target: 5,   medalReward: 30, hint: "Chefes de bioma" },
  { id: "arena",  label: "Vencer 3 lutas na Arena",   target: 3,   medalReward: 30, hint: "Vitórias em PvP" },
  { id: "dungeon",label: "Concluir 2 masmorras",      target: 2,   medalReward: 25, hint: "Qualquer masmorra" },
  { id: "tower",  label: "Subir 5 andares na Torre",  target: 5,   medalReward: 25, hint: "Novos andares" },
];

const EVENT_SHOP: EventShopItem[] = [
  { id: "gold_s",  label: "5.000 Ouro",      icon: "🪙", cost: 10, limitPerEvent: 0, desc: "Injeção rápida de ouro" },
  { id: "gems_s",  label: "20 Cristais",     icon: "💎", cost: 25, limitPerEvent: 0, desc: "Cristais premium" },
  { id: "chest",   label: "Baú Épico",       icon: "📦", cost: 40, limitPerEvent: 5, desc: "Equipamento raro+" },
  { id: "frag",    label: "10 Fragmentos Pet", icon: "🐾", cost: 30, limitPerEvent: 10, desc: "Fragmento aleatório" },
  { id: "essence", label: "1 Essência",      icon: "✨", cost: 60, limitPerEvent: 3, desc: "Rebirth mais rápido" },
  { id: "rune_frag", label: "5 Fragmentos de Runa", icon: "🔮", cost: 40, limitPerEvent: 10, desc: "Evolua suas runas" },
  { id: "cosm_aura_blue",    label: "Cosmético: Aura Azul",     icon: "💠", cost: 100, limitPerEvent: 1, desc: "Aura brilhante do evento" },
  { id: "cosm_frame_brasil", label: "Cosmético: Moldura Brasil", icon: "🇧🇷", cost: 100, limitPerEvent: 1, desc: "Moldura tupiniquim" },
  { id: "skin_brasil", label: "Skin: Guardião do Brasil", icon: "🦸", cost: 120, limitPerEvent: 1, desc: "Cosmético do evento" },
];

function emptyEvent(): EventState {
  return { key: null, startedAt: 0, medals: 0, missions: [] };
}

function ensureEventStarted(save: SaveState): EventState {
  if (save.level < EVENT_UNLOCK_LEVEL) return save.event;
  const now = Date.now();
  const cur = save.event;
  const expired = cur.key && now - cur.startedAt > EVENT_DURATION_MS;
  if (!cur.key || expired) {
    return {
      key: ACTIVE_EVENT.key,
      startedAt: now,
      medals: expired ? cur.medals : cur.medals, // preserva medalhas atuais
      missions: EVENT_MISSIONS.map((m) => ({ id: m.id, progress: 0, claimed: false })),
    };
  }
  // garante que todas missões existem (caso EVENT_MISSIONS mude)
  const missions = EVENT_MISSIONS.map((m) => cur.missions.find((x) => x.id === m.id) ?? { id: m.id, progress: 0, claimed: false });
  return { ...cur, missions };
}

function eventTimeLeft(ev: EventState): number {
  if (!ev.key || !ev.startedAt) return 0;
  return Math.max(0, EVENT_DURATION_MS - (Date.now() - ev.startedAt));
}

function eventActive(ev: EventState): boolean {
  return !!ev.key && eventTimeLeft(ev) > 0;
}

function bumpEventMission(ev: EventState, id: string, delta: number): EventState {
  if (!eventActive(ev)) return ev;
  const def = EVENT_MISSIONS.find((m) => m.id === id);
  if (!def) return ev;
  const missions = ev.missions.map((m) =>
    m.id === id ? { ...m, progress: Math.min(def.target, m.progress + delta) } : m,
  );
  return { ...ev, missions };
}

function addMedals(ev: EventState, amount: number): EventState {
  if (!eventActive(ev) || amount <= 0) return ev;
  return { ...ev, medals: ev.medals + amount };
}

// ===== Skins / Cosméticos =====
const SKIN_UNLOCK_LEVEL = 10;

type SkinDef = {
  id: SkinId;
  label: string;
  icon: string;
  rarity: "Comum" | "Raro" | "Épico" | "Lendário";
  color: string;
  desc: string;
  sprite: string;    // Imagem do personagem jogável
  filter?: string;   // CSS filter aplicado ao sprite (fallback/tint)
  priceGems?: number; // preço direto na loja de skins (opcional)
};

const SKIN_DEFS: Record<SkinId, SkinDef> = {
  classic:  { id: "classic",  label: "Herói Clássico",     icon: "🧙", rarity: "Comum",    color: "from-slate-500 to-slate-700",     desc: "O visual original — todos começam aqui.",  sprite: skinClassicSprite },
  green:    { id: "green",    label: "Guerreiro Verde",    icon: "🥷", rarity: "Raro",     color: "from-emerald-500 to-green-700",   desc: "Furtivo e ágil, camuflado na floresta.",   sprite: skinGreenSprite,    priceGems: 200 },
  gold:     { id: "gold",     label: "Cavaleiro Dourado",  icon: "🤴", rarity: "Épico",    color: "from-amber-400 to-yellow-700",    desc: "Armadura reluzente forjada em ouro.",       sprite: skinGoldSprite,     priceGems: 500 },
  brasil:   { id: "brasil",   label: "Guardião do Brasil", icon: "🦸", rarity: "Épico",    color: "from-green-500 to-yellow-500",    desc: "Herói tupiniquim das terras tropicais.",   sprite: skinBrasilSprite,   priceGems: 400 },
  shadow:   { id: "shadow",   label: "Sombra Lendária",    icon: "🥷", rarity: "Lendário", color: "from-purple-700 to-black",        desc: "Rumores dizem que ele nunca é visto.",     sprite: skinShadowSprite,   priceGems: 1200 },
  samurai:  { id: "samurai",  label: "Samurai Carmesim",   icon: "🗡️", rarity: "Épico",    color: "from-rose-600 to-red-800",        desc: "Lâmina afiada, honra inquebrável.",         sprite: skinSamuraiSprite,  priceGems: 600 },
  mago:     { id: "mago",     label: "Arquimago Azul",     icon: "🧙‍♂️", rarity: "Raro",     color: "from-sky-500 to-indigo-700",      desc: "Domina os elementos arcanos.",              sprite: skinMagoSprite,     priceGems: 300 },
  arqueiro: { id: "arqueiro", label: "Arqueiro Élfico",    icon: "🏹", rarity: "Raro",     color: "from-teal-500 to-emerald-800",    desc: "Precisão sobrenatural da floresta antiga.", sprite: skinArqueiroSprite, priceGems: 350 },
  paladino: { id: "paladino", label: "Paladino Sagrado",   icon: "🛡️", rarity: "Épico",    color: "from-yellow-300 to-amber-600",    desc: "Fé inabalável, escudo intransponível.",     sprite: skinPaladinoSprite, priceGems: 700 },
  pirata:   { id: "pirata",   label: "Capitão Pirata",     icon: "🏴‍☠️", rarity: "Épico",    color: "from-slate-700 to-red-900",       desc: "Terror dos sete mares.",                    sprite: skinPirataSprite,   priceGems: 550 },
  vampiro:  { id: "vampiro",  label: "Lorde Vampiro",      icon: "🧛", rarity: "Lendário", color: "from-red-900 to-black",           desc: "Da noite eterna surge o predador.",         sprite: skinVampiroSprite,  priceGems: 1500 },
  gabi:     { id: "gabi",     label: "Gabi Xavier",        icon: "⚔️", rarity: "Lendário", color: "from-emerald-600 to-amber-700",   desc: "Guerreira destemida de cachos indomáveis e coração de leoa.", sprite: skinGabiSprite, priceGems: 100 },
};

function emptySkins(): SkinsState {
  return { owned: ["classic"], equipped: "classic" };
}

function equippedSkinDef(save: SaveState): SkinDef {
  const id = save.skins?.equipped ?? "classic";
  return SKIN_DEFS[id] ?? SKIN_DEFS.classic;
}

function isSkinId(value: unknown): value is SkinId {
  return typeof value === "string" && value in SKIN_DEFS;
}

function normalizeSkins(raw: unknown): SkinsState {
  const parsed = raw && typeof raw === "object" ? (raw as Partial<SkinsState>) : {};
  const owned = Array.isArray(parsed.owned)
    ? parsed.owned.filter(isSkinId)
    : [];
  const uniqueOwned = Array.from(new Set<SkinId>(["classic", ...owned]));
  const equipped = isSkinId(parsed.equipped) && uniqueOwned.includes(parsed.equipped)
    ? parsed.equipped
    : "classic";
  return { owned: uniqueOwned, equipped };
}

// ===== Conquistas / Achievements (Fase 3 — Bloco 9) =====
type AchievementCategory = "combate" | "progressao" | "colecao" | "social";
type AchievementReward = { gold?: number; gems?: number; essence?: number; chest?: 0 | 1 | 2; petFragKind?: PetKind; petFrags?: number; runeFrags?: number; cosmetic?: CosmeticId };
type AchievementDef = {
  id: AchievementId;
  category: AchievementCategory;
  icon: string;
  label: string;
  desc: string;
  goal: number;
  metric: (s: SaveState) => number;
  reward: AchievementReward;
};

const ACHIEVEMENTS: AchievementDef[] = [
  // Combate — inimigos
  { id: "kill_100",   category: "combate",    icon: "⚔️", label: "Aprendiz das Batalhas",   desc: "Derrote 100 inimigos",       goal: 100,   metric: (s) => s.counters.enemies,          reward: { gold: 2000 } },
  { id: "kill_1k",    category: "combate",    icon: "⚔️", label: "Veterano de Guerra",      desc: "Derrote 1.000 inimigos",     goal: 1000,  metric: (s) => s.counters.enemies,          reward: { gold: 20000, gems: 20 } },
  { id: "kill_10k",   category: "combate",    icon: "⚔️", label: "Ceifador Implacável",     desc: "Derrote 10.000 inimigos",    goal: 10000, metric: (s) => s.counters.enemies,          reward: { gold: 250000, gems: 100, chest: 1 } },
  // Combate — chefes
  { id: "boss_10",    category: "combate",    icon: "🐲", label: "Caçador de Chefes I",     desc: "Derrote 10 chefes",          goal: 10,    metric: (s) => s.counters.bosses,           reward: { gold: 3000, gems: 10 } },
  { id: "boss_50",    category: "combate",    icon: "🐲", label: "Caçador de Chefes II",    desc: "Derrote 50 chefes",          goal: 50,    metric: (s) => s.counters.bosses,           reward: { gems: 40, chest: 1 } },
  { id: "boss_200",   category: "combate",    icon: "🐲", label: "Slayer Lendário",         desc: "Derrote 200 chefes",         goal: 200,   metric: (s) => s.counters.bosses,           reward: { gems: 150, essence: 20, chest: 2 } },
  // Progressão — Rebirth
  { id: "reb_1",      category: "progressao", icon: "🌟", label: "Renascido",               desc: "Faça 1 Rebirth",             goal: 1,     metric: (s) => s.prestigeLevel,             reward: { essence: 5, gems: 30 } },
  { id: "reb_5",      category: "progressao", icon: "🌟", label: "Ciclo Eterno",            desc: "Faça 5 Rebirths",            goal: 5,     metric: (s) => s.prestigeLevel,             reward: { essence: 25, gems: 100 } },
  { id: "reb_25",     category: "progressao", icon: "🌟", label: "Ascendido",               desc: "Faça 25 Rebirths",           goal: 25,    metric: (s) => s.prestigeLevel,             reward: { essence: 150, gems: 500, chest: 2 } },
  // Progressão — estágios
  { id: "stg_50",     category: "progressao", icon: "🗺️", label: "Explorador",              desc: "Alcance o estágio 50",       goal: 50,    metric: (s) => s.maxStage,                  reward: { gold: 5000, gems: 15 } },
  { id: "stg_200",    category: "progressao", icon: "🗺️", label: "Desbravador",             desc: "Alcance o estágio 200",      goal: 200,   metric: (s) => s.maxStage,                  reward: { gold: 50000, gems: 60, chest: 1, cosmetic: "axe_gold" } },
  { id: "stg_1000",   category: "progressao", icon: "🗺️", label: "Andarilho Infinito",      desc: "Alcance o estágio 1000",     goal: 1000,  metric: (s) => s.maxStage,                  reward: { gems: 300, essence: 50, chest: 2 } },
  // Progressão — Torre
  { id: "twr_10",     category: "progressao", icon: "🗼", label: "Escalador",               desc: "Suba ao andar 10 da Torre",  goal: 10,    metric: (s) => s.tower.bestFloor,           reward: { gold: 4000, gems: 15 } },
  { id: "twr_50",     category: "progressao", icon: "🗼", label: "Alpinista Bravio",        desc: "Suba ao andar 50 da Torre",  goal: 50,    metric: (s) => s.tower.bestFloor,           reward: { gems: 80, essence: 5 } },
  { id: "twr_150",    category: "progressao", icon: "🗼", label: "Rei da Torre",            desc: "Suba ao andar 150 da Torre", goal: 150,   metric: (s) => s.tower.bestFloor,           reward: { gems: 250, essence: 30, chest: 2 } },
  // Social — Arena
  { id: "arn_5",      category: "social",     icon: "🏟️", label: "Estreante da Arena",      desc: "Vença 5 batalhas na Arena",  goal: 5,     metric: (s) => s.arena.wins,                reward: { gold: 3000, gems: 15 } },
  { id: "arn_25",     category: "social",     icon: "🏟️", label: "Gladiador",               desc: "Vença 25 batalhas na Arena", goal: 25,    metric: (s) => s.arena.wins,                reward: { gems: 60, essence: 5 } },
  { id: "arn_100",    category: "social",     icon: "🏟️", label: "Campeão da Arena",        desc: "Vença 100 batalhas na Arena", goal: 100,  metric: (s) => s.arena.wins,                reward: { gems: 200, essence: 30, chest: 2 } },
  // Social — Guilda (proxy: guild.xp acumulado por doações)
  { id: "gld_100",    category: "social",     icon: "🏰", label: "Membro Contribuinte",     desc: "Acumule 100 XP de Guilda",   goal: 100,   metric: (s) => s.guild.xp,                  reward: { gold: 2000, gems: 10 } },
  { id: "gld_1000",   category: "social",     icon: "🏰", label: "Pilar da Guilda",         desc: "Acumule 1.000 XP de Guilda", goal: 1000,  metric: (s) => s.guild.xp,                  reward: { gems: 60, essence: 5 } },
  { id: "gld_10000",  category: "social",     icon: "🏰", label: "Lenda da Guilda",         desc: "Acumule 10.000 XP de Guilda",goal: 10000, metric: (s) => s.guild.xp,                  reward: { gems: 250, essence: 30, chest: 2 } },
  // Coleção — Pets
  { id: "pet_1",      category: "colecao",    icon: "🐾", label: "Primeiro Companheiro",    desc: "Colete 1 pet",               goal: 1,     metric: (s) => s.pets.length,               reward: { gold: 2000, gems: 10 } },
  { id: "pet_3",      category: "colecao",    icon: "🐾", label: "Amigo dos Animais",       desc: "Colete 3 pets",              goal: 3,     metric: (s) => s.pets.length,               reward: { gems: 40, petFragKind: "wolf", petFrags: 5 } },
  { id: "pet_8",      category: "colecao",    icon: "🐾", label: "Mestre dos Pets",         desc: "Colete 8 pets",              goal: 8,     metric: (s) => s.pets.length,               reward: { gems: 150, essence: 10, chest: 2 } },
  // Coleção — Skins
  { id: "skn_2",      category: "colecao",    icon: "🎭", label: "Estilo Novo",             desc: "Desbloqueie 2 skins",        goal: 2,     metric: (s) => s.skins.owned.length,        reward: { gold: 2500, gems: 10 } },
  { id: "skn_4",      category: "colecao",    icon: "🎭", label: "Fashionista",             desc: "Desbloqueie 4 skins",        goal: 4,     metric: (s) => s.skins.owned.length,        reward: { gems: 50, essence: 5 } },
  { id: "skn_5",      category: "colecao",    icon: "🎭", label: "Colecionador Total",      desc: "Desbloqueie todas as skins", goal: 5,     metric: (s) => s.skins.owned.length,        reward: { gems: 200, essence: 20, chest: 2 } },
];

const ACHIEVEMENT_CATEGORIES: { key: AchievementCategory; label: string; icon: string }[] = [
  { key: "combate",    label: "Combate",    icon: "⚔️" },
  { key: "progressao", label: "Progressão", icon: "🌟" },
  { key: "colecao",    label: "Coleção",    icon: "🎭" },
  { key: "social",     label: "Social",     icon: "🏰" },
];

function emptyAchievements(): AchievementsState {
  return { claimed: [] };
}

function achievementRewardLabel(r: AchievementReward): string {
  const parts: string[] = [];
  if (r.gold) parts.push(`${fmt(r.gold)}🪙`);
  if (r.gems) parts.push(`${r.gems}💎`);
  if (r.essence) parts.push(`${r.essence}✨`);
  if (r.chest) parts.push(r.chest === 2 ? "🎁 Baú Raro" : "🎁 Baú");
  if (r.petFrags && r.petFragKind) parts.push(`${r.petFrags}🧩 ${r.petFragKind}`);
  if (r.runeFrags) parts.push(`${r.runeFrags}🔮 runa`);
  if (r.cosmetic && COSMETIC_DEFS[r.cosmetic]) parts.push(`🎭 ${COSMETIC_DEFS[r.cosmetic].label}`);
  return parts.join(" · ");
}

// ===== Runas / Encantamentos (Fase 3 — Bloco 10) =====
const RUNE_UNLOCK_LEVEL = 35;
const RUNE_MAX_LEVEL = 10;
const RUNE_MAX_EQUIPPED = 3;

type RuneKind = "atk" | "hp" | "gold" | "xp" | "drop" | "crit";

type RunesState = {
  fragments: number;
  levels: Record<RuneKind, number>;
  equipped: RuneKind[];
};

type RuneDef = {
  id: RuneKind;
  label: string;
  icon: string;
  color: string;
  perLevel: number;   // fração (0.02 = +2% ou +0.02 flat)
  kind: "pct" | "flat"; // pct multiplicativo, flat somado
  desc: (v: number) => string;
};

const RUNE_DEFS: Record<RuneKind, RuneDef> = {
  atk:  { id: "atk",  label: "Runa do Ataque",     icon: "🗡️", color: "from-red-500 to-red-800",         perLevel: 0.02,  kind: "pct",  desc: (v) => `+${(v*100).toFixed(0)}% ATK` },
  hp:   { id: "hp",   label: "Runa da Vida",       icon: "❤️", color: "from-rose-500 to-rose-800",       perLevel: 0.02,  kind: "pct",  desc: (v) => `+${(v*100).toFixed(0)}% HP` },
  gold: { id: "gold", label: "Runa da Fortuna",    icon: "🪙", color: "from-amber-400 to-yellow-700",    perLevel: 0.015, kind: "pct",  desc: (v) => `+${(v*100).toFixed(1)}% Ouro` },
  xp:   { id: "xp",   label: "Runa do Aprendizado",icon: "📘", color: "from-sky-500 to-indigo-700",      perLevel: 0.015, kind: "pct",  desc: (v) => `+${(v*100).toFixed(1)}% XP` },
  drop: { id: "drop", label: "Runa do Caçador",    icon: "🎯", color: "from-emerald-500 to-emerald-800", perLevel: 0.005, kind: "flat", desc: (v) => `+${(v*100).toFixed(1)}% Drop` },
  crit: { id: "crit", label: "Runa Crítica",       icon: "💥", color: "from-fuchsia-500 to-purple-800",  perLevel: 0.5,   kind: "flat", desc: (v) => `+${v.toFixed(1)}% Crítico` },
};

const RUNE_ORDER: RuneKind[] = ["atk", "hp", "gold", "xp", "drop", "crit"];

function emptyRunes(): RunesState {
  return {
    fragments: 0,
    levels: { atk: 0, hp: 0, gold: 0, xp: 0, drop: 0, crit: 0 },
    equipped: [],
  };
}

function runeUpgradeCost(currentLv: number): { gold: number; fragments: number } {
  const next = currentLv + 1;
  return {
    gold: Math.floor(500 * Math.pow(next, 1.7)),
    fragments: 2 + next * 2,
  };
}

type RuneBonus = { atkMul: number; hpMul: number; goldMul: number; xpMul: number; dropAdd: number; critAdd: number };

function runeBonus(s: SaveState): RuneBonus {
  const acc: RuneBonus = { atkMul: 1, hpMul: 1, goldMul: 1, xpMul: 1, dropAdd: 0, critAdd: 0 };
  const r = s.runes;
  if (!r || s.level < RUNE_UNLOCK_LEVEL) return acc;
  for (const k of r.equipped) {
    const lv = Math.min(RUNE_MAX_LEVEL, r.levels[k] ?? 0);
    if (lv <= 0) continue;
    const def = RUNE_DEFS[k];
    const v = def.perLevel * lv;
    if (k === "atk")  acc.atkMul  += v;
    if (k === "hp")   acc.hpMul   += v;
    if (k === "gold") acc.goldMul += v;
    if (k === "xp")   acc.xpMul   += v;
    if (k === "drop") acc.dropAdd += v;
    if (k === "crit") acc.critAdd += v;
  }
  return acc;
}

function runeCurrentValue(kind: RuneKind, lv: number): number {
  return RUNE_DEFS[kind].perLevel * Math.min(RUNE_MAX_LEVEL, Math.max(0, lv));
}

// ===== Cosméticos avançados (Fase 3 — Bloco 11) =====
// Puramente visuais/status — NUNCA afetam ATK/HP/XP/Ouro/Drop/Crit
type CosmeticCategory = "weapon" | "aura" | "frame" | "title";
type CosmeticRarity = "Comum" | "Raro" | "Épico" | "Lendário";
type CosmeticId = string;

type CosmeticDef = {
  id: CosmeticId;
  category: CosmeticCategory;
  label: string;
  icon: string;
  rarity: CosmeticRarity;
  color: string;
  desc: string;
  source: string;
};

type CosmeticsState = {
  owned: CosmeticId[];
  equipped: Partial<Record<CosmeticCategory, CosmeticId | null>>;
};

const COSMETIC_DEFS: Record<CosmeticId, CosmeticDef> = {
  // Armas visuais
  none_weapon:  { id: "none_weapon",  category: "weapon", label: "Sem arma visual", icon: "❌", rarity: "Comum",    color: "from-slate-500 to-slate-700",     desc: "Nenhum efeito visual",           source: "Padrão" },
  sword_green:  { id: "sword_green",  category: "weapon", label: "Espada Verde",    icon: "🗡️", rarity: "Raro",     color: "from-emerald-500 to-green-700",   desc: "Uma lâmina esmeralda",           source: "Baú Raro" },
  axe_gold:     { id: "axe_gold",     category: "weapon", label: "Machado Dourado", icon: "🪓", rarity: "Épico",    color: "from-amber-400 to-yellow-700",    desc: "Forjado em ouro puro",           source: "Conquistas" },
  // Auras
  none_aura:    { id: "none_aura",    category: "aura",   label: "Sem aura",        icon: "❌", rarity: "Comum",    color: "from-slate-500 to-slate-700",     desc: "Nenhuma aura",                   source: "Padrão" },
  aura_blue:    { id: "aura_blue",    category: "aura",   label: "Aura Azul",       icon: "💠", rarity: "Raro",     color: "from-sky-400 to-blue-700",        desc: "Um brilho tranquilo",            source: "Evento" },
  aura_legend:  { id: "aura_legend",  category: "aura",   label: "Aura Lendária",   icon: "✨", rarity: "Lendário", color: "from-fuchsia-500 to-purple-800",  desc: "Poucos a ostentaram",            source: "Baú Raro" },
  // Molduras
  none_frame:   { id: "none_frame",   category: "frame",  label: "Sem moldura",     icon: "▫️", rarity: "Comum",    color: "from-slate-500 to-slate-700",     desc: "Sem moldura de avatar",          source: "Padrão" },
  frame_brasil: { id: "frame_brasil", category: "frame",  label: "Moldura Brasil",  icon: "🇧🇷", rarity: "Épico",    color: "from-green-500 to-yellow-500",    desc: "Cores da bandeira tupiniquim",   source: "Evento" },
  // Títulos
  title_none:    { id: "title_none",    category: "title", label: "Sem título",           icon: "—", rarity: "Comum",    color: "from-slate-500 to-slate-700",   desc: "Nenhum título exibido",     source: "Padrão" },
  title_founder: { id: "title_founder", category: "title", label: "Fundador Beta",        icon: "🌟", rarity: "Lendário", color: "from-amber-400 to-orange-700", desc: "Esteve aqui no início",     source: "Bônus inicial" },
};

const COSMETIC_CATEGORIES: { key: CosmeticCategory; label: string; icon: string }[] = [
  { key: "weapon", label: "Armas",     icon: "🗡️" },
  { key: "aura",   label: "Auras",     icon: "✨" },
  { key: "frame",  label: "Molduras",  icon: "🖼️" },
  { key: "title",  label: "Títulos",   icon: "🏷️" },
];

function emptyCosmetics(): CosmeticsState {
  return {
    owned: ["none_weapon", "none_aura", "none_frame", "title_none", "title_founder"],
    equipped: { weapon: "none_weapon", aura: "none_aura", frame: "none_frame", title: "title_founder" },
  };
}

// ===== Códigos / Redeem (Fase 3 — Bloco 12) =====
type RedeemReward = {
  gold?: number;
  gems?: number;
  essence?: number;
  epicChest?: boolean;
  cosmetic?: CosmeticId;
  skin?: SkinId;
};
type RedeemDef = { label: string; desc: string; reward: RedeemReward };

// Códigos beta removidos. Cupons ativos são gerenciados pelo Admin (remote).
const REDEEM_CODES: Record<string, RedeemDef> = {};











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

const SKILLS: {
  name: string;
  unlock: number;
  icon: "sword" | "zap" | "flame" | "crown";
  color: string;      // active gradient
  border: string;     // active border
  desc: string;       // tooltip / didactic hint
}[] = [
  { name: "Ataque",   unlock: 1,  icon: "sword", color: "from-orange-400 to-orange-600", border: "border-orange-800", desc: "Golpe básico automático — sempre ativo." },
  { name: "Golpe",    unlock: 5,  icon: "zap",   color: "from-rose-400 to-rose-600",     border: "border-rose-800",   desc: "Investida rápida a cada poucos segundos." },
  { name: "Fúria",    unlock: 20, icon: "flame", color: "from-sky-400 to-sky-600",       border: "border-sky-800",    desc: "Combo em área que causa dano extra." },
  { name: "Ultimate", unlock: 40, icon: "crown", color: "from-amber-300 to-yellow-500",  border: "border-amber-700",  desc: "Habilidade suprema — abre no Lv 40." },
];

// Metadados de casting/CD por habilidade ativa. Ataque é o básico, sem cast.
// Prioridade ao escolher a próxima habilidade a executar (maior primeiro).
type SkillFxKind = "lightning" | "fire" | "aura";
const SKILL_META: Record<
  string,
  { cooldownMs: number; castMs: number; mult: number; priority: number; ringColor: string; glow: string; emoji: string; label: string; fx: SkillFxKind; sound: "zap" | "whoosh" | "boom" }
> = {
  Golpe:    { cooldownMs: 4000,  castMs: 500,  mult: 1.8, priority: 1, ringColor: "from-rose-400 to-rose-700",   glow: "shadow-rose-500/70",   emoji: "⚡", label: "GOLPE!",    fx: "lightning", sound: "zap" },
  Fúria:    { cooldownMs: 9000,  castMs: 800,  mult: 3.2, priority: 2, ringColor: "from-sky-400 to-sky-700",     glow: "shadow-sky-500/70",    emoji: "🔥", label: "FÚRIA!",    fx: "fire",      sound: "whoosh" },
  Ultimate: { cooldownMs: 22000, castMs: 1200, mult: 6.5, priority: 3, ringColor: "from-amber-300 to-yellow-600", glow: "shadow-amber-500/80",  emoji: "👑", label: "ULTIMATE!", fx: "aura",      sound: "boom" },
};

const PASSIVE_SLOTS = [
  { name: "Passiva I",  unlock: 60, desc: "Bônus permanente de dano." },
  { name: "Passiva II", unlock: 80, desc: "Bônus permanente de vida." },
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
    dungeon: emptyDungeon(),
    pets: [],
    equippedPetId: null,
    petFragments: emptyPetFragments(),
    tower: emptyTower(),
    blessings: emptyBlessings(),
    guild: emptyGuild(),
    arena: emptyArena(),
    event: emptyEvent(),
    skins: emptySkins(),
    achievements: emptyAchievements(),
    runes: emptyRunes(),
    cosmetics: emptyCosmetics(),
    redeem: { used: [] },
    version: SAVE_VERSION,
  };
}

function mergeSave(parsed: unknown): SaveState {
  const base = defaultSave();
  if (!parsed || typeof parsed !== "object") return base;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = parsed as any;
  const merged: SaveState = {
    ...base,
    ...p,
    attrs: { ...base.attrs, ...(p.attrs ?? {}) } as Record<AttrKey, Attr>,
    equipment: { ...emptyEquipment(), ...(p.equipment ?? {}) },
    inventory: Array.isArray(p.inventory) ? p.inventory : [],
    globalUp: { ...emptyGlobalUp(), ...(p.globalUp ?? {}) },
    daily: { ...base.daily, ...(p.daily ?? {}), streakClaimed: Array.isArray(p.daily?.streakClaimed) ? p.daily.streakClaimed : [] },
    freeChest: { ...base.freeChest, ...(p.freeChest ?? {}) },
    lastSeenAt: typeof p.lastSeenAt === "number" ? p.lastSeenAt : Date.now(),
    counters: { ...emptyCounters(), ...(p.counters ?? {}) },
    missions: {
      ...emptyMissions(),
      ...(p.missions ?? {}),
      daily: Array.isArray(p.missions?.daily) ? p.missions.daily : [],
      weekly: Array.isArray(p.missions?.weekly) ? p.missions.weekly : [],
    },
    dungeon: { ...emptyDungeon(), ...(p.dungeon ?? {}) },
    pets: Array.isArray(p.pets) ? p.pets : [],
    equippedPetId: typeof p.equippedPetId === "string" ? p.equippedPetId : null,
    petFragments: { ...emptyPetFragments(), ...(p.petFragments ?? {}) },
    tower: { ...emptyTower(), ...(p.tower ?? {}) },
    blessings: { ...emptyBlessings(), ...(p.blessings ?? {}) },
    guild: { ...emptyGuild(), ...(p.guild ?? {}) },
    arena: { ...emptyArena(), ...(p.arena ?? {}) },
    event: {
      ...emptyEvent(),
      ...(p.event ?? {}),
      missions: Array.isArray(p.event?.missions) ? p.event.missions : [],
    },
    skins: normalizeSkins(p.skins),
    achievements: {
      claimed: Array.isArray(p.achievements?.claimed) ? p.achievements.claimed : [],
    },
    runes: {
      fragments: typeof p.runes?.fragments === "number" ? p.runes.fragments : 0,
      levels: { ...emptyRunes().levels, ...(p.runes?.levels ?? {}) },
      equipped: Array.isArray(p.runes?.equipped)
        ? (p.runes.equipped.filter((k: string) => (RUNE_ORDER as string[]).includes(k)) as RuneKind[]).slice(0, RUNE_MAX_EQUIPPED)
        : [],
    },
    cosmetics: (() => {
      const b = emptyCosmetics();
      const parsedOwned: string[] = Array.isArray(p.cosmetics?.owned) ? p.cosmetics.owned : [];
      const ownedSet = new Set<string>([...b.owned, ...parsedOwned.filter((id) => id in COSMETIC_DEFS)]);
      const eq: Partial<Record<CosmeticCategory, CosmeticId | null>> = { ...b.equipped };
      const pe = (p.cosmetics?.equipped ?? {}) as Record<string, unknown>;
      for (const c of COSMETIC_CATEGORIES) {
        const v = pe[c.key];
        if (typeof v === "string" && v in COSMETIC_DEFS && ownedSet.has(v) && COSMETIC_DEFS[v].category === c.key) {
          eq[c.key] = v;
        }
      }
      return { owned: Array.from(ownedSet), equipped: eq };
    })(),
    redeem: { used: Array.isArray(p.redeem?.used) ? p.redeem.used.filter((c: unknown) => typeof c === "string") : [] },
    version: SAVE_VERSION,
  };
  for (const k of ATTR_ORDER) {
    if (!merged.attrs[k]) merged.attrs[k] = { level: 0 };
  }
  return merged;
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
  component: GameGate,
});

// BRHero é um jogo web responsivo. Em desktop/tablet o jogo fica centralizado
// com backdrop animado por bioma nas laterais; em mobile ocupa quase toda a
// largura. Sem gate de plataforma — roda em qualquer navegador.
function GameGate() {
  return (
    <>
      <BiomeBackdrop />
      <div className="mx-auto w-full max-w-[560px] md:max-w-[600px] lg:max-w-[640px]">
        <GamePage />
      </div>
    </>
  );
}


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
  const navigate = useNavigate();
  useSingleSessionGuard((reason) => {
    alert(reason);
    navigate({ to: "/" });
  });
  const [save, setSave] = useState<SaveState | null>(null);
  const saveRef = useRef<SaveState | null>(null);
  const cloudDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOwnWriteAtRef = useRef<string | null>(null);
  const lastAppliedRemoteStampRef = useRef<string | null>(null);
  const autoSavePausedUntilRef = useRef<number>(0);
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
  // Sistema de habilidades ativas (com cast + cooldown, nunca simultâneas)
  const skillCdRef = useRef<Record<string, number>>({ Golpe: 0, Fúria: 0, Ultimate: 0 });
  type CastingState = { name: keyof typeof SKILL_META; startedAt: number; endsAt: number };
  const castingRef = useRef<CastingState | null>(null);
  const [casting, setCasting] = useState<CastingState | null>(null);
  const [skillCds, setSkillCds] = useState<Record<string, number>>({ Golpe: 0, Fúria: 0, Ultimate: 0 });
  const [skillBanner, setSkillBanner] = useState<{ id: number; name: string; emoji: string; glow: string } | null>(null);
  const skillBannerIdRef = useRef(0);
  // FX visual por habilidade (raios/fogo/aura) e toque manual para forçar cast
  const [skillFx, setSkillFx] = useState<{ id: number; kind: SkillFxKind; endsAt: number } | null>(null);
  const skillFxIdRef = useRef(0);
  const manualCastRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playSkillSound = useCallback((kind: "zap" | "whoosh" | "boom") => {
    try {
      const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      if (!AC) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.18;
      master.connect(ctx.destination);
      if (kind === "zap") {
        const o = ctx.createOscillator();
        o.type = "square";
        o.frequency.setValueAtTime(880, now);
        o.frequency.exponentialRampToValueAtTime(180, now + 0.22);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        o.connect(g); g.connect(master); o.start(now); o.stop(now + 0.3);
      } else if (kind === "whoosh") {
        const bufferSize = 2 * ctx.sampleRate * 0.45;
        const noise = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        const src = ctx.createBufferSource(); src.buffer = noise;
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = 1.2;
        const g = ctx.createGain(); g.gain.value = 0.9;
        src.connect(bp); bp.connect(g); g.connect(master); src.start(now); src.stop(now + 0.5);
      } else {
        // boom
        const o = ctx.createOscillator(); o.type = "sawtooth";
        o.frequency.setValueAtTime(120, now);
        o.frequency.exponentialRampToValueAtTime(40, now + 0.6);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(1, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        o.connect(g); g.connect(master); o.start(now); o.stop(now + 0.8);
      }
    } catch { /* audio opcional */ }
  }, []);
  const [heroHit, setHeroHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [enemyDying, setEnemyDying] = useState(false);
  const [heroDying, setHeroDying] = useState(false);
  const heroDyingRef = useRef(false);
  const [pickStageOpen, setPickStageOpen] = useState(false);
  const [deathCountdown, setDeathCountdown] = useState<number | null>(null);
  const [heroLunge, setHeroLunge] = useState(false);
  const [enemyLunge, setEnemyLunge] = useState(false);
  const [deathBanner, setDeathBanner] = useState<null | "hero" | "enemy">(null);
  const [toast, setToast] = useState<string | null>(null);
  const [levelFlash, setLevelFlash] = useState(false);
  const [bgCache, setBgCache] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<"equip" | "arena" | "store" | "rebirth" | "crystals" | "daily" | "missions" | "dungeon" | "pets" | "tower" | "blessings" | "guild" | "event" | "skins" | "achievements" | "runes" | "cosmetics" | "codes" | "menu" | "cloud" | null>(null);
  const [offlineReport, setOfflineReport] = useState<{ ms: number; gold: number; xp: number; drops: number } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error("fullscreen error", e);
    }
  }, []);
  const handleChatUnread = useCallback((n: number) => {
    // sentinela: n === -1 significa "incrementa 1"
    setChatUnread((prev) => (n < 0 ? prev + 1 : n));
  }, []);
  const prevLevelRef = useRef(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>(() => {
    try { return localStorage.getItem("brhero_display_name_v1") || "Herói"; } catch { return "Herói"; }
  });
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const { data } = await _supaClient.auth.getUser();
        const u = data.user;
        if (!u) return;
        const stored = localStorage.getItem("brhero_display_name_v1");
        if (stored) return;
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        const name = (meta.full_name as string) || (meta.name as string) || (u.email?.split("@")[0]) || "Herói";
        setDisplayName(name);
        try { localStorage.setItem("brhero_display_name_v1", name); } catch { /* noop */ }
      } catch { /* noop */ }
    })();
  }, []);
  const saveDisplayName = async (raw: string) => {
    const name = raw.trim().slice(0, 20) || "Herói";
    setDisplayName(name);
    try { localStorage.setItem("brhero_display_name_v1", name); } catch { /* noop */ }
    try { await _supaClient.auth.updateUser({ data: { full_name: name, name } }); } catch { /* noop */ }
    setEditingName(false);
  };
  const refStats = useReferralStats(currentUserId);

  // Convites: captura ?ref= da URL e tenta creditar 10💎 ao convidante quando o jogador loga
  useEffect(() => {
    captureReferralFromUrl();
    let disposed = false;
    const run = async () => {
      const { data } = await _supaClient.auth.getSession();
      const uid = data.session?.user.id ?? null;
      if (disposed) return;
      setCurrentUserId(uid);
      if (uid) {
        const res = await tryClaimPendingReferral(uid);
        if (res?.ok && !disposed) {
          try { window.dispatchEvent(new CustomEvent("brhero:toast", { detail: `🎁 Convite ativado! +${res.gems ?? 10}💎 para quem te convidou` })); } catch { /* noop */ }
        }
      }
    };
    void run();
    const { data: sub } = _supaClient.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") { setCurrentUserId(session?.user.id ?? null); void run(); }
      if (event === "SIGNED_OUT") setCurrentUserId(null);
    });
    return () => { disposed = true; sub.subscription.unsubscribe(); };
  }, []);


  // Init — carrega SOMENTE da nuvem. Sem conta, volta para a home.
  const cloudUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCloudUser();
      if (cancelled) return;
      if (!user) {
        navigate({ to: "/", replace: true });
        return;
      }
      cloudUserIdRef.current = user.id;
      let s: SaveState;
      try {
        const remote = await loadCloudSave(user.id);
        lastOwnWriteAtRef.current = remote?.client_updated_at ?? null;
        s = remote ? mergeSave(remote.save_data) : defaultSave();
      } catch {
        s = defaultSave();
      }
      if (cancelled) return;
      s.event = ensureEventStarted(s);
      // ==== Recompensas Offline ====
      const now = Date.now();
      const elapsed = Math.max(0, Math.min(OFFLINE_MAX_MS, now - (s.lastSeenAt ?? now)));
      if (elapsed > 60_000) {
        const battles = Math.floor(elapsed / 2000);
        const enemy = enemyForStage(s.stage);
        const lo = getLiveOpsMultipliers();
        const goldMul = (1 + (s.globalUp?.gold ?? 0) * GLOBAL_UP_DEFS.gold.perLevel) * lo.gold;
        const xpMul = (1 + (s.globalUp?.xp ?? 0) * GLOBAL_UP_DEFS.xp.perLevel) * lo.xp;
        const gold = Math.floor(battles * enemy.gold * 0.4 * goldMul);
        const xp = Math.floor(battles * enemy.xp * 0.4 * xpMul);
        const drops = Math.min(20, Math.floor(battles * 0.02 * lo.drop));
        s.gold += gold;
        s.xp += xp;
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
    })();
    // Se o usuário deslogar durante o jogo, volta imediatamente para a home.
    const { data: sub } = _supaClient.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        cloudUserIdRef.current = null;
        navigate({ to: "/", replace: true });
      }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [navigate]);

  // Tick 30s: playtime + rotação de missões. Persistência é feita no efeito de save.
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
    const flush = () => {
      const cur = saveRef.current;
      const uid = cloudUserIdRef.current;
      if (!cur || !uid) return;
      if (Date.now() < autoSavePausedUntilRef.current) return;
      const next = { ...cur, lastSeenAt: Date.now() };
      lastOwnWriteAtRef.current = new Date(next.lastSeenAt).toISOString();
      void saveCloudSave(uid, next).catch(() => { /* silencioso */ });
    };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("visibilitychange", flush);
    return () => { clearInterval(iv); window.removeEventListener("beforeunload", flush); window.removeEventListener("visibilitychange", flush); };
  }, []);

  // Persistência em tempo real na nuvem (debounce 1.2s).
  // Trava (`autoSavePausedUntilRef`): após detectar update externo (painel admin),
  // suspendemos o auto-save por alguns segundos para não sobrescrever o que
  // o admin acabou de aplicar.
  useEffect(() => {
    if (!save) return;
    saveRef.current = save;
    const uid = cloudUserIdRef.current;
    if (!uid) return;
    if (cloudDebounceRef.current) clearTimeout(cloudDebounceRef.current);
    cloudDebounceRef.current = setTimeout(() => {
      if (Date.now() < autoSavePausedUntilRef.current) return; // trava ativa
      void saveCloudSave(uid, save)
        .then((canonicalStamp) => { lastOwnWriteAtRef.current = canonicalStamp; })
        .catch(() => { /* silencioso */ });
    }, 1200);
    return () => {
      if (cloudDebounceRef.current) clearTimeout(cloudDebounceRef.current);
    };
  }, [save]);

  // Realtime: escuta UPDATE na linha do próprio jogador em player_saves.
  // Se o timestamp remoto for diferente do último write feito por este cliente,
  // é uma edição externa (painel admin) — pausa o auto-save por 8s e aplica
  // o novo save em memória, sem recarregar a página.
  useEffect(() => {
    const uid = cloudUserIdRef.current;
    if (!uid) return;
    const channel = _supaClient
      .channel(`player-save-${uid}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "player_saves", filter: `user_id=eq.${uid}` },
        (payload) => {
          const row = payload.new as { client_updated_at?: string; save_data?: unknown } | null;
          const remoteStamp = row?.client_updated_at ?? null;
          const ownStamp = lastOwnWriteAtRef.current;
          if (!remoteStamp) return;
          if (ownStamp) {
            const dr = new Date(remoteStamp).getTime();
            const dl = new Date(ownStamp).getTime();
            if (Number.isFinite(dr) && Number.isFinite(dl) && Math.abs(dr - dl) < 2000) return; // eco do próprio write
          }
          if (lastAppliedRemoteStampRef.current === remoteStamp) return;
          if (!row || row.save_data === undefined) return;

          autoSavePausedUntilRef.current = Date.now() + 8_000;
          if (cloudDebounceRef.current) {
            clearTimeout(cloudDebounceRef.current);
            cloudDebounceRef.current = null;
          }

          const next = mergeSave(row.save_data);
          next.event = ensureEventStarted(next);
          lastAppliedRemoteStampRef.current = remoteStamp;
          saveRef.current = next;
          setSave(next);

          const stats = computeStats(next);
          heroHpRef.current = stats.hp;
          setHeroHp(stats.hp);
          const enemy = enemyForStage(next.stage);
          enemyRef.current = enemy;
          enemyHpRef.current = enemy.hp;
          setEnemyHp(enemy.hp);
          heroCdRef.current = 200;
          enemyCdRef.current = 700;
          setHeroDying(false);
          heroDyingRef.current = false;
          setEnemyDying(false);
          setDeathCountdown(null);
          setToast(`✅ Save atualizado pelo painel · Stage ${formatStage(next.stage)}`);
          window.setTimeout(() => setToast(null), 2200);
        },
      )
      .subscribe();
    return () => { void _supaClient.removeChannel(channel); };
  }, [cloudUserIdRef.current]);




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

  // OAuth callback do APK: finaliza a sessão e mantém o jogador direto no jogo.
  useEffect(() => {
    const currentUrl = window.location.href;
    if (!currentUrl.includes("brhero_native=1") && !currentUrl.includes("access_token=") && !currentUrl.includes("code=")) {
      return;
    }

    let cancelled = false;
    void completeNativeOAuthFromUrl(currentUrl)
      .then(async (handled) => {
        if (!handled || cancelled) return;
        await closeNativeAuthBrowser();
        window.history.replaceState({}, document.title, "/game");
        flashToast("✅ Login Google conectado");
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Falha ao concluir login Google";
        flashToast(`⚠️ ${msg}`);
      });

    return () => {
      cancelled = true;
    };
  }, [flashToast]);

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

      // Cooldowns de habilidades ativas (nunca ocorrem em paralelo)
      let cdChanged = false;
      for (const k of Object.keys(skillCdRef.current)) {
        if (skillCdRef.current[k] > 0) {
          skillCdRef.current[k] = Math.max(0, skillCdRef.current[k] - TICK);
          cdChanged = true;
        }
      }
      if (cdChanged) setSkillCds({ ...skillCdRef.current });

      // Resolve cast em andamento
      const nowMs = Date.now();
      const cast = castingRef.current;
      if (cast && nowMs >= cast.endsAt) {
        const meta = SKILL_META[cast.name];
        if (enemyHpRef.current > 0 && heroHpRef.current > 0) {
          const effDef = Math.max(0, enemy.def - stats.penetration);
          let dmg = Math.max(1, stats.atk - effDef);
          dmg = Math.floor(dmg * meta.mult * (0.95 + Math.random() * 0.1));
          enemyHpRef.current = Math.max(0, enemyHpRef.current - dmg);
          setEnemyHp(enemyHpRef.current);
          setEnemyHit(true);
          setHeroLunge(true);
          setTimeout(() => setEnemyHit(false), 320);
          setTimeout(() => setHeroLunge(false), 520);
          spawnDamage(dmg, true, "hero");
          const bId = ++skillBannerIdRef.current;
          setSkillBanner({ id: bId, name: meta.label, emoji: meta.emoji, glow: meta.glow });
          setTimeout(() => setSkillBanner((b) => (b && b.id === bId ? null : b)), 900);
        }
        skillCdRef.current[cast.name] = meta.cooldownMs;
        setSkillCds({ ...skillCdRef.current });
        castingRef.current = null;
        setCasting(null);
        heroCdRef.current = 350; // pequena pausa após cast
      }

      // Hero attack básico OU inicia um cast (habilidades nunca simultâneas)
      heroCdRef.current -= TICK;
      const heroInterval = (1000 / (stats.atkSpeed / 100)) * 1.7;
      if (
        !castingRef.current &&
        heroCdRef.current <= 0 &&
        enemyHpRef.current > 0 &&
        heroHpRef.current > 0
      ) {
        // Prioriza toque manual (força cast antes do auto-cast)
        let chosen: keyof typeof SKILL_META | null = null;
        const manual = manualCastRef.current;
        if (manual && SKILL_META[manual]) {
          const unlock = SKILLS.find((sk) => sk.name === manual)?.unlock ?? 999;
          if (s.level >= unlock && (skillCdRef.current[manual] ?? 0) <= 0) {
            chosen = manual as keyof typeof SKILL_META;
          }
          manualCastRef.current = null;
        }
        if (!chosen) {
          // Auto-cast: habilidade de maior prioridade pronta e desbloqueada
          const ready = (Object.keys(SKILL_META) as (keyof typeof SKILL_META)[])
            .filter((n) => {
              const unlock = SKILLS.find((sk) => sk.name === n)?.unlock ?? 999;
              return s.level >= unlock && (skillCdRef.current[n] ?? 0) <= 0;
            })
            .sort((a, b) => SKILL_META[b].priority - SKILL_META[a].priority);
          if (ready.length > 0) chosen = ready[0];
        }
        if (chosen) {
          const name = chosen;
          const meta = SKILL_META[name];
          const state: CastingState = { name, startedAt: nowMs, endsAt: nowMs + meta.castMs };
          castingRef.current = state;
          setCasting(state);
          heroCdRef.current = meta.castMs + 100; // trava o básico durante o cast
          // FX visual + som ao iniciar o cast
          const fxId = ++skillFxIdRef.current;
          setSkillFx({ id: fxId, kind: meta.fx, endsAt: nowMs + meta.castMs + 350 });
          setTimeout(() => setSkillFx((f) => (f && f.id === fxId ? null : f)), meta.castMs + 400);
          playSkillSound(meta.sound);
        } else {
          // Ataque básico
          heroCdRef.current = heroInterval;
          const crit = Math.random() * 100 < Math.min(80, stats.critChance);
          const effDef = Math.max(0, enemy.def - stats.penetration);
          let dmg = Math.max(1, stats.atk - effDef);
          if (crit) dmg = Math.floor(dmg * (stats.critDmg / 100));
          dmg = Math.floor(dmg * (0.92 + Math.random() * 0.16));
          enemyHpRef.current = Math.max(0, enemyHpRef.current - dmg);
          setEnemyHp(enemyHpRef.current);
          setEnemyHit(true);
          setHeroLunge(true);
          setTimeout(() => setEnemyHit(false), 260);
          setTimeout(() => setHeroLunge(false), 480);
          spawnDamage(dmg, crit, "hero");
          if (stats.lifesteal > 0) {
            const heal = Math.floor((dmg * Math.min(60, stats.lifesteal)) / 100);
            if (heal > 0) {
              heroHpRef.current = Math.min(stats.hp, heroHpRef.current + heal);
              setHeroHp(heroHpRef.current);
            }
          }
        }
      }

      // Enemy attack
      enemyCdRef.current -= TICK;
      if (enemyCdRef.current <= 0 && heroHpRef.current > 0 && enemyHpRef.current > 0) {
        enemyCdRef.current = 2100;
        let dmg = Math.max(1, enemy.atk - stats.defense);
        dmg = Math.floor(dmg * (0.92 + Math.random() * 0.16));
        heroHpRef.current = Math.max(0, heroHpRef.current - dmg);
        setHeroHp(heroHpRef.current);
        setHeroHit(true);
        setEnemyLunge(true);
        setTimeout(() => setHeroHit(false), 260);
        setTimeout(() => setEnemyLunge(false), 480);
        spawnDamage(dmg, false, "enemy");
      }

      // Enemy killed
      if (enemyHpRef.current <= 0) {
        setEnemyDying(true);
        setDeathBanner("enemy");
        setTimeout(() => setEnemyDying(false), 250);
        setTimeout(() => setDeathBanner((b) => (b === "enemy" ? null : b)), 700);
        onEnemyKilled();
      }

      // Hero died — show MORREU banner + action buttons; wait for user
      if (heroHpRef.current <= 0 && !heroDyingRef.current) {
        heroDyingRef.current = true;
        setHeroDying(true);
        setDeathBanner("hero");
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

  // Death countdown: auto-respawn at start of current biome block after 5s
  useEffect(() => {
    if (deathBanner !== "hero" || pickStageOpen) {
      setDeathCountdown(null);
      return;
    }
    setDeathCountdown(5);
    const tick = setInterval(() => {
      setDeathCountdown((c) => (c === null ? null : c - 1));
    }, 1000);
    const timeout = setTimeout(() => {
      const s = saveRef.current;
      if (!s) return;
      const blockStart = Math.floor((s.stage - 1) / 10) * 10 + 1;
      setSave((prev) => {
        if (!prev) return prev;
        const next = { ...prev, stage: blockStart };
        saveRef.current = next;
        return next;
      });
      setDeathBanner(null);
      setHeroDying(false);
      heroDyingRef.current = false;
      setTimeout(() => respawn(), 0);
    }, 5000);
    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [deathBanner, pickStageOpen]);


  const onEnemyKilled = () => {
    const cur = saveRef.current;
    if (!cur) return;
    const enemy = enemyRef.current;
    if (!enemy) return;
    // Global prestige bonuses + pet + bênçãos
    const pb = petBonus(cur);
    const bb = blessingBonus(cur);
    const gb = guildBonus(cur);
    const rb = runeBonus(cur);
    const lo = getLiveOpsMultipliers();
    const goldMul = (1 + (cur.globalUp?.gold ?? 0) * GLOBAL_UP_DEFS.gold.perLevel) * pb.goldMul * bb.goldMul * gb.goldMul * rb.goldMul * lo.gold;
    const xpMul = (1 + (cur.globalUp?.xp ?? 0) * GLOBAL_UP_DEFS.xp.perLevel) * pb.xpMul * bb.xpMul * gb.xpMul * rb.xpMul * lo.xp;
    const gainedGold = Math.floor(enemy.gold * goldMul);
    const gainedXp = Math.floor(enemy.xp * xpMul);
    let level = cur.level;
    let xp = cur.xp + gainedXp;
    while (xp >= xpForLevel(level)) {
      xp -= xpForLevel(level);
      level += 1;
    }
    const canDrop = level >= 3 || cur.level >= 3;
    const dropBonus = ((cur.globalUp?.drop ?? 0) * GLOBAL_UP_DEFS.drop.perLevel + pb.dropAdd + bb.dropAdd + rb.dropAdd) * lo.drop;
    const drop = canDrop && (enemy.isBoss || Math.random() < 0.12 + dropBonus)
      ? rollItem(SLOTS[Math.floor(Math.random() * SLOTS.length)].key, cur.stage)
      : null;
    if (drop) flashToast(`📦 ${drop.rarity} ${SLOTS.find(s => s.key === drop.slot)!.label}`);
    const nextStage = cur.stage + 1;
    // Evento: medalhas + progresso missões
    let ev = ensureEventStarted(cur);
    const medalGain = eventActive(ev) ? (enemy.isBoss ? 5 : 1) : 0;
    ev = addMedals(ev, medalGain);
    ev = bumpEventMission(ev, "kill", 1);
    if (enemy.isBoss) ev = bumpEventMission(ev, "boss", 1);
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
      event: ev,
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
        counters: { ...prev.counters, upgrades: prev.counters.upgrades + 1 },
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

  const bulkSellItems = (ids: string[]) => {
    if (ids.length === 0) return;
    setSave((prev) => {
      if (!prev) return prev;
      const idSet = new Set(ids);
      const sold = prev.inventory.filter((i) => idSet.has(i.id));
      if (sold.length === 0) return prev;
      const gain = sold.reduce(
        (acc, item) => acc + Math.floor(50 * (RARITIES.find((r) => r.name === item.rarity)?.mult ?? 1)),
        0,
      );
      flashToast(`♻️ ${sold.length} destruído(s) · +${fmt(gain)} 🪙`);
      return {
        ...prev,
        gold: prev.gold + gain,
        inventory: prev.inventory.filter((i) => !idSet.has(i.id)),
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
          next = { ...next, inventory: [...next.inventory, item].slice(-60), counters: { ...next.counters, chests: next.counters.chests + 1 } };
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
        // Preservado entre prestígios (moedas premium/meta)
        gems: prev.gems,
        essence: prev.essence + gained,
        prestigeLevel: prev.prestigeLevel + 1,
        maxStage: prev.maxStage,
        globalUp: prev.globalUp,
        stage: startStage,
        // Coleções permanentes — nunca resetam no Rebirth
        pets: prev.pets,
        equippedPetId: prev.equippedPetId,
        petFragments: prev.petFragments,
        tower: { ...fresh.tower, bestFloor: prev.tower.bestFloor },
        guild: { ...prev.guild, donationsToday: 0, bossLastAt: 0 },
        arena: { ...prev.arena, ticketsToday: 0, extraTickets: prev.arena.extraTickets, lastTicketDay: null },
        skins: prev.skins,
        achievements: prev.achievements,
        runes: prev.runes,
        cosmetics: prev.cosmetics,
        redeem: prev.redeem,
        counters: prev.counters,
        daily: prev.daily,
        event: prev.event,
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

  // ==== Sandbox purchase delivery (Fase 3 · Bloco 4a.2) ====
  const deliverSandboxReward = useCallback((tx: PaymentTransaction, parsed: ParsedReward) => {
    const g = parsed.gems || 100; // fallback mínimo se parsing falhar
    setSave((prev) => prev ? {
      ...prev,
      gems: prev.gems + g,
      gold: prev.gold + (parsed.gold || 0),
      essence: prev.essence + (parsed.essence || 0),
    } : prev);
    const parts: string[] = [];
    if (g) parts.push(`💎 +${g}`);
    if (parsed.gold) parts.push(`🪙 +${fmt(parsed.gold)}`);
    if (parsed.essence) parts.push(`✨ +${parsed.essence}`);
    flashToast(`🛒 Sandbox: ${parts.join(" ")} entregue`);
    void tx; // audit registrada no backend
  }, [flashToast]);
  useSandboxDelivery(deliverSandboxReward);


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
    return { next: { ...next, inventory: inv, counters: { ...next.counters, chests: next.counters.chests + count } }, msg: `${r.icon} ${r.label} aberto!` };
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
      // Chance de pet no baú raro
      let pets = prev.pets;
      let frags = prev.petFragments;
      if (tier === "rare" && Math.random() < 0.35) {
        const d = maybePetDrop(0.15);
        if (d.pet) { pets = [...pets, d.pet]; flashToast(`🐾 Pet ${PET_DEFS[d.pet.kind].label} (${d.pet.rarity})!`); }
        else if (d.fragKind && d.fragAmt) { frags = { ...frags, [d.fragKind]: frags[d.fragKind] + d.fragAmt }; flashToast(`🧩 +${d.fragAmt} frag. ${PET_DEFS[d.fragKind].label}`); }
      }
      // Chance pequena de skin cosmética no baú raro
      let skins = prev.skins;
      if (tier === "rare" && Math.random() < 0.05) {
        const pool: SkinId[] = (["green", "gold", "shadow"] as SkinId[]).filter((s) => !skins.owned.includes(s));
        if (pool.length > 0) {
          const drop = pool[Math.floor(Math.random() * pool.length)]!;
          skins = { ...skins, owned: [...skins.owned, drop] };
          flashToast(`✨ Skin desbloqueada: ${SKIN_DEFS[drop].label}!`);
        }
      }
      // Chance pequena de cosmético no baú raro
      let cosm = prev.cosmetics;
      if (tier === "rare" && Math.random() < 0.08) {
        const pool: CosmeticId[] = (["sword_green", "aura_legend"] as CosmeticId[]).filter((id) => !cosm.owned.includes(id));
        if (pool.length > 0) {
          const drop = pool[Math.floor(Math.random() * pool.length)]!;
          cosm = { ...cosm, owned: [...cosm.owned, drop] };
          flashToast(`🎭 Cosmético: ${COSMETIC_DEFS[drop].label}!`);
        }
      }
      return {
        ...prev,
        inventory: [...prev.inventory, item].slice(-60),
        counters: { ...prev.counters, chests: prev.counters.chests + 1 },
        pets,
        petFragments: frags,
        skins,
        cosmetics: cosm,
        freeChest: tier === "free"
          ? { ...prev.freeChest, lastFreeAt: now }
          : { ...prev.freeChest, lastRareAt: now },
      };
    });
  }, [flashToast]);

  const closeOfflineReport = useCallback(() => setOfflineReport(null), []);

  // ==== Missões: reivindicar ====
  const claimMission = useCallback((scope: "daily" | "weekly", id: string) => {
    setSave((prev) => {
      if (!prev) return prev;
      const list = prev.missions[scope];
      const m = list.find((x) => x.id === id);
      if (!m || m.claimed) return prev;
      const progress = Math.min(m.goal, counterOf(prev.counters, m.kind) - m.snapshot);
      if (progress < m.goal) { flashToast("Missão ainda incompleta"); return prev; }
      // aplicar recompensa
      let inv = prev.inventory;
      let chestCount = 0;
      for (let i = 0; i < m.reward.chest; i++) {
        const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)].key;
        inv = [...inv, rollItem(slot, prev.stage + (scope === "weekly" ? 3 : 0))].slice(-60);
        chestCount++;
      }
      const parts = [
        m.reward.gold > 0 ? `+${fmt(m.reward.gold)}🪙` : null,
        m.reward.gems > 0 ? `+${m.reward.gems}💎` : null,
        m.reward.essence > 0 ? `+${m.reward.essence}✨` : null,
        chestCount > 0 ? `+${chestCount}📦` : null,
      ].filter(Boolean).join(" ");
      flashToast(`🏅 Missão! ${parts}`);
      return {
        ...prev,
        gold: prev.gold + m.reward.gold,
        gems: prev.gems + m.reward.gems,
        essence: prev.essence + m.reward.essence,
        inventory: inv,
        counters: { ...prev.counters, chests: prev.counters.chests + chestCount },
        missions: {
          ...prev.missions,
          [scope]: list.map((x) => x.id === id ? { ...x, claimed: true } : x),
        },
      };
    });
  }, [flashToast]);

  // ==== Masmorra: entrar (consome 1 chave, entrega recompensas) ====
  const enterDungeon = useCallback((kind: DungeonKind): { ok: boolean; rewards?: { gold: number; gems: number; essence: number; items: Item[] } } => {
    const prev = saveRef.current;
    if (!prev) return { ok: false };
    if (prev.level < DUNGEON_UNLOCK_LEVEL) { flashToast(`🔒 Libera no Lv ${DUNGEON_UNLOCK_LEVEL}`); return { ok: false }; }
    const norm = dungeonKeysNow(prev.dungeon);
    if (norm.keys <= 0) { flashToast("🗝️ Sem chaves"); return { ok: false }; }

    // scaling — inimigos "mais fortes" traduzidos em recompensa maior
    const stage = prev.stage;
    const stagePlus = stage + 5;
    let gold = 0, gems = 0, essence = 0;
    const items: Item[] = [];

    if (kind === "gold") {
      gold = Math.floor(200 * Math.pow(1.12, stage) + stage * 40);
      if (Math.random() < 0.5) items.push(rollItem(SLOTS[Math.floor(Math.random() * SLOTS.length)].key, stagePlus));
      if (Math.random() < 0.05) essence = 1;
    } else if (kind === "gear") {
      gold = Math.floor(80 * Math.pow(1.1, stage) + stage * 15);
      for (let i = 0; i < 2; i++) items.push(rollItem(SLOTS[Math.floor(Math.random() * SLOTS.length)].key, stagePlus + 2));
      if (Math.random() < 0.1) essence = 1;
    } else {
      gold = Math.floor(60 * Math.pow(1.08, stage) + stage * 10);
      essence = 1 + Math.floor(stage / 40);
      items.push(rollItem(SLOTS[Math.floor(Math.random() * SLOTS.length)].key, stagePlus + 3));
      if (Math.random() < 0.3) gems = 2;
    }

    const newInv = [...prev.inventory, ...items].slice(-60);
    const nextDungeon: DungeonState = {
      keys: norm.keys - 1,
      lastKeyAt: norm.keys >= DUNGEON_MAX_KEYS ? Date.now() : norm.lastKeyAt,
      runs: prev.dungeon.runs + 1,
    };
    // Chance de pet na masmorra gear
    let pets = prev.pets;
    let frags = prev.petFragments;
    if (kind === "gear" && Math.random() < 0.5) {
      const d = maybePetDrop(0.2);
      if (d.pet) { pets = [...pets, d.pet]; flashToast(`🐾 Pet ${PET_DEFS[d.pet.kind].label} (${d.pet.rarity})!`); }
      else if (d.fragKind && d.fragAmt) { frags = { ...frags, [d.fragKind]: frags[d.fragKind] + d.fragAmt }; }
    }
    let ev = ensureEventStarted(prev);
    ev = addMedals(ev, 20);
    ev = bumpEventMission(ev, "dungeon", 1);
    setSave({
      ...prev,
      gold: prev.gold + gold,
      gems: prev.gems + gems,
      essence: prev.essence + essence,
      inventory: newInv,
      counters: { ...prev.counters, chests: prev.counters.chests + items.length },
      dungeon: nextDungeon,
      pets,
      petFragments: frags,
      event: ev,
      runes: prev.level >= RUNE_UNLOCK_LEVEL
        ? { ...prev.runes, fragments: prev.runes.fragments + 3 }
        : prev.runes,
    });
    return { ok: true, rewards: { gold, gems, essence, items } };
  }, [flashToast]);

  // ==== Pets: callbacks ====
  const equipPet = useCallback((id: string | null) => {
    setSave((prev) => prev ? { ...prev, equippedPetId: id } : prev);
  }, []);
  const upgradePet = useCallback((id: string) => {
    setSave((prev) => {
      if (!prev) return prev;
      const p = prev.pets.find((x) => x.id === id);
      if (!p) return prev;
      if (p.level >= PET_MAX_LEVEL) { flashToast("🌟 Nível máximo"); return prev; }
      const cost = petUpgradeCost(p);
      if (prev.gold < cost.gold) { flashToast("💰 Ouro insuficiente"); return prev; }
      if (prev.petFragments[p.kind] < cost.fragments) { flashToast("🧩 Fragmentos insuficientes"); return prev; }
      flashToast(`🐾 ${PET_DEFS[p.kind].label} +1`);
      return {
        ...prev,
        gold: prev.gold - cost.gold,
        petFragments: { ...prev.petFragments, [p.kind]: prev.petFragments[p.kind] - cost.fragments },
        pets: prev.pets.map((x) => x.id === id ? { ...x, level: x.level + 1 } : x),
      };
    });
  }, [flashToast]);
  const craftPet = useCallback((kind: PetKind) => {
    setSave((prev) => {
      if (!prev) return prev;
      const cost = craftPetCost();
      if (prev.petFragments[kind] < cost) { flashToast("🧩 Fragmentos insuficientes"); return prev; }
      const rarity = rollPetRarity();
      const pet = makePet(kind, rarity);
      flashToast(`🐾 Forjado: ${PET_DEFS[kind].label} (${rarity})`);
      return {
        ...prev,
        petFragments: { ...prev.petFragments, [kind]: prev.petFragments[kind] - cost },
        pets: [...prev.pets, pet],
      };
    });
  }, [flashToast]);

  // ==== Torre Infinita: tentativa ====
  const runTower = useCallback((): { floor: number; best: number; newRecord: boolean; rewards: ReturnType<typeof towerRewards> } | null => {
    const prev = saveRef.current;
    if (!prev) return null;
    if (prev.level < TOWER_UNLOCK_LEVEL) { flashToast(`🔒 Libera no Lv ${TOWER_UNLOCK_LEVEL}`); return null; }
    const floor = simulateTowerRun(prev);
    const best = Math.max(prev.tower.bestFloor, floor);
    const newRecord = floor > prev.tower.bestFloor;
    const rw = towerRewards(floor, prev.stage, prev);
    const multi = newRecord ? 1.5 : 1;
    const gold = Math.floor(rw.gold * multi);
    const gems = Math.floor(rw.gems * multi);
    const essence = Math.floor(rw.essence * multi);
    const chests = Math.floor(rw.chests * multi);

    let inv = prev.inventory;
    for (let i = 0; i < chests; i++) {
      const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)].key;
      inv = [...inv, rollItem(slot, prev.stage + 3)].slice(-60);
    }
    let frags = prev.petFragments;
    if (rw.frag) frags = { ...frags, [rw.frag.kind]: frags[rw.frag.kind] + rw.frag.amt };

    const floorsClimbed = Math.max(0, floor - prev.tower.bestFloor);
    let ev = ensureEventStarted(prev);
    ev = addMedals(ev, 10 + Math.floor(floor / 5));
    if (floorsClimbed > 0) ev = bumpEventMission(ev, "tower", floorsClimbed);
    // Runas: fragmentos por escalada (2 + floor/10)
    const runeFragGain = prev.level >= RUNE_UNLOCK_LEVEL ? 2 + Math.floor(floor / 10) : 0;
    setSave({
      ...prev,
      gold: prev.gold + gold,
      gems: prev.gems + gems,
      essence: prev.essence + essence,
      inventory: inv,
      petFragments: frags,
      counters: { ...prev.counters, chests: prev.counters.chests + chests },
      tower: { bestFloor: best, runs: prev.tower.runs + 1, lastRunAt: Date.now() },
      event: ev,
      runes: { ...prev.runes, fragments: prev.runes.fragments + runeFragGain },
    });
    return { floor, best, newRecord, rewards: { gold, gems, essence, chests, frag: rw.frag } };
  }, [flashToast]);

  // ==== Bênçãos: ativar (paga com ouro OU cristais e adiciona ao expiresAt) ====
  const activateBlessing = useCallback((kind: BlessingKind, durationIdx: number, pay: "gold" | "gems") => {
    setSave((prev) => {
      if (!prev) return prev;
      if (prev.level < BLESSING_UNLOCK_LEVEL) { flashToast(`🔒 Libera no Lv ${BLESSING_UNLOCK_LEVEL}`); return prev; }
      const def = BLESSING_DEFS[kind];
      const dur = BLESSING_DURATIONS[durationIdx];
      if (!dur) return prev;
      const goldCost = Math.floor(def.baseGold * dur.goldMul);
      const gemCost = Math.floor(def.baseGems * dur.gemMul);
      if (pay === "gold" && prev.gold < goldCost) { flashToast("💰 Ouro insuficiente"); return prev; }
      if (pay === "gems" && prev.gems < gemCost) { flashToast("💎 Cristais insuficientes"); return prev; }
      const now = Date.now();
      const cur = prev.blessings[kind] ?? 0;
      const from = cur > now ? cur : now;
      const next = from + dur.ms;
      flashToast(`${def.icon} ${def.label} +${dur.label}`);
      return {
        ...prev,
        gold: pay === "gold" ? prev.gold - goldCost : prev.gold,
        gems: pay === "gems" ? prev.gems - gemCost : prev.gems,
        blessings: { ...prev.blessings, [kind]: next },
      };
    });
  }, [flashToast]);

  // ==== Guilda (Fase 3 — Bloco 5) ====
  const joinGuild = useCallback((id: GuildId) => {
    setSave((prev) => {
      if (!prev) return prev;
      if (prev.level < GUILD_UNLOCK_LEVEL) { flashToast(`🔒 Libera no Lv ${GUILD_UNLOCK_LEVEL}`); return prev; }
      if (prev.guild.id) { flashToast("Você já pertence a uma guilda"); return prev; }
      flashToast(`${GUILD_DEFS[id].icon} Bem-vindo aos ${GUILD_DEFS[id].name}!`);
      return { ...prev, guild: { ...prev.guild, id, joinedAt: Date.now() } };
    });
  }, [flashToast]);

  const donateGuild = useCallback(() => {
    setSave((prev) => {
      if (!prev || !prev.guild.id) return prev;
      const today = todayKey();
      const wk = weekKey();
      const donationsToday = prev.guild.lastDonateDay === today ? prev.guild.donationsToday : 0;
      const contribWeek = prev.guild.weekKey === wk ? prev.guild.contribWeek : 0;
      if (donationsToday >= GUILD_DAILY_DONATIONS) { flashToast("Doações diárias esgotadas"); return prev; }
      const cost = guildDonationCost(prev.level, donationsToday);
      if (prev.gold < cost) { flashToast("💰 Ouro insuficiente"); return prev; }
      const xpGain = 120 + prev.level * 8;
      flashToast(`🎁 +${xpGain} XP Guilda`);
      return {
        ...prev,
        gold: prev.gold - cost,
        guild: {
          ...prev.guild,
          xp: prev.guild.xp + xpGain,
          donationsToday: donationsToday + 1,
          lastDonateDay: today,
          contribWeek: contribWeek + xpGain,
          weekKey: wk,
        },
      };
    });
  }, [flashToast]);

  const fightGuildBoss = useCallback(() => {
    setSave((prev) => {
      if (!prev || !prev.guild.id) return prev;
      const now = Date.now();
      if (now - prev.guild.bossLastAt < GUILD_BOSS_COOLDOWN_MS) { flashToast("⏳ Chefão em recarga"); return prev; }
      const power = heroPower(computeStats(prev));
      const threshold = 500 + guildLevel(prev.guild.xp) * 40;
      const win = power >= threshold || Math.random() < Math.min(0.9, power / threshold);
      if (!win) {
        flashToast("💀 Chefão te derrotou — treine mais!");
        return { ...prev, guild: { ...prev.guild, bossLastAt: now } };
      }
      const gold = 5000 + prev.level * 300;
      const gems = 50;
      const essence = 1;
      flashToast(`🏆 Vitória! +${fmt(gold)}🪙 +${gems}💎 +${essence}✨`);
      return {
        ...prev,
        gold: prev.gold + gold,
        gems: prev.gems + gems,
        essence: prev.essence + essence,
        guild: { ...prev.guild, bossLastAt: now, bossKills: prev.guild.bossKills + 1 },
      };
    });
  }, [flashToast]);

  // ==== Arena PvP Assíncrona (Fase 3 — Bloco 6) ====
  const fightArenaOpponent = useCallback((opp: ArenaOpponent): { win: boolean } => {
    let result: { win: boolean } = { win: false };
    setSave((prev) => {
      if (!prev) return prev;
      if (prev.level < ARENA_UNLOCK_LEVEL) { flashToast(`🔒 Libera no Lv ${ARENA_UNLOCK_LEVEL}`); return prev; }
      const today = todayKey();
      const usedToday = prev.arena.lastTicketDay === today ? prev.arena.ticketsToday : 0;
      const freeLeft = Math.max(0, ARENA_DAILY_TICKETS - usedToday);
      if (freeLeft <= 0 && prev.arena.extraTickets <= 0) { flashToast("Sem ingressos de arena"); return prev; }
      const sim = simulateArenaFight(prev, opp);
      result = { win: sim.win };
      const useExtra = freeLeft <= 0;
      const pointsGain = sim.win ? 25 : -8;
      const nextPoints = Math.max(0, prev.arena.points + pointsGain);
      const gold = sim.win ? opp.rewardGold : Math.floor(opp.rewardGold * 0.2);
      const gems = sim.win ? opp.rewardGems : 1;
      const essence = sim.win && opp.power >= heroPower(computeStats(prev)) ? 1 : 0;
      flashToast(sim.win ? `🏆 Vitória vs ${opp.name} +${pointsGain}pts` : `😞 Derrota vs ${opp.name} ${pointsGain}pts`);
      let ev = ensureEventStarted(prev);
      ev = addMedals(ev, sim.win ? 8 : 2);
      if (sim.win) ev = bumpEventMission(ev, "arena", 1);
      return {
        ...prev,
        gold: prev.gold + gold,
        gems: prev.gems + gems,
        essence: prev.essence + essence,
        pvpWins: prev.pvpWins + (sim.win ? 1 : 0),
        arena: {
          ...prev.arena,
          points: nextPoints,
          wins: prev.arena.wins + (sim.win ? 1 : 0),
          losses: prev.arena.losses + (sim.win ? 0 : 1),
          ticketsToday: useExtra ? usedToday : usedToday + 1,
          lastTicketDay: today,
          extraTickets: useExtra ? prev.arena.extraTickets - 1 : prev.arena.extraTickets,
        },
        event: ev,
      };
    });
    return result;
  }, [flashToast]);

  const buyArenaTicket = useCallback(() => {
    setSave((prev) => {
      if (!prev) return prev;
      if (prev.gems < ARENA_EXTRA_TICKET_COST_GEMS) { flashToast("💎 Cristais insuficientes"); return prev; }
      flashToast(`+1 ingresso de arena`);
      return {
        ...prev,
        gems: prev.gems - ARENA_EXTRA_TICKET_COST_GEMS,
        arena: { ...prev.arena, extraTickets: prev.arena.extraTickets + 1 },
      };
    });
  }, [flashToast]);

  const claimArenaDaily = useCallback(() => {
    setSave((prev) => {
      if (!prev) return prev;
      const today = todayKey();
      if (prev.arena.lastDailyClaim === today) { flashToast("Já coletado hoje"); return prev; }
      flashToast(`🎁 +${fmt(ARENA_DAILY_REWARD_GOLD)}🪙 +${ARENA_DAILY_REWARD_GEMS}💎`);
      return {
        ...prev,
        gold: prev.gold + ARENA_DAILY_REWARD_GOLD,
        gems: prev.gems + ARENA_DAILY_REWARD_GEMS,
        arena: { ...prev.arena, lastDailyClaim: today },
      };
    });
  }, [flashToast]);

  // ==== Eventos Sazonais (Fase 3 — Bloco 7) ====
  const claimEventMission = useCallback((id: string) => {
    setSave((prev) => {
      if (!prev) return prev;
      let ev = ensureEventStarted(prev);
      const def = EVENT_MISSIONS.find((m) => m.id === id);
      if (!def) return prev;
      const m = ev.missions.find((x) => x.id === id);
      if (!m || m.claimed || m.progress < def.target) { flashToast("Missão incompleta"); return prev; }
      ev = {
        ...ev,
        medals: ev.medals + def.medalReward,
        missions: ev.missions.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
      };
      flashToast(`${ACTIVE_EVENT.medalIcon} +${def.medalReward} ${ACTIVE_EVENT.medalName}`);
      return { ...prev, event: ev };
    });
  }, [flashToast]);

  const buyEventShop = useCallback((id: string) => {
    setSave((prev) => {
      if (!prev) return prev;
      const item = EVENT_SHOP.find((x) => x.id === id);
      if (!item) return prev;
      let ev = ensureEventStarted(prev);
      if (!eventActive(ev)) { flashToast("Evento encerrado"); return prev; }
      if (ev.medals < item.cost) { flashToast(`${ACTIVE_EVENT.medalIcon} Medalhas insuficientes`); return prev; }
      let next: SaveState = { ...prev };
      switch (item.id) {
        case "gold_s":  next = { ...next, gold: next.gold + 5000 }; break;
        case "gems_s":  next = { ...next, gems: next.gems + 20 }; break;
        case "chest":  {
          const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)].key;
          next = { ...next, inventory: [...next.inventory, rollItem(slot, next.stage + 3)].slice(-60) };
          break;
        }
        case "frag": {
          const kind = PET_KINDS[Math.floor(Math.random() * PET_KINDS.length)]!;
          next = { ...next, petFragments: { ...next.petFragments, [kind]: next.petFragments[kind] + 10 } };
          break;
        }
        case "essence": next = { ...next, essence: next.essence + 1 }; break;
        case "rune_frag": next = { ...next, runes: { ...next.runes, fragments: next.runes.fragments + 5 } }; break;
        case "cosm_aura_blue": {
          if (next.cosmetics.owned.includes("aura_blue")) { flashToast("💠 Já possui"); return prev; }
          next = { ...next, cosmetics: { ...next.cosmetics, owned: [...next.cosmetics.owned, "aura_blue"] } };
          break;
        }
        case "cosm_frame_brasil": {
          if (next.cosmetics.owned.includes("frame_brasil")) { flashToast("🇧🇷 Já possui"); return prev; }
          next = { ...next, cosmetics: { ...next.cosmetics, owned: [...next.cosmetics.owned, "frame_brasil"] } };
          break;
        }
        case "skin_brasil": {
          if (next.skins.owned.includes("brasil")) { flashToast("🦸 Já possui essa skin"); return prev; }
          next = { ...next, skins: { ...next.skins, owned: [...next.skins.owned, "brasil"] } };
          break;
        }
      }
      flashToast(`${item.icon} ${item.label}`);
      ev = { ...ev, medals: ev.medals - item.cost };
      return { ...next, event: ev };
    });
  }, [flashToast]);

  // ==== Skins / Cosméticos (Fase 3 — Bloco 8) ====
  const equipSkin = useCallback((id: SkinId) => {
    setSave((prev) => {
      if (!prev) return prev;
      if (!prev.skins.owned.includes(id)) { flashToast("Skin não desbloqueada"); return prev; }
      setHeroLunge(false);
      setHeroHit(false);
      setHeroDying(false);
      heroDyingRef.current = false;
      flashToast(`${SKIN_DEFS[id].icon} ${SKIN_DEFS[id].label} equipada`);
      return { ...prev, skins: { ...prev.skins, equipped: id } };
    });
  }, [flashToast]);

  const buySkin = useCallback((id: SkinId) => {
    setSave((prev) => {
      if (!prev) return prev;
      const def = SKIN_DEFS[id];
      if (!def?.priceGems) { flashToast("Skin indisponível na loja"); return prev; }
      if (prev.skins.owned.includes(id)) { flashToast("Você já tem"); return prev; }
      if (prev.gems < def.priceGems) { flashToast("Gemas insuficientes"); return prev; }
      setHeroLunge(false);
      setHeroHit(false);
      setHeroDying(false);
      heroDyingRef.current = false;
      flashToast(`✨ ${def.label} desbloqueado(a)!`);
      return {
        ...prev,
        gems: prev.gems - def.priceGems,
        skins: { owned: [...prev.skins.owned, id], equipped: id },
      };
    });
  }, [flashToast]);

  // ==== Conquistas / Achievements (Fase 3 — Bloco 9) ====
  const claimAchievement = useCallback((id: AchievementId) => {
    setSave((prev) => {
      if (!prev) return prev;
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return prev;
      if (prev.achievements.claimed.includes(id)) return prev;
      if (def.metric(prev) < def.goal) { flashToast("🔒 Progresso insuficiente"); return prev; }
      const r = def.reward;
      let next: SaveState = {
        ...prev,
        gold: prev.gold + (r.gold ?? 0),
        gems: prev.gems + (r.gems ?? 0),
        essence: prev.essence + (r.essence ?? 0),
        achievements: { ...prev.achievements, claimed: [...prev.achievements.claimed, id] },
      };
      if (r.chest) {
        // Recompensa de baú convertida em ouro/cristais bônus (sistema simplificado)
        const bonusGold = r.chest === 2 ? 25000 : 8000;
        const bonusGems = r.chest === 2 ? 30 : 10;
        next = { ...next, gold: next.gold + bonusGold, gems: next.gems + bonusGems };
      }
      if (r.petFrags && r.petFragKind) {
        next = { ...next, petFragments: { ...next.petFragments, [r.petFragKind]: next.petFragments[r.petFragKind] + r.petFrags } };
      }
      if (r.runeFrags) {
        next = { ...next, runes: { ...next.runes, fragments: next.runes.fragments + r.runeFrags } };
      }
      if (r.cosmetic && COSMETIC_DEFS[r.cosmetic] && !next.cosmetics.owned.includes(r.cosmetic)) {
        next = { ...next, cosmetics: { ...next.cosmetics, owned: [...next.cosmetics.owned, r.cosmetic] } };
      }
      flashToast(`🏆 ${def.label} — ${achievementRewardLabel(r)}`);
      return next;
    });
  }, [flashToast]);

  // ==== Runas / Encantamentos (Fase 3 — Bloco 10) ====
  const upgradeRune = useCallback((kind: RuneKind) => {
    setSave((prev) => {
      if (!prev) return prev;
      if (prev.level < RUNE_UNLOCK_LEVEL) { flashToast(`🔒 Libera no Lv ${RUNE_UNLOCK_LEVEL}`); return prev; }
      const lv = prev.runes.levels[kind] ?? 0;
      if (lv >= RUNE_MAX_LEVEL) { flashToast("🌟 Nível máximo"); return prev; }
      const cost = runeUpgradeCost(lv);
      if (prev.gold < cost.gold) { flashToast("💰 Ouro insuficiente"); return prev; }
      if (prev.runes.fragments < cost.fragments) { flashToast("🔮 Fragmentos insuficientes"); return prev; }
      flashToast(`🔮 ${RUNE_DEFS[kind].label} Lv${lv + 1}`);
      return {
        ...prev,
        gold: prev.gold - cost.gold,
        runes: {
          ...prev.runes,
          fragments: prev.runes.fragments - cost.fragments,
          levels: { ...prev.runes.levels, [kind]: lv + 1 },
        },
      };
    });
  }, [flashToast]);

  const toggleRune = useCallback((kind: RuneKind) => {
    setSave((prev) => {
      if (!prev) return prev;
      if (prev.level < RUNE_UNLOCK_LEVEL) return prev;
      const lv = prev.runes.levels[kind] ?? 0;
      if (lv <= 0) { flashToast("🔒 Runa ainda em Lv0"); return prev; }
      const eq = prev.runes.equipped;
      if (eq.includes(kind)) {
        return { ...prev, runes: { ...prev.runes, equipped: eq.filter((k) => k !== kind) } };
      }
      if (eq.length >= RUNE_MAX_EQUIPPED) { flashToast(`Máx ${RUNE_MAX_EQUIPPED} runas equipadas`); return prev; }
      return { ...prev, runes: { ...prev.runes, equipped: [...eq, kind] } };
    });
  }, [flashToast]);

  // ==== Cosméticos avançados (Fase 3 — Bloco 11) ====
  const equipCosmetic = useCallback((category: CosmeticCategory, id: CosmeticId) => {
    setSave((prev) => {
      if (!prev) return prev;
      const def = COSMETIC_DEFS[id];
      if (!def || def.category !== category) return prev;
      if (!prev.cosmetics.owned.includes(id)) { flashToast("🔒 Cosmético bloqueado"); return prev; }
      flashToast(`${def.icon} ${def.label}`);
      return { ...prev, cosmetics: { ...prev.cosmetics, equipped: { ...prev.cosmetics.equipped, [category]: id } } };
    });
  }, [flashToast]);

  // ==== Códigos / Redeem (Fase 3 — Bloco 12) ====
  const redeemCode = useCallback((raw: string): { ok: boolean; msg: string } => {
    const code = raw.trim().toUpperCase();
    if (!code) return { ok: false, msg: "Digite um código" };
    if (!save) return { ok: false, msg: "Carregando save..." };

    // Fase 3 · Bloco 1 — tenta registro remoto primeiro; fallback local.
    const remote = resolveRemoteRedeem(code, save.redeem.used);
    if (remote && !remote.ok) {
      flashToast(`❌ ${remote.error}`);
      return { ok: false, msg: remote.error };
    }
    const def = remote?.ok ? remote.def : REDEEM_CODES[code];
    if (!def) {
      flashToast("❌ Código inválido");
      return { ok: false, msg: "Código inválido" };
    }
    if (save.redeem.used.includes(code)) {
      flashToast("⚠️ Código já usado");
      return { ok: false, msg: "Código já resgatado" };
    }

    setSave((prev) => {
      if (!prev) return prev;
      if (prev.redeem.used.includes(code)) return prev;
      let next: SaveState = { ...prev, redeem: { used: [...prev.redeem.used, code] } };
      const r = def.reward;
      if (r.gold) next = { ...next, gold: next.gold + r.gold };
      if (r.gems) next = { ...next, gems: next.gems + r.gems };
      if (r.essence) next = { ...next, essence: next.essence + r.essence };
      if (r.epicChest) {
        const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)].key;
        const item = rollItem(slot, next.stage);
        next = { ...next, inventory: [...next.inventory, item].slice(-60) };
      }
      if (r.cosmetic && COSMETIC_DEFS[r.cosmetic] && !next.cosmetics.owned.includes(r.cosmetic)) {
        next = { ...next, cosmetics: { ...next.cosmetics, owned: [...next.cosmetics.owned, r.cosmetic] } };
      }
      if (isSkinId(r.skin) && !next.skins.owned.includes(r.skin)) {
        next = { ...next, skins: { owned: [...next.skins.owned, r.skin], equipped: r.skin } };
      }
      return next;
    });

    flashToast(`🎁 ${def.label} resgatado!`);
    return { ok: true, msg: `${def.label}: ${def.desc}` };
  }, [save, flashToast]);



















  const stats = useMemo(() => (save ? computeStats(save) : null), [save]);
  const heroSkin = useMemo(
    () => (save ? equippedSkinDef(save) : SKIN_DEFS.classic),
    [save?.skins?.equipped, save?.skins],
  );

  // Força sincronização da skin equipada ao montar (entrar na arena / recarregar)
  const skinSyncRef = useRef(false);
  useEffect(() => {
    if (skinSyncRef.current) return;
    if (!save) return;
    skinSyncRef.current = true;
    setSave((prev) => {
      if (!prev) return prev;
      const normalized = normalizeSkins(prev.skins);
      if (
        normalized.equipped === prev.skins?.equipped &&
        normalized.owned.length === (prev.skins?.owned?.length ?? 0)
      ) {
        // trigger re-render mesmo sem mudança para reaplicar o filtro no HUD
        return { ...prev, skins: { ...normalized } };
      }
      return { ...prev, skins: normalized };
    });
    setHeroLunge(false);
    setHeroHit(false);
    setHeroDying(false);
    heroDyingRef.current = false;
  }, [save]);
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

  const liveOps = useLiveOps();

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
      <LiveOpsBanner snap={liveOps} />
      <WalletHud gemsOverride={save.gems} goldOverride={save.gold} />
      
      <ChatPopup open={chatOpen} onClose={() => setChatOpen(false)} onUnreadChange={handleChatUnread} />
      {/* ===== Top HUD ===== */}
      <header className="relative z-[80] bg-gradient-to-b from-[#3E2723] to-[#2D1B0E] border-b-4 border-[#8B4513] px-3 pt-2 pb-2">
        {/* Row 1: player name + top actions */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => { setNameDraft(displayName); setEditingName(true); }}
            className="flex min-w-0 items-center gap-1.5 rounded-md border border-[#8B4513]/70 bg-black/40 px-2 py-0.5 text-[11px] font-bold text-amber-100 hover:bg-black/60 active:scale-95"
            title="Editar nome"
          >
            <span className="truncate max-w-[140px]">{displayName}</span>
            <Pencil className="h-3 w-3 opacity-70" strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-1">
            <Link
              to="/roadmap"
              aria-label="Roadmap"
              title="Roadmap"
              className="rounded-md border border-[#8B4513]/70 bg-black/40 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-200/90 hover:text-amber-100 hover:bg-black/60"
            >
              ROADMAP
            </Link>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
              className="flex items-center gap-1 rounded-md border border-sky-500/60 bg-sky-950/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-sky-200 hover:bg-sky-900/70 hover:text-sky-100 active:scale-95"
            >
              {isFullscreen ? <Minimize className="h-3 w-3" strokeWidth={2.5} /> : <Maximize className="h-3 w-3" strokeWidth={2.5} />}
            </button>
            <button
              type="button"
              onClick={() => { setChatOpen(true); setChatUnread(0); }}
              aria-label="Chat Global"
              title="Chat Global"
              className="relative flex items-center gap-1 rounded-md border border-emerald-500/60 bg-emerald-950/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-200 hover:bg-emerald-900/70 hover:text-emerald-100 active:scale-95"
            >
              💬 CHAT
              {chatUnread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 min-w-[16px] rounded-full border border-black/60 bg-rose-500 px-1 text-[9px] font-black text-white shadow">
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={async () => {
                void forceSignOut().catch((e) => { console.error("signOut error", e); });
                navigate({ to: "/", replace: true });
              }}
              aria-label="Sair da conta"
              title="Sair da conta"
              className="relative z-[90] flex items-center gap-1 rounded-md border border-rose-500/60 bg-rose-950/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-rose-200 hover:bg-rose-900/70 hover:text-rose-100 active:scale-95"
            >
              <LogOut className="h-3 w-3" strokeWidth={2.5} />
              SAIR
            </button>
          </div>
        </div>

        {/* Row 2: avatar + currencies + menu */}
        <div className="flex items-center gap-2">
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

          <div className="flex flex-1 flex-col gap-1 min-w-0">
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

          <div className="flex flex-col gap-1">
            <QuickCartoonBtn
              icon={<Sparkles className="h-3 w-3" />}
              label={save.stage >= PRESTIGE_UNLOCK_STAGE ? "REBIRTH" : "🔒"}
              onClick={() => setModal("rebirth")}
            />
            <QuickCartoonBtn
              icon={<Package className="h-3 w-3" />}
              label="MENU"
              onClick={() => setModal("menu")}
            />
          </div>
        </div>
      </header>

      <ActiveBlessingsBar save={save} onOpen={() => setModal("blessings")} />

      {/* ===== Battle arena ===== */}
      <section
        className={`relative h-72 sm:h-[420px] md:h-[480px] overflow-hidden bg-gradient-to-b ${biome.bg} border-b-4 border-[#1A0F08]`}
        style={(() => {
          const src = BIOME_BG[biome.name] ?? bgCache[biome.name];
          return src
            ? {
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined;
        })()}
        aria-label="Campo de batalha"
      >
        {/* stage banner */}
        <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border-2 border-black/60 bg-black/50 px-4 py-0.5 backdrop-blur-sm">
          <span
            className="text-sm tracking-wider text-amber-100 drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            {biome.name.toUpperCase()}: {formatStage(save.stage)}
          </span>
        </div>
        {enemy.isBoss && (
          <div
            className="absolute right-2 top-12 rounded-lg border-2 border-amber-950 bg-amber-500 px-2 py-0.5 text-[10px] text-amber-950 shadow"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            👑 {bossForBiome(biome.name).name.toUpperCase()}
          </div>
        )}


        {/* clouds */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
          <div className="absolute left-4 top-8 h-4 w-16 rounded-full bg-white blur-md" />
          <div className="absolute right-8 top-14 h-3 w-10 rounded-full bg-white blur-md" />
        </div>

        {/* Hero */}
        <div
          className={`absolute bottom-10 left-6 sm:left-16 md:left-24 flex flex-col items-center transition-transform duration-[380ms] ease-in-out ${
            heroDying ? "opacity-0 scale-75 rotate-12 translate-y-2" : ""
          } ${heroLunge ? "translate-x-24 sm:translate-x-40" : heroHit ? "-translate-x-2" : ""}`}
        >
          <div className="mb-1 h-2 w-16 overflow-hidden rounded-full border-2 border-black/60 bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all"
              style={{ width: `${(heroHp / stats.hp) * 100}%` }}
            />
          </div>
          <img
            key={heroSkin.id}
            src={heroSkin.sprite ?? heroSprite}
            alt="Herói"
            className={`h-20 w-20 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] ${levelFlash ? "animate-[heroBounce_0.9s_ease-out]" : ""}`}
            style={{ filter: heroSkin.filter ?? "none" }}
            draggable={false}
          />

          <div className="-mt-2 rounded-full border-2 border-black/60 bg-black/65 px-2 py-0.5 text-[10px] font-black text-amber-100 shadow">
            <span className="mr-1">{heroSkin.icon}</span>{heroSkin.label}
          </div>

          <div className="mt-0.5 text-[9px] tabular-nums text-white/90 font-bold">
            {fmt(heroHp)}/{fmt(stats.hp)}
          </div>
        </div>

        {/* Enemy */}
        <div
          className={`absolute bottom-10 right-6 sm:right-16 md:right-24 flex flex-col items-center transition-transform duration-[380ms] ease-in-out ${
            enemyDying ? "opacity-0 scale-50 rotate-12" : ""
          } ${enemyLunge ? "-translate-x-24 sm:-translate-x-40" : enemyHit ? "-translate-x-2" : ""}`}
        >
          <div className="mb-1 h-2 w-20 overflow-hidden rounded-full border-2 border-black/60 bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-red-400 transition-all"
              style={{ width: `${(enemyHp / enemy.hp) * 100}%` }}
            />
          </div>
          {enemy.isBoss ? (
            <div className={`relative flex items-center justify-center h-24 w-24 ${enemyHit ? "animate-[shake_0.15s]" : ""}`}>
              <div className={`absolute inset-0 rounded-full bg-gradient-radial ${bossForBiome(biome.name).halo} blur-xl opacity-80`} />
              <span className="relative text-6xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)] leading-none">
                {bossForBiome(biome.name).emoji}
              </span>
            </div>
          ) : (
            <img
              src={pickEnemySprite(save.stage)}
              alt="Inimigo"
              className={`object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] h-20 w-20 ${enemyHit ? "animate-[shake_0.15s]" : ""}`}
              draggable={false}
            />
          )}

          <div className="mt-0.5 text-[9px] tabular-nums text-white/90 font-bold">
            {fmt(enemyHp)}/{fmt(enemy.hp)}
          </div>
        </div>

        {/* Enemy defeated flash */}
        {deathBanner === "enemy" && (
          <div
            key={"enemy-" + Date.now()}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          >
            <span
              className="animate-[deathPop_1.1s_ease-out_forwards] text-5xl font-black tracking-widest text-red-500 drop-shadow-[0_4px_0_rgba(0,0,0,0.8)]"
              style={{ fontFamily: "'Luckiest Guy', cursive", WebkitTextStroke: "2px #1a0000" }}
            >
              DERROTADO!
            </span>
          </div>
        )}

        {/* Hero death overlay — MORREU 5s fade + action buttons */}
        {deathBanner === "hero" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 overflow-y-auto py-4 bg-black/70 backdrop-blur-sm animate-[fadeInOverlay_400ms_ease-out_forwards]">
            <span
              className="animate-[morreu5s_5s_ease-in-out_forwards] text-4xl sm:text-6xl font-black tracking-widest text-red-500 drop-shadow-[0_4px_0_rgba(0,0,0,0.9)]"
              style={{ fontFamily: "'Luckiest Guy', cursive", WebkitTextStroke: "2px #1a0000" }}
            >
              MORREU!
            </span>
            <span className="text-xs text-slate-300 animate-[fadeInOverlay_600ms_ease-out_400ms_both]">
              Retornando ao início da fase em <span className="text-amber-300 font-bold">{deathCountdown ?? 5}s</span>
            </span>
            <div className="flex flex-col gap-2 w-56 animate-[fadeInOverlay_600ms_ease-out_400ms_both]">
              <button
                onClick={() => {
                  setDeathBanner(null);
                  setHeroDying(false);
                  heroDyingRef.current = false;
                  respawn();
                }}
                className="rounded-xl border-2 border-emerald-900 bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-lg active:translate-y-0.5"
                style={{ fontFamily: "'Luckiest Guy', cursive" }}
              >
                🔁 TENTAR NOVAMENTE
              </button>
              <button
                onClick={() => setPickStageOpen(true)}
                className="rounded-xl border-2 border-indigo-900 bg-gradient-to-b from-indigo-500 to-indigo-700 px-4 py-2 text-sm font-bold text-white shadow-lg active:translate-y-0.5"
                style={{ fontFamily: "'Luckiest Guy', cursive" }}
              >
                🗺️ ESCOLHER ETAPA
              </button>
              <button
                onClick={() => {
                  setDeathBanner(null);
                  setHeroDying(false);
                  heroDyingRef.current = false;
                  navigate({ to: "/dashboard" });
                }}
                className="rounded-xl border-2 border-slate-900 bg-gradient-to-b from-slate-500 to-slate-700 px-4 py-2 text-sm font-bold text-white shadow-lg active:translate-y-0.5"
                style={{ fontFamily: "'Luckiest Guy', cursive" }}
              >
                🏠 MENU INICIAL
              </button>
              <button
                onClick={() => {
                  setDeathBanner(null);
                  setHeroDying(false);
                  heroDyingRef.current = false;
                  respawn();
                  setModal("store");
                }}
                className="rounded-xl border-2 border-amber-900 bg-gradient-to-b from-amber-400 to-amber-600 px-4 py-2 text-sm font-bold text-amber-950 shadow-lg active:translate-y-0.5"
                style={{ fontFamily: "'Luckiest Guy', cursive" }}
              >
                💎 COMPRAR PODER
              </button>
            </div>
          </div>
        )}

        {/* Stage picker overlay — choose which stage to farm */}
        {pickStageOpen && save && (() => {
          const stats = computeStats(save);
          const power = heroPower(stats);
          const enemyPowerAt = (st: number) => {
            const e = enemyForStage(st);
            const dps = e.atk * 1 * 1;
            const tank = e.hp * (1 + e.def / 200);
            return dps * 3 + tank;
          };
          // Recommend: highest stage where power >= enemyPower * 1.6 (comfortable farm)
          let rec = 1;
          const maxS = Math.max(1, save.maxStage || save.stage);
          for (let s = maxS; s >= 1; s--) {
            if (power >= enemyPowerAt(s) * 1.6) { rec = s; break; }
          }
          const set = new Set<number>();
          [1, Math.floor(rec / 2), rec - 10, rec - 5, rec, rec + 5, rec + 10, save.stage, maxS].forEach((n) => {
            if (n >= 1 && n <= maxS) set.add(n);
          });
          const options = Array.from(set).sort((a, b) => a - b);
          return (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeInOverlay_300ms_ease-out_forwards]">
              <div className="w-full max-w-sm rounded-2xl border-2 border-indigo-800 bg-slate-900 p-4 shadow-2xl">
                <div className="mb-3 text-center">
                  <div className="text-lg font-black text-white" style={{ fontFamily: "'Luckiest Guy', cursive" }}>🗺️ ESCOLHER ETAPA</div>
                  <div className="text-xs text-slate-400">Seu poder: <span className="text-amber-300 font-bold">{Math.floor(power).toLocaleString()}</span></div>
                  <div className="text-xs text-emerald-400">Recomendado: Etapa {rec}</div>
                </div>
                <div className="max-h-72 overflow-y-auto flex flex-col gap-1.5">
                  {options.map((st) => {
                    const ep = enemyPowerAt(st);
                    const ratio = power / ep;
                    const tag =
                      ratio >= 2.5 ? { label: "Fácil", color: "text-emerald-400" } :
                      ratio >= 1.6 ? { label: "Farm", color: "text-lime-400" } :
                      ratio >= 1.0 ? { label: "Justo", color: "text-amber-400" } :
                      { label: "Difícil", color: "text-red-400" };
                    const isRec = st === rec;
                    return (
                      <button
                        key={st}
                        onClick={() => {
                          setSave((prev) => {
                            if (!prev) return prev;
                            const next = { ...prev, stage: st };
                            saveRef.current = next;
                            return next;
                          });
                          setPickStageOpen(false);
                          setDeathBanner(null);
                          setHeroDying(false);
                          heroDyingRef.current = false;
                          setTimeout(() => respawn(), 0);
                        }}
                        className={`flex items-center justify-between rounded-lg border-2 px-3 py-2 text-left transition ${
                          isRec ? "border-emerald-500 bg-emerald-950/60" : "border-slate-700 bg-slate-800 hover:bg-slate-700"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">
                            Etapa {st} {isRec && <span className="text-emerald-400">⭐</span>}
                          </span>
                          <span className="text-[10px] text-slate-400">{biomeFor(st).name}</span>
                        </div>
                        <span className={`text-xs font-bold ${tag.color}`}>{tag.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPickStageOpen(false)}
                  className="mt-3 w-full rounded-lg border-2 border-slate-700 bg-slate-800 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          );
        })()}


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

        {/* Barra de carregamento da habilidade (cast bar) */}
        {casting && (() => {
          const meta = SKILL_META[casting.name];
          const total = casting.endsAt - casting.startedAt;
          const elapsed = Math.min(total, Date.now() - casting.startedAt);
          const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
          return (
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 z-30 flex flex-col items-center gap-1 animate-[fadeInOverlay_0.15s_ease-out]">
              <div className={`flex items-center gap-1.5 rounded-full border-2 border-black/60 bg-black/70 px-3 py-1 text-white shadow-lg ${meta.glow}`}>
                <span className="text-lg leading-none">{meta.emoji}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ fontFamily: "'Luckiest Guy', cursive" }}>
                  Carregando {casting.name}
                </span>
              </div>
              <div className="h-2 w-48 overflow-hidden rounded-full border-2 border-black/60 bg-black/70 shadow-inner">
                <div
                  className={`h-full bg-gradient-to-r ${meta.ringColor}`}
                  style={{ width: `${pct}%`, transition: "width 100ms linear" }}
                />
              </div>
            </div>
          );
        })()}

        {/* Banner explosivo da habilidade ao concluir */}
        {skillBanner && (
          <div
            key={skillBanner.id}
            className={`pointer-events-none absolute inset-0 z-40 flex items-center justify-center`}
          >
            <div className={`animate-[skillPop_0.9s_ease-out_forwards] rounded-2xl border-4 border-black/70 bg-black/40 px-5 py-2 shadow-2xl ${skillBanner.glow}`}>
              <div className="flex items-center gap-2 text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.9)]">
                <span className="text-4xl">{skillBanner.emoji}</span>
                <span className="text-3xl font-black tracking-wider" style={{ fontFamily: "'Luckiest Guy', cursive" }}>
                  {skillBanner.name}
                </span>
              </div>
            </div>
          </div>
        )}
        <style>{`
          @keyframes floatUp{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-40px);opacity:0}}
          @keyframes heroBounce{0%,100%{transform:translateY(0) scale(1)}20%{transform:translateY(-18px) scale(1.15)}45%{transform:translateY(0) scale(0.92)}65%{transform:translateY(-8px) scale(1.05)}85%{transform:translateY(0) scale(0.98)}}
          @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
          @keyframes levelPop{0%{transform:scale(0.5) rotate(-8deg);opacity:0}60%{transform:scale(1.15) rotate(4deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
          @keyframes deathPop{0%{transform:scale(0.2) rotate(-15deg);opacity:0}25%{transform:scale(1.4) rotate(6deg);opacity:1}45%{transform:scale(1) rotate(-3deg);opacity:1}80%{transform:scale(1.05) rotate(0);opacity:1}100%{transform:scale(1.2) rotate(0);opacity:0}}
          @keyframes morreu5s{0%{transform:scale(0.2) rotate(-10deg);opacity:0}15%{transform:scale(1.3) rotate(4deg);opacity:1}25%{transform:scale(1) rotate(0);opacity:1}85%{transform:scale(1) rotate(0);opacity:1}100%{transform:scale(1.4) rotate(0);opacity:0}}
          @keyframes fadeInOverlay{from{opacity:0}to{opacity:1}}
          @keyframes skillPop{0%{transform:scale(0.3) rotate(-8deg);opacity:0}25%{transform:scale(1.25) rotate(4deg);opacity:1}55%{transform:scale(1) rotate(0);opacity:1}85%{transform:scale(1) rotate(0);opacity:1}100%{transform:scale(1.35) rotate(0);opacity:0}}
        `}</style>
      </section>

      {/* ===== Skill bar (mais didática) ===== */}
      <section className="relative -mt-4 z-10 px-3 pb-2">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[10px] uppercase tracking-wider text-amber-300/80" style={{ fontFamily: "'Luckiest Guy', cursive" }}>
            Habilidades
          </span>
          <span className="text-[10px] text-amber-200/60">Toque para forçar • auto-cast</span>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {SKILLS.map((sk) => {
            const locked = save.level < sk.unlock;
            const IconCmp = sk.icon === "sword" ? Sword : sk.icon === "zap" ? Zap : sk.icon === "flame" ? Flame : Crown;
            const onCd = (skillCds[sk.name] ?? 0) > 0;
            const isCasting = casting?.name === sk.name;
            return (
              <button
                key={sk.name}
                disabled={locked}
                onClick={() => {
                  if (locked) { flashToast(`🔒 ${sk.name} libera no Lv ${sk.unlock}`); return; }
                  if (!SKILL_META[sk.name]) { flashToast(`⚡ ${sk.name}: ${sk.desc}`); return; }
                  if (onCd) { flashToast(`⏳ ${sk.name} recarregando (${Math.ceil((skillCds[sk.name] ?? 0)/1000)}s)`); return; }
                  if (isCasting || castingRef.current) { flashToast(`⚡ Já lançando habilidade`); return; }
                  manualCastRef.current = sk.name;
                  heroCdRef.current = Math.min(heroCdRef.current, 0); // libera para disparar no próximo tick
                  flashToast(`⚡ ${sk.name} forçada!`);
                }}
                title={locked ? `${sk.name} — libera no Lv ${sk.unlock}` : `${sk.name} — ${sk.desc}`}
                aria-label={`${sk.name}${locked ? ` bloqueada até Lv ${sk.unlock}` : ""}`}
                className={`group relative flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border-4 p-1 shadow-lg transition active:translate-y-0.5 ${
                  locked
                    ? "border-[#1A0F08] bg-[#2A1810]"
                    : `${sk.border} bg-gradient-to-br ${sk.color}`
                }`}
              >
                {locked ? (
                  <>
                    <Lock className="h-4 w-4 text-amber-200/40" />
                    <span className="mt-0.5 rounded-full bg-black/60 px-1.5 text-[9px] font-bold text-amber-200 leading-tight">
                      Lv {sk.unlock}
                    </span>
                  </>
                ) : (
                  <>
                    <IconCmp className="h-5 w-5 text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.7)]" strokeWidth={2.6} />
                    <span className="mt-0.5 text-[9px] font-bold uppercase text-white/95 leading-none drop-shadow-[0_1px_0_rgba(0,0,0,0.7)]">
                      {sk.name}
                    </span>
                    {/* Overlay de casting em andamento */}
                    {casting?.name === sk.name && (
                      <div className="pointer-events-none absolute inset-0 rounded-lg ring-4 ring-white/80 animate-pulse" />
                    )}
                    {/* Overlay de cooldown */}
                    {SKILL_META[sk.name] && (skillCds[sk.name] ?? 0) > 0 && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/65 text-white">
                        <span className="text-sm font-black tabular-nums" style={{ fontFamily: "'Luckiest Guy', cursive" }}>
                          {Math.ceil((skillCds[sk.name] ?? 0) / 1000)}s
                        </span>
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
          {PASSIVE_SLOTS.map((ps) => {
            const unlocked = save.level >= ps.unlock;
            return (
              <button
                key={ps.name}
                disabled={!unlocked}
                title={unlocked ? `${ps.name} — ${ps.desc}` : `${ps.name} — libera no Lv ${ps.unlock}`}
                aria-label={unlocked ? `${ps.name} ativa` : `${ps.name} bloqueada até Lv ${ps.unlock}`}
                onClick={() =>
                  flashToast(unlocked ? `✨ ${ps.name}: ${ps.desc}` : `🔒 ${ps.name} libera no Lv ${ps.unlock}`)
                }
                className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border-4 border-[#1A0F08] p-1 shadow-lg ${
                  unlocked ? "bg-gradient-to-br from-fuchsia-500 to-purple-700" : "bg-[#2A1810]"
                }`}
              >
                {unlocked ? (
                  <>
                    <Crown className="h-5 w-5 text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.7)]" strokeWidth={2.6} />
                    <span className="mt-0.5 text-[9px] font-bold uppercase text-white/95 leading-none drop-shadow-[0_1px_0_rgba(0,0,0,0.7)]">
                      {ps.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-amber-200/40" />
                    <span className="mt-0.5 rounded-full bg-black/60 px-1.5 text-[9px] font-bold text-amber-200 leading-tight">
                      Lv {ps.unlock}
                    </span>
                  </>
                )}
              </button>
            );
          })}

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
              <HoldButton
                onTick={() => upgrade(key)}
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
              </HoldButton>
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
          onBulkSell={bulkSellItems}
        />
      )}
      {modal === "arena" && (
        <ArenaPvpModal
          save={save}
          onClose={() => setModal(null)}
          onFight={fightArenaOpponent}
          onBuyTicket={buyArenaTicket}
          onClaimDaily={claimArenaDaily}
        />
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
      {modal === "missions" && (
        <MissionsModal
          save={save}
          onClose={() => setModal(null)}
          onClaim={claimMission}
        />
      )}
      {modal === "dungeon" && (
        <DungeonModal
          save={save}
          onClose={() => setModal(null)}
          onEnter={enterDungeon}
        />
      )}
      {modal === "pets" && (
        <PetsModal
          save={save}
          onClose={() => setModal(null)}
          onEquip={equipPet}
          onUpgrade={upgradePet}
          onCraft={craftPet}
        />
      )}
      {modal === "tower" && (
        <TowerModal
          save={save}
          onClose={() => setModal(null)}
          onRun={runTower}
        />
      )}
      {modal === "blessings" && (
        <BlessingsModal
          save={save}
          onClose={() => setModal(null)}
          onActivate={activateBlessing}
        />
      )}
      {modal === "guild" && (
        <GuildModal
          save={save}
          onClose={() => setModal(null)}
          onJoin={joinGuild}
          onDonate={donateGuild}
          onFightBoss={fightGuildBoss}
        />
      )}
      {modal === "event" && (
        <EventModal
          save={save}
          onClose={() => setModal(null)}
          onClaimMission={claimEventMission}
          onBuy={buyEventShop}
        />
      )}
      {modal === "skins" && (
        <SkinsModal save={save} onClose={() => setModal(null)} onEquip={equipSkin} onBuy={buySkin} />
      )}
      {modal === "achievements" && (
        <AchievementsModal save={save} onClose={() => setModal(null)} onClaim={claimAchievement} />
      )}
      {modal === "runes" && (
        <RunesModal save={save} onClose={() => setModal(null)} onUpgrade={upgradeRune} onToggle={toggleRune} />
      )}
      {modal === "cosmetics" && (
        <CosmeticsModal save={save} onClose={() => setModal(null)} onEquip={equipCosmetic} />
      )}
      {modal === "codes" && (
        <CodesModal
          save={save}
          onClose={() => setModal(null)}
          onRedeem={redeemCode}
          inviteLink={currentUserId ? buildInviteLink(currentUserId) : null}
          referralCount={refStats.count}
        />
      )}



      {modal === "menu" && (
        <GameMenuModal
          save={save}
          onClose={() => setModal(null)}
          onPick={(m) => setModal(m)}
        />
      )}



      {editingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditingName(false)}>
          <div
            className="w-full max-w-xs rounded-xl border-4 border-[#8B4513] bg-gradient-to-b from-[#3E2723] to-[#2D1B0E] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-center text-sm font-bold tracking-wider text-amber-200" style={{ fontFamily: "'Luckiest Guy', cursive" }}>
              NOME DE EXIBIÇÃO
            </h3>
            <p className="mb-3 text-center text-[11px] text-amber-100/70">
              Este nome aparecerá no ranking e para outros jogadores.
            </p>
            <input
              autoFocus
              maxLength={20}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void saveDisplayName(nameDraft); }}
              placeholder="Seu nome (máx 20)"
              className="mb-3 w-full rounded-md border-2 border-[#8B4513] bg-[#1A0F08] px-3 py-2 text-sm text-amber-100 outline-none focus:border-amber-400"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="flex-1 rounded-md border-2 border-[#8B4513] bg-black/40 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-black/60"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => void saveDisplayName(nameDraft)}
                className="flex-1 rounded-md border-2 border-amber-600 bg-amber-500 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-400 active:scale-95"
              >
                SALVAR
              </button>
            </div>
          </div>
        </div>
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
  const pb = petBonus(s);
  const bb = blessingBonus(s);
  const gb = guildBonus(s);
  const rb = runeBonus(s);
  const atkBonus = (1 + (s.globalUp?.atk ?? 0) * GLOBAL_UP_DEFS.atk.perLevel) * pb.atkMul * bb.atkMul * gb.atkMul * rb.atkMul;
  const hpBonus = (1 + (s.globalUp?.hp ?? 0) * GLOBAL_UP_DEFS.hp.perLevel) * pb.hpMul * bb.hpMul * rb.hpMul;
  return {
    atk: Math.floor((attrValue("atk", s.attrs.atk.level) + eq.atk) * atkBonus),
    hp: Math.floor((attrValue("hp", s.attrs.hp.level) + eq.hp) * hpBonus),
    regen: (attrValue("regen", s.attrs.regen.level) + pb.regenAdd) * bb.regenMul,
    critDmg: attrValue("critDmg", s.attrs.critDmg.level),
    critChance: attrValue("critChance", s.attrs.critChance.level) + (s.globalUp?.crit ?? 0) * GLOBAL_UP_DEFS.crit.perLevel * 100 + rb.critAdd,
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

function itemPower(item: Item) {
  return item.bonus.atk + item.bonus.hp + item.bonus.def;
}

function EquipmentModal({
  save,
  onClose,
  onEquip,
  onUnequip,
  onSell,
  onBulkSell,
}: {
  save: SaveState;
  onClose: () => void;
  onEquip: (item: Item) => void;
  onUnequip: (slot: SlotKey) => void;
  onSell: (id: string) => void;
  onBulkSell: (ids: string[]) => void;
}) {
  const bonus = equipmentBonus(save.equipment);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isWeak = (item: Item) => {
    const eq = save.equipment[item.slot];
    return !!eq && itemPower(eq) > itemPower(item);
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const weakItems = save.inventory.filter(isWeak);
  const selectAllWeak = () => setSelected(new Set(weakItems.map((i) => i.id)));
  const clearSel = () => setSelected(new Set());

  const selectedGold = save.inventory
    .filter((i) => selected.has(i.id))
    .reduce((acc, item) => acc + Math.floor(50 * (RARITIES.find((r) => r.name === item.rarity)?.mult ?? 1)), 0);

  const destroySelected = () => {
    if (selected.size === 0) return;
    onBulkSell(Array.from(selected));
    clearSel();
  };

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

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Inventário ({save.inventory.length})
        </h3>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={selectAllWeak}
            disabled={weakItems.length === 0}
            className="rounded bg-rose-700 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-40 active:scale-95"
          >
            Selecionar fracos ({weakItems.length})
          </button>
          {selected.size > 0 && (
            <button
              onClick={clearSel}
              className="rounded bg-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200 active:scale-95"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <button
          onClick={destroySelected}
          className="mb-3 w-full rounded-lg bg-gradient-to-r from-rose-600 to-red-700 px-3 py-2 text-xs font-bold text-white shadow active:scale-95"
        >
          ♻️ Destruir {selected.size} · +{fmt(selectedGold)} 🪙
        </button>
      )}

      {save.inventory.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-800 py-6 text-center text-xs text-slate-500">
          Vença inimigos e chefes para ganhar equipamentos.
        </p>
      )}
      <div className="space-y-2">
        {save.inventory.map((item) => {
          const slotInfo = SLOTS.find((s) => s.key === item.slot)!;
          const color = RARITIES.find((r) => r.name === item.rarity)!.color;
          const weak = isWeak(item);
          const isSel = selected.has(item.id);
          return (
            <div
              key={item.id}
              className={`grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border-2 px-2 py-2 ${
                weak
                  ? "border-red-500 bg-red-950/50"
                  : `${color} bg-slate-900/60`
              } ${isSel ? "ring-2 ring-amber-400" : ""}`}
            >
              <input
                type="checkbox"
                checked={isSel}
                onChange={() => toggle(item.id)}
                className="h-4 w-4 cursor-pointer accent-rose-500"
              />
              <span className="text-2xl">{slotInfo.emoji}</span>
              <div className="min-w-0 text-[11px]">
                <div className="flex flex-wrap items-center gap-1 font-bold">
                  <span className="truncate">{slotInfo.label}</span>
                  <span className="opacity-70">·</span>
                  <span className="truncate">{item.rarity}</span>
                  <span className="text-amber-300">{"★".repeat(item.stars)}</span>
                  {weak && (
                    <span className="rounded bg-red-600 px-1 text-[9px] font-bold text-white">
                      FRACO
                    </span>
                  )}
                </div>
                <div className={`text-[10px] tabular-nums ${weak ? "text-red-300" : "text-slate-400"}`}>
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
                  Destruir
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

// Chefes temáticos por bioma — cada mapa tem seu próprio boss visual e nome.
// Usa emoji grande sobre um halo para não depender de novos assets de imagem.
const BOSS_BY_BIOME: Record<string, { emoji: string; name: string; halo: string }> = {
  Floresta: { emoji: "🌳", name: "Ent Ancestral",     halo: "from-emerald-400/60 to-transparent" },
  Caverna:  { emoji: "🕷️", name: "Aranha da Fenda",   halo: "from-slate-300/60 to-transparent" },
  Deserto:  { emoji: "🦂", name: "Escorpião de Ouro", halo: "from-amber-300/70 to-transparent" },
  Vulcão:   { emoji: "🐉", name: "Dragão de Rubi",    halo: "from-red-400/70 to-transparent" },
  Castelo:  { emoji: "🤴", name: "Rei Caído",         halo: "from-indigo-300/60 to-transparent" },
  Inferno:  { emoji: "👹", name: "Senhor Demoníaco",  halo: "from-rose-400/70 to-transparent" },
  Céu:      { emoji: "👼", name: "Serafim Corrompido",halo: "from-sky-200/70 to-transparent" },
};
function bossForBiome(biomeName: string) {
  return BOSS_BY_BIOME[biomeName] ?? { emoji: "👑", name: "Chefe", halo: "from-amber-300/60 to-transparent" };
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
  const [mode, setMode] = useState<"choice" | "buy" | "spend">("choice");
  const remoteOffers = useRemoteOffers();
  // Só pacotes de diamantes pagos (BRL) na aba COMPRAR DIAMANTES
  const diamondPacks = remoteOffers.filter(
    (o) => o.currency === "brl" && /diamante|cristal|gem|💎/i.test(`${o.name} ${o.reward}`),
  );

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
          <div className="flex items-center gap-2">
            {mode !== "choice" && (
              <button
                onClick={() => setMode("choice")}
                className="rounded-full border border-[#f5c542]/40 px-2 py-1 text-xs text-[#f5c542]"
                aria-label="Voltar"
              >
                ←
              </button>
            )}
            <h2 className="text-2xl text-[#f5c542]" style={{ fontFamily: "'Lilita One', cursive" }}>
              {mode === "choice" ? "🛒 Loja" : mode === "buy" ? "💎 Comprar Diamantes" : "🛍️ Gastar Diamantes"}
            </h2>
          </div>
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

        {mode === "choice" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => setMode("buy")}
              className="flex flex-col items-center gap-2 rounded-2xl border-4 border-emerald-400 bg-gradient-to-b from-emerald-500 to-emerald-700 p-5 text-center text-white shadow-lg transition hover:scale-[1.02]"
              style={{ fontFamily: "'Lilita One', cursive" }}
            >
              <div className="text-5xl">💎</div>
              <div className="text-lg">COMPRAR DIAMANTES</div>
              <div className="text-[11px] font-normal opacity-90">Recarregue com dinheiro real</div>
            </button>
            <button
              onClick={() => setMode("spend")}
              className="flex flex-col items-center gap-2 rounded-2xl border-4 border-[#f5c542] bg-gradient-to-b from-[#f5c542] to-[#c98a1a] p-5 text-center text-[#0a1c3a] shadow-lg transition hover:scale-[1.02]"
              style={{ fontFamily: "'Lilita One', cursive" }}
            >
              <div className="text-5xl">🛍️</div>
              <div className="text-lg">GASTAR DIAMANTES</div>
              <div className="text-[11px] font-normal opacity-90">Ouro, baús e acelerações</div>
            </button>
          </div>
        )}

        {mode === "buy" && (
          <>
            <p className="mb-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-2 text-[11px] text-emerald-200">
              💎 Escolha o pacote ideal. O pagamento é processado com segurança pelo InfinitePay.
              Diamantes são creditados após confirmação.
            </p>
            {diamondPacks.length > 0 ? (
              <RemoteOffersPanel offers={diamondPacks} />
            ) : (
              <div className="rounded-xl border-2 border-amber-400/30 bg-[#0a1c3a]/70 p-4 text-center text-sm text-amber-200/80">
                Nenhum pacote de diamantes disponível no momento.
                <br />
                <span className="text-[11px] opacity-70">Volte mais tarde ou fale com o suporte.</span>
              </div>
            )}
          </>
        )}

        {mode === "spend" && (
          <>
            <p className="mb-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-2 text-[11px] text-emerald-200">
              ⚖️ <b>100% Pay-to-Fast:</b> a loja só vende ouro, baús e acelerações
              — nunca atributos, XP direto ou avanço automático de estágio.
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
          </>
        )}
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
  const remoteOffers = useRemoteOffers();
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

        <RemoteOffersPanel offers={remoteOffers} />

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

// -------- Missions Modal --------
function MissionsModal({
  save,
  onClose,
  onClaim,
}: {
  save: SaveState;
  onClose: () => void;
  onClaim: (scope: "daily" | "weekly", id: string) => void;
}) {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const list = save.missions[tab];
  const nextResetLabel = tab === "daily" ? "Reseta em 24h" : "Reseta na segunda-feira";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>🎯 Missões</h2>
          <div className="text-[10px] opacity-70">{nextResetLabel}</div>
        </div>

        <div className="mb-3 flex gap-2">
          {(["daily", "weekly"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 rounded-lg border-2 border-[#1A0F08] py-1.5 text-xs font-black ${
                tab === k ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950" : "bg-[#2A1810] text-amber-100/70"
              }`}
            >
              {k === "daily" ? "📅 Diárias" : "📆 Semanais"}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
          {list.length === 0 && (
            <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs opacity-70">
              Gerando missões...
            </div>
          )}
          {list.map((m) => {
            const progress = Math.min(m.goal, counterOf(save.counters, m.kind) - m.snapshot);
            const pct = Math.min(100, (progress / m.goal) * 100);
            const done = progress >= m.goal;
            return (
              <div key={m.id} className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">{MISSION_ICONS[m.kind]}</div>
                    <div>
                      <div className="text-xs font-black">{MISSION_LABELS[m.kind](m.goal)}</div>
                      <div className="text-[10px] opacity-70">
                        {m.reward.gold > 0 && `🪙${fmt(m.reward.gold)} `}
                        {m.reward.gems > 0 && `💎${m.reward.gems} `}
                        {m.reward.essence > 0 && `✨${m.reward.essence} `}
                        {m.reward.chest > 0 && `📦x${m.reward.chest}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onClaim(tab, m.id)}
                    disabled={!done || m.claimed}
                    className={`shrink-0 rounded-md border-2 border-[#1A0F08] px-3 py-1 text-[10px] font-black ${
                      m.claimed ? "bg-emerald-900 opacity-50"
                        : done ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950 animate-pulse"
                        : "bg-[#3E2723] opacity-60"
                    }`}
                  >
                    {m.claimed ? "✓" : done ? "COLETAR" : `${progress}/${m.goal}`}
                  </button>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full border border-[#1A0F08] bg-[#1A0F08]">
                  <div
                    className={`h-full transition-all ${done ? "bg-emerald-400" : "bg-gradient-to-r from-amber-400 to-orange-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Dungeon Modal (Fase 3 — Bloco 1) --------
function DungeonModal({
  save,
  onClose,
  onEnter,
}: {
  save: SaveState;
  onClose: () => void;
  onEnter: (kind: DungeonKind) => { ok: boolean; rewards?: { gold: number; gems: number; essence: number; items: Item[] } };
}) {
  const locked = save.level < DUNGEON_UNLOCK_LEVEL;
  const [selected, setSelected] = useState<DungeonKind | null>(null);
  const [phase, setPhase] = useState<"idle" | "running" | "result">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; gold: number; gems: number; essence: number; items: Item[] } | null>(null);
  const [, force] = useState(0);
  const norm = useMemo(() => dungeonKeysNow(save.dungeon), [save.dungeon]);

  // tick para timer de recarga
  useEffect(() => {
    if (norm.keys >= DUNGEON_MAX_KEYS) return;
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [norm.keys]);

  useEffect(() => {
    if (phase !== "running") return;
    setProgress(0);
    const start = Date.now();
    const dur = 2500;
    const t = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / dur) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(t);
        if (selected) {
          const r = onEnter(selected);
          if (r.ok && r.rewards) {
            setResult({ ok: true, ...r.rewards });
            setPhase("result");
          } else {
            setPhase("idle");
          }
        }
      }
    }, 60);
    return () => clearInterval(t);
  }, [phase, selected, onEnter]);

  const nextKeyLabel = useMemo(() => {
    if (norm.keys >= DUNGEON_MAX_KEYS) return "Cheio";
    const s = Math.max(0, Math.floor(norm.nextInMs / 1000));
    const m = Math.floor(s / 60);
    return `+1 em ${m}:${String(s % 60).padStart(2, "0")}`;
  }, [norm]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>
            🏰 Masmorra
          </h2>
          <div className="text-[10px] opacity-80">
            🗝️ {norm.keys}/{DUNGEON_MAX_KEYS} · {nextKeyLabel}
          </div>
        </div>

        {locked && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs">
            🔒 Desbloqueia no <b>Nível {DUNGEON_UNLOCK_LEVEL}</b>
            <div className="mt-1 opacity-70">Você está no Lv {save.level}</div>
          </div>
        )}

        {!locked && phase === "idle" && (
          <>
            <p className="mb-2 text-[11px] opacity-80">
              Explore masmorras temáticas gastando 1 chave. Inimigos mais fortes, recompensas melhores.
            </p>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {(Object.keys(DUNGEON_DEFS) as DungeonKind[]).map((k) => {
                const def = DUNGEON_DEFS[k];
                return (
                  <button
                    key={k}
                    onClick={() => {
                      if (norm.keys <= 0) return;
                      setSelected(k);
                      setPhase("running");
                    }}
                    disabled={norm.keys <= 0}
                    className={`w-full rounded-lg border-2 border-[#1A0F08] bg-gradient-to-br ${def.color} p-3 text-left shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:grayscale`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{def.icon}</div>
                        <div>
                          <div className="text-sm font-black text-amber-50 drop-shadow">{def.label}</div>
                          <div className="text-[10px] text-amber-50/90">{def.desc}</div>
                        </div>
                      </div>
                      <div className="rounded-md border-2 border-[#1A0F08] bg-[#1A0F08]/60 px-2 py-1 text-[10px] font-black">
                        🗝️ 1
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-amber-50/90">
                      Recompensa alvo · stage {save.stage} (+5 nos drops)
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {!locked && phase === "running" && selected && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center">
            <div className="text-3xl">{DUNGEON_DEFS[selected].icon}</div>
            <div className="mt-1 text-sm font-black">{DUNGEON_DEFS[selected].label}</div>
            <div className="mt-1 text-[11px] opacity-80">Enfrentando o chefão...</div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full border-2 border-[#1A0F08] bg-[#1A0F08]">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-orange-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!locked && phase === "result" && result && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4">
            <div className="text-center text-sm font-black text-emerald-300">🏆 Vitória!</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {result.gold > 0 && <div className="rounded border border-[#1A0F08] bg-[#1A0F08]/60 p-2">🪙 +{fmt(result.gold)} ouro</div>}
              {result.gems > 0 && <div className="rounded border border-[#1A0F08] bg-[#1A0F08]/60 p-2">💎 +{result.gems} cristais</div>}
              {result.essence > 0 && <div className="rounded border border-[#1A0F08] bg-[#1A0F08]/60 p-2">✨ +{result.essence} essência</div>}
              {result.items.length > 0 && (
                <div className="col-span-2 rounded border border-[#1A0F08] bg-[#1A0F08]/60 p-2">
                  📦 {result.items.length} equipamento(s): {result.items.map((it) => `${it.rarity} ${SLOTS.find(s => s.key === it.slot)?.label}`).join(", ")}
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => { setResult(null); setSelected(null); setPhase("idle"); }}
                className="rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-xs font-black"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  if (selected && dungeonKeysNow(save.dungeon).keys > 0) setPhase("running");
                  else { setSelected(null); setPhase("idle"); }
                }}
                className="rounded-lg border-2 border-[#1A0F08] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] py-2 text-xs font-black text-amber-950"
              >
                Repetir
              </button>
            </div>
          </div>
        )}

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}


// -------- Pets Modal (Fase 3 — Bloco 2) --------
function PetsModal({
  save,
  onClose,
  onEquip,
  onUpgrade,
  onCraft,
}: {
  save: SaveState;
  onClose: () => void;
  onEquip: (id: string | null) => void;
  onUpgrade: (id: string) => void;
  onCraft: (kind: PetKind) => void;
}) {
  const locked = save.level < PETS_UNLOCK_LEVEL;
  const [tab, setTab] = useState<"collection" | "forge">("collection");
  const equipped = save.pets.find((p) => p.id === save.equippedPetId) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>🐾 Pets</h2>
          <div className="text-[10px] opacity-70">1 equipado · bônus passivos</div>
        </div>

        {locked && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs">
            🔒 Desbloqueia no <b>Nível {PETS_UNLOCK_LEVEL}</b>
            <div className="mt-1 opacity-70">Você está no Lv {save.level}</div>
          </div>
        )}

        {!locked && (
          <>
            {equipped && (
              <div className={`mb-3 rounded-lg border-2 border-[#1A0F08] bg-gradient-to-br ${PET_DEFS[equipped.kind].color} p-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{PET_DEFS[equipped.kind].icon}</div>
                    <div>
                      <div className="text-sm font-black text-amber-50 drop-shadow">{PET_DEFS[equipped.kind].label}</div>
                      <div className="text-[10px] text-amber-50/90">{equipped.rarity} · Lv {equipped.level} · {PET_DEFS[equipped.kind].desc}</div>
                    </div>
                  </div>
                  <button onClick={() => onEquip(null)} className="rounded-md border-2 border-[#1A0F08] bg-[#1A0F08]/60 px-2 py-1 text-[10px] font-black">Desequipar</button>
                </div>
              </div>
            )}

            <div className="mb-3 flex gap-2">
              {(["collection", "forge"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`flex-1 rounded-lg border-2 border-[#1A0F08] py-1.5 text-xs font-black ${
                    tab === k ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950" : "bg-[#2A1810] text-amber-100/70"
                  }`}
                >
                  {k === "collection" ? `📚 Coleção (${save.pets.length})` : "🔨 Forjar"}
                </button>
              ))}
            </div>

            {tab === "collection" && (
              <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                {save.pets.length === 0 && (
                  <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs opacity-70">
                    Sem pets ainda. Abra baús raros ou faça masmorra de equipamento.
                  </div>
                )}
                {save.pets.map((p) => {
                  const def = PET_DEFS[p.kind];
                  const cost = petUpgradeCost(p);
                  const isEq = p.id === save.equippedPetId;
                  const canUp = p.level < PET_MAX_LEVEL && save.gold >= cost.gold && save.petFragments[p.kind] >= cost.fragments;
                  return (
                    <div key={p.id} className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br ${def.color} text-xl`}>{def.icon}</div>
                          <div>
                            <div className="text-xs font-black">{def.label} <span className="opacity-70">({p.rarity})</span></div>
                            <div className="text-[10px] opacity-80">Lv {p.level}/{PET_MAX_LEVEL} · {def.desc}</div>
                            {p.level < PET_MAX_LEVEL && (
                              <div className="text-[10px] opacity-70">🪙{fmt(cost.gold)} · 🧩{cost.fragments}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => onEquip(isEq ? null : p.id)}
                            className={`rounded-md border-2 border-[#1A0F08] px-2 py-1 text-[10px] font-black ${
                              isEq ? "bg-emerald-700" : "bg-[#5D4037]"
                            }`}
                          >
                            {isEq ? "✓ Equipado" : "Equipar"}
                          </button>
                          <button
                            onClick={() => onUpgrade(p.id)}
                            disabled={!canUp}
                            className={`rounded-md border-2 border-[#1A0F08] px-2 py-1 text-[10px] font-black ${
                              canUp ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950" : "bg-[#3E2723] opacity-60"
                            }`}
                          >
                            {p.level >= PET_MAX_LEVEL ? "MAX" : "Evoluir"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "forge" && (
              <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2 text-[11px] opacity-80">
                  Use fragmentos (obtidos em baús raros e masmorra de equipamento) para forjar um pet novo. Custa <b>{craftPetCost()}🧩</b> do mesmo tipo.
                </div>
                {PET_KINDS.map((k) => {
                  const def = PET_DEFS[k];
                  const cur = save.petFragments[k];
                  const cost = craftPetCost();
                  const ok = cur >= cost;
                  return (
                    <div key={k} className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br ${def.color} text-xl`}>{def.icon}</div>
                          <div>
                            <div className="text-xs font-black">{def.label}</div>
                            <div className="text-[10px] opacity-80">{def.desc} · 🧩 {cur}/{cost}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => onCraft(k)}
                          disabled={!ok}
                          className={`rounded-md border-2 border-[#1A0F08] px-3 py-1 text-[10px] font-black ${
                            ok ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950" : "bg-[#3E2723] opacity-60"
                          }`}
                        >
                          Forjar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Tower Modal (Fase 3 — Bloco 3) --------
function TowerModal({
  save,
  onClose,
  onRun,
}: {
  save: SaveState;
  onClose: () => void;
  onRun: () => { floor: number; best: number; newRecord: boolean; rewards: { gold: number; gems: number; essence: number; chests: number; frag?: { kind: PetKind; amt: number } } } | null;
}) {
  const locked = save.level < TOWER_UNLOCK_LEVEL;
  const [phase, setPhase] = useState<"idle" | "running" | "result">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof onRun> | null>(null);

  useEffect(() => {
    if (phase !== "running") return;
    setProgress(0);
    const start = Date.now();
    const dur = 2200;
    const t = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / dur) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(t);
        const r = onRun();
        if (r) { setResult(r); setPhase("result"); }
        else setPhase("idle");
      }
    }, 60);
    return () => clearInterval(t);
  }, [phase, onRun]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>🗼 Torre Infinita</h2>
          <div className="text-[10px] opacity-80">🏆 Recorde: {save.tower.bestFloor}</div>
        </div>

        {locked && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs">
            🔒 Desbloqueia no <b>Nível {TOWER_UNLOCK_LEVEL}</b>
            <div className="mt-1 opacity-70">Você está no Lv {save.level}</div>
          </div>
        )}

        {!locked && phase === "idle" && (
          <>
            <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-3 text-[11px] leading-relaxed">
              Enfrente andares cada vez mais fortes. A cada <b>{TOWER_BOSS_EVERY}</b> andares, um chefão. A derrota encerra a tentativa. Recompensas escalam por andar, com <b>+50%</b> em novo recorde.
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded border-2 border-[#1A0F08] bg-[#2A1810] p-2">🏆 Recorde: <b>{save.tower.bestFloor}</b></div>
              <div className="rounded border-2 border-[#1A0F08] bg-[#2A1810] p-2">🔁 Tentativas: <b>{save.tower.runs}</b></div>
            </div>
            <button
              onClick={() => setPhase("running")}
              className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] py-2 text-sm font-black text-amber-950"
            >
              🗡️ Iniciar Tentativa
            </button>
          </>
        )}

        {!locked && phase === "running" && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center">
            <div className="text-3xl">🗼</div>
            <div className="mt-1 text-sm font-black">Escalando a torre...</div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full border-2 border-[#1A0F08] bg-[#1A0F08]">
              <div className="h-full bg-gradient-to-r from-fuchsia-400 to-purple-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {!locked && phase === "result" && result && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4">
            <div className="text-center">
              <div className="text-xs opacity-80">Andar alcançado</div>
              <div className="text-3xl font-black text-amber-300">{result.floor}</div>
              {result.newRecord && (
                <div className="mt-1 text-xs font-black text-emerald-300">🏆 Novo recorde! (+50% recompensa)</div>
              )}
              {result.floor === 0 && (
                <div className="mt-1 text-[11px] opacity-80">Muito difícil — fortaleça o herói e tente novamente.</div>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {result.rewards.gold > 0 && <div className="rounded border border-[#1A0F08] bg-[#1A0F08]/60 p-2">🪙 +{fmt(result.rewards.gold)}</div>}
              {result.rewards.gems > 0 && <div className="rounded border border-[#1A0F08] bg-[#1A0F08]/60 p-2">💎 +{result.rewards.gems}</div>}
              {result.rewards.essence > 0 && <div className="rounded border border-[#1A0F08] bg-[#1A0F08]/60 p-2">✨ +{result.rewards.essence}</div>}
              {result.rewards.chests > 0 && <div className="rounded border border-[#1A0F08] bg-[#1A0F08]/60 p-2">📦 +{result.rewards.chests} baús</div>}
              {result.rewards.frag && (
                <div className="col-span-2 rounded border border-[#1A0F08] bg-[#1A0F08]/60 p-2">🧩 +{result.rewards.frag.amt} frag. {PET_DEFS[result.rewards.frag.kind].label}</div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => { setResult(null); setPhase("idle"); }} className="rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-xs font-black">Voltar</button>
              <button onClick={() => { setResult(null); setPhase("running"); }} className="rounded-lg border-2 border-[#1A0F08] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] py-2 text-xs font-black text-amber-950">Tentar de novo</button>
            </div>
          </div>
        )}

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Active Blessings Bar (Fase 3 — Bloco 4) --------
function ActiveBlessingsBar({ save, onOpen }: { save: SaveState; onOpen: () => void }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const now = Date.now();
  const active = (Object.keys(BLESSING_DEFS) as BlessingKind[]).filter((k) => (save.blessings?.[k] ?? 0) > now);
  if (active.length === 0) return null;
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center justify-center gap-1.5 border-b-2 border-[#1A0F08] bg-gradient-to-r from-[#3E2723] via-[#5D4037] to-[#3E2723] px-2 py-1 text-[10px]"
    >
      {active.map((k) => {
        const ms = (save.blessings?.[k] ?? 0) - now;
        const mins = Math.max(0, Math.ceil(ms / 60000));
        const label = mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60}m` : `${mins}m`;
        return (
          <span key={k} className="rounded border border-[#1A0F08] bg-black/40 px-1.5 py-0.5 font-black text-amber-100">
            {BLESSING_DEFS[k].icon} {label}
          </span>
        );
      })}
    </button>
  );
}

// -------- Blessings Modal (Fase 3 — Bloco 4) --------
function BlessingsModal({
  save,
  onClose,
  onActivate,
}: {
  save: SaveState;
  onClose: () => void;
  onActivate: (kind: BlessingKind, durationIdx: number, pay: "gold" | "gems") => void;
}) {
  const locked = save.level < BLESSING_UNLOCK_LEVEL;
  const [selectedDur, setSelectedDur] = useState(0);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const now = Date.now();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>✨ Bênçãos</h2>
          <div className="text-[10px] opacity-70">Bônus temporários — não pay-to-win</div>
        </div>

        {locked && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs">
            🔒 Desbloqueia no <b>Nível {BLESSING_UNLOCK_LEVEL}</b>
            <div className="mt-1 opacity-70">Você está no Lv {save.level}</div>
          </div>
        )}

        {!locked && (
          <>
            <div className="mb-3 flex gap-2">
              {BLESSING_DURATIONS.map((d, i) => (
                <button
                  key={d.label}
                  onClick={() => setSelectedDur(i)}
                  className={`flex-1 rounded-lg border-2 border-[#1A0F08] py-1.5 text-xs font-black ${
                    selectedDur === i ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950" : "bg-[#2A1810] text-amber-100/70"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {(Object.keys(BLESSING_DEFS) as BlessingKind[]).map((k) => {
                const def = BLESSING_DEFS[k];
                const dur = BLESSING_DURATIONS[selectedDur];
                const goldCost = Math.floor(def.baseGold * dur.goldMul);
                const gemCost = Math.floor(def.baseGems * dur.gemMul);
                const exp = save.blessings?.[k] ?? 0;
                const active = exp > now;
                const remMs = active ? exp - now : 0;
                const remMin = Math.ceil(remMs / 60000);
                const remLabel = remMin >= 60 ? `${Math.floor(remMin / 60)}h${remMin % 60}m` : `${remMin}m`;
                return (
                  <div key={k} className={`rounded-lg border-2 border-[#1A0F08] bg-gradient-to-br ${def.color} p-2`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{def.icon}</div>
                        <div>
                          <div className="text-xs font-black text-amber-50 drop-shadow">{def.label}</div>
                          <div className="text-[10px] text-amber-50/90">{def.desc}</div>
                          {active && (
                            <div className="mt-0.5 text-[10px] font-black text-emerald-200">⏳ Ativa · {remLabel}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => onActivate(k, selectedDur, "gold")}
                          disabled={save.gold < goldCost}
                          className="rounded-md border-2 border-[#1A0F08] bg-black/40 px-2 py-1 text-[10px] font-black text-amber-100 disabled:opacity-50"
                        >
                          🪙 {fmt(goldCost)}
                        </button>
                        <button
                          onClick={() => onActivate(k, selectedDur, "gems")}
                          disabled={save.gems < gemCost}
                          className="rounded-md border-2 border-[#1A0F08] bg-black/40 px-2 py-1 text-[10px] font-black text-amber-100 disabled:opacity-50"
                        >
                          💎 {gemCost}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-center text-[10px] opacity-70">
              Ativar novamente empilha o tempo restante.
            </div>
          </>
        )}

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Guild Modal (Fase 3 — Bloco 5) --------
function GuildModal({
  save,
  onClose,
  onJoin,
  onDonate,
  onFightBoss,
}: {
  save: SaveState;
  onClose: () => void;
  onJoin: (id: GuildId) => void;
  onDonate: () => void;
  onFightBoss: () => void;
}) {
  const locked = save.level < GUILD_UNLOCK_LEVEL;
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const g = save.guild;
  const today = todayKey();
  const donationsToday = g.lastDonateDay === today ? g.donationsToday : 0;
  const donationsLeft = GUILD_DAILY_DONATIONS - donationsToday;
  const cost = guildDonationCost(save.level, donationsToday);
  const lvl = guildLevel(g.xp);
  const nextXp = guildXpForLevel(lvl + 1);
  const prevXp = guildXpForLevel(lvl);
  const pct = lvl >= GUILD_MAX_LEVEL ? 100 : Math.min(100, ((g.xp - prevXp) / (nextXp - prevXp)) * 100);
  const now = Date.now();
  const bossReadyIn = Math.max(0, GUILD_BOSS_COOLDOWN_MS - (now - g.bossLastAt));
  const bossReady = bossReadyIn === 0;
  const bossHours = Math.ceil(bossReadyIn / (60 * 60 * 1000));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>🏰 Guilda</h2>
          <div className="text-[10px] opacity-70">Buffs passivos + chefão semanal</div>
        </div>

        {locked && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs">
            🔒 Desbloqueia no <b>Nível {GUILD_UNLOCK_LEVEL}</b>
            <div className="mt-1 opacity-70">Você está no Lv {save.level}</div>
          </div>
        )}

        {!locked && !g.id && (
          <div className="space-y-2">
            <div className="text-center text-xs opacity-80 mb-2">Escolha sua guilda (permanente por enquanto):</div>
            {(Object.keys(GUILD_DEFS) as GuildId[]).map((id) => {
              const def = GUILD_DEFS[id];
              return (
                <button
                  key={id}
                  onClick={() => onJoin(id)}
                  className={`w-full rounded-lg border-2 border-[#1A0F08] bg-gradient-to-br ${def.color} p-3 text-left active:scale-95`}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-3xl">{def.icon}</div>
                    <div>
                      <div className="text-sm font-black text-amber-50 drop-shadow">{def.name}</div>
                      <div className="text-[11px] text-amber-50/90">{def.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!locked && g.id && (
          <div className="space-y-3">
            {(() => {
              const def = GUILD_DEFS[g.id!];
              return (
                <div className={`rounded-lg border-2 border-[#1A0F08] bg-gradient-to-br ${def.color} p-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-3xl">{def.icon}</div>
                      <div>
                        <div className="text-sm font-black text-amber-50 drop-shadow">{def.name}</div>
                        <div className="text-[10px] text-amber-50/90">Nível {lvl}/{GUILD_MAX_LEVEL} · Bias +{def.bias.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-amber-50">
                      <div>🏆 {g.bossKills}</div>
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-[#1A0F08] bg-black/40">
                    <div className="h-full bg-amber-300" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-center text-[10px] text-amber-50/90">
                    {lvl >= GUILD_MAX_LEVEL ? "MAX" : `${fmt(g.xp - prevXp)} / ${fmt(nextXp - prevXp)} XP`}
                  </div>
                </div>
              );
            })()}

            <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-3">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-xs font-black">🎁 Doar Ouro</div>
                <div className="text-[10px] opacity-70">Restam {donationsLeft}/{GUILD_DAILY_DONATIONS} hoje</div>
              </div>
              <div className="text-[10px] opacity-80 mb-2">Aumenta o nível da guilda e a contribuição semanal.</div>
              <button
                onClick={onDonate}
                disabled={donationsLeft <= 0 || save.gold < cost}
                className="w-full rounded-md border-2 border-[#1A0F08] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] py-1.5 text-xs font-black text-amber-950 disabled:opacity-50"
              >
                Doar 🪙 {fmt(cost)}
              </button>
              <div className="mt-1 text-center text-[10px] opacity-70">
                Contrib. semanal: {fmt(g.weekKey === weekKey() ? g.contribWeek : 0)}
              </div>
            </div>

            <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-3">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-xs font-black">🐲 Chefão Semanal</div>
                <div className="text-[10px] opacity-70">
                  {bossReady ? "Pronto!" : `⏳ ${bossHours}h`}
                </div>
              </div>
              <div className="text-[10px] opacity-80 mb-2">Recompensas: ouro alto, cristais e essência.</div>
              <button
                onClick={onFightBoss}
                disabled={!bossReady}
                className="w-full rounded-md border-2 border-[#1A0F08] bg-gradient-to-b from-rose-500 to-red-700 py-1.5 text-xs font-black text-amber-50 disabled:opacity-50"
              >
                {bossReady ? "Enfrentar Chefão" : `Aguarde ${bossHours}h`}
              </button>
            </div>

            <div className="text-center text-[10px] opacity-60">
              Bônus atuais: ATK ×{guildBonus(save).atkMul.toFixed(2)} · Ouro ×{guildBonus(save).goldMul.toFixed(2)} · XP ×{guildBonus(save).xpMul.toFixed(2)}
            </div>
          </div>
        )}

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Arena PvP Async Modal (Fase 3 — Bloco 6) --------
function ArenaPvpModal({
  save,
  onClose,
  onFight,
  onBuyTicket,
  onClaimDaily,
}: {
  save: SaveState;
  onClose: () => void;
  onFight: (opp: ArenaOpponent) => { win: boolean };
  onBuyTicket: () => void;
  onClaimDaily: () => void;
}) {
  const locked = save.level < ARENA_UNLOCK_LEVEL;
  const [opponents, setOpponents] = useState<ArenaOpponent[]>(() => (locked ? [] : generateArenaOpponents(save)));
  const [lastResult, setLastResult] = useState<{ opp: ArenaOpponent; win: boolean } | null>(null);
  const [loadingReal, setLoadingReal] = useState(false);
  const [history, setHistory] = useState<ArenaHistoryEntry[]>(() => readArenaHistory());
  const [showHistory, setShowHistory] = useState(false);
  const tier = arenaTier(save.arena.points);
  const nextTier = ARENA_TIERS.find((t) => t.min > save.arena.points);
  const ticketsLeft = arenaTicketsLeft(save.arena);
  const canClaimDaily = save.arena.lastDailyClaim !== todayKey();

  // Converte snapshot público em ArenaOpponent do jogo
  const mapReal = useCallback((r: RealArenaOpponent, i: number): ArenaOpponent => {
    const level = Math.max(1, Math.floor(r.heroPower / 40));
    return {
      name: r.name,
      level,
      power: r.heroPower,
      guild: r.guild ?? "Independente",
      pet: r.skin ? `✨ ${r.skin}` : "🐺 Lobo",
      rank: r.rank || 999,
      rewardGold: Math.floor(400 * level),
      rewardGems: 3 + (i % 5),
      seed: (Date.now() ^ i) >>> 0,
      userId: r.userId,
      avatar: r.avatar,
      title: r.title,
      skin: r.skin,
      real: true,
    };
  }, []);

  // Carrega oponentes reais + fallback NPC
  const loadReal = useCallback(async (force: boolean) => {
    if (locked) return;
    setLoadingReal(true);
    try {
      const uid = await getCurrentUserId();
      const hp = heroPower(computeStats(save));
      const real = await fetchArenaOpponents(uid, hp, 5, force);
      const npcs = generateArenaOpponents(save);
      const merged: ArenaOpponent[] = [
        ...real.map(mapReal),
        ...npcs,
      ].slice(0, 5);
      setOpponents(merged);
    } finally {
      setLoadingReal(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, mapReal]);

  useEffect(() => { void loadReal(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const doFight = (opp: ArenaOpponent) => {
    const r = onFight(opp);
    setLastResult({ opp, win: r.win });
    pushArenaHistory({
      at: Date.now(),
      win: r.win,
      opponentName: opp.name,
      opponentPower: opp.power,
      opponentUserId: opp.userId,
      real: !!opp.real,
    });
    setHistory(readArenaHistory());
    // Regenera lista local (NPC) para variar; recarrega reais só respeitando throttle
    setTimeout(() => {
      const next = generateArenaOpponents({ ...save, arena: { ...save.arena, wins: save.arena.wins + (r.win ? 1 : 0), losses: save.arena.losses + (r.win ? 0 : 1) } });
      setOpponents((prev) => {
        const reals = prev.filter((o) => o.real);
        return [...reals, ...next].slice(0, 5);
      });
    }, 300);
  };

  const refreshReady = canRefreshOpponents();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>⚔️ Arena PvP</h2>
          <div className="text-[10px] opacity-70">Assíncrona · beta</div>
        </div>

        {locked && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs">
            🔒 Desbloqueia no <b>Nível {ARENA_UNLOCK_LEVEL}</b>
            <div className="mt-1 opacity-70">Você está no Lv {save.level}</div>
          </div>
        )}

        {!locked && (
          <>
            <div className={`rounded-lg border-2 border-[#1A0F08] bg-gradient-to-br ${tier.color} p-3 mb-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-3xl">{tier.icon}</div>
                  <div>
                    <div className="text-sm font-black text-amber-50 drop-shadow">{tier.name}</div>
                    <div className="text-[10px] text-amber-50/90">{save.arena.points} pts · {save.arena.wins}V / {save.arena.losses}D</div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-amber-50">
                  🎟️ {ticketsLeft}
                  <button onClick={onBuyTicket} className="mt-1 block rounded border border-[#1A0F08] bg-black/40 px-1.5 py-0.5 font-black">+1 💎{ARENA_EXTRA_TICKET_COST_GEMS}</button>
                </div>
              </div>
              {nextTier && (
                <div className="mt-2 text-center text-[10px] text-amber-50/90">
                  Próximo: {nextTier.icon} {nextTier.name} em {nextTier.min - save.arena.points} pts
                </div>
              )}
            </div>

            {canClaimDaily && (
              <button
                onClick={onClaimDaily}
                className="mb-3 w-full rounded-lg border-2 border-[#1A0F08] bg-gradient-to-b from-emerald-500 to-emerald-700 py-1.5 text-xs font-black text-amber-50"
              >
                🎁 Coletar Recompensa Diária ({fmt(ARENA_DAILY_REWARD_GOLD)}🪙 + {ARENA_DAILY_REWARD_GEMS}💎)
              </button>
            )}

            {lastResult && (
              <div className={`mb-3 rounded-lg border-2 border-[#1A0F08] p-2 text-center text-xs font-black ${lastResult.win ? "bg-emerald-800" : "bg-rose-900"}`}>
                {lastResult.win ? "🏆" : "💀"} {lastResult.win ? "Vitória" : "Derrota"} vs {lastResult.opp.name}
              </div>
            )}

            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[10px] opacity-70">
                {loadingReal ? "Buscando heróis reais…" : (opponents.some(o => o.real) ? "Oponentes reais + NPCs" : "Somente NPCs (offline)")}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowHistory((s) => !s)}
                  className="rounded border border-[#1A0F08] bg-black/40 px-2 py-0.5 text-[10px] font-black"
                >
                  📜 Histórico
                </button>
                <button
                  onClick={() => void loadReal(true)}
                  disabled={!refreshReady || loadingReal}
                  className="rounded border border-[#1A0F08] bg-black/40 px-2 py-0.5 text-[10px] font-black disabled:opacity-40"
                >
                  {refreshReady ? "🔄 Atualizar" : "⏳ Aguarde"}
                </button>
              </div>
            </div>

            {showHistory && (
              <div className="mb-2 max-h-[20vh] overflow-y-auto rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2 text-[10px]">
                {history.length === 0 ? (
                  <div className="opacity-60 text-center py-2">Sem batalhas recentes.</div>
                ) : history.slice(0, 10).map((h, i) => (
                  <div key={i} className="flex justify-between border-b border-[#1A0F08]/40 py-0.5 last:border-0">
                    <span>{h.win ? "🏆" : "💀"} vs {h.opponentName} {h.real ? "🌎" : "🤖"}</span>
                    <span className="opacity-60">⚡{fmt(h.opponentPower)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {opponents.map((o, i) => (
                <div key={`${o.userId ?? "npc"}-${i}`} className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-[#1A0F08] border border-[#8B4513] flex items-center justify-center text-lg">
                        {o.avatar || (o.real ? "🦸" : "🤖")}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-100">
                          <span>#{o.rank}</span>
                          <span className="truncate">{o.name}</span>
                          <span className="text-[10px] opacity-70">Lv{o.level}</span>
                          {o.real && <span className="text-[9px] text-emerald-300">🌎</span>}
                        </div>
                        {o.title && <div className="text-[10px] text-yellow-300 truncate">🏆 {o.title}</div>}
                        <div className="text-[10px] opacity-80 truncate">
                          {o.guild} · {o.pet} · ⚡{fmt(o.power)}
                        </div>
                        <div className="text-[10px] text-amber-300/90">
                          Prêmio: 🪙{fmt(o.rewardGold)} · 💎{o.rewardGems}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => doFight(o)}
                      disabled={ticketsLeft <= 0}
                      className="rounded-md border-2 border-[#1A0F08] bg-gradient-to-b from-rose-500 to-red-700 px-3 py-1.5 text-[11px] font-black text-amber-50 disabled:opacity-40"
                    >
                      Lutar
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </>
        )}

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Event Modal (Fase 3 — Bloco 7) --------
function EventModal({
  save,
  onClose,
  onClaimMission,
  onBuy,
}: {
  save: SaveState;
  onClose: () => void;
  onClaimMission: (id: string) => void;
  onBuy: (id: string) => void;
}) {
  const locked = save.level < EVENT_UNLOCK_LEVEL;
  const [tab, setTab] = useState<"missions" | "shop">("missions");
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const ev = save.event;
  const ms = eventTimeLeft(ev);
  const active = eventActive(ev);
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / 60000);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>
            {ACTIVE_EVENT.icon} {ACTIVE_EVENT.name}
          </h2>
          <div className="text-[10px] opacity-70">Beta · limitado</div>
        </div>

        {locked && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs">
            🔒 Desbloqueia no <b>Nível {EVENT_UNLOCK_LEVEL}</b>
            <div className="mt-1 opacity-70">Você está no Lv {save.level}</div>
          </div>
        )}

        {!locked && (
          <>
            <div className="mb-3 rounded-lg border-2 border-[#1A0F08] bg-gradient-to-br from-fuchsia-600 to-purple-800 p-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-amber-50/90">{ACTIVE_EVENT.desc}</div>
                <div className="text-right">
                  <div className="text-sm font-black text-amber-50">{ACTIVE_EVENT.medalIcon} {fmt(ev.medals)}</div>
                  <div className="text-[10px] text-amber-50/80">{active ? `${days}d ${hours}h ${mins}m` : "Encerrado"}</div>
                </div>
              </div>
            </div>

            <div className="mb-3 flex gap-2">
              <button
                onClick={() => setTab("missions")}
                className={`flex-1 rounded-lg border-2 border-[#1A0F08] py-1.5 text-xs font-black ${
                  tab === "missions" ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950" : "bg-[#2A1810] text-amber-100/70"
                }`}
              >
                Missões
              </button>
              <button
                onClick={() => setTab("shop")}
                className={`flex-1 rounded-lg border-2 border-[#1A0F08] py-1.5 text-xs font-black ${
                  tab === "shop" ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950" : "bg-[#2A1810] text-amber-100/70"
                }`}
              >
                Loja
              </button>
            </div>

            {tab === "missions" && (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {EVENT_MISSIONS.map((def) => {
                  const m = ev.missions.find((x) => x.id === def.id) ?? { id: def.id, progress: 0, claimed: false };
                  const pct = Math.min(100, (m.progress / def.target) * 100);
                  const done = m.progress >= def.target;
                  return (
                    <div key={def.id} className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black">{def.label}</div>
                          <div className="text-[10px] opacity-70">{def.hint} · +{def.medalReward} {ACTIVE_EVENT.medalIcon}</div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full border border-[#1A0F08] bg-black/40">
                            <div className="h-full bg-amber-300" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-0.5 text-right text-[10px]">{m.progress}/{def.target}</div>
                        </div>
                        <button
                          onClick={() => onClaimMission(def.id)}
                          disabled={!done || m.claimed || !active}
                          className="rounded-md border-2 border-[#1A0F08] bg-gradient-to-b from-emerald-500 to-emerald-700 px-2.5 py-1 text-[10px] font-black text-amber-50 disabled:opacity-40"
                        >
                          {m.claimed ? "Coletado" : "Coletar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "shop" && (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {EVENT_SHOP.map((item) => {
                  const can = ev.medals >= item.cost && active;
                  return (
                    <div key={item.id} className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">{item.icon}</div>
                          <div>
                            <div className="text-xs font-black">{item.label}</div>
                            <div className="text-[10px] opacity-70">{item.desc}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => onBuy(item.id)}
                          disabled={!can}
                          className="rounded-md border-2 border-[#1A0F08] bg-gradient-to-b from-[#FFB74D] to-[#FF9800] px-2.5 py-1 text-[10px] font-black text-amber-950 disabled:opacity-40"
                        >
                          {ACTIVE_EVENT.medalIcon} {item.cost}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Skins Modal (Fase 3 — Bloco 8) --------
function SkinsModal({
  save,
  onClose,
  onEquip,
  onBuy,
}: {
  save: SaveState;
  onClose: () => void;
  onEquip: (id: SkinId) => void;
  onBuy: (id: SkinId) => void;
}) {
  const locked = save.level < SKIN_UNLOCK_LEVEL;
  const allIds = Object.keys(SKIN_DEFS) as SkinId[];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>👗 Personagens</h2>
          <div className="text-[10px] opacity-70">💎 {save.gems}</div>
        </div>

        {locked && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs">
            🔒 Desbloqueia no <b>Nível {SKIN_UNLOCK_LEVEL}</b>
            <div className="mt-1 opacity-70">Você está no Lv {save.level}</div>
          </div>
        )}

        {!locked && (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {allIds.map((id) => {
              const def = SKIN_DEFS[id];
              const owned = save.skins.owned.includes(id);
              const equipped = save.skins.equipped === id;
              const canBuy = !owned && !!def.priceGems;
              const affordable = canBuy && save.gems >= (def.priceGems ?? 0);
              return (
                <div key={id} className={`rounded-lg border-2 border-[#1A0F08] bg-gradient-to-br ${def.color} p-2 ${owned ? "" : "opacity-90"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 border-black/50 bg-black/30">
                        {owned ? (
                          <img
                            src={def.sprite}
                            alt={def.label}
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl">🔒</div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-amber-50 drop-shadow">{def.label}</div>
                        <div className="text-[10px] text-amber-50/90">{def.rarity} · {def.desc}</div>
                        {!owned && !def.priceGems && (
                          <div className="mt-0.5 text-[10px] font-black text-amber-50/80">
                            Obtenha em baús raros ou na loja do evento.
                          </div>
                        )}
                      </div>
                    </div>
                    {owned ? (
                      <button
                        onClick={() => onEquip(id)}
                        disabled={equipped}
                        className="rounded-md border-2 border-[#1A0F08] bg-black/40 px-2.5 py-1.5 text-[11px] font-black text-amber-100 disabled:opacity-50"
                      >
                        {equipped ? "Equipada" : "Equipar"}
                      </button>
                    ) : canBuy ? (
                      <button
                        onClick={() => onBuy(id)}
                        disabled={!affordable}
                        className="rounded-md border-2 border-[#1A0F08] bg-amber-500/90 px-2.5 py-1.5 text-[11px] font-black text-amber-950 disabled:opacity-50"
                      >
                        💎 {def.priceGems}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="rounded-md border-2 border-[#1A0F08] bg-black/40 px-2.5 py-1.5 text-[11px] font-black text-amber-100 opacity-50"
                      >
                        Bloqueada
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Achievements Modal (Fase 3 — Bloco 9) --------
function AchievementsModal({
  save,
  onClose,
  onClaim,
}: {
  save: SaveState;
  onClose: () => void;
  onClaim: (id: AchievementId) => void;
}) {
  const [cat, setCat] = useState<AchievementCategory>("combate");
  const claimedSet = new Set(save.achievements.claimed);
  const list = ACHIEVEMENTS.filter((a) => a.category === cat);
  const totalDone = save.achievements.claimed.length;
  const totalAll = ACHIEVEMENTS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>🏆 Conquistas</h2>
          <div className="text-[10px] opacity-70">{totalDone}/{totalAll} coletadas</div>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-1">
          {ACHIEVEMENT_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`rounded-lg border-2 border-[#1A0F08] py-1.5 text-[10px] font-black ${
                cat === c.key ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950" : "bg-[#2A1810] text-amber-100/70"
              }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {list.map((a) => {
            const cur = Math.min(a.metric(save), a.goal);
            const pct = Math.min(100, Math.floor((cur / a.goal) * 100));
            const done = cur >= a.goal;
            const claimed = claimedSet.has(a.id);
            return (
              <div key={a.id} className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="text-2xl leading-none">{a.icon}</div>
                    <div className="min-w-0">
                      <div className="text-xs font-black">{a.label}</div>
                      <div className="text-[10px] opacity-80">{a.desc}</div>
                      <div className="text-[10px] mt-0.5 text-amber-300">🎁 {achievementRewardLabel(a.reward)}</div>
                    </div>
                  </div>
                  <button
                    disabled={!done || claimed}
                    onClick={() => onClaim(a.id)}
                    className={`shrink-0 rounded-md border-2 border-[#1A0F08] px-2 py-1 text-[10px] font-black ${
                      claimed
                        ? "bg-[#4A2F1A] text-amber-100/50"
                        : done
                        ? "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white"
                        : "bg-black/40 text-amber-100/50"
                    }`}
                  >
                    {claimed ? "✓ Coletada" : done ? "Coletar" : "🔒"}
                  </button>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
                  <div
                    className={`h-full ${done ? "bg-emerald-400" : "bg-amber-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-0.5 text-right text-[9px] opacity-70">{fmt(cur)} / {fmt(a.goal)}</div>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Runes Modal (Fase 3 — Bloco 10) --------
function RunesModal({
  save,
  onClose,
  onUpgrade,
  onToggle,
}: {
  save: SaveState;
  onClose: () => void;
  onUpgrade: (kind: RuneKind) => void;
  onToggle: (kind: RuneKind) => void;
}) {
  const locked = save.level < RUNE_UNLOCK_LEVEL;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>🔮 Runas</h2>
          <div className="text-[10px] opacity-70">
            🔮 {save.runes.fragments} · Equipadas {save.runes.equipped.length}/{RUNE_MAX_EQUIPPED}
          </div>
        </div>

        {locked && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-4 text-center text-xs">
            🔒 Desbloqueia no <b>Nível {RUNE_UNLOCK_LEVEL}</b>
            <div className="mt-1 opacity-70">Você está no Lv {save.level}</div>
          </div>
        )}

        {!locked && (
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {RUNE_ORDER.map((k) => {
              const def = RUNE_DEFS[k];
              const lv = save.runes.levels[k] ?? 0;
              const equipped = save.runes.equipped.includes(k);
              const isMax = lv >= RUNE_MAX_LEVEL;
              const cost = runeUpgradeCost(lv);
              const curVal = runeCurrentValue(k, lv);
              const nextVal = runeCurrentValue(k, Math.min(RUNE_MAX_LEVEL, lv + 1));
              return (
                <div key={k} className={`rounded-lg border-2 border-[#1A0F08] bg-gradient-to-br ${def.color} p-2`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="text-2xl">{def.icon}</div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-amber-50 drop-shadow flex items-center gap-1">
                          {def.label} <span className="text-[10px] opacity-80">Lv{lv}/{RUNE_MAX_LEVEL}</span>
                        </div>
                        <div className="text-[10px] text-amber-50/90">
                          Atual: {lv > 0 ? def.desc(curVal) : "—"}
                          {!isMax && lv >= 0 && <> · Próx: {def.desc(nextVal)}</>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => onToggle(k)}
                        disabled={lv <= 0}
                        className={`rounded-md border-2 border-[#1A0F08] px-2 py-1 text-[10px] font-black ${
                          equipped
                            ? "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white"
                            : "bg-black/40 text-amber-100 disabled:opacity-40"
                        }`}
                      >
                        {equipped ? "✓ Equipada" : "Equipar"}
                      </button>
                      <button
                        onClick={() => onUpgrade(k)}
                        disabled={isMax || save.gold < cost.gold || save.runes.fragments < cost.fragments}
                        className="rounded-md border-2 border-[#1A0F08] bg-black/40 px-2 py-1 text-[10px] font-black text-amber-100 disabled:opacity-40"
                      >
                        {isMax ? "MAX" : `🪙${fmt(cost.gold)} · 🔮${cost.fragments}`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2 text-[10px] opacity-80">
              💡 Fragmentos vêm de <b>Torre</b>, <b>Masmorra</b>, <b>Conquistas</b> e <b>Loja do Evento</b>.
              Bônus máximos por runa: ATK/HP +20% · Ouro/XP +15% · Drop +5% · Crítico +5%.
            </div>
          </div>
        )}

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}

// -------- Cosmetics Modal (Fase 3 — Bloco 11) --------
function CosmeticsModal({
  save,
  onClose,
  onEquip,
}: {
  save: SaveState;
  onClose: () => void;
  onEquip: (category: CosmeticCategory, id: CosmeticId) => void;
}) {
  const [cat, setCat] = useState<CosmeticCategory>("weapon");
  const list = Object.values(COSMETIC_DEFS).filter((c) => c.category === cat);
  const equippedId = save.cosmetics.equipped[cat] ?? null;
  const totalOwned = save.cosmetics.owned.length;
  const totalAll = Object.keys(COSMETIC_DEFS).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t-4 border-[#8B4513] bg-[#3E2723] p-4 pb-8 text-amber-100"
        style={{ animation: "slideUp 200ms ease" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ fontFamily: "'Luckiest Guy', cursive" }}>🎭 Cosméticos</h2>
          <div className="text-[10px] opacity-70">{totalOwned}/{totalAll} · sem bônus de poder</div>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-1">
          {COSMETIC_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`rounded-lg border-2 border-[#1A0F08] py-1.5 text-[10px] font-black ${
                cat === c.key ? "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-amber-950" : "bg-[#2A1810] text-amber-100/70"
              }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {list.map((c) => {
            const owned = save.cosmetics.owned.includes(c.id);
            const equipped = equippedId === c.id;
            return (
              <div key={c.id} className={`rounded-lg border-2 border-[#1A0F08] bg-gradient-to-br ${c.color} p-2 ${!owned ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-2xl">{c.icon}</div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-amber-50 drop-shadow">
                        {c.label} <span className="text-[9px] opacity-80">· {c.rarity}</span>
                      </div>
                      <div className="text-[10px] text-amber-50/90">{c.desc}</div>
                      {!owned && <div className="text-[10px] mt-0.5 text-amber-200">🔒 Fonte: {c.source}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => onEquip(c.category, c.id)}
                    disabled={!owned}
                    className={`shrink-0 rounded-md border-2 border-[#1A0F08] px-2 py-1 text-[10px] font-black ${
                      equipped
                        ? "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white"
                        : owned
                        ? "bg-black/40 text-amber-100"
                        : "bg-black/40 text-amber-100/50"
                    }`}
                  >
                    {equipped ? "✓ Equipado" : owned ? "Equipar" : "🔒"}
                  </button>
                </div>
              </div>
            );
          })}
          <div className="rounded-lg border-2 border-[#1A0F08] bg-[#2A1810] p-2 text-[10px] opacity-80">
            💡 Cosméticos são <b>puramente visuais</b> e não afetam atributos. Fontes: <b>Baús Raros</b>, <b>Conquistas</b> e <b>Loja do Evento</b>.
          </div>
        </div>

        <button onClick={onClose} className="mt-3 w-full rounded-lg border-2 border-[#1A0F08] bg-[#5D4037] py-2 text-sm">Fechar</button>
      </div>
    </div>
  );
}




// ============= Códigos / Redeem Modal (Fase 3 — Bloco 12) =============
function CodesModal({
  save,
  onClose,
  onRedeem,
  inviteLink,
  referralCount,
}: {
  save: SaveState;
  onClose: () => void;
  onRedeem: (code: string) => { ok: boolean; msg: string };
  inviteLink?: string | null;
  referralCount?: number;
}) {
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const used = save.redeem.used;

  const submit = () => {
    const res = onRedeem(code);
    setFeedback(res);
    if (res.ok) setCode("");
  };

  const copyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  const shareInvite = async () => {
    if (!inviteLink) return;
    const text = `🎮 Joga BR Hero comigo! Use meu link e ganhe recompensas: ${inviteLink}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "BR Hero", text, url: inviteLink }); return; } catch { /* fallback */ }
    }
    void copyInvite();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border-4 border-[#1A0F08] bg-gradient-to-b from-amber-100 to-amber-200 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#1A0F08]">🎟️ Códigos Promocionais</h2>
          <button onClick={onClose} className="rounded-lg bg-red-600 px-2 py-1 text-xs font-bold text-white">
            Fechar
          </button>
        </div>

        <p className="mb-2 text-xs text-[#3A2415]">
          Insira códigos promocionais para resgatar recompensas. Cada código pode ser usado apenas uma vez por save.
        </p>

        <div className="mb-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 24))}
            placeholder="DIGITE O CÓDIGO"
            className="flex-1 rounded-lg border-2 border-[#1A0F08] bg-white px-3 py-2 text-sm font-bold uppercase tracking-wider text-[#1A0F08]"
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            maxLength={24}
          />
          <button
            onClick={submit}
            className="rounded-lg border-2 border-[#1A0F08] bg-emerald-500 px-3 py-2 text-sm font-black text-white active:scale-95"
          >
            RESGATAR
          </button>
        </div>

        {feedback && (
          <div
            className={`mb-3 rounded-lg border-2 border-[#1A0F08] px-3 py-2 text-xs font-bold ${
              feedback.ok ? "bg-emerald-200 text-emerald-900" : "bg-red-200 text-red-900"
            }`}
          >
            {feedback.ok ? "✅ " : "⚠️ "} {feedback.msg}
          </div>
        )}

        {/* Painel de convite — 10💎 por amigo que loga pelo link */}
        <div className="mb-2 rounded-lg border-2 border-[#1A0F08] bg-gradient-to-b from-sky-100 to-sky-200 p-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-xs font-black text-[#1A0F08]">🎁 Convide amigos · +10 💎 por convite</div>
            {typeof referralCount === "number" && (
              <span className="rounded bg-emerald-600 px-2 py-[1px] text-[10px] font-bold text-white">
                {referralCount} convidado{referralCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {inviteLink ? (
            <>
              <div className="mb-1 truncate rounded border border-[#1A0F08]/40 bg-white px-2 py-1 font-mono text-[11px] text-[#1A0F08]">
                {inviteLink}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyInvite}
                  className="flex-1 rounded-lg border-2 border-[#1A0F08] bg-amber-400 px-2 py-1 text-[11px] font-black text-[#1A0F08] active:scale-95"
                >
                  {copied ? "✅ COPIADO" : "📋 COPIAR"}
                </button>
                <button
                  onClick={shareInvite}
                  className="flex-1 rounded-lg border-2 border-[#1A0F08] bg-emerald-500 px-2 py-1 text-[11px] font-black text-white active:scale-95"
                >
                  📤 COMPARTILHAR
                </button>
              </div>
              <p className="mt-1 text-[10px] text-[#3A2415]">
                Cada amigo que entrar pelo seu link e logar te dá <b>+10 💎</b>. 1 recompensa por amigo.
              </p>
            </>
          ) : (
            <p className="text-[11px] text-[#3A2415]">Faça login para gerar seu link de convite.</p>
          )}
        </div>


        {Object.keys(REDEEM_CODES).length > 0 && (
          <div className="rounded-lg border-2 border-[#1A0F08] bg-amber-50 p-2">
            <div className="mb-1 text-xs font-black text-[#1A0F08]">📜 Códigos disponíveis</div>
            <ul className="space-y-1 text-[11px] text-[#3A2415]">
              {Object.entries(REDEEM_CODES).map(([k, def]) => {
                const isUsed = used.includes(k);
                return (
                  <li key={k} className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-black">{k}</span>
                      <span className="ml-1">— {def.desc}</span>
                    </div>
                    <span className={`shrink-0 rounded px-1 text-[10px] font-bold ${isUsed ? "bg-gray-400 text-white" : "bg-emerald-500 text-white"}`}>
                      {isUsed ? "USADO" : "NOVO"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ============= Game Menu Modal — grade compacta (evita poluir a arena) =============
type MenuKey =
  | "daily" | "missions" | "dungeon" | "pets" | "tower"
  | "blessings" | "guild" | "arena" | "event" | "skins"
  | "achievements" | "runes" | "cosmetics" | "codes" | "cloud";

function GameMenuModal({
  save,
  onClose,
  onPick,
}: {
  save: SaveState;
  onClose: () => void;
  onPick: (m: MenuKey) => void;
}) {
  const items: { key: MenuKey; icon: string; label: string; unlock?: number; kind?: "level" }[] = [
    { key: "daily",        icon: "📅", label: "Diário" },
    { key: "missions",     icon: "🎯", label: "Missões" },
    { key: "dungeon",      icon: "🗝️", label: "Masmorra",  unlock: DUNGEON_UNLOCK_LEVEL },
    { key: "pets",         icon: "🐾", label: "Pets",      unlock: PETS_UNLOCK_LEVEL },
    { key: "tower",        icon: "🗼", label: "Torre",     unlock: TOWER_UNLOCK_LEVEL },
    { key: "blessings",    icon: "✨", label: "Bênçãos",  unlock: BLESSING_UNLOCK_LEVEL },
    { key: "guild",        icon: "🛡️", label: "Guilda",    unlock: GUILD_UNLOCK_LEVEL },
    { key: "arena",        icon: "⚔️", label: "Arena",     unlock: ARENA_UNLOCK_LEVEL },
    { key: "event",        icon: ACTIVE_EVENT.icon, label: "Evento", unlock: EVENT_UNLOCK_LEVEL },
    { key: "skins",        icon: equippedSkinDef(save).icon, label: "Skins", unlock: SKIN_UNLOCK_LEVEL },
    { key: "achievements", icon: "🏆", label: "Conquistas" },
    { key: "runes",        icon: "🔮", label: "Runas",     unlock: RUNE_UNLOCK_LEVEL },
    { key: "cosmetics",    icon: "🎭", label: "Cosméticos" },
    { key: "codes",        icon: "🎟️", label: "Códigos" },
  ];


  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border-4 border-b-0 border-[#1A0F08] bg-gradient-to-b from-amber-100 to-amber-200 p-3 shadow-2xl sm:rounded-2xl sm:border-b-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black text-[#1A0F08]">📖 Menu</h2>
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-[#1A0F08] bg-red-500 px-2 py-1 text-xs font-black text-white active:scale-95"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {items.map((it) => {
            const locked = it.unlock !== undefined && save.level < it.unlock;
            return (
              <button
                key={it.key}
                onClick={() => {
                  if (locked) return;
                  onPick(it.key);
                }}
                disabled={locked}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-[#1A0F08] px-1.5 py-2 text-[10px] font-black uppercase tracking-wide leading-tight shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] active:scale-95 ${
                  locked
                    ? "bg-stone-300 text-stone-500"
                    : "bg-gradient-to-b from-amber-300 to-orange-400 text-[#1A0F08]"
                }`}
              >
                <span className="text-xl leading-none">{locked ? "🔒" : it.icon}</span>
                <span className="text-center">
                  {locked ? `Lv${it.unlock}` : it.label}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-[10px] text-[#3A2415]">
          Toque em um módulo para abrir · Rebirth continua no topo
        </p>
      </div>
    </div>
  );
}

// ---- LiveOps banner (Fase 3 · Bloco 2) ----
function LiveOpsBanner({ snap }: { snap: import("@/lib/game/remote-liveops").LiveOpsSnapshot }) {
  const buffs = snap.activeBuffs;
  const events = snap.flashEvents;
  const hasAny = snap.globalMessage || snap.maintenance || buffs.length > 0 || events.length > 0;
  if (!hasAny) return null;
  const buffLabel = (t: string) =>
    t === "double_xp" ? "XP" : t === "double_gold" ? "Ouro" : "Drop";
  return (
    <div className="flex flex-col gap-1 border-b-2 border-[#8B4513] bg-[#1a0f07] px-3 py-1.5 text-[11px]">
      {snap.maintenance && (
        <div className={`rounded px-2 py-1 font-semibold ${snap.maintenance.active ? "bg-red-700/80 text-white" : "bg-amber-600/80 text-amber-50"}`}>
          🛠️ {snap.maintenance.active ? "Manutenção em andamento" : "Manutenção programada"} — {snap.maintenance.message}
          {snap.maintenance.startsAt && !snap.maintenance.active && (
            <> · início {new Date(snap.maintenance.startsAt).toLocaleString("pt-BR")}</>
          )}
        </div>
      )}
      {snap.globalMessage && (
        <div className="rounded bg-sky-700/80 px-2 py-1 font-medium text-sky-50">
          📢 {snap.globalMessage}
        </div>
      )}
      {buffs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {buffs.map((b, i) => (
            <span key={i} className="rounded bg-emerald-700/80 px-2 py-0.5 font-bold text-emerald-50">
              ⚡ ×{b.multiplier} {buffLabel(b.type)}
              {b.endsAt && ` · até ${new Date(b.endsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
            </span>
          ))}
        </div>
      )}
      {events.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {events.map((e) => (
            <span key={e.id} className="rounded bg-fuchsia-700/80 px-2 py-0.5 font-bold text-fuchsia-50">
              🎉 {e.name}
              {e.endsAt && ` · até ${new Date(e.endsAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Remote offers panel (Fase 3 · Bloco 3, read-only) ----
function RemoteOffersPanel({ offers }: { offers: RemoteOffer[] }) {
  const paymentsCfg = usePaymentsConfig();
  const { list: txs, loading: txLoading, refresh } = usePlayerTransactions();
  const [busyId, setBusyId] = useState<string | null>(null);
  const canBuy = !!paymentsCfg?.enabled;

  const isInfinitepay = paymentsCfg?.provider === "infinitepay";

  const buy = async (o: RemoteOffer) => {
    setBusyId(o.id);
    try {
      if (isInfinitepay) {
        const redirect = typeof window !== "undefined" ? `${window.location.origin}/?payment=success` : undefined;
        const res = await beginInfinitepayCheckoutClient(o, redirect);
        if (!res.ok) { alert(res.reason ?? "Falha no checkout"); return; }
        refresh();
        if (res.checkoutUrl && typeof window !== "undefined") {
          window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
        }
        return;
      }
      const res = await beginSandboxCheckout(o);
      if (!res.ok) { alert(res.reason ?? "Falha no checkout"); return; }
      refresh();
      alert("🛒 Transação criada como PENDING.\nO Admin precisa confirmar para liberar a recompensa.");
    } finally {
      setBusyId(null);
    }
  };

  const currencyIcon = (c: RemoteOffer["currency"]) =>
    c === "gems" ? "💎" : c === "gold" ? "🪙" : c === "essence" ? "✨" : "R$";

  if (offers.length === 0 && txs.length === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-amber-300" style={{ fontFamily: "'Lilita One', cursive" }}>
          🎁 Ofertas do Admin
        </h3>
        <span className="rounded-full bg-amber-500/20 px-2 py-[1px] text-[9px] uppercase text-amber-300">
          {canBuy ? (isInfinitepay ? "infinitepay ativo" : "sandbox ativo") : "somente leitura"}
        </span>
      </div>
      {offers.map((o) => {
        const paid = o.currency === "brl";
        const showBuy = paid && canBuy;
        return (
          <div key={o.id} className="flex items-center gap-3 rounded-xl border-2 border-amber-400/30 bg-[#0a1c3a]/70 p-3">
            <div className="text-2xl">{o.featured ? "⭐" : "🛒"}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-amber-200" style={{ fontFamily: "'Lilita One', cursive" }}>
                {o.name}
                {o.featured && <span className="rounded-full bg-amber-400 px-2 py-[1px] text-[9px] uppercase text-[#0a1c3a]">destaque</span>}
              </div>
              <div className="text-[11px] opacity-80">{o.reward}</div>
              {o.endsAt && (
                <div className="text-[10px] opacity-60">até {new Date(o.endsAt).toLocaleString("pt-BR")}</div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[11px] text-amber-100">
                {paid
                  ? `R$ ${o.price.toFixed(2).replace(".", ",")}`
                  : `${currencyIcon(o.currency)} ${o.price.toLocaleString("pt-BR")}`}
              </div>
              {showBuy ? (
                <button
                  onClick={() => void buy(o)}
                  disabled={busyId === o.id}
                  className="rounded-lg border-2 border-amber-400 bg-gradient-to-b from-amber-400 to-amber-600 px-2 py-1 text-[10px] font-black text-[#0a1c3a] disabled:opacity-60"
                >
                  {busyId === o.id ? "..." : isInfinitepay ? "COMPRAR (INFINITEPAY)" : "COMPRAR (SANDBOX)"}
                </button>
              ) : (
                <span className="rounded border border-amber-400/40 px-2 py-[2px] text-[9px] uppercase text-amber-200/70">
                  {paid ? "em breve" : "prévia"}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Histórico de compras */}
      <details className="rounded-lg border border-amber-400/20 bg-[#0a1c3a]/50 p-2 text-[11px]">
        <summary className="cursor-pointer text-amber-200/80">
          🧾 Minhas compras {txLoading ? "(carregando…)" : `(${txs.length})`}
        </summary>
        <div className="mt-2 space-y-1">
          {txs.length === 0 ? (
            <div className="opacity-60">Nenhuma transação ainda.</div>
          ) : txs.map((tx) => {
            const snap = tx.offer_snapshot as { name?: string; reward?: string } | null;
            const badge =
              tx.status === "paid" ? "bg-emerald-500/30 text-emerald-200"
              : tx.status === "pending" ? "bg-yellow-500/30 text-yellow-200"
              : tx.status === "failed" ? "bg-red-500/30 text-red-200"
              : "bg-slate-500/30 text-slate-200";
            return (
              <div key={tx.id} className="flex items-center justify-between gap-2 rounded border border-amber-400/10 bg-black/20 px-2 py-1">
                <div className="flex-1 truncate">
                  <div className="truncate">{snap?.name ?? tx.offer_id}</div>
                  <div className="opacity-60 text-[10px]">
                    R$ {(tx.amount_cents / 100).toFixed(2).replace(".", ",")} · {new Date(tx.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>
                <span className={`rounded px-2 py-[1px] text-[9px] uppercase ${badge}`}>
                  {tx.status}{tx.reward_delivered ? " ✓" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </details>

      <p className="text-[10px] opacity-50">
        {canBuy
          ? "Modo sandbox: nenhum valor real é cobrado. Recompensas só entram após confirmação do Admin."
          : "Ofertas gerenciadas pelo Admin. Compra real será liberada em versão futura."}
      </p>
    </div>
  );
}

