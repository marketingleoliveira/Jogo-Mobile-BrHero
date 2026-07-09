import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getPaymentsConfig,
  setPaymentsConfig,
  type PaymentsConfig,
  type PaymentTransaction,
} from "@/lib/game/payments";
import {
  getPaymentProviders,
  setPaymentProviders,
  resolveActiveProvider,
  type PaymentProvidersConfig,
  type PaymentProvider,
} from "@/lib/game/payment-providers";
import { persistRemoteLog } from "@/lib/admin/supabase-admin";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Pagamentos — BRHero Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Page,
});

const STATUS_STYLES: Record<PaymentTransaction["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  failed: "bg-red-500/20 text-red-300 border-red-500/40",
  refunded: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

function Page() {
  const [cfg, setCfg] = useState<PaymentsConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [txs, setTxs] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<PaymentProvidersConfig | null>(null);
  const [savingProviders, setSavingProviders] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payment_transactions")
      .select("id,offer_id,offer_snapshot,amount_cents,currency,status,provider,provider_ref,reward_delivered,reward_delivered_at,client_consumed_at,error_message,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setTxs((data ?? []) as unknown as PaymentTransaction[]);
    setLoading(false);
  };

  useEffect(() => {
    void getPaymentsConfig(true).then(setCfg);
    void getPaymentProviders(true).then(setProviders);
    void refresh();
  }, []);

  const saveProviders = async (next: PaymentProvidersConfig) => {
    setSavingProviders(true);
    const ok = await setPaymentProviders(next);
    setSavingProviders(false);
    if (ok) { setProviders(next); toast.success("Providers atualizados."); }
    else toast.error("Falha ao salvar providers.");
  };

  const moveInPriority = (p: PaymentProvider, dir: -1 | 1) => {
    if (!providers) return;
    const list = [...providers.priority];
    const i = list.indexOf(p);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    void saveProviders({ ...providers, priority: list });
  };

  const save = async (next: PaymentsConfig) => {
    setSaving(true);
    const ok = await setPaymentsConfig(next);
    setSaving(false);
    if (ok) { setCfg(next); toast.success("Configuração salva."); }
    else toast.error("Falha ao salvar. Verifique permissão de admin.");
  };

  const markStatus = async (tx: PaymentTransaction, status: PaymentTransaction["status"]) => {
    const patch: Record<string, unknown> = { status };
    if (status === "paid") { patch.reward_delivered = true; patch.reward_delivered_at = new Date().toISOString(); }
    const { error } = await supabase
      .from("payment_transactions")
      .update(patch as never)
      .eq("id", tx.id);
    if (error) { toast.error(error.message); return; }
    await persistRemoteLog({
      module: "shop",
      action: "critical",
      target: tx.id,
      reason: `payment ${tx.offer_id} → ${status}`,
      before: { status: tx.status },
      after: { status },
      role: "super_admin",
    });
    toast.success(`Transação marcada como ${status}.`);
    void refresh();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-emerald-400" />
        <div>
          <h1 className="text-2xl font-semibold">Pagamentos (Sandbox)</h1>
          <p className="text-sm text-slate-400">
            Feature flag global. Recompensas só são entregues após marcar a transação como <b>paid</b>.
          </p>
        </div>
      </header>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader><CardTitle className="text-slate-100">Configuração</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Switch
              checked={cfg?.enabled ?? false}
              disabled={!cfg || saving}
              onCheckedChange={(v) => cfg && save({ ...cfg, enabled: v })}
            />
            <span className="text-sm">
              {cfg?.enabled ? "Pagamentos ATIVOS (sandbox)" : "Pagamentos DESATIVADOS"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Provider</span>
            <Select
              value={cfg?.provider ?? "sandbox"}
              onValueChange={(v) => cfg && save({ ...cfg, provider: v as PaymentsConfig["provider"] })}
              disabled={!cfg || saving}
            >
              <SelectTrigger className="w-40 bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="stripe">Stripe (futuro)</SelectItem>
                <SelectItem value="google_play">Google Play (futuro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="border-yellow-500/40 text-yellow-300">
            Modo teste — nenhum valor real é cobrado
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="text-slate-100">Providers de pagamento (feature flags)</CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Ativo agora: <b className="text-emerald-300">{providers ? (resolveActiveProvider(providers) ?? "nenhum") : "…"}</b>.
            Integração real do Stripe/Google Play ainda não implementada — ligar não cria checkout real.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {(["stripe", "sandbox", "google_play"] as const).map((p) => {
              const key = `${p}_enabled` as const;
              const on = providers?.[key] ?? false;
              return (
                <div key={p} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium capitalize">{p.replace("_", " ")}</div>
                    <div className="text-xs text-slate-500">
                      {p === "stripe" && "Real — desligado"}
                      {p === "sandbox" && "Teste — sem cobrança"}
                      {p === "google_play" && "Real — desligado"}
                    </div>
                  </div>
                  <Switch
                    checked={on}
                    disabled={!providers || savingProviders}
                    onCheckedChange={(v) => providers && saveProviders({ ...providers, [key]: v })}
                  />
                </div>
              );
            })}
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-2">Prioridade (primeiro habilitado vence):</div>
            <div className="flex flex-wrap gap-2">
              {providers?.priority.map((p, idx) => (
                <div key={p} className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1">
                  <span className="text-xs text-slate-500">{idx + 1}.</span>
                  <span className="text-sm capitalize">{p.replace("_", " ")}</span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={idx === 0 || savingProviders} onClick={() => moveInPriority(p, -1)}>↑</Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={idx === (providers?.priority.length ?? 0) - 1 || savingProviders} onClick={() => moveInPriority(p, 1)}>↓</Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>



      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-100">Transações recentes</CardTitle>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma transação registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-3">Quando</th>
                    <th className="py-2 pr-3">Oferta</th>
                    <th className="py-2 pr-3">Valor</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Recompensa</th>
                    <th className="py-2 pr-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-800/60">
                      <td className="py-2 pr-3 text-slate-400">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{tx.offer_id}</td>
                      <td className="py-2 pr-3">R$ {(tx.amount_cents / 100).toFixed(2)}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className={STATUS_STYLES[tx.status]}>{tx.status}</Badge>
                      </td>
                      <td className="py-2 pr-3">{tx.reward_delivered ? "✅ entregue" : "—"}</td>
                      <td className="py-2 pr-3 flex gap-1">
                        {tx.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 border-emerald-500/40 text-emerald-300" onClick={() => markStatus(tx, "paid")}>Confirmar</Button>
                            <Button size="sm" variant="outline" className="h-7 border-red-500/40 text-red-300" onClick={() => markStatus(tx, "failed")}>Falhar</Button>
                          </>
                        )}
                        {tx.status === "paid" && (
                          <Button size="sm" variant="outline" className="h-7 border-slate-500/40 text-slate-300" onClick={() => markStatus(tx, "refunded")}>Reembolsar</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
