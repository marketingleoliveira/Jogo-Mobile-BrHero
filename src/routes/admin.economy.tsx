import { createFileRoute } from "@tanstack/react-router";
import { Coins } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/placeholder-panel";

export const Route = createFileRoute("/admin/economy")({ component: Page });
function Page() {
  return (
    <AdminPlaceholder
      icon={Coins}
      title="Economia"
      description="Fontes e sumidouros de ouro, cristais, essência e fragmentos. Alertas de inflação."
      kpis={[
        { label: "Ouro/dia",       value: "82,4M", hint: "fonte principal: batalhas" },
        { label: "Cristais/dia",   value: "412K",  hint: "fonte: eventos + drops" },
        { label: "Essência/dia",   value: "18,2K", hint: "prestígio + arena" },
        { label: "Inflação 7d",    value: "+3,4%", hint: "dentro do alvo" },
      ]}
      columns={["Recurso", "Fonte", "Ganho 24h", "Gasto 24h", "Delta"]}
      rows={[
        ["Ouro",     "Batalhas",   "58,1M", "51,4M", "+6,7M"],
        ["Ouro",     "Masmorra",   "12,0M", "0",     "+12,0M"],
        ["Cristais", "Loja",       "0",     "180K",  "-180K"],
        ["Essência", "Rebirth",    "9,4K",  "6,1K",  "+3,3K"],
      ]}
    />
  );
}
