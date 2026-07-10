import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ShoppingBag, Plus, Pencil, Power, Trash2, Star } from "lucide-react";
import {
  shopActions, shopStatus, getShopItems, getShopLogs, subscribeShop,
  SHOP_TYPE_LABEL, SHOP_TYPES, CURRENCY_LABEL, CURRENCIES, RARITY_LABEL, RARITIES,
  type ShopInput, type ShopItem, type ShopItemType, type ShopCurrency, type ShopRarity,
} from "@/lib/admin/mock-shop";
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

export const Route = createFileRoute("/admin/shop")({ component: ShopPage });

const statusBadge = {
  active:    { label: "Ativo",    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  scheduled: { label: "Agendado", className: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  expired:   { label: "Expirado", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  inactive:  { label: "Inativo",  className: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  sold_out:  { label: "Esgotado", className: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
} as const;

const rarityBadge: Record<ShopRarity, string> = {
  common:    "bg-slate-500/15 text-slate-200 border-slate-500/30",
  uncommon:  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rare:      "bg-blue-500/15 text-blue-300 border-blue-500/30",
  epic:      "bg-purple-500/15 text-purple-300 border-purple-500/30",
  legendary: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  mythic:    "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function useItems() { return useSyncExternalStore(subscribeShop, getShopItems, getShopItems); }
function useLogs()  { return useSyncExternalStore(subscribeShop, getShopLogs, getShopLogs); }

type Pending =
  | { kind: "toggle"; item: ShopItem }
  | { kind: "delete"; item: ShopItem };

const emptyInput = (): ShopInput => ({
  name: "", type: "gems", price: 100, currency: "gems",
  quantity: 0, perPlayerLimit: 1, startsAt: null, endsAt: null,
  active: true, featured: false, rarity: "common", reward: "",
});

function ShopPage() {
  const items = useItems();
  const logs = useLogs();
  const [editing, setEditing] = useState<ShopItem | "new" | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");

  const featured = useMemo(
    () => items.filter((i) => i.featured && shopStatus(i) === "active"),
    [items],
  );

  const confirmDestructive = () => {
    if (!pending) return;
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    if (pending.kind === "toggle") {
      shopActions.toggle(pending.item.id, reason.trim());
      toast.success(pending.item.active ? "Item desativado" : "Item ativado");
    } else {
      shopActions.remove(pending.item.id, reason.trim());
      toast.success("Item excluído");
    }
    setPending(null);
    setReason("");
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-gradient-to-br from-slate-900/80 to-slate-900/40 text-slate-900">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Loja</h2>
              <p className="text-sm text-slate-600">
                CMS de ofertas. Mock local — sem pagamento real.
              </p>
            </div>
          </div>
          <Button onClick={() => setEditing("new")} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
            <Plus className="mr-1 h-4 w-4" /> Novo item
          </Button>
        </CardContent>
      </Card>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((i) => (
            <div
              key={i.id}
              className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-3 text-amber-100"
            >
              <div className="grid h-9 w-9 place-items-center rounded-md bg-amber-500/20 text-amber-300">
                <Star className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{i.name}</div>
                <div className="text-xs text-amber-200/80">
                  {i.price} {CURRENCY_LABEL[i.currency]} · {i.reward}
                </div>
              </div>
              <Badge variant="outline" className={rarityBadge[i.rarity]}>
                {RARITY_LABEL[i.rarity]}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <Card className="border-slate-200 bg-white text-slate-900">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Itens ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-600">Nome</TableHead>
                <TableHead className="text-slate-600">Tipo</TableHead>
                <TableHead className="text-slate-600">Preço</TableHead>
                <TableHead className="text-slate-600">Raridade</TableHead>
                <TableHead className="text-slate-600">Estoque</TableHead>
                <TableHead className="text-slate-600">Vendidos</TableHead>
                <TableHead className="text-slate-600">Status</TableHead>
                <TableHead className="text-right text-slate-600">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => {
                const st = shopStatus(i);
                const b = statusBadge[st];
                return (
                  <TableRow key={i.id} className="border-slate-200 hover:bg-slate-800/40">
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        {i.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                        {i.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{SHOP_TYPE_LABEL[i.type]}</TableCell>
                    <TableCell className="text-slate-300">
                      {i.price} <span className="text-xs text-slate-500">{CURRENCY_LABEL[i.currency]}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={rarityBadge[i.rarity]}>
                        {RARITY_LABEL[i.rarity]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {i.quantity === 0 ? "∞" : i.quantity}
                    </TableCell>
                    <TableCell className="text-slate-300">{i.sold}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={b.className}>{b.label}</Badge>
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
                );
              })}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhum item cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white text-slate-900">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Audit Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent className="max-h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma ação registrada ainda.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {logs.map((l) => (
                <li key={l.id} className="rounded border border-slate-200 bg-slate-50 p-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-mono">{new Date(l.date).toLocaleString("pt-BR")}</span>
                    <span className="text-amber-300">{l.admin}</span>
                  </div>
                  <div className="mt-1 text-slate-200">
                    <span className="font-bold uppercase">{l.action}</span> — {l.item}
                  </div>
                  <div className="text-slate-600">Motivo: {l.reason}</div>
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
        <AlertDialogContent className="border-slate-200 bg-white text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "toggle"
                ? (pending.item.active ? "Desativar item?" : "Ativar item?")
                : "Excluir item?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Esta ação será registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-slate-300">Motivo (obrigatório)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo"
              className="border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 bg-slate-800 text-slate-900 hover:bg-slate-700">Cancelar</AlertDialogCancel>
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
  initial: ShopItem | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ShopInput>(() =>
    initial
      ? {
          name: initial.name, type: initial.type,
          price: initial.price, currency: initial.currency,
          quantity: initial.quantity, perPlayerLimit: initial.perPlayerLimit,
          startsAt: initial.startsAt, endsAt: initial.endsAt,
          active: initial.active, featured: initial.featured,
          rarity: initial.rarity, reward: initial.reward,
        }
      : emptyInput(),
  );
  const [reason, setReason] = useState("");

  const toLocalInput = (iso: string | null) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : "";
  const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

  const submit = () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!reason.trim()) { toast.error("Motivo obrigatório"); return; }
    try {
      if (initial) {
        shopActions.update(initial.id, form, reason.trim());
        toast.success("Item atualizado");
      } else {
        shopActions.create(form, reason.trim());
        toast.success("Item criado");
      }
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl border-slate-200 bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar item" : "Novo item"}</DialogTitle>
          <DialogDescription className="text-slate-600">
            Toda alteração registra motivo em audit log.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label className="text-slate-300">Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>

          <div>
            <Label className="text-slate-300">Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ShopItemType })}>
              <SelectTrigger className="border-slate-300 bg-slate-50 text-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent className="border-slate-300 bg-white text-slate-900">
                {SHOP_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{SHOP_TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Raridade</Label>
            <Select value={form.rarity} onValueChange={(v) => setForm({ ...form, rarity: v as ShopRarity })}>
              <SelectTrigger className="border-slate-300 bg-slate-50 text-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent className="border-slate-300 bg-white text-slate-900">
                {RARITIES.map((r) => (
                  <SelectItem key={r} value={r}>{RARITY_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Preço</Label>
            <Input
              type="number" min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
              className="border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>

          <div>
            <Label className="text-slate-300">Moeda</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v as ShopCurrency })}>
              <SelectTrigger className="border-slate-300 bg-slate-50 text-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent className="border-slate-300 bg-white text-slate-900">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{CURRENCY_LABEL[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Estoque total (0 = ∞)</Label>
            <Input
              type="number" min={0}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) || 0 })}
              className="border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>

          <div>
            <Label className="text-slate-300">Limite por jogador</Label>
            <Input
              type="number" min={1}
              value={form.perPlayerLimit}
              onChange={(e) => setForm({ ...form, perPlayerLimit: Number(e.target.value) || 1 })}
              className="border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>

          <div>
            <Label className="text-slate-300">Início</Label>
            <Input
              type="datetime-local"
              value={toLocalInput(form.startsAt)}
              onChange={(e) => setForm({ ...form, startsAt: fromLocalInput(e.target.value) })}
              className="border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>

          <div>
            <Label className="text-slate-300">Fim</Label>
            <Input
              type="datetime-local"
              value={toLocalInput(form.endsAt)}
              onChange={(e) => setForm({ ...form, endsAt: fromLocalInput(e.target.value) })}
              className="border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <span className="text-sm text-slate-300">Ativo</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <span className="text-sm text-slate-300">Destaque</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label className="text-slate-300">Recompensa entregue</Label>
            <Input
              value={form.reward}
              onChange={(e) => setForm({ ...form, reward: e.target.value })}
              placeholder="Ex.: 500 cristais + 1 Baú Épico"
              className="border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-slate-300">Motivo da alteração (obrigatório)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: início da promoção de fim de semana"
              className="border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-300 bg-slate-800 text-slate-900 hover:bg-slate-700">
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
