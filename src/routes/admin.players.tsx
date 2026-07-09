import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, Search, ShieldCheck, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listAdminPlayers } from "@/lib/admin/players.functions";

export const Route = createFileRoute("/admin/players")({ component: PlayersPage });

function PlayersPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"updated" | "level" | "stage" | "prestige" | "gems">("updated");
  const [page, setPage] = useState(1);
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
            Dados reais de <code>player_saves</code>. Ordene por atividade, nível ou prestígio.
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
            <SelectTrigger className="md:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Última atividade</SelectItem>
              <SelectItem value="level">Nível</SelectItem>
              <SelectItem value="stage">Stage máx.</SelectItem>
              <SelectItem value="prestige">Prestígio</SelectItem>
              <SelectItem value="gems">Cristais</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.userId}>
                  <TableCell className="font-mono text-xs">{p.userId.slice(0, 8)}…</TableCell>
                  <TableCell className="text-sm">{p.email ?? "—"}</TableCell>
                  <TableCell>Lv {p.level}</TableCell>
                  <TableCell>{p.stage} / {p.maxStage}</TableCell>
                  <TableCell>P{p.prestigeLevel}</TableCell>
                  <TableCell>{p.gems.toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{p.gold.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !query.isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    {query.error
                      ? `Erro: ${(query.error as Error).message}`
                      : "Nenhum jogador ainda. Os dados aparecem aqui assim que alguém joga e salva progresso."}
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
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
