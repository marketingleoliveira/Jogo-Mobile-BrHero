import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Users, Search, Coins, Gem, Sparkles, Package,
  PauseCircle, Ban, RotateCcw, ShieldCheck, X,
} from "lucide-react";
import {
  adminActions, getLogs, getPlayers, searchPlayers, subscribe,
  type MockPlayer, type PlayerStatus,
} from "@/lib/admin/mock-players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/players")({ component: PlayersPage });

const statusBadge: Record<PlayerStatus, { label: string; className: string }> = {
  active:    { label: "Ativo",     className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  suspended: { label: "Suspenso",  className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  banned:    { label: "Banido",    className: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
};

function usePlayersStore() {
  return useSyncExternalStore(subscribe, () => getPlayers(), () => getPlayers());
}
function useLogsStore() {
  return useSyncExternalStore(subscribe, () => getLogs(), () => getLogs());
}

function PlayersPage() {
  const players = usePlayersStore();
  const logs = useLogsStore();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    void players; // re-run on store change
    return searchPlayers(query);
  }, [query, players]);
  const selected = players.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-semibold">Jogadores</h1>
          <p className="text-sm text-muted-foreground">
            Suporte / GM Panel — dados mockados. Ações registradas em audit log.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buscar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome, ID (P-1234), e-mail ou Google ID..."
              className="pl-9"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {filtered.length} de {players.length} jogadores.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Lista beta</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Apelido</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Rebirth</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última sessão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelectedId(p.id)}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.nickname}</TableCell>
                  <TableCell>Lv {p.level}</TableCell>
                  <TableCell>{p.stage} / {p.maxStage}</TableCell>
                  <TableCell>P{p.rebirths}</TableCell>
                  <TableCell><Badge variant="outline" className={statusBadge[p.status].className}>{statusBadge[p.status].label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.lastSeen}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedId(p.id); }}>
                      Inspecionar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum jogador encontrado.
                  </TableCell>
                </TableRow>
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
                <TableHead>Jogador</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(0, 10).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(l.date).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{l.admin}</TableCell>
                  <TableCell><Badge variant="secondary">{l.action}</Badge></TableCell>
                  <TableCell className="text-sm">{l.player}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{l.reason}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma ação registrada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PlayerDrawer player={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

/* -------------------- Drawer detalhado -------------------- */

function PlayerDrawer({ player, onClose }: { player: MockPlayer | null; onClose: () => void }) {
  return (
    <Sheet open={!!player} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {player && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {player.nickname}
                <Badge variant="outline" className={statusBadge[player.status].className}>
                  {statusBadge[player.status].label}
                </Badge>
              </SheetTitle>
              <SheetDescription className="font-mono text-xs">
                {player.id} · {player.email} · {player.googleId}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Nível" value={`Lv ${player.level}`} />
              <Stat label="Stage" value={String(player.stage)} />
              <Stat label="Max Stage" value={String(player.maxStage)} />
              <Stat label="Rebirths" value={`P${player.rebirths}`} />
              <Stat label="Ouro" value={player.gold.toLocaleString("pt-BR")} />
              <Stat label="Cristais" value={player.gems.toLocaleString("pt-BR")} />
              <Stat label="Essência" value={String(player.essence)} />
              <Stat label="Guilda" value={player.guild ?? "—"} />
              <Stat label="Arena Rank" value={`#${player.arenaRank}`} />
              <Stat label="Torre" value={`Andar ${player.towerBest}`} />
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <Collection label="Pets"       items={player.pets} />
              <Collection label="Runas"      items={player.runes} />
              <Collection label="Skins"      items={player.skins} />
              <Collection label="Cosméticos" items={player.cosmetics} />
              <Collection label="Códigos usados" items={player.redeemUsed} />
            </div>

            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-semibold mb-3">Ações administrativas</h3>
              <AdminActionPanel player={player} />
            </div>

            <Button variant="ghost" size="sm" className="absolute right-4 top-4" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-md border bg-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function Collection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label} ({items.length})</div>
      <div className="flex flex-wrap gap-1">
        {items.length === 0
          ? <span className="text-xs text-muted-foreground italic">nenhum</span>
          : items.map((it, i) => <Badge key={`${it}-${i}`} variant="secondary">{it}</Badge>)}
      </div>
    </div>
  );
}

/* -------------------- Painel de ações -------------------- */

type PendingAction =
  | { kind: "grant"; type: "gold" | "gems" | "essence"; amount: number }
  | { kind: "item"; item: string }
  | { kind: "suspend" }
  | { kind: "ban" }
  | { kind: "reset" };

function AdminActionPanel({ player }: { player: MockPlayer }) {
  const [gold, setGold] = useState("1000");
  const [gems, setGems] = useState("50");
  const [essence, setEssence] = useState("5");
  const [item, setItem] = useState("Baú Épico");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState("");

  const request = (a: PendingAction) => { setReason(""); setPending(a); };
  const requiresConfirm = (a: PendingAction) =>
    a.kind === "ban" || a.kind === "reset" || a.kind === "suspend";

  const runGrant = (type: "gold" | "gems" | "essence", raw: string) => {
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error("Quantidade inválida"); return; }
    request({ kind: "grant", type, amount });
  };

  const confirm = () => {
    if (!pending) return;
    if (requiresConfirm(pending) && !reason.trim()) {
      toast.error("Motivo obrigatório para ações críticas."); return;
    }
    const r = reason.trim() || "—";
    switch (pending.kind) {
      case "grant":
        if (pending.type === "gold")    adminActions.addGold(player.id, pending.amount, r);
        if (pending.type === "gems")    adminActions.addGems(player.id, pending.amount, r);
        if (pending.type === "essence") adminActions.addEssence(player.id, pending.amount, r);
        toast.success(`+${pending.amount} ${pending.type} concedido`);
        break;
      case "item":    adminActions.addItem(player.id, pending.item, r); toast.success(`Item concedido: ${pending.item}`); break;
      case "suspend": adminActions.suspend(player.id, r); toast.warning("Jogador suspenso"); break;
      case "ban":     adminActions.ban(player.id, r);     toast.error("Jogador banido"); break;
      case "reset":   adminActions.reset(player.id, r);   toast.error("Jogador resetado"); break;
    }
    setPending(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-3">
        <ActionRow icon={Coins} label="Ouro" input={gold} setInput={setGold}
          onGo={() => runGrant("gold", gold)} />
        <ActionRow icon={Gem} label="Cristais" input={gems} setInput={setGems}
          onGo={() => runGrant("gems", gems)} />
        <ActionRow icon={Sparkles} label="Essência" input={essence} setInput={setEssence}
          onGo={() => runGrant("essence", essence)} />
        <ActionRow icon={Package} label="Item" input={item} setInput={setItem} isText
          onGo={() => request({ kind: "item", item: item.trim() || "Item" })} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={() => request({ kind: "suspend" })}
          disabled={player.status === "suspended"}>
          <PauseCircle className="h-4 w-4 mr-1" /> Suspender
        </Button>
        <Button variant="destructive" size="sm" onClick={() => request({ kind: "ban" })}
          disabled={player.status === "banned"}>
          <Ban className="h-4 w-4 mr-1" /> Banir
        </Button>
        <Button variant="destructive" size="sm" onClick={() => request({ kind: "reset" })}>
          <RotateCcw className="h-4 w-4 mr-1" /> Resetar
        </Button>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && describeAction(pending, player)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo {pending && requiresConfirm(pending) && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="reason" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: compensação por bug do evento X"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ActionRow({
  icon: Icon, label, input, setInput, onGo, isText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; input: string; setInput: (v: string) => void;
  onGo: () => void; isText?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <Label className="w-20 text-xs">{label}</Label>
      <Input
        value={input} onChange={(e) => setInput(e.target.value)}
        type={isText ? "text" : "number"} className="h-8"
      />
      <Button size="sm" onClick={onGo}>Conceder</Button>
    </div>
  );
}

function describeAction(a: PendingAction, p: MockPlayer): string {
  switch (a.kind) {
    case "grant": return `Conceder ${a.amount} ${a.type} a ${p.nickname}.`;
    case "item":  return `Conceder item "${a.item}" a ${p.nickname}.`;
    case "suspend": return `SUSPENDER ${p.nickname}. Ação crítica — motivo obrigatório.`;
    case "ban":     return `BANIR ${p.nickname}. Ação crítica e irreversível no mock — motivo obrigatório.`;
    case "reset":   return `RESETAR ${p.nickname} — todos os dados de progresso zerados. Motivo obrigatório.`;
  }
}
