import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Users, Coins, Gem, Swords, TrendingUp, TrendingDown, Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

// ===== Mock data =====
const KPIS = [
  { key: "dau",     label: "DAU",             value: "1.284", delta: "+8,4%", up: true,  icon: Users,  hint: "vs. ontem" },
  { key: "gold",    label: "Ouro em circ.",   value: "82,4M", delta: "+2,1%", up: true,  icon: Coins,  hint: "últimas 24h" },
  { key: "gems",    label: "Cristais",        value: "412K",  delta: "-1,2%", up: false, icon: Gem,    hint: "queimados hoje" },
  { key: "battles", label: "Batalhas/min",    value: "9.712", delta: "+12,7%",up: true,  icon: Swords, hint: "média 1h" },
];

const DAU_SERIES = [
  { d: "Seg", dau: 812, ret: 610 },
  { d: "Ter", dau: 934, ret: 702 },
  { d: "Qua", dau: 1021, ret: 780 },
  { d: "Qui", dau: 987, ret: 745 },
  { d: "Sex", dau: 1150, ret: 860 },
  { d: "Sáb", dau: 1284, ret: 940 },
  { d: "Dom", dau: 1240, ret: 905 },
];

const ECON_SERIES = [
  { h: "00h", ouro: 3.2, cristais: 0.4 },
  { h: "04h", ouro: 2.1, cristais: 0.2 },
  { h: "08h", ouro: 4.4, cristais: 0.6 },
  { h: "12h", ouro: 6.7, cristais: 1.1 },
  { h: "16h", ouro: 8.9, cristais: 1.4 },
  { h: "20h", ouro: 7.8, cristais: 1.2 },
];

const LOGS = [
  { t: "12:41", who: "system",   act: "Rebirth executado", who2: "player#2381", tag: "info" },
  { t: "12:39", who: "gm.root",  act: "Código BETA100 concedido", who2: "player#1907", tag: "reward" },
  { t: "12:36", who: "system",   act: "Compra loja evento (baú)", who2: "player#5510", tag: "econ" },
  { t: "12:32", who: "gm.root",  act: "Ajuste balanceamento torre +5%", who2: "global", tag: "balance" },
  { t: "12:28", who: "system",   act: "Nova skin desbloqueada", who2: "player#0921", tag: "cosmetic" },
];

const CHART_CFG: ChartConfig = {
  dau:      { label: "DAU",       color: "hsl(45 95% 55%)" },
  ret:      { label: "Retenção",  color: "hsl(200 90% 60%)" },
  ouro:     { label: "Ouro (M)",  color: "hsl(45 95% 55%)" },
  cristais: { label: "Cristais (M)", color: "hsl(280 85% 65%)" },
};

function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.key} className="border-slate-800 bg-slate-900/60 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {k.label}
              </CardTitle>
              <k.icon className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{k.value}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                {k.up ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-rose-400" />
                )}
                <span className={k.up ? "text-emerald-400" : "text-rose-400"}>{k.delta}</span>
                <span className="text-slate-500">· {k.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Activity className="h-4 w-4 text-amber-400" />
              DAU & Retenção (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CHART_CFG} className="h-64 w-full">
              <ResponsiveContainer>
                <AreaChart data={DAU_SERIES}>
                  <defs>
                    <linearGradient id="gDau" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(45 95% 55%)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(45 95% 55%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(200 90% 60%)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(200 90% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
                  <XAxis dataKey="d" stroke="hsl(220 10% 60%)" fontSize={11} />
                  <YAxis stroke="hsl(220 10% 60%)" fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="dau" stroke="hsl(45 95% 55%)" fill="url(#gDau)" strokeWidth={2} />
                  <Area type="monotone" dataKey="ret" stroke="hsl(200 90% 60%)" fill="url(#gRet)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Coins className="h-4 w-4 text-amber-400" />
              Economia (24h) — em milhões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CHART_CFG} className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={ECON_SERIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
                  <XAxis dataKey="h" stroke="hsl(220 10% 60%)" fontSize={11} />
                  <YAxis stroke="hsl(220 10% 60%)" fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ouro" fill="hsl(45 95% 55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cristais" fill="hsl(280 85% 65%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Logs table */}
      <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-100">Atividade recente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Hora</TableHead>
                <TableHead className="text-slate-400">Autor</TableHead>
                <TableHead className="text-slate-400">Ação</TableHead>
                <TableHead className="text-slate-400">Alvo</TableHead>
                <TableHead className="text-slate-400">Tag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LOGS.map((l, i) => (
                <TableRow key={i} className="border-slate-800 hover:bg-slate-800/40">
                  <TableCell className="font-mono text-xs text-slate-400">{l.t}</TableCell>
                  <TableCell className="text-sm">{l.who}</TableCell>
                  <TableCell className="text-sm">{l.act}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{l.who2}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-700 bg-slate-800/60 text-[10px] uppercase tracking-widest text-slate-300">
                      {l.tag}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
