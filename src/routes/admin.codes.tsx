import { createFileRoute } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import {
  Ticket, Plus, Pencil, Power, Trash2, ShieldCheck,
} from "lucide-react";
import {
  codeActions, codeStatus, emptyRewards, getCodeLogs, getCodes, subscribeCodes,
  type CodeInput, type CodeRewards, type RedeemCode,
} from "@/lib/admin/mock-codes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const Route = createFileRoute("/admin/codes")({ component: CodesPage });

const statusBadge = {
  active:    { label: "Ativo",     className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  inactive:  { label: "Inativo",   className: "bg-slate-500/15 text-slate-600 border-slate-500/30" },
  scheduled: { label: "Agendado",  className: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  expired:   { label: "Expirado",  className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  exhausted: { label: "Esgotado",  className: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
} as const;

function useCodes() { return useSyncExternalStore(subscribeCodes, getCodes, getCodes); }
function useLogs()  { return useSyncExternalStore(subscribeCodes, getCodeLogs, getCodeLogs); }

type Pending =
  | { kind: "toggle"; code: RedeemCode }
  | { kind: "delete"; code: RedeemCode };

function CodesPage() {
  const codes = useCodes();
  const logs = useLogs();
  const [editing, setEditing] = useState<RedeemCode | "new" | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");

  const confirmDestructive = () => {
    if (!pending) return;
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    if (pending.kind === "toggle") {
      codeActions.toggle(pending.code.id, reason.trim());
      toast.success(pending.code.active ? "Código desativado" : "Código ativado");
    } else {
      codeActions.remove(pending.code.id, reason.trim());
      toast.error("Código excluído");
    }
    setPending(null); setReason("");
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Ticket className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold">Códigos / Redeem</h1>
            <p className="text-sm text-muted-foreground">CRUD de campanhas beta — mock local, sem impacto no jogo.</p>
          </div>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4 mr-1" /> Novo código
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Códigos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Recompensa</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((c) => {
                const st = codeStatus(c);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.code}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[240px]">{rewardSummary(c.rewards) || "—"}</TableCell>
                    <TableCell>{c.uses}{c.totalLimit > 0 ? ` / ${c.totalLimit}` : ""}</TableCell>
                    <TableCell className="text-xs">{c.perPlayerLimit}x por jogador</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatRange(c.startsAt, c.endsAt)}</TableCell>
                    <TableCell><Badge variant="outline" className={statusBadge[st].className}>{statusBadge[st].label}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(c.updatedAt).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(c)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setReason(""); setPending({ kind: "toggle", code: c }); }}
                          title={c.active ? "Desativar" : "Ativar"}>
                          <Power className={c.active ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-slate-500"} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setReason(""); setPending({ kind: "delete", code: c }); }}
                          title="Excluir">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {codes.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum código cadastrado.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Audit logs recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(0, 10).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(l.date).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{l.admin}</TableCell>
                  <TableCell><Badge variant="secondary">{l.action}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{l.code}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{l.reason}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhuma ação registrada.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing !== null && (
        <CodeEditor
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "delete" ? "Excluir código" : (pending?.code.active ? "Desativar código" : "Ativar código")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending && (pending.kind === "delete"
                ? `Excluir "${pending.code.code}" é irreversível no mock. Motivo obrigatório.`
                : `Alternar status do código "${pending.code.code}". Motivo obrigatório.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason-toggle">Motivo <span className="text-destructive">*</span></Label>
            <Textarea id="reason-toggle" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: fim da campanha de lançamento" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDestructive}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -------------------- Editor -------------------- */

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fromDatetimeLocal(v: string): string | null {
  if (!v) return null;
  return new Date(v).toISOString();
}

function CodeEditor({ initial, onClose }: { initial: RedeemCode | null; onClose: () => void }) {
  const isNew = initial === null;
  const [form, setForm] = useState<CodeInput>(() => ({
    code:           initial?.code ?? "",
    active:         initial?.active ?? true,
    startsAt:       initial?.startsAt ?? null,
    endsAt:         initial?.endsAt ?? null,
    totalLimit:     initial?.totalLimit ?? 0,
    perPlayerLimit: initial?.perPlayerLimit ?? 1,
    rewards:        initial?.rewards ?? emptyRewards(),
  }));
  const [reason, setReason] = useState("");

  const setR = (k: keyof CodeRewards, v: string | number) =>
    setForm((f) => ({ ...f, rewards: { ...f.rewards, [k]: v } }));

  const submit = () => {
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    try {
      if (isNew) codeActions.create(form, reason.trim());
      else if (initial) codeActions.update(initial.id, form, reason.trim());
      toast.success(isNew ? "Código criado" : "Código atualizado");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo código" : `Editar ${initial?.code}`}</DialogTitle>
          <DialogDescription>Configure recompensas, validade e limites.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Código">
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="BETA2026" className="font-mono" />
          </Field>
          <Field label="Ativo">
            <div className="flex items-center h-9">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <span className="ml-2 text-sm text-muted-foreground">{form.active ? "Sim" : "Não"}</span>
            </div>
          </Field>

          <Field label="Início">
            <Input type="datetime-local" value={toDatetimeLocal(form.startsAt)}
              onChange={(e) => setForm({ ...form, startsAt: fromDatetimeLocal(e.target.value) })} />
          </Field>
          <Field label="Fim">
            <Input type="datetime-local" value={toDatetimeLocal(form.endsAt)}
              onChange={(e) => setForm({ ...form, endsAt: fromDatetimeLocal(e.target.value) })} />
          </Field>

          <Field label="Limite total (0 = ilimitado)">
            <Input type="number" min={0} value={form.totalLimit}
              onChange={(e) => setForm({ ...form, totalLimit: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Limite por jogador">
            <Input type="number" min={1} value={form.perPlayerLimit}
              onChange={(e) => setForm({ ...form, perPlayerLimit: Number(e.target.value) || 1 })} />
          </Field>
        </div>

        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Recompensas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Ouro">
              <Input type="number" min={0} value={form.rewards.gold} onChange={(e) => setR("gold", Number(e.target.value) || 0)} />
            </Field>
            <Field label="Cristais">
              <Input type="number" min={0} value={form.rewards.gems} onChange={(e) => setR("gems", Number(e.target.value) || 0)} />
            </Field>
            <Field label="Essência">
              <Input type="number" min={0} value={form.rewards.essence} onChange={(e) => setR("essence", Number(e.target.value) || 0)} />
            </Field>
            <Field label="Baú">
              <Input value={form.rewards.chest} onChange={(e) => setR("chest", e.target.value)} placeholder="Baú Épico" />
            </Field>
            <Field label="Item">
              <Input value={form.rewards.item} onChange={(e) => setR("item", e.target.value)} placeholder="Poção Rara" />
            </Field>
            <Field label="Skin">
              <Input value={form.rewards.skin} onChange={(e) => setR("skin", e.target.value)} placeholder="Guerreiro Sombrio" />
            </Field>
            <Field label="Cosmético">
              <Input value={form.rewards.cosmetic} onChange={(e) => setR("cosmetic", e.target.value)} placeholder="Aura Azul" />
            </Field>
          </div>
        </div>

        <div className="mt-4 border-t pt-4 space-y-2">
          <Label>Motivo (audit log) <span className="text-destructive">*</span></Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: nova campanha para influenciadores" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit}>{isNew ? "Criar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function rewardSummary(r: CodeRewards): string {
  const parts: string[] = [];
  if (r.gold)     parts.push(`${r.gold.toLocaleString("pt-BR")} 🪙`);
  if (r.gems)     parts.push(`${r.gems} 💎`);
  if (r.essence)  parts.push(`${r.essence} ✨`);
  if (r.chest)    parts.push(`📦 ${r.chest}`);
  if (r.item)     parts.push(`🎁 ${r.item}`);
  if (r.skin)     parts.push(`👕 ${r.skin}`);
  if (r.cosmetic) parts.push(`🌟 ${r.cosmetic}`);
  return parts.join(" · ");
}

function formatRange(s: string | null, e: string | null): string {
  if (!s && !e) return "sem prazo";
  const f = (v: string | null) => v ? new Date(v).toLocaleDateString("pt-BR") : "—";
  return `${f(s)} → ${f(e)}`;
}
