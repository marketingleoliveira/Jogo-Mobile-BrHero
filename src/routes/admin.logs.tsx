import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ScrollText, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getAudit, subscribeAudit, clearAudit } from "@/lib/admin/audit-central";
import { MODULE_LABEL, type AdminModule } from "@/lib/admin/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/logs")({ component: LogsPage });

function LogsPage() {
  const entries = useSyncExternalStore(subscribeAudit, getAudit, getAudit);
  const [q, setQ] = useState("");
  const [fMod, setFMod] = useState<AdminModule | "all">("all");
  const [fAdmin, setFAdmin] = useState<string>("all");

  const admins = useMemo(
    () => Array.from(new Set(entries.map((e) => e.adminName))).sort(),
    [entries],
  );

  const filtered = useMemo(
    () => entries.filter((e) => {
      if (fMod !== "all" && e.module !== fMod) return false;
      if (fAdmin !== "all" && e.adminName !== fAdmin) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!e.target.toLowerCase().includes(s) &&
            !e.action.toLowerCase().includes(s) &&
            !e.reason.toLowerCase().includes(s)) return false;
      }
      return true;
    }),
    [entries, fMod, fAdmin, q],
  );

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-gradient-to-br from-slate-900/80 to-slate-900/40 text-slate-900">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Logs de Auditoria</h2>
              <p className="text-sm text-slate-600">
                Log centralizado. Todas as ações administrativas com perfil (RBAC), motivo e diff antes/depois.
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline"
                className="border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
                <Trash2 className="mr-1 h-4 w-4" /> Limpar logs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-slate-200 bg-white text-slate-900">
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar todos os logs?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600">
                  Esta ação é irreversível no mock local.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-slate-300 bg-slate-800 text-slate-900 hover:bg-slate-700">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => { clearAudit(); toast.success("Logs apagados"); }}
                  className="bg-rose-500 text-slate-50 hover:bg-rose-400">
                  Apagar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white text-slate-900">
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por alvo, ação ou motivo…"
            className="border-slate-300 bg-slate-50 text-slate-900 md:col-span-2" />
          <Select value={fMod} onValueChange={(v) => setFMod(v as AdminModule | "all")}>
            <SelectTrigger className="border-slate-300 bg-slate-50 text-slate-900">
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent className="border-slate-300 bg-white text-slate-900">
              <SelectItem value="all">Todos os módulos</SelectItem>
              {(Object.keys(MODULE_LABEL) as AdminModule[]).map((m) => (
                <SelectItem key={m} value={m}>{MODULE_LABEL[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fAdmin} onValueChange={setFAdmin}>
            <SelectTrigger className="border-slate-300 bg-slate-50 text-slate-900">
              <SelectValue placeholder="Admin" />
            </SelectTrigger>
            <SelectContent className="border-slate-300 bg-white text-slate-900">
              <SelectItem value="all">Todos os admins</SelectItem>
              {admins.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white text-slate-900">
        <CardHeader>
          <CardTitle className="text-sm font-bold">
            Entradas ({filtered.length}/{entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-600">Data</TableHead>
                <TableHead className="text-slate-600">Admin</TableHead>
                <TableHead className="text-slate-600">Perfil</TableHead>
                <TableHead className="text-slate-600">Módulo</TableHead>
                <TableHead className="text-slate-600">Ação</TableHead>
                <TableHead className="text-slate-600">Alvo</TableHead>
                <TableHead className="text-slate-600">Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id} className="border-slate-200 hover:bg-slate-800/40">
                  <TableCell className="font-mono text-[11px] text-slate-600">
                    {new Date(e.date).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm text-amber-300">{e.adminName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-300 bg-slate-800/60 text-[10px] uppercase tracking-widest text-slate-300">
                      {e.roleLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">{MODULE_LABEL[e.module]}</TableCell>
                  <TableCell className="font-bold uppercase text-slate-900">{e.action}</TableCell>
                  <TableCell className="text-slate-300">{e.target}</TableCell>
                  <TableCell className="max-w-[280px] truncate text-slate-600" title={e.reason}>
                    {e.reason}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum log corresponde aos filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
