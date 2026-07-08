import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/placeholder-panel";

export const Route = createFileRoute("/admin/events")({ component: Page });
function Page() {
  return (
    <AdminPlaceholder
      icon={CalendarClock}
      title="Eventos"
      description="Agendamento, ativação e monitoramento de eventos sazonais e temporários."
      kpis={[
        { label: "Ativos",     value: "1",  hint: "Festival dos Heróis" },
        { label: "Agendados",  value: "2",  hint: "próximos 30d" },
        { label: "Participantes","value": "3.140", hint: "72% do DAU" } as { label: string; value: string; hint: string },
        { label: "Medalhas emit.", value: "1,2M", hint: "hoje" },
      ]}
      columns={["Evento", "Status", "Início", "Fim", "Recompensa top"]}
      rows={[
        ["Festival dos Heróis", "Ativo",    "01/07", "08/07", "Aura Lendária"],
        ["Copa Brasil",         "Agendado", "10/07", "17/07", "Skin Brasil"],
        ["Semana do Cerrado",   "Rascunho", "—",     "—",     "—"],
      ]}
    />
  );
}
