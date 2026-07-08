import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/placeholder-panel";

export const Route = createFileRoute("/admin/shop")({ component: Page });
function Page() {
  return (
    <AdminPlaceholder
      icon={ShoppingBag}
      title="Loja"
      description="Ofertas, packs de cristais, preços e limites diários. Sem pagamento real por enquanto."
      kpis={[
        { label: "Ofertas ativas", value: "12" },
        { label: "Vendas mock 24h", value: "R$ 0",  hint: "beta" },
        { label: "Cristais gastos", value: "180K" },
        { label: "Conv. cliques",  value: "6,3%" },
      ]}
      columns={["SKU", "Nome", "Preço", "Vendas 24h", "Estado"]}
      rows={[
        ["pack_small",  "Pack Pequeno",  "50 💎",  "412",   "ativo"],
        ["pack_medium", "Pack Médio",    "180 💎", "128",   "ativo"],
        ["pack_epic",   "Pack Épico",    "500 💎", "37",    "ativo"],
        ["chest_evt",   "Baú do Evento", "40 🏅",  "1.204", "evento"],
      ]}
    />
  );
}
