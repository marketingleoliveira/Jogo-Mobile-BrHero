import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users, Ticket, Radio, Package, ShoppingBag, ShieldAlert,
  TrendingUp, Activity, AlertTriangle, Coins,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer,
} from "recharts";

import { getPlayers, getLogs as getPlayerLogs, subscribe as subPlayers } from "@/lib/admin/mock-players";
import { getCodes, getCodeLogs, subscribeCodes, codeStatus } from "@/lib/admin/mock-codes";
import { getCampaigns, getLiveOpsLogs, subscribeLiveOps, campaignStatus } from "@/lib/admin/mock-liveops";
import { getShopItems, getShopLogs, subscribeShop, shopStatus } from "@/lib/admin/mock-shop";
import { getCatalogItems, getItemLogs, subscribeItems } from "@/lib/admin/mock-items";
import { getBalancingLogs, subscribeBalancing } from "@/lib/admin/mock-balancing";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

const CHART_CFG: ChartConfig = {
  players:  { label: "Jogadores",   color: "hsl(45 95% 55%)" },
  gold:     { label: "Ouro (M)",    color: "hsl(45 95% 55%)" },
  gems:     { label: "Cristais (K)", color: "hsl(280 85% 65%)" },
  essence:  { label: "Essência",    color: "hsl(160 70% 55%)" },
  uses:     { label: "Resgates",    color: "hsl(200 90% 60%)" },
  count:    { label: "Ações",       color: "hsl(45 95% 55%)" },
};

// ----- Consolidated audit log source -----
type FeedEntry = { date: string; source: string; action: string; target: string; reason: string };

function useAll<T>(subs: ((l: () => void) => () => void)[], getter: () => T): T {
  const subscribe = (l: () => void) => {
    const unsubs = subs.map((s) => s(l));
    return () => { unsubs.forEach((u) => u()); };
  };
  return useSyncExternalStore(subscribe, getter, getter);
}

function AdminDashboard() {
  const players    = useAll([subPlayers], getPlayers);
  const playerLogs = useAll([subPlayers], getPlayerLogs);
  const codes      = useAll([subscribeCodes], getCodes);
  const codeLogs   = useAll([subscribeCodes], getCodeLogs);
  const campaigns  = useAll([subscribeLiveOps], getCampaigns);
  const liveLogs   = useAll([subscribeLiveOps], getLiveOpsLogs);
  const shop       = useAll([subscribeShop], getShopItems);
  const shopLogs   = useAll([subscribeShop], getShopLogs);
  const items      = useAll([subscribeItems], getCatalogItems);
  const itemLogs   = useAll([subscribeItems], getItemLogs);
  const balLogs    = useAll([subscribeBalancing], getBalancingLogs);

  // ---- KPIs ----
  const totalPlayers   = players.length;
  const activePlayers  = players.filter((p) => p.status === "active").length;
  const bannedPlayers  = players.filter((p) => p.status === "banned" || p.status === "suspended").length;
  const activeCodes    = codes.filter((c) => codeStatus(c) === "active").length;
  const activeCamps    = campaigns.filter((c) => campaignStatus(c) === "active").length;
  const activeItems    = items.filter((i) => i.active).length;
  const activeOffers   = shop.filter((s) => shopStatus(s) === "active").length;

  // ---- Level distribution ----
  const levelDist = useMemo(() => {
    const buckets = [
      { range: "1-19",  min: 1,  max: 19 },
      { range: "20-39", min: 20, max: 39 },
      { range: "40-59", min: 40, max: 59 },
      { range: "60-79", min: 60, max: 79 },
      { range: "80+",   min: 80, max: Infinity },
    ];
    return buckets.map((b) => ({
      range: b.range,
      players: players.filter((p) => p.level >= b.min && p.level <= b.max).length,
    }));
  }, [players]);

  // ---- Simulated 7-day growth (deterministic from current totals) ----
  const growthSeries = useMemo(() => {
    const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return days.map((d, i) => ({
      d,
      players: Math.max(1, Math.round(totalPlayers * (0.55 + i * 0.075))),
    }));
  }, [totalPlayers]);

  // ---- Economy simulated from player totals ----
  const econ = useMemo(() => {
    const totalGold    = players.reduce((s, p) => s + p.gold, 0);
    const totalGems    = players.reduce((s, p) => s + p.gems, 0);
    const totalEssence = players.reduce((s, p) => s + p.essence, 0);
    return { totalGold, totalGems, totalEssence };
  }, [players]);

  const econSeries = useMemo(() => {
    const hours = ["00h", "04h", "08h", "12h", "16h", "20h"];
    return hours.map((h, i) => {
      const w = 0.1 + Math.sin(i / 2) * 0.05 + i * 0.03;
      return {
        h,
        gold: +(econ.totalGold * w / 1_000_000).toFixed(2),
        gems: +(econ.totalGems * w / 1000).toFixed(2),
      };
    });
  }, [econ]);

  // ---- Code usage ----
  const codeUsage = useMemo(
    () => [...codes]
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 6)
      .map((c) => ({ code: c.code, uses: c.uses })),
    [codes],
  );

  // ---- Admin activity (audit logs per day of week) ----
  const adminActivity = useMemo(() => {
    const all = [...playerLogs, ...codeLogs, ...liveLogs, ...shopLogs, ...itemLogs, ...balLogs];
    const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const counts = days.map((d) => ({ d, count: 0 }));
    // In mock, spread by weekday from log date
    all.forEach((l) => {
      const day = new Date(l.date).getDay(); // 0 dom .. 6 sab
      const idx = day === 0 ? 6 : day - 1;
      counts[idx].count += 1;
    });
    // Ensure at least small baseline for visualization
    const total = counts.reduce((s, c) => s + c.count, 0);
    if (total === 0) return counts.map((c) => ({ ...c, count: 0 }));
    return counts;
  }, [playerLogs, codeLogs, liveLogs, shopLogs, itemLogs, balLogs]);

  // ---- Alerts ----
  const alerts = useMemo(() => {
    const A: { level: "warn" | "critical" | "info"; msg: string; to: string }[] = [];
    const now = Date.now();
    const soon = 3 * 86400_000;

    campaigns.forEach((c) => {
      if (campaignStatus(c) === "active" && c.endsAt) {
        const remain = new Date(c.endsAt).getTime() - now;
        if (remain > 0 && remain < soon) {
          A.push({ level: "warn", msg: `Campanha "${c.name}" expira em ${Math.ceil(remain / 86400_000)}d`, to: "/admin/liveops" });
        }
      }
    });

    codes.forEach((c) => {
      if (c.totalLimit > 0 && c.uses / c.totalLimit > 0.8 && codeStatus(c) === "active") {
        A.push({ level: "warn", msg: `Código ${c.code} usou ${Math.round(100 * c.uses / c.totalLimit)}% do limite`, to: "/admin/codes" });
      }
    });

    const suspects = players.filter((p) => p.gems > 800 || p.gold > 400_000);
    if (suspects.length > 0) {
      A.push({ level: "info", msg: `${suspects.length} jogador(es) com recursos acima da média`, to: "/admin/players" });
    }

    if (bannedPlayers > totalPlayers * 0.25 && totalPlayers > 0) {
      A.push({ level: "critical", msg: `${bannedPlayers} de ${totalPlayers} jogadores banidos/suspensos (${Math.round(100 * bannedPlayers / totalPlayers)}%)`, to: "/admin/players" });
    }

    // Economy inflation: high gold vs gems ratio
    if (econ.totalGold > econ.totalGems * 500 && econ.totalGems > 0) {
      A.push({ level: "warn", msg: "Inflação de ouro detectada — ratio ouro/cristais muito alto", to: "/admin/balancing" });
    }

    return A;
  }, [campaigns, codes, players, bannedPlayers, totalPlayers, econ]);

  // ---- Consolidated feed ----
  const feed = useMemo<FeedEntry[]>(() => {
    const entries: FeedEntry[] = [
      ...playerLogs.map((l) => ({ date: l.date, source: "Jogadores", action: l.action, target: l.player, reason: l.reason })),
      ...codeLogs.map((l)   => ({ date: l.date, source: "Códigos",   action: l.action, target: l.code,   reason: l.reason })),
      ...liveLogs.map((l)   => ({ date: l.date, source: "LiveOps",   action: l.action, target: l.campaign, reason: l.reason })),
      ...shopLogs.map((l)   => ({ date: l.date, source: "Loja",      action: l.action, target: l.item,   reason: l.reason })),
      ...itemLogs.map((l)   => ({ date: l.date, source: "Itens",     action: l.action, target: l.item,   reason: l.reason })),
      ...balLogs.map((l)    => ({ date: l.date, source: "Balanc.",   action: "update", target: String(l.section), reason: l.reason })),
    ];
    return entries.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 25);
  }, [playerLogs, codeLogs, liveLogs, shopLogs, itemLogs, balLogs]);

  const kpis = [
    { label: "Jogadores",         value: String(totalPlayers),  icon: Users,       to: "/admin/players", hint: `${activePlayers} ativos` },
    { label: "Banidos/Suspensos", value: String(bannedPlayers), icon: ShieldAlert, to: "/admin/players", hint: totalPlayers ? `${Math.round(100 * bannedPlayers / totalPlayers)}% do total` : "—" },
    { label: "Códigos ativos",    value: String(activeCodes),   icon: Ticket,      to: "/admin/codes",   hint: `${codes.length} totais` },
    { label: "Campanhas ativas",  value: String(activeCamps),   icon: Radio,       to: "/admin/liveops", hint: `${campaigns.length} totais` },
    { label: "Itens ativos",      value: String(activeItems),   icon: Package,     to: "/admin/items",   hint: `${items.length} no catálogo` },
    { label: "Ofertas ativas",    value: String(activeOffers),  icon: ShoppingBag, to: "/admin/shop",    hint: `${shop.length} totais` },
    { label: "Ouro em circ.",     value: fmt(econ.totalGold),   icon: Coins,       to: "/admin/economy", hint: "somatório mocks" },
    { label: "Ações recentes",    value: String(feed.length),   icon: Activity,    to: "/admin/logs",    hint: "audit consolidado" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="block">
            <Card className="border-slate-200 bg-white text-slate-900 transition hover:border-amber-500/40 hover:bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {k.label}
                </CardTitle>
                <k.icon className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black tracking-tight">{k.value}</div>
                <div className="mt-1 text-[11px] text-slate-500">{k.hint}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Alertas ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i) => {
              const cls =
                a.level === "critical" ? "border-rose-500/40 bg-rose-500/10 text-rose-200" :
                a.level === "warn"     ? "border-amber-500/40 bg-amber-500/10 text-amber-200" :
                                         "border-blue-500/40 bg-blue-500/10 text-blue-200";
              return (
                <div key={i} className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${cls}`}>
                  <span>{a.msg}</span>
                  <Link to={a.to}>
                    <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-white/10">
                      Ver →
                    </Button>
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <TrendingUp className="h-4 w-4 text-amber-400" /> Crescimento de jogadores (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CHART_CFG} className="h-64 w-full">
              <ResponsiveContainer>
                <AreaChart data={growthSeries}>
                  <defs>
                    <linearGradient id="gPlayers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(45 95% 55%)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(45 95% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
                  <XAxis dataKey="d" stroke="hsl(220 10% 60%)" fontSize={11} />
                  <YAxis stroke="hsl(220 10% 60%)" fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="players" stroke="hsl(45 95% 55%)" fill="url(#gPlayers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Distribuição por nível</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CHART_CFG} className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={levelDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
                  <XAxis dataKey="range" stroke="hsl(220 10% 60%)" fontSize={11} />
                  <YAxis stroke="hsl(220 10% 60%)" fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="players" fill="hsl(45 95% 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 bg-white text-slate-900 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Coins className="h-4 w-4 text-amber-400" /> Economia (24h) — ouro/cristais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CHART_CFG} className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={econSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
                  <XAxis dataKey="h" stroke="hsl(220 10% 60%)" fontSize={11} />
                  <YAxis stroke="hsl(220 10% 60%)" fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="gold" fill="hsl(45 95% 55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gems" fill="hsl(280 85% 65%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Uso de códigos</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CHART_CFG} className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={codeUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
                  <XAxis type="number" stroke="hsl(220 10% 60%)" fontSize={11} />
                  <YAxis type="category" dataKey="code" stroke="hsl(220 10% 60%)" fontSize={11} width={90} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="uses" fill="hsl(200 90% 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Admin activity + Feed */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Atividade administrativa</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CHART_CFG} className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={adminActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
                  <XAxis dataKey="d" stroke="hsl(220 10% 60%)" fontSize={11} />
                  <YAxis stroke="hsl(220 10% 60%)" fontSize={11} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(160 70% 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">Feed de auditoria consolidado</CardTitle>
            <Link to="/admin/logs">
              <Button size="sm" variant="outline" className="h-7 border-slate-300 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto">
            {feed.length === 0 ? (
              <p className="text-sm text-slate-500">Sem atividade registrada ainda.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {feed.map((e, i) => (
                  <li key={i} className="rounded border border-slate-200 bg-slate-50 p-2">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-mono">{new Date(e.date).toLocaleString("pt-BR")}</span>
                      <Badge variant="outline" className="border-slate-300 bg-slate-800/60 text-[10px] uppercase tracking-widest text-slate-300">
                        {e.source}
                      </Badge>
                    </div>
                    <div className="mt-1 text-slate-200">
                      <span className="font-bold uppercase">{e.action}</span> — {e.target}
                    </div>
                    {e.reason && <div className="text-slate-600">Motivo: {e.reason}</div>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
