import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/placeholder-panel";

export const Route = createFileRoute("/admin/items")({ component: Page });
function Page() {
  return (
    <AdminPlaceholder
      icon={Package}
      title="Itens"
      description="Catálogo de equipamentos, raridades, drop rate e ajustes de bônus por slot."
      kpis={[
        { label: "Itens base",   value: "48" },
        { label: "Raridades",    value: "5",  hint: "Comum → Lendário" },
        { label: "Drop médio",   value: "12%" },
        { label: "Alertas",      value: "0" },
      ]}
      columns={["Slot", "Nome base", "Raridade", "ATK", "HP"]}
      rows={[
        ["arma",    "Espada",   "Épico",     "+42", "0"],
        ["elmo",    "Elmo",     "Raro",      "0",   "+80"],
        ["armadura","Armadura", "Lendário",  "+8",  "+220"],
        ["botas",   "Botas",    "Comum",     "0",   "+18"],
      ]}
    />
  );
}
