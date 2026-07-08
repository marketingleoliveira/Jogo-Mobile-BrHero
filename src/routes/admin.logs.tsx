import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/placeholder-panel";

export const Route = createFileRoute("/admin/logs")({ component: Page });
function Page() {
  return (
    <AdminPlaceholder
      icon={ScrollText}
      title="Logs de Auditoria"
      description="Ações de GM, compras, alterações de balanceamento e eventos automáticos do sistema."
      kpis={[
        { label: "Eventos 24h", value: "18.204" },
        { label: "Ações GM",    value: "42" },
        { label: "Erros",       value: "3",  hint: "não críticos" },
        { label: "Bloqueios",   value: "1" },
      ]}
      columns={["Timestamp", "Autor", "Categoria", "Descrição", "Alvo"]}
      rows={[
        ["12:41:03", "system",  "econ",     "Rebirth executado",              "#2381"],
        ["12:39:47", "gm.root", "reward",   "Concedido BETA100",              "#1907"],
        ["12:36:12", "system",  "shop",     "Compra baú evento",              "#5510"],
        ["12:32:55", "gm.root", "balance",  "Torre HP/andar +8% → +8% (noop)","global"],
        ["12:28:04", "system",  "cosmetic", "Skin Brasil desbloqueada",       "#0921"],
      ]}
    />
  );
}
