import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Package, Plus, Pencil, Power, Trash2, Search } from "lucide-react";
import {
  itemActions, getCatalogItems, getItemLogs, subscribeItems,
  ITEM_TYPE_LABEL, ITEM_TYPES, RARITY_LABEL, RARITIES,
  isCosmeticType, hasAttributes,
  type ItemInput, type CatalogItem, type ItemType, type ItemRarity, type ItemAttributes,
} from "@/lib/admin/mock-items";
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

export const Route = createFileRoute("/admin/items")({ component: ItemsPage });

const rarityBadge: Record<ItemRarity, string> = {
  common:    "bg-slate-500/15 text-slate-200 border-slate-500/30",
  uncommon:  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rare:      "bg-blue-500/15 text-blue-300 border-blue-500/30",
  epic:      "bg-purple-500/15 text-purple-300 border-purple-500/30",
  legendary: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  mythic:    "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function useItems() { return useSyncExternalStore(subscribeItems, getCatalogItems, getCatalogItems); }
function useLogs()  { return useSyncExternalStore(subscribeItems, getItemLogs, getItemLogs); }

type Pending =
  | { kind: "toggle"; item: CatalogItem }
  | { kind: "delete"; item: CatalogItem };

const emptyInput = (): ItemInput => ({
  name: "", type: "equipment", rarity: "common",
  description: "", active: true, source: "", dropRate: 0, icon: "❔",
  attributes: {}, visualCategory: "",
});

function ItemsPage() {
  const items = useItems();
  const logs = useLogs();
  const [editing, setEditing] = useState<CatalogItem | "new" | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");

  const [fType, setFType] = useState<ItemType | "all">("all");
  const [fRarity, setFRarity] = useState<ItemRarity | "all">("all");
  const [fActive, setFActive] = useState<"all" | "on" | "off">("all");
  const [fSource, setFSource] = useState("");
  const [q, setQ] = useState("");

  const sources = useMemo(
    () => Array.from(new Set(items.map((i) => i.source).filter(Boolean))).sort(),
    [items],
  );

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (fType !== "all" && i.type !== fType) return false;
        if (fRarity !== "all" && i.rarity !== fRarity) return false;
        if (fActive === "on" && !i.active) return false;
        if (fActive === "off" && i.active) return false;
        if (fSource && i.source !== fSource) return false;
        if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [items, fType, fRarity, fActive, fSource, q],
  );

  const confirmDestructive = () => {
    if (!pending) return;
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    if (pending.kind === "toggle") {
      itemActions.toggle(pending.item.id, reason.trim());
      toast.success(pending.item.active ? "Item desativado" : "Item ativado");
    } else {
      itemActions.remove(pending.item.id, reason.trim());
      toast.success("Item excluído");
    }
    setPending(null);
    setReason("");
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 text-slate-100">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Itens · Catálogo Geral</h2>
              <p className="text-sm text-slate-400">
                Equipamentos, pets, runas, cosméticos, baús, títulos e mais. Mock local.
              </p>
            </div>
          </div>
          <Button onClick={() => setEditing("new")} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
            <Plus className="mr-1 h-4 w-4" /> Novo item
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
        <CardContent className="grid gap-3 p-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome…"
              className="border-slate-700 bg-slate-950 pl-8 text-slate-100"
            />
          </div>

          <Select value={fType} onValueChange={(v) => setFType(v as ItemType | "all")}>
            <SelectTrigger className="border-slate-700 bg-slate-950 text-slate-100"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
              <SelectItem value="all">Todos os tipos</SelectItem>
              {ITEM_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{ITEM_TYPE_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fRarity} onValueChange={(v) => setFRarity(v as ItemRarity | "all")}>
            <SelectTrigger className="border-slate-700 bg-slate-950 text-slate-100"><SelectValue placeholder="Raridade" /></SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
              <SelectItem value="all">Todas as raridades</SelectItem>
              {RARITIES.map((r) => (
                <SelectItem key={r} value={r}>{RARITY_LABEL[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fActive} onValueChange={(v) => setFActive(v as "all" | "on" | "off")}>
            <SelectTrigger className="border-slate-700 bg-slate-950 text-slate-100"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="on">Ativos</SelectItem>
              <SelectItem value="off">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={fSource || "all"} onValueChange={(v) => setFSource(v === "all" ? "" : v)}>
            <SelectTrigger className="border-slate-700 bg-slate-950 text-slate-100"><SelectValue placeholder="Origem" /></SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
              <SelectItem value="all">Todas as origens</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-bold">
            Itens ({filtered.length}/{items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">Item</TableHead>
                <TableHead className="text-slate-400">Tipo</TableHead>
                <TableHead className="text-slate-400">Raridade</TableHead>
                <TableHead className="text-slate-400">Origem</TableHead>
                <TableHead className="text-slate-400">Drop</TableHead>
                <TableHead className="text-slate-400">Atributos</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id} className="border-slate-800 hover:bg-slate-800/40">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{i.icon}</span>
                      <div>
                        <div className="font-semibold">{i.name}</div>
                        <div className="text-[10px] text-slate-500">
                          edit. {new Date(i.updatedAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{ITEM_TYPE_LABEL[i.type]}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={rarityBadge[i.rarity]}>
                      {RARITY_LABEL[i.rarity]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">{i.source || "—"}</TableCell>
                  <TableCell className="text-slate-300">
                    {i.dropRate > 0 ? `${i.dropRate}%` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {hasAttributes(i.type)
                      ? Object.entries(i.attributes)
                          .filter(([, v]) => v)
                          .map(([k, v]) => `${k.toUpperCase()} ${v}`)
                          .join(" · ") || "—"
                      : isCosmeticType(i.type) && i.visualCategory
                        ? i.visualCategory
                        : "—"}
                  </TableCell>
                  <TableCell>
                    {i.active ? (
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-500/30 bg-slate-500/15 text-slate-300">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:bg-slate-800" onClick={() => setEditing(i)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:bg-slate-800" onClick={() => { setPending({ kind: "toggle", item: i }); setReason(""); }}>
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-300 hover:bg-rose-500/10" onClick={() => { setPending({ kind: "delete", item: i }); setReason(""); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhum item corresponde aos filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                    <span className="font-bold uppercase">{l.action}</span> — {l.item}
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
                ? (pending.item.active ? "Desativar item?" : "Ativar item?")
                : "Excluir item?"}
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
  initial: CatalogItem | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ItemInput>(() =>
    initial
      ? {
          name: initial.name, type: initial.type, rarity: initial.rarity,
          description: initial.description, active: initial.active,
          source: initial.source, dropRate: initial.dropRate, icon: initial.icon,
          attributes: { ...initial.attributes }, visualCategory: initial.visualCategory,
        }
      : emptyInput(),
  );
  const [reason, setReason] = useState("");

  const setAttr = (k: keyof ItemAttributes, v: number) =>
    setForm({ ...form, attributes: { ...form.attributes, [k]: v || undefined } });

  const submit = () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    try {
      if (initial) {
        itemActions.update(initial.id, form, reason.trim());
        toast.success("Item atualizado");
      } else {
        itemActions.create(form, reason.trim());
        toast.success("Item criado");
      }
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl border-slate-800 bg-slate-900 text-slate-100">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar item" : "Novo item"}</DialogTitle>
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
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ItemType })}>
              <SelectTrigger className="border-slate-700 bg-slate-950 text-slate-100"><SelectValue /></SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                {ITEM_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{ITEM_TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Raridade</Label>
            <Select value={form.rarity} onValueChange={(v) => setForm({ ...form, rarity: v as ItemRarity })}>
              <SelectTrigger className="border-slate-700 bg-slate-950 text-slate-100"><SelectValue /></SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                {RARITIES.map((r) => (
                  <SelectItem key={r} value={r}>{RARITY_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Ícone (emoji ou URL)</Label>
            <Input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>

          <div>
            <Label className="text-slate-300">Origem / Drop source</Label>
            <Input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="Ex.: Baú Épico, Arena S1"
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>

          <div>
            <Label className="text-slate-300">Drop rate (%)</Label>
            <Input
              type="number" min={0} max={100} step={0.1}
              value={form.dropRate}
              onChange={(e) => setForm({ ...form, dropRate: Number(e.target.value) || 0 })}
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>

          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <span className="text-sm text-slate-300">Ativo</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label className="text-slate-300">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>

          {hasAttributes(form.type) && (
            <div className="md:col-span-2 rounded-md border border-slate-800 bg-slate-950/40 p-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-300">
                Atributos
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(["atk", "def", "hp", "crit", "speed"] as const).map((k) => (
                  <div key={k}>
                    <Label className="text-[11px] uppercase text-slate-400">{k}</Label>
                    <Input
                      type="number" min={0}
                      value={form.attributes[k] ?? 0}
                      onChange={(e) => setAttr(k, Number(e.target.value) || 0)}
                      className="border-slate-700 bg-slate-950 text-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {isCosmeticType(form.type) && (
            <div className="md:col-span-2">
              <Label className="text-slate-300">Categoria visual</Label>
              <Input
                value={form.visualCategory}
                onChange={(e) => setForm({ ...form, visualCategory: e.target.value })}
                placeholder="Ex.: Aura, Traje completo, Nameplate"
                className="border-slate-700 bg-slate-950 text-slate-100"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <Label className="text-slate-300">Motivo da alteração (obrigatório)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: rebalanceamento pós-torneio"
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
