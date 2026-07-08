import { createFileRoute } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/placeholder-panel";

export const Route = createFileRoute("/admin/codes")({ component: Page });
function Page() {
  return (
    <AdminPlaceholder
      icon={Ticket}
      title="Códigos"
      description="Criação, expiração e monitoramento de códigos promocionais e de imprensa."
      kpis={[
        { label: "Códigos ativos", value: "3" },
        { label: "Resgates 24h",   value: "1.812" },
        { label: "Únicos",         value: "1.702" },
        { label: "Expirados",      value: "7" },
      ]}
      columns={["Código", "Recompensa", "Resgates", "Limite/save", "Status"]}
      rows={[
        ["BETA100",  "100 💎",                  "812",  "1x", "ativo"],
        ["BRHERO",   "50k 🪙 + baú épico",      "610",  "1x", "ativo"],
        ["FUNDADOR", "Aura Lendária",           "390",  "1x", "ativo"],
      ]}
    />
  );
}
