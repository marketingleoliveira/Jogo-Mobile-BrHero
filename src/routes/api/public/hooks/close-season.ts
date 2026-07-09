// Fase 4 · Bloco 4 — Fechamento automático de temporada.
// Rota pública protegida por header `x-cron-secret` (comparado com env CRON_SECRET).
// Não altera personagem, rebirth, pets, runas ou skins. Apenas gera registros em
// `season_rewards` (UNIQUE user_id,season_key,category → idempotente).
//
// ─────────────────────────────────────────────────────────────────────────────
// AGENDAMENTO pg_cron (rodar UMA vez via SQL do projeto):
//
//   -- Semanal: toda segunda-feira 00:05 UTC, fecha a semana ISO anterior
//   select cron.schedule(
//     'brhero-close-week',
//     '5 0 * * 1',
//     $$
//     select net.http_post(
//       url:='https://project--23a59135-60ed-4cd8-9a32-fe35291633ee.lovable.app/api/public/hooks/close-season',
//       headers:='{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
//       body:='{"type":"weekly"}'::jsonb
//     );
//     $$
//   );
//
//   -- Mensal: todo dia 1 às 00:10 UTC, fecha o mês UTC anterior
//   select cron.schedule(
//     'brhero-close-month',
//     '10 0 1 * *',
//     $$
//     select net.http_post(
//       url:='https://project--23a59135-60ed-4cd8-9a32-fe35291633ee.lovable.app/api/public/hooks/close-season',
//       headers:='{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
//       body:='{"type":"monthly"}'::jsonb
//     );
//     $$
//   );
// ─────────────────────────────────────────────────────────────────────────────

import { createFileRoute } from "@tanstack/react-router";
import { currentSeasonKey, rewardForTier, rewardTierForRank } from "@/lib/game/seasons";

const CATEGORIES = ["stage", "rebirth", "tower", "arena", "hero_power"] as const;
type Category = (typeof CATEGORIES)[number];

function previousSeasonKey(type: "weekly" | "monthly"): string {
  const now = new Date();
  if (type === "monthly") {
    // Primeiro dia do mês atual (UTC) - 1 dia = último dia do mês anterior
    const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const prev = new Date(firstOfThisMonth.getTime() - 24 * 3600_000);
    return currentSeasonKey("monthly", prev);
  }
  const prev = new Date(now.getTime() - 7 * 24 * 3600_000);
  return currentSeasonKey("weekly", prev);
}

export const Route = createFileRoute("/api/public/hooks/close-season")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.CRON_SECRET;
        const provided = request.headers.get("x-cron-secret");
        if (!expected || !provided || provided !== expected) {
          console.warn("[close-season] unauthorized call");
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: { type?: "weekly" | "monthly"; season_key?: string } = {};
        try { body = (await request.json()) as typeof body; } catch { /* empty body */ }

        const seasonKey = body.season_key ?? (body.type ? previousSeasonKey(body.type) : null);
        if (!seasonKey) {
          return new Response(JSON.stringify({ error: "missing type or season_key" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        console.log(`[close-season] starting season_key=${seasonKey}`);

        // Usuários que jogaram nesta temporada
        const { data: users, error: usersErr } = await supabaseAdmin
          .from("leaderboards")
          .select("user_id")
          .eq("season_key", seasonKey);
        if (usersErr) {
          console.error("[close-season] failed to list users:", usersErr.message);
          return new Response(JSON.stringify({ error: usersErr.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
        const uniqueUsers = Array.from(new Set((users ?? []).map((u) => u.user_id as string)));
        console.log(`[close-season] users=${uniqueUsers.length} categories=${CATEGORIES.length}`);

        let granted = 0, skipped = 0, failed = 0;

        for (const uid of uniqueUsers) {
          for (const category of CATEGORIES) {
            try {
              const { data: mine } = await supabaseAdmin
                .from("leaderboards")
                .select("score")
                .eq("user_id", uid).eq("category", category).eq("season_key", seasonKey)
                .maybeSingle();
              if (!mine) { skipped++; continue; }

              const { count } = await supabaseAdmin
                .from("leaderboards")
                .select("user_id", { count: "exact", head: true })
                .eq("category", category).eq("season_key", seasonKey)
                .gt("score", mine.score);
              const rank = (count ?? 0) + 1;
              const tier = rewardTierForRank(rank);
              const reward = rewardForTier(tier);

              // Idempotente: UNIQUE(user_id, season_key, category) + ignoreDuplicates
              const { error } = await supabaseAdmin
                .from("season_rewards")
                .upsert(
                  {
                    user_id: uid, season_key: seasonKey, category, rank, tier,
                    reward: reward as unknown as Record<string, unknown>,
                  } as never,
                  { onConflict: "user_id,season_key,category", ignoreDuplicates: true },
                );
              if (error) { failed++; console.error(`[close-season] upsert fail uid=${uid} cat=${category}:`, error.message); }
              else granted++;
            } catch (e) {
              failed++;
              console.error(`[close-season] exception uid=${uid} cat=${category}:`, (e as Error).message);
            }
          }
        }

        const summary = { season_key: seasonKey, users: uniqueUsers.length, granted, skipped, failed };
        console.log("[close-season] done", summary);
        return new Response(JSON.stringify({ ok: true, ...summary }), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
