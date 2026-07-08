import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Coins,
  Gem,
  Zap,
  Swords,
  User,
  Shield,
  ChevronUp,
  Target,
  Trophy,
  ShoppingBag,
  Settings,
  Home,
} from "lucide-react";
import {
  loadGame,
  saveGame,
  resetGame,
  simulateBattle,
  applyBattleResult,
  rollEquipment,
  upgradeCost,
  ENERGY_REGEN_MS,
  type GameState,
  type BattleResult,
} from "@/lib/game/engine";
import {
  BattleScreen,
  CharacterScreen,
  EquipmentScreen,
  UpgradesScreen,
  MissionsScreen,
  AchievementsScreen,
  ShopScreen,
  AdminScreen,
} from "@/components/game/screens";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Hero Rise — RPG Beta" },
      {
        name: "description",
        content:
          "Hero Rise: RPG mobile de progressão rápida. Evolua seu herói, vença chefes e desbloqueie novas funções.",
      },
      { property: "og:title", content: "Hero Rise — RPG Beta" },
      {
        property: "og:description",
        content:
          "RPG mobile viciante com progressão rápida, equipamentos, missões e chefes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
    ],
  }),
  component: GamePage,
});

type Tab =
  | "battle"
  | "character"
  | "equipment"
  | "upgrades"
  | "missions"
  | "achievements"
  | "shop"
  | "admin";

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "battle", label: "Batalha", icon: <Swords className="h-4 w-4" /> },
  { id: "character", label: "Herói", icon: <User className="h-4 w-4" /> },
  { id: "equipment", label: "Itens", icon: <Shield className="h-4 w-4" /> },
  { id: "upgrades", label: "Melhorar", icon: <ChevronUp className="h-4 w-4" /> },
  { id: "missions", label: "Missões", icon: <Target className="h-4 w-4" /> },
  { id: "achievements", label: "Conq.", icon: <Trophy className="h-4 w-4" /> },
  { id: "shop", label: "Loja", icon: <ShoppingBag className="h-4 w-4" /> },
  { id: "admin", label: "Admin", icon: <Settings className="h-4 w-4" /> },
];

function GamePage() {
  const [state, setState] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>("battle");
  const [fighting, setFighting] = useState(false);
  const [battle, setBattle] = useState<BattleResult | null>(null);
  const [fastMode, setFastMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const prevUnlockRef = useRef<GameState["unlocked"] | null>(null);

  // Load save
  useEffect(() => {
    setState(loadGame());
  }, []);

  // Persist
  useEffect(() => {
    if (state) saveGame(state);
  }, [state]);

  // Energy regen
  useEffect(() => {
    if (!state) return;
    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev) return prev;
        if (prev.energy >= prev.maxEnergy) return prev;
        const now = Date.now();
        const elapsed = now - prev.lastEnergyTick;
        const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
        if (gained <= 0) return prev;
        return {
          ...prev,
          energy: Math.min(prev.maxEnergy, prev.energy + gained),
          lastEnergyTick: now,
        };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [state]);

  // Unlock notifications
  useEffect(() => {
    if (!state) return;
    const prev = prevUnlockRef.current;
    if (prev) {
      const labels: Record<keyof GameState["unlocked"], string> = {
        equipment: "🎽 Equipamentos desbloqueados!",
        upgrades: "⬆️ Melhorias desbloqueadas!",
        missions: "🎯 Missões diárias desbloqueadas!",
        chests: "📦 Baús desbloqueados!",
        arena: "🏟️ Arena offline desbloqueada!",
        clan: "🛡️ Clãs desbloqueados!",
        multiplayer: "🌐 Multiplayer beta desbloqueado!",
      };
      for (const key of Object.keys(state.unlocked) as Array<keyof GameState["unlocked"]>) {
        if (state.unlocked[key] && !prev[key]) {
          setToast(labels[key]);
          setTimeout(() => setToast(null), 3500);
          break;
        }
      }
    }
    prevUnlockRef.current = state.unlocked;
  }, [state]);

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const doFight = () => {
    if (!state || state.energy < 1 || fighting) return;
    setFighting(true);
    setBattle(null);
    const spent: GameState = { ...state, energy: state.energy - 1 };
    setState(spent);
    const result = simulateBattle(spent);
    const delay = fastMode ? 400 : 1200;
    setTimeout(() => {
      setState((prev) => (prev ? applyBattleResult(prev, result) : prev));
      setBattle(result);
      setFighting(false);
    }, delay);
  };

  const toggleEquip = (id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const item = prev.inventory.find((i) => i.id === id);
      if (!item) return prev;
      const inv = prev.inventory.map((i) => {
        if (i.id === id) return { ...i, equipped: !i.equipped };
        // one per slot
        if (!item.equipped && i.slot === item.slot && i.equipped) return { ...i, equipped: false };
        return i;
      });
      return { ...prev, inventory: inv };
    });
  };

  const sellItem = (id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const item = prev.inventory.find((i) => i.id === id);
      if (!item) return prev;
      const gain = { common: 15, uncommon: 40, rare: 100, epic: 250 }[item.rarity];
      flashToast(`+${gain} 🪙`);
      return {
        ...prev,
        coins: prev.coins + gain,
        inventory: prev.inventory.filter((i) => i.id !== id),
      };
    });
  };

  const upgradeStat = (stat: "atk" | "def" | "hp" | "speed" | "crit") => {
    setState((prev) => {
      if (!prev) return prev;
      const cost = upgradeCost(stat, prev.hero);
      if (prev.coins < cost) return prev;
      const hero = { ...prev.hero };
      if (stat === "atk") hero.baseAtk += 2;
      if (stat === "def") hero.baseDef += 1;
      if (stat === "hp") hero.baseHp += 8;
      if (stat === "speed") hero.speed += 1;
      if (stat === "crit") hero.crit += 1;
      return { ...prev, hero, coins: prev.coins - cost };
    });
  };

  const claimMission = (id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const m = prev.missions.find((x) => x.id === id);
      if (!m || m.claimed || m.progress < m.goal) return prev;
      return {
        ...prev,
        coins: prev.coins + m.reward.coins,
        crystals: prev.crystals + m.reward.crystals,
        hero: { ...prev.hero, xp: prev.hero.xp + m.reward.xp },
        missions: prev.missions.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
      };
    });
  };

  const claimAchievement = (id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const a = prev.achievements.find((x) => x.id === id);
      if (!a || a.claimed || a.progress < a.goal) return prev;
      return {
        ...prev,
        coins: prev.coins + a.reward.coins,
        crystals: prev.crystals + a.reward.crystals,
        achievements: prev.achievements.map((x) =>
          x.id === id ? { ...x, claimed: true } : x,
        ),
      };
    });
  };

  const buyPack = (pack: "energy" | "crystals_small" | "crystals_big" | "boost") => {
    setState((prev) => {
      if (!prev) return prev;
      if (pack === "energy") {
        if (prev.crystals < 5) return prev;
        flashToast("+10 ⚡");
        return { ...prev, crystals: prev.crystals - 5, energy: prev.energy + 10 };
      }
      if (pack === "crystals_small") {
        if (prev.coins < 300) return prev;
        flashToast("+30 💎");
        return { ...prev, coins: prev.coins - 300, crystals: prev.crystals + 30 };
      }
      if (pack === "crystals_big") {
        if (prev.coins < 900) return prev;
        flashToast("+100 💎");
        return { ...prev, coins: prev.coins - 900, crystals: prev.crystals + 100 };
      }
      if (pack === "boost") {
        if (prev.crystals < 20) return prev;
        flashToast("Boost XP (visual)");
        return { ...prev, crystals: prev.crystals - 20 };
      }
      return prev;
    });
  };

  const openChest = () => {
    setState((prev) => {
      if (!prev || prev.crystals < 10) return prev;
      const drop = rollEquipment(prev.stage);
      flashToast(`📦 ${drop.name}`);
      return {
        ...prev,
        crystals: prev.crystals - 10,
        inventory: [...prev.inventory, drop],
        stats: { ...prev.stats, chestsOpened: prev.stats.chestsOpened + 1 },
      };
    });
  };

  const currentTab = useMemo(() => {
    if (!state) return null;
    switch (tab) {
      case "battle":
        return (
          <BattleScreen
            state={state}
            onFight={doFight}
            battle={battle}
            fighting={fighting}
            fastMode={fastMode}
            setFastMode={setFastMode}
          />
        );
      case "character":
        return <CharacterScreen state={state} />;
      case "equipment":
        return <EquipmentScreen state={state} onToggle={toggleEquip} onSell={sellItem} />;
      case "upgrades":
        return <UpgradesScreen state={state} onUpgrade={upgradeStat} />;
      case "missions":
        return <MissionsScreen state={state} onClaim={claimMission} />;
      case "achievements":
        return <AchievementsScreen state={state} onClaim={claimAchievement} />;
      case "shop":
        return <ShopScreen state={state} onBuy={buyPack} onOpenChest={openChest} />;
      case "admin":
        return (
          <AdminScreen
            onReset={() => {
              const s = resetGame();
              setState(s);
              setBattle(null);
              flashToast("Progresso resetado");
            }}
            onGiveCoins={() => setState((p) => (p ? { ...p, coins: p.coins + 500 } : p))}
            onGiveCrystals={() =>
              setState((p) => (p ? { ...p, crystals: p.crystals + 50 } : p))
            }
            onGiveXp={() =>
              setState((p) => {
                if (!p) return p;
                const next = { ...p, hero: { ...p.hero, xp: p.hero.xp + 500 } };
                // apply level-ups via a fake battle result
                const res: BattleResult = { win: false, log: [], rewards: { xp: 0, coins: 0, crystals: 0 } };
                return applyBattleResult(next, res);
              })
            }
            onGiveDrop={() =>
              setState((p) =>
                p ? { ...p, inventory: [...p.inventory, rollEquipment(p.stage)] } : p,
              )
            }
            onFillEnergy={() =>
              setState((p) => (p ? { ...p, energy: p.maxEnergy } : p))
            }
          />
        );
    }
  }, [tab, state, battle, fighting, fastMode]);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Carregando…
      </div>
    );
  }

  const visibleTabs = TABS.filter((t) => {
    if (t.id === "equipment") return state.unlocked.equipment;
    if (t.id === "upgrades") return state.unlocked.upgrades;
    if (t.id === "missions") return state.unlocked.missions;
    return true;
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background text-foreground">
      {/* Top HUD */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            Hero Rise
          </Link>
          <div className="flex items-center gap-1 text-xs">
            <span className="rounded-md bg-secondary px-1.5 py-0.5">
              Nv {state.hero.level}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 pb-3 text-xs">
          <HudPill icon={<Coins className="h-3.5 w-3.5 text-amber-500" />} value={state.coins} />
          <HudPill icon={<Gem className="h-3.5 w-3.5 text-fuchsia-500" />} value={state.crystals} />
          <HudPill
            icon={<Zap className="h-3.5 w-3.5 text-sky-500" />}
            value={`${state.energy}/${state.maxEnergy}`}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">{currentTab}</main>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center px-4">
          <div className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {/* Bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-border bg-card/95 backdrop-blur">
        <div className="flex overflow-x-auto">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 min-w-[64px] flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] ${
                tab === t.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function HudPill({ icon, value }: { icon: React.ReactNode; value: string | number }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1">
      {icon}
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
