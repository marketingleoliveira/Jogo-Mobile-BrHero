import { useState } from "react";
import type { GameState, Equipment, BattleResult } from "@/lib/game/engine";
import {
  enemyForStage,
  heroTotals,
  xpForLevel,
  upgradeCost,
  rollEquipment,
} from "@/lib/game/engine";
import {
  Swords,
  Shield,
  Heart,
  Zap,
  Coins,
  Gem,
  Trophy,
  Target,
  Sparkles,
  Package,
  ChevronUp,
  Lock,
  Check,
} from "lucide-react";

const rarityColor: Record<Equipment["rarity"], string> = {
  common: "text-muted-foreground border-border",
  uncommon: "text-emerald-500 border-emerald-500/40",
  rare: "text-sky-500 border-sky-500/40",
  epic: "text-fuchsia-500 border-fuchsia-500/50",
};

export function BattleScreen({
  state,
  onFight,
  battle,
  fighting,
  fastMode,
  setFastMode,
}: {
  state: GameState;
  onFight: () => void;
  battle: BattleResult | null;
  fighting: boolean;
  fastMode: boolean;
  setFastMode: (v: boolean) => void;
}) {
  const totals = heroTotals(state);
  const enemy = enemyForStage(state.stage);
  const lastEnemyHp = battle?.log[battle.log.length - 1]?.enemyHp ?? enemy.hp;
  const lastHeroHp = battle?.log[battle.log.length - 1]?.heroHp ?? totals.hp;
  const enemyPct = Math.max(0, (lastEnemyHp / enemy.hp) * 100);
  const heroPct = Math.max(0, (lastHeroHp / totals.hp) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Estágio {state.stage}</span>
          {enemy.isBoss && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
              CHEFE
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-medium">{enemy.name}</div>
          <div className="text-xs text-muted-foreground">
            HP {Math.max(0, Math.floor(lastEnemyHp))}/{enemy.hp}
          </div>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-destructive transition-all"
            style={{ width: `${enemyPct}%` }}
          />
        </div>
        <div className="my-6 flex items-center justify-center gap-6 text-5xl">
          <span className={fighting ? "animate-pulse" : ""}>🧝</span>
          <Swords className="h-6 w-6 text-muted-foreground" />
          <span className={fighting ? "animate-pulse" : ""}>
            {enemy.isBoss ? "👹" : "👺"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{state.hero.name}</div>
          <div className="text-xs text-muted-foreground">
            HP {Math.max(0, Math.floor(lastHeroHp))}/{totals.hp}
          </div>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${heroPct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onFight}
          disabled={fighting || state.energy < 1}
          className="flex-1 rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          {fighting ? "Lutando…" : state.energy < 1 ? "Sem energia" : "⚔️ Lutar"}
        </button>
        <button
          onClick={() => setFastMode(!fastMode)}
          className={`rounded-2xl border border-border px-4 py-4 text-sm ${
            fastMode ? "bg-primary/10" : "bg-card"
          }`}
        >
          ⏩
        </button>
      </div>

      {battle && !fighting && (
        <div
          className={`rounded-2xl border p-4 ${
            battle.win
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-destructive/40 bg-destructive/5"
          }`}
        >
          <div className="mb-2 text-sm font-semibold">
            {battle.win ? "🏆 Vitória!" : "💀 Derrota"}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> +{battle.rewards.xp} XP
            </span>
            {battle.rewards.coins > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-500">
                <Coins className="h-3.5 w-3.5" /> +{battle.rewards.coins}
              </span>
            )}
            {battle.rewards.crystals > 0 && (
              <span className="inline-flex items-center gap-1 text-fuchsia-500">
                <Gem className="h-3.5 w-3.5" /> +{battle.rewards.crystals}
              </span>
            )}
            {battle.rewards.drop && (
              <span className="inline-flex items-center gap-1 text-sky-500">
                <Package className="h-3.5 w-3.5" /> {battle.rewards.drop.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CharacterScreen({ state }: { state: GameState }) {
  const totals = heroTotals(state);
  const need = xpForLevel(state.hero.level);
  const pct = (state.hero.xp / need) * 100;
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="text-6xl">🧝</div>
        <h2 className="mt-2 text-xl font-bold">{state.hero.name}</h2>
        <p className="text-sm text-muted-foreground">Nível {state.hero.level}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {state.hero.xp} / {need} XP
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={<Swords className="h-4 w-4" />} label="Ataque" value={totals.atk} />
        <StatCard icon={<Shield className="h-4 w-4" />} label="Defesa" value={totals.def} />
        <StatCard icon={<Heart className="h-4 w-4" />} label="Vida" value={totals.hp} />
        <StatCard icon={<Zap className="h-4 w-4" />} label="Velocidade" value={totals.speed} />
        <StatCard icon={<Target className="h-4 w-4" />} label="Crítico %" value={totals.crit} />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Vitórias"
          value={state.stats.battlesWon}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

export function EquipmentScreen({
  state,
  onToggle,
  onSell,
}: {
  state: GameState;
  onToggle: (id: string) => void;
  onSell: (id: string) => void;
}) {
  if (!state.unlocked.equipment) return <Locked label="Nível 2" />;
  if (state.inventory.length === 0)
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhum equipamento ainda. Vença batalhas para receber itens.
      </p>
    );
  return (
    <div className="flex flex-col gap-2">
      {state.inventory.map((e) => (
        <div
          key={e.id}
          className={`rounded-xl border bg-card p-3 ${rarityColor[e.rarity]}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{e.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{e.slot}</div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onToggle(e.id)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
              >
                {e.equipped ? "Remover" : "Equipar"}
              </button>
              <button
                onClick={() => onSell(e.id)}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-muted-foreground"
              >
                Vender
              </button>
            </div>
          </div>
          <div className="mt-2 flex gap-3 text-xs">
            {e.atk > 0 && <span>⚔️ +{e.atk}</span>}
            {e.def > 0 && <span>🛡️ +{e.def}</span>}
            {e.hp > 0 && <span>❤️ +{e.hp}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function UpgradesScreen({
  state,
  onUpgrade,
}: {
  state: GameState;
  onUpgrade: (stat: "atk" | "def" | "hp" | "speed" | "crit") => void;
}) {
  if (!state.unlocked.upgrades) return <Locked label="Nível 3" />;
  const items: Array<{
    key: "atk" | "def" | "hp" | "speed" | "crit";
    label: string;
    icon: React.ReactNode;
    value: number;
    inc: string;
  }> = [
    { key: "atk", label: "Ataque", icon: <Swords className="h-4 w-4" />, value: state.hero.baseAtk, inc: "+2" },
    { key: "def", label: "Defesa", icon: <Shield className="h-4 w-4" />, value: state.hero.baseDef, inc: "+1" },
    { key: "hp", label: "Vida", icon: <Heart className="h-4 w-4" />, value: state.hero.baseHp, inc: "+8" },
    { key: "speed", label: "Velocidade", icon: <Zap className="h-4 w-4" />, value: state.hero.speed, inc: "+1" },
    { key: "crit", label: "Crítico %", icon: <Target className="h-4 w-4" />, value: state.hero.crit, inc: "+1" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => {
        const cost = upgradeCost(it.key, state.hero);
        const can = state.coins >= cost;
        return (
          <div key={it.key} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                {it.icon}
                {it.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {it.value} <span className="text-xs">({it.inc})</span>
              </div>
            </div>
            <button
              onClick={() => onUpgrade(it.key)}
              disabled={!can}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              <ChevronUp className="h-4 w-4" />
              <Coins className="h-3.5 w-3.5" /> {cost}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function MissionsScreen({
  state,
  onClaim,
}: {
  state: GameState;
  onClaim: (id: string) => void;
}) {
  if (!state.unlocked.missions) return <Locked label="Nível 5" />;
  return (
    <div className="flex flex-col gap-2">
      {state.missions.map((m) => {
        const pct = (m.progress / m.goal) * 100;
        const done = m.progress >= m.goal && !m.claimed;
        return (
          <div key={m.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{m.label}</div>
              <div className="text-xs text-muted-foreground">
                {m.progress}/{m.goal}
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2 text-xs">
                <span>🪙 {m.reward.coins}</span>
                <span>💎 {m.reward.crystals}</span>
                <span>✨ {m.reward.xp}</span>
              </div>
              <button
                onClick={() => onClaim(m.id)}
                disabled={!done}
                className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-40"
              >
                {m.claimed ? <Check className="h-3.5 w-3.5" /> : "Coletar"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AchievementsScreen({
  state,
  onClaim,
}: {
  state: GameState;
  onClaim: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {state.achievements.map((a) => {
        const pct = (a.progress / a.goal) * 100;
        const done = a.progress >= a.goal && !a.claimed;
        return (
          <div key={a.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-4 w-4 text-amber-500" />
                {a.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {a.progress}/{a.goal}
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2 text-xs">
                <span>🪙 {a.reward.coins}</span>
                <span>💎 {a.reward.crystals}</span>
              </div>
              <button
                onClick={() => onClaim(a.id)}
                disabled={!done}
                className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-40"
              >
                {a.claimed ? <Check className="h-3.5 w-3.5" /> : "Coletar"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ShopScreen({
  state,
  onBuy,
  onOpenChest,
}: {
  state: GameState;
  onBuy: (pack: "energy" | "crystals_small" | "crystals_big" | "boost") => void;
  onOpenChest: () => void;
}) {
  const packs = [
    { id: "energy" as const, label: "+10 Energia", cost: 5, currency: "💎" },
    { id: "crystals_small" as const, label: "+30 Cristais", cost: 300, currency: "🪙" },
    { id: "crystals_big" as const, label: "+100 Cristais", cost: 900, currency: "🪙" },
    { id: "boost" as const, label: "Boost XP x2 (10 lutas)", cost: 20, currency: "💎" },
  ];
  return (
    <div className="flex flex-col gap-3">
      {state.unlocked.chests && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4" /> Baú Beta
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Contém equipamento aleatório do seu estágio.
          </p>
          <button
            onClick={onOpenChest}
            disabled={state.crystals < 10}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Abrir por 💎 10
          </button>
        </div>
      )}
      <div className="text-xs text-muted-foreground">Pacotes (beta, sem cobrança real)</div>
      {packs.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
        >
          <div className="text-sm">{p.label}</div>
          <button
            onClick={() => onBuy(p.id)}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            {p.currency} {p.cost}
          </button>
        </div>
      ))}
    </div>
  );
}

export function AdminScreen({
  onReset,
  onGiveCoins,
  onGiveCrystals,
  onGiveXp,
  onGiveDrop,
  onFillEnergy,
}: {
  onReset: () => void;
  onGiveCoins: () => void;
  onGiveCrystals: () => void;
  onGiveXp: () => void;
  onGiveDrop: () => void;
  onFillEnergy: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Painel interno — ajustes rápidos para testar a fase beta.
      </p>
      <AdminBtn label="+ 500 moedas" onClick={onGiveCoins} />
      <AdminBtn label="+ 50 cristais" onClick={onGiveCrystals} />
      <AdminBtn label="+ 500 XP" onClick={onGiveXp} />
      <AdminBtn label="Gerar drop de equipamento" onClick={onGiveDrop} />
      <AdminBtn label="Encher energia" onClick={onFillEnergy} />
      <AdminBtn label="Resetar progresso" onClick={onReset} destructive />
    </div>
  );
}

function AdminBtn({
  label,
  onClick,
  destructive,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-sm ${
        destructive
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-border bg-card"
      }`}
    >
      {label}
    </button>
  );
}

function Locked({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
      <Lock className="h-6 w-6" />
      <p className="text-sm">Desbloqueia no {label}</p>
    </div>
  );
}

export { rollEquipment };
