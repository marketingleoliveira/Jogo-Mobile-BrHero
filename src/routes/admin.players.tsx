import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, Search, ShieldCheck, RefreshCcw, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listAdminPlayers,
  updateAdminPlayer,
  type AdminPlayerRow,
} from "@/lib/admin/players.functions";
import { formatStage } from "@/lib/game/cloud-save";


export const Route = createFileRoute("/admin/players")({ component: PlayersPage });

function PlayersPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"updated" | "level" | "stage" | "prestige" | "gems">("updated");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminPlayerRow | null>(null);
  const pageSize = 25;

  const list = useServerFn(listAdminPlayers);
  const query = useQuery({
    queryKey: ["admin", "players", { page, pageSize, sort, search }],
    queryFn: () => list({ data: { page, pageSize, sort, search } }),
    staleTime: 15_000,
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Jogadores</h1>
          <p className="text-sm text-muted-foreground">
            Todos os usuários autenticados. Clique em <strong>Editar</strong> para conceder recursos ou ajustar progresso.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por e-mail ou user_id…"
              className="pl-9"
            />
          </div>
          <Select value={sort} onValueChange={(v) => { setSort(v as typeof sort); setPage(1); }}>
            <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Última atividade</SelectItem>
              <SelectItem value="level">Nível</SelectItem>
              <SelectItem value="stage">Stage máx.</SelectItem>
              <SelectItem value="prestige">Prestígio</SelectItem>
              <SelectItem value="gems">Cristais</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCcw className={`h-4 w-4 mr-1 ${query.isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {query.isLoading ? "Carregando…" : `${total} jogador(es)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Prestígio</TableHead>
                <TableHead>Cristais</TableHead>
                <TableHead>Ouro</TableHead>
                <TableHead>Última sessão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.userId} className={p.hasSave ? "" : "opacity-70"}>
                  <TableCell className="font-mono text-xs">{p.userId.slice(0, 8)}…</TableCell>
                  <TableCell className="text-sm">
                    {p.email ?? "—"}
                    {!p.hasSave && <span className="ml-2 text-[10px] uppercase text-muted-foreground">sem save</span>}
                  </TableCell>
                  <TableCell>Lv {p.level}</TableCell>
                  <TableCell title={`Stage bruto ${p.stage} · Máx ${p.maxStage}`}>
                    {p.stage} <span className="text-xs text-muted-foreground">({formatStage(p.stage)})</span>
                    {" / "}
                    {p.maxStage} <span className="text-xs text-muted-foreground">({formatStage(p.maxStage)})</span>
                  </TableCell>

                  <TableCell>P{p.prestigeLevel}</TableCell>
                  <TableCell>{p.gems.toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{p.gold.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !query.isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                    {query.error ? `Erro: ${(query.error as Error).message}` : "Nenhum jogador ainda."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Página {page} de {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages || query.isFetching}
            onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      </div>

      <EditPlayerDialog
        player={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function EditPlayerDialog({ player, onClose }: { player: AdminPlayerRow | null; onClose: () => void }) {
  const qc = useQueryClient();
  const update = useServerFn(updateAdminPlayer);
  const [form, setForm] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");

  const open = player !== null;
  useEffect(() => {
    if (!player) return;
    setForm({
      level: String(player.level),
      stage: String(player.stage),
      maxStage: String(player.maxStage),
      prestigeLevel: String(player.prestigeLevel),
      essence: String(player.essence),
      gems: String(player.gems),
      gold: String(player.gold),
    });
    setReason("");
  }, [player]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!player) return;
      const num = (k: string) => {
        const raw = form[k];
        if (raw === undefined || raw === "") return undefined;
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
      };
      const patch: Record<string, number> = {};
      const keys = ["level", "stage", "maxStage", "prestigeLevel", "essence", "gems", "gold"] as const;
      const original: Record<string, number> = {
        level: player.level, stage: player.stage, maxStage: player.maxStage,
        prestigeLevel: player.prestigeLevel, essence: player.essence,
        gems: player.gems, gold: player.gold,
      };
      for (const k of keys) {
        const v = num(k);
        if (v !== undefined && v !== original[k]) patch[k] = v;
      }
      if (Object.keys(patch).length === 0) throw new Error("Nada foi alterado");
      const finalStage = patch.stage ?? original.stage;
      const finalMax = patch.maxStage ?? original.maxStage;
      if (finalMax < finalStage) {
        throw new Error("Stage máximo não pode ser menor que o stage atual");
      }
      await update({ data: { userId: player.userId, patch, reason } });

    },
    onSuccess: () => {
      toast.success("Jogador atualizado");
      qc.invalidateQueries({ queryKey: ["admin", "players"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao atualizar"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar jogador</DialogTitle>
          <DialogDescription>
            {player?.email ?? player?.userId} — altere apenas os campos desejados.
          </DialogDescription>
        </DialogHeader>
        {player && (
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 rounded-md border border-border/60 bg-muted/30 p-2 text-xs text-muted-foreground">
              <strong>Stage:</strong> valor bruto (ex.: <code>91</code>). O HUD do jogo mostra no formato <code>bloco-andar</code> (ex.: <code>91 = 10-1</code>). A conversão é <code>bloco = ⌊(stage-1)/10⌋+1</code>, <code>andar = ((stage-1) mod 10)+1</code>. "Máximo" nunca pode ser menor que o "atual".
            </div>
            {[
              { k: "level", label: "Nível do herói" },
              { k: "prestigeLevel", label: "Prestígio" },
              { k: "stage", label: "Stage atual (bruto)" },
              { k: "maxStage", label: "Stage máximo (bruto)" },
              { k: "gems", label: "Cristais (diamantes)" },
              { k: "gold", label: "Ouro (moedas)" },
              { k: "essence", label: "Essência" },
            ].map(({ k, label }) => {
              const raw = Number(form[k]);
              const showConv = (k === "stage" || k === "maxStage") && Number.isFinite(raw) && raw > 0;
              return (
                <div key={k} className="space-y-1">
                  <Label htmlFor={`f-${k}`} className="text-xs">
                    {label}
                    {showConv && (
                      <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                        HUD: {formatStage(raw)}
                      </span>
                    )}
                  </Label>
                  <Input
                    id={`f-${k}`}
                    type="number"
                    min={0}
                    value={form[k] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  />
                </div>
              );
            })}

            <div className="col-span-2 space-y-1">
              <Label htmlFor="f-reason" className="text-xs">Motivo (audit log)</Label>
              <Textarea
                id="f-reason"
                rows={2}
                placeholder="Ex.: compensação de bug, evento, suporte…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
