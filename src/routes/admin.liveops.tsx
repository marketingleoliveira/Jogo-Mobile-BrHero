import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/placeholder-panel";

export const Route = createFileRoute("/admin/liveops")({ component: Page });
function Page() {
  return (
    <AdminPlaceholder
      icon={Radio}
      title="LiveOps"
      description="Anúncios, banners in-game, push notifications e feature flags remotas."
      kpis={[
        { label: "Feature flags", value: "8",  hint: "3 ativas" },
        { label: "Banners live",  value: "2" },
        { label: "Push 24h",      value: "0",  hint: "beta" },
        { label: "Incidentes",    value: "0" },
      ]}
      columns={["Flag", "Escopo", "Estado", "Rollout", "Atualizado"]}
      rows={[
        ["arena_pvp_beta",   "global",   "on",  "100%", "há 1d"],
        ["runes_v2",         "beta",     "off", "0%",   "há 2d"],
        ["shop_pack_epic",   "global",   "on",  "100%", "há 6h"],
        ["event_copa_brasil","agendado", "off", "0%",   "há 5min"],
      ]}
    />
  );
}
