import { createFileRoute } from "@tanstack/react-router";
import { Sliders } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/placeholder-panel";

export const Route = createFileRoute("/admin/balancing")({ component: Page });
function Page() {
  return (
    <AdminPlaceholder
      icon={Sliders}
      title="Balanceamento"
      description="Multiplicadores globais de ouro, XP, drop, dificuldade da torre e recompensas de arena."
      kpis={[
        { label: "Mult. Ouro",   value: "1,00x" },
        { label: "Mult. XP",     value: "1,00x" },
        { label: "Mult. Drop",   value: "1,00x" },
        { label: "Dif. Torre",   value: "Normal" },
      ]}
      columns={["Sistema", "Parâmetro", "Valor atual", "Recomendado", "Última mudança"]}
      rows={[
        ["Batalha", "Ouro/kill",         "1,00x", "1,00x", "há 3d"],
        ["Torre",   "HP inimigo/andar",  "+8%",   "+8%",   "há 7d"],
        ["Arena",   "Essência vit.",     "1",     "1",     "há 2d"],
        ["Runa",    "Bônus max/nível",   "20%",   "20%",   "estável"],
      ]}
    />
  );
}
