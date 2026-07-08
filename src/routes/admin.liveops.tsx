import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Radio, Plus, Pencil, Power, Trash2, Megaphone, Wrench, Zap, Coins, TrendingUp, Package,
} from "lucide-react";
import {
  liveOpsActions, campaignStatus, getCampaigns, getLiveOpsLogs, subscribeLiveOps,
  CAMPAIGN_TYPE_LABEL, CAMPAIGN_TYPES, usesMultiplier,
  type CampaignInput, type CampaignType, type LiveOpsCampaign,
} from "@/lib/admin/mock-liveops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/liveops")({ component: LiveOpsPage });

const statusBadge = {
  active:    { label: "Ativa",    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  scheduled: { label: "Agendada", className: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  expired:   { label: "Expirada", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  inactive:  { label: "Inativa",  className: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
} as const;

const TYPE_ICON: Record<CampaignType, typeof Zap> = {
  double_xp: TrendingUp,
  double_gold: Coins,
  double_drop: Package,
  flash_event: Zap,
  global_message: Megaphone,
  maintenance: Wrench,
};

function useCampaigns() { return useSyncExternalStore(subscribeLiveOps, getCampaigns, getCampaigns); }
function useLogs()      { return useSyncExternalStore(subscribeLiveOps, getLiveOpsLogs, getLiveOpsLogs); }

type Pending =
  | { kind: "toggle"; c: LiveOpsCampaign }
  | { kind: "delete"; c: LiveOpsCampaign };

const emptyInput = (): CampaignInput => ({
  name: "",
  type: "double_xp",
  startsAt: null,
  endsAt: null,
  multiplier: 2,
  message: "",
  active: true,
  priority: 3,
});

function LiveOpsPage() {
  const campaigns = useCampaigns();
  const logs = useLogs();
  const [editing, setEditing] = useState<LiveOpsCampaign | "new" | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");

  const active = useMemo(
    () => campaigns.filter((c) => campaignStatus(c) === "active")
                   .sort((a, b) => a.priority - b.priority),
    [campaigns],
  );

  const confirmDestructive = () => {
    if (!pending) return;
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    if (pending.kind === "toggle") {
      liveOpsActions.toggle(pending.c.id, reason.trim());
      toast.success(pending.c.active ? "Campanha desativada" : "Campanha ativada");
    } else {
      liveOpsActions.remove(pending.c.id, reason.trim());
      toast.success("Campanha excluída");
    }
    setPending(null);
    setReason("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 text-slate-100">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">LiveOps</h2>
              <p className="text-sm text-slate-400">
                Campanhas ativas, mensagens globais e manutenção. Mock local.
              </p>
            </div>
          </div>
          <Button onClick={() => setEditing("new")} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
            <Plus className="mr-1 h-4 w-4" /> Nova campanha
          </Button>
        </CardContent>
      </Card>

      {/* Active banners */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.map((c) => {
            const Icon = TYPE_ICON[c.type];
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-3 text-emerald-100"
              >
                <div className="grid h-9 w-9 place-items-center rounded-md bg-emerald-500/20 text-emerald-300">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">
                    {c.name}
                    {usesMultiplier(c.type) && (
                      <span className="ml-2 text-emerald-300">×{c.multiplier}</span>
                    )}
                  </div>
                  {c.message && <div className="text-xs text-emerald-200/80">{c.message}</div>}
                </div>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] uppercase tracking-widest text-emerald-300">
                  P{c.priority}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Campanhas ({campaigns.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">Nome</TableHead>
                <TableHead className="text-slate-400">Tipo</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Início</TableHead>
                <TableHead className="text-slate-400">Fim</TableHead>
                <TableHead className="text-slate-400">Mult.</TableHead>
                <TableHead className="text-slate-400">Prio.</TableHead>
                <TableHead className="text-right text-slate-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const st = campaignStatus(c);
                const b = statusBadge[st];
                return (
                  <TableRow key={c.id} className="border-slate-800 hover:bg-slate-800/40">
                    <TableCell className="font-semibold">{c.name}</TableCell>
                    <TableCell className="text-slate-300">{CAMPAIGN_TYPE_LABEL[c.type]}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={b.className}>{b.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {c.startsAt ? new Date(c.startsAt).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {c.endsAt ? new Date(c.endsAt).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {usesMultiplier(c.type) ? `×${c.multiplier}` : "—"}
                    </TableCell>
                    <TableCell className="text-slate-300">P{c.priority}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:bg-slate-800" onClick={() => setEditing(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:bg-slate-800" onClick={() => { setPending({ kind: "toggle", c }); setReason(""); }}>
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-300 hover:bg-rose-500/10" onClick={() => { setPending({ kind: "delete", c }); setReason(""); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhuma campanha cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit logs */}
      <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Audit Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent className="max-h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma ação registrada ainda.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {logs.map((l) => (
                <li key={l.id} className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-mono">{new Date(l.date).toLocaleString("pt-BR")}</span>
                    <span className="text-amber-300">{l.admin}</span>
                  </div>
                  <div className="mt-1 text-slate-200">
                    <span className="font-bold uppercase">{l.action}</span> — {l.campaign}
                  </div>
                  <div className="text-slate-400">Motivo: {l.reason}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditorDialog
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) { setPending(null); setReason(""); } }}>
        <AlertDialogContent className="border-slate-800 bg-slate-900 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "toggle"
                ? (pending.c.active ? "Desativar campanha?" : "Ativar campanha?")
                : "Excluir campanha?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação será registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-slate-300">Motivo (obrigatório)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo"
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDestructive} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditorDialog({
  initial,
  onClose,
}: {
  initial: LiveOpsCampaign | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CampaignInput>(() =>
    initial
      ? {
          name: initial.name, type: initial.type,
          startsAt: initial.startsAt, endsAt: initial.endsAt,
          multiplier: initial.multiplier, message: initial.message,
          active: initial.active, priority: initial.priority,
        }
      : emptyInput(),
  );
  const [reason, setReason] = useState("");

  const submit = () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    try {
      if (initial) {
        liveOpsActions.update(initial.id, form, reason.trim());
        toast.success("Campanha atualizada");
      } else {
        liveOpsActions.create(form, reason.trim());
        toast.success("Campanha criada");
      }
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  const toLocalInput = (iso: string | null) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : "";
  const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl border-slate-800 bg-slate-900 text-slate-100">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar campanha" : "Nova campanha"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Toda alteração registra motivo em audit log.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label className="text-slate-300">Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>

          <div>
            <Label className="text-slate-300">Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CampaignType })}>
              <SelectTrigger className="border-slate-700 bg-slate-950 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                {CAMPAIGN_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{CAMPAIGN_TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Prioridade (1 alta – 5 baixa)</Label>
            <Input
              type="number" min={1} max={5}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 1 })}
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>

          <div>
            <Label className="text-slate-300">Início</Label>
            <Input
              type="datetime-local"
              value={toLocalInput(form.startsAt)}
              onChange={(e) => setForm({ ...form, startsAt: fromLocalInput(e.target.value) })}
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>

          <div>
            <Label className="text-slate-300">Fim</Label>
            <Input
              type="datetime-local"
              value={toLocalInput(form.endsAt)}
              onChange={(e) => setForm({ ...form, endsAt: fromLocalInput(e.target.value) })}
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>

          <div>
            <Label className="text-slate-300">Multiplicador</Label>
            <Input
              type="number" min={1} step={0.5}
              value={form.multiplier}
              disabled={!usesMultiplier(form.type)}
              onChange={(e) => setForm({ ...form, multiplier: Number(e.target.value) || 1 })}
              className="border-slate-700 bg-slate-950 text-slate-100 disabled:opacity-40"
            />
          </div>

          <div className="flex items-end gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <span className="text-sm text-slate-300">Ativa</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label className="text-slate-300">Mensagem</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Texto exibido no banner in-game"
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-slate-300">Motivo da alteração (obrigatório)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: início da Copa Brasil"
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700">
            Cancelar
          </Button>
          <Button onClick={submit} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
            {initial ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
