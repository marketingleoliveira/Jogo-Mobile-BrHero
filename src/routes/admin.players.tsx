import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/placeholder-panel";

export const Route = createFileRoute("/admin/players")({ component: Page });
function Page() {
  return (
    <AdminPlaceholder
      icon={Users}
      title="Jogadores"
      description="Busca de contas, inspeção de save, banimento, reset e concessão de recompensas."
      kpis={[
        { label: "Total contas", value: "12.480", hint: "+142 hoje" },
        { label: "Ativos 7d",    value: "4.910",  hint: "39% do total" },
        { label: "Prestige 1+",  value: "1.087",  hint: "8,7%" },
        { label: "Suspeitos",    value: "23",     hint: "flags automáticas" },
      ]}
      columns={["ID", "Apelido", "Nível", "Prestígio", "Última sessão"]}
      rows={[
        ["#2381", "GuerreiroBR", "Lv 42", "P2", "há 3min"],
        ["#1907", "LenaFire",    "Lv 37", "P1", "há 12min"],
        ["#5510", "TigreDoCerrado","Lv 55","P3","há 1h"],
        ["#0921", "PixelHero",   "Lv 19", "P0", "há 4h"],
      ]}
    />
  );
}
