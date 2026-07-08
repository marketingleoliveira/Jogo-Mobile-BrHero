import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Sliders, RotateCcw, Play, Save } from "lucide-react";
import {
  balancingActions, getBalancing, getBalancingLogs, subscribeBalancing,
  simulate, curveValue, costValue,
  type BalancingConfig, type CurveConfig, type CostConfig, type RebirthRewards,
  type SimulatorInput,
} from "@/lib/admin/mock-balancing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/balancing")({ component: BalancingPage });

function useConfig() { return useSyncExternalStore(subscribeBalancing, getBalancing, getBalancing); }
function useLogs()   { return useSyncExternalStore(subscribeBalancing, getBalancingLogs, getBalancingLogs); }

type CurveKey = "xpCurve" | "goldCurve" | "enemyScale" | "bossScale" | "towerScale" | "arenaScale" | "dungeonScale";
type CostKey  = "upgradeCost" | "petCost" | "runeCost";

const CURVE_SECTIONS: { key: CurveKey; label: string }[] = [
  { key: "xpCurve",      label: "Curva de XP" },
  { key: "goldCurve",    label: "Curva de Ouro" },
  { key: "enemyScale",   label: "Escala de Inimigos" },
  { key: "bossScale",    label: "Escala de Chefes" },
  { key: "towerScale",   label: "Escala da Torre" },
  { key: "arenaScale",   label: "Escala da Arena" },
  { key: "dungeonScale", label: "Escala das Masmorras" },
];
const COST_SECTIONS: { key: CostKey; label: string }[] = [
  { key: "upgradeCost", label: "Custo de Upgrades" },
  { key: "petCost",     label: "Custo de Pets" },
  { key: "runeCost",    label: "Custo de Runas" },
];

const fmt = (n: number) =>
  n >= 1e9 ? (n / 1e9).toFixed(2) + "B" :
  n >= 1e6 ? (n / 1e6).toFixed(2) + "M" :
  n >= 1e3 ? (n / 1e3).toFixed(2) + "K" :
  n.toFixed(0);

const fmtMs = (ms: number) =>
  ms < 1000 ? `${ms.toFixed(0)}ms` :
  ms < 60_000 ? `${(ms / 1000).toFixed(1)}s` :
  `${Math.floor(ms / 60_000)}m ${((ms % 60_000) / 1000).toFixed(0)}s`;

function BalancingPage() {
  const config = useConfig();
  const logs = useLogs();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetReason, setResetReason] = useState("");

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 text-slate-100">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Balanceamento</h2>
              <p className="text-sm text-slate-400">
                Curvas, custos, rebirth e simulador. Mock local — não afeta o jogo.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setResetOpen(true)}
            className="border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
            <RotateCcw className="mr-1 h-4 w-4" /> Reset global
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {CURVE_SECTIONS.map((s) => (
          <CurveCard key={s.key} title={s.label} section={s.key} value={config[s.key]} />
        ))}
        {COST_SECTIONS.map((s) => (
          <CostCard key={s.key} title={s.label} section={s.key} value={config[s.key]} />
        ))}
        <RebirthCard value={config.rebirth} />
      </div>

      <Simulator config={config} />

      <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Audit Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent className="max-h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma alteração registrada ainda.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {logs.map((l) => (
                <li key={l.id} className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-mono">{new Date(l.date).toLocaleString("pt-BR")}</span>
                    <span className="text-amber-300">{l.admin}</span>
                  </div>
                  <div className="mt-1 text-slate-200">
                    <span className="font-bold uppercase">{l.section}</span>
                  </div>
                  <div className="text-slate-400">Motivo: {l.reason}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={resetOpen} onOpenChange={(o) => { if (!o) { setResetOpen(false); setResetReason(""); } }}>
        <AlertDialogContent className="border-slate-800 bg-slate-900 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar padrões?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Todas as curvas e custos voltarão ao padrão. Ação registrada em log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-slate-300">Motivo (obrigatório)</Label>
            <Textarea value={resetReason} onChange={(e) => setResetReason(e.target.value)}
              className="border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                try {
                  balancingActions.resetAll(resetReason);
                  toast.success("Balanceamento restaurado");
                  setResetOpen(false); setResetReason("");
                } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
              }}
              className="bg-rose-500 text-slate-50 hover:bg-rose-400">
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CurveCard({ title, section, value }: { title: string; section: CurveKey; value: CurveConfig }) {
  const [form, setForm] = useState<CurveConfig>(value);
  const [reason, setReason] = useState("");
  const dirty = form.base !== value.base || form.growth !== value.growth || form.exponent !== value.exponent;

  const preview = [1, 10, 25, 50, 100].map((l) => ({ l, v: curveValue(form, l) }));

  const submit = () => {
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    try {
      balancingActions.updateSection(section, form, reason);
      toast.success(`${title} salvo`);
      setReason("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[11px] text-slate-400">Base</Label>
            <Input type="number" value={form.base}
              onChange={(e) => setForm({ ...form, base: Number(e.target.value) || 0 })}
              className="h-8 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Growth</Label>
            <Input type="number" step={0.01} value={form.growth}
              onChange={(e) => setForm({ ...form, growth: Number(e.target.value) || 1 })}
              className="h-8 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Exp.</Label>
            <Input type="number" step={0.01} value={form.exponent}
              onChange={(e) => setForm({ ...form, exponent: Number(e.target.value) || 1 })}
              className="h-8 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 rounded border border-slate-800 bg-slate-950/40 p-2 text-center text-[10px]">
          {preview.map((p) => (
            <div key={p.l}>
              <div className="text-slate-500">lvl {p.l}</div>
              <div className="font-mono font-bold text-slate-100">{fmt(p.v)}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo da alteração"
            className="h-8 flex-1 border-slate-700 bg-slate-950 text-xs text-slate-100" />
          <Button size="sm" disabled={!dirty} onClick={submit}
            className="h-8 bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40">
            <Save className="mr-1 h-3.5 w-3.5" /> Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CostCard({ title, section, value }: { title: string; section: CostKey; value: CostConfig }) {
  const [form, setForm] = useState<CostConfig>(value);
  const [reason, setReason] = useState("");
  const dirty = form.base !== value.base || form.growth !== value.growth;

  const preview = [1, 10, 25, 50, 100].map((l) => ({ l, v: costValue(form, l) }));

  const submit = () => {
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    try {
      balancingActions.updateSection(section, form, reason);
      toast.success(`${title} salvo`);
      setReason("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-slate-400">Base</Label>
            <Input type="number" value={form.base}
              onChange={(e) => setForm({ ...form, base: Number(e.target.value) || 0 })}
              className="h-8 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Growth</Label>
            <Input type="number" step={0.01} value={form.growth}
              onChange={(e) => setForm({ ...form, growth: Number(e.target.value) || 1 })}
              className="h-8 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 rounded border border-slate-800 bg-slate-950/40 p-2 text-center text-[10px]">
          {preview.map((p) => (
            <div key={p.l}>
              <div className="text-slate-500">lvl {p.l}</div>
              <div className="font-mono font-bold text-slate-100">{fmt(p.v)}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo da alteração"
            className="h-8 flex-1 border-slate-700 bg-slate-950 text-xs text-slate-100" />
          <Button size="sm" disabled={!dirty} onClick={submit}
            className="h-8 bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40">
            <Save className="mr-1 h-3.5 w-3.5" /> Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RebirthCard({ value }: { value: RebirthRewards }) {
  const [form, setForm] = useState<RebirthRewards>(value);
  const [reason, setReason] = useState("");
  const dirty =
    form.essencePerRebirth !== value.essencePerRebirth ||
    form.goldMultiplier    !== value.goldMultiplier ||
    form.xpMultiplier      !== value.xpMultiplier;

  const submit = () => {
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    try {
      balancingActions.updateSection("rebirth", form, reason);
      toast.success("Recompensas de Rebirth salvas");
      setReason("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60 text-slate-100 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">Recompensas de Rebirth</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[11px] text-slate-400">Essência por Rebirth</Label>
            <Input type="number" value={form.essencePerRebirth}
              onChange={(e) => setForm({ ...form, essencePerRebirth: Number(e.target.value) || 0 })}
              className="h-8 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Mult. Ouro</Label>
            <Input type="number" step={0.05} value={form.goldMultiplier}
              onChange={(e) => setForm({ ...form, goldMultiplier: Number(e.target.value) || 1 })}
              className="h-8 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Mult. XP</Label>
            <Input type="number" step={0.05} value={form.xpMultiplier}
              onChange={(e) => setForm({ ...form, xpMultiplier: Number(e.target.value) || 1 })}
              className="h-8 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo da alteração"
            className="h-8 flex-1 border-slate-700 bg-slate-950 text-xs text-slate-100" />
          <Button size="sm" disabled={!dirty} onClick={submit}
            className="h-8 bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40">
            <Save className="mr-1 h-3.5 w-3.5" /> Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Simulator({ config }: { config: BalancingConfig }) {
  const [input, setInput] = useState<SimulatorInput>({
    level: 50, stage: 50, rebirth: 0, pet: 5, runes: 3, guild: 10, blessings: 15,
  });

  const result = useMemo(() => simulate(config, input), [config, input]);

  const set = <K extends keyof SimulatorInput>(k: K, v: number) =>
    setInput((s) => ({ ...s, [k]: v }));

  const diffColor = {
    "Fácil":       "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    "Normal":      "border-blue-500/40 bg-blue-500/15 text-blue-300",
    "Difícil":     "border-amber-500/40 bg-amber-500/15 text-amber-300",
    "Impossível":  "border-rose-500/40 bg-rose-500/15 text-rose-300",
  }[result.difficulty];

  const fields: { k: keyof SimulatorInput; label: string; min?: number; max?: number }[] = [
    { k: "level",     label: "Level" },
    { k: "stage",     label: "Stage" },
    { k: "rebirth",   label: "Rebirth" },
    { k: "pet",       label: "Pet lvl" },
    { k: "runes",     label: "Runas lvl" },
    { k: "guild",     label: "Guilda %", max: 100 },
    { k: "blessings", label: "Bênçãos %", max: 100 },
  ];

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900/80 to-slate-900/40 text-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-300">
          <Play className="h-4 w-4" /> Simulador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {fields.map((f) => (
            <div key={f.k}>
              <Label className="text-[11px] text-slate-400">{f.label}</Label>
              <Input type="number" min={f.min ?? 0} max={f.max}
                value={input[f.k]}
                onChange={(e) => set(f.k, Number(e.target.value) || 0)}
                className="h-8 border-slate-700 bg-slate-950 text-slate-100" />
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="Hero Power" value={fmt(result.heroPower)} />
          <Kpi label="Kill inimigo" value={fmtMs(result.killEnemyMs)} />
          <Kpi label="Kill chefe" value={fmtMs(result.killBossMs)} />
          <Kpi label="Ouro/hora" value={fmt(result.goldPerHour)} />
          <Kpi label="XP/hora" value={fmt(result.xpPerHour)} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Dificuldade</div>
            <div className="mt-1 flex items-center justify-between">
              <Badge variant="outline" className={diffColor}>{result.difficulty}</Badge>
              <span className="font-mono text-xs text-slate-400">
                ratio {result.ratio.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-lg font-black text-slate-100">{value}</div>
    </div>
  );
}
