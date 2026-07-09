import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminPlayerRow = {
  userId: string;
  email: string | null;
  level: number;
  stage: number;
  maxStage: number;
  prestigeLevel: number;
  gems: number;
  essence: number;
  gold: number;
  updatedAt: string;
  clientUpdatedAt: string;
  createdAt: string;
};

export type ListPlayersResult = {
  rows: AdminPlayerRow[];
  total: number;
  page: number;
  pageSize: number;
};

const InputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(200).default(""),
  sort: z
    .enum(["updated", "level", "stage", "prestige", "gems"])
    .default("updated"),
});

export const listAdminPlayers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => InputSchema.parse(raw ?? {}))
  .handler(async ({ data, context }): Promise<ListPlayersResult> => {
    // Authorize: caller must be an admin.
    const { data: isAdmin, error: adminErr } = await context.supabase.rpc(
      "is_admin",
      { _user_id: context.userId },
    );
    if (adminErr) throw new Error(adminErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const sortColumn =
      data.sort === "level"
        ? "level"
        : data.sort === "stage"
          ? "max_stage"
          : data.sort === "prestige"
            ? "prestige_level"
            : data.sort === "gems"
              ? "gems"
              : "updated_at";

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    const { data: saves, error, count } = await supabaseAdmin
      .from("player_saves")
      .select(
        "user_id, level, stage, max_stage, prestige_level, gems, essence, updated_at, client_updated_at, created_at",
        { count: "exact" },
      )
      .order(sortColumn, { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);

    const userIds = (saves ?? []).map((s) => s.user_id);
    if (userIds.length === 0) {
      return { rows: [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
    }

    const { data: wallets } = await supabaseAdmin
      .from("player_wallet")
      .select("user_id, gold, gems")
      .in("user_id", userIds);
    const walletMap = new Map(
      (wallets ?? []).map((w) => [w.user_id, { gold: Number(w.gold ?? 0), gems: w.gems ?? 0 }]),
    );

    // Fetch emails via Admin Auth API (one call per user; small page size only).
    const emailMap = new Map<string, string | null>();
    await Promise.all(
      userIds.map(async (uid) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
        emailMap.set(uid, u?.user?.email ?? null);
      }),
    );

    let rows: AdminPlayerRow[] = (saves ?? []).map((s) => ({
      userId: s.user_id,
      email: emailMap.get(s.user_id) ?? null,
      level: s.level,
      stage: s.stage,
      maxStage: s.max_stage,
      prestigeLevel: s.prestige_level,
      gems: s.gems,
      essence: s.essence,
      gold: walletMap.get(s.user_id)?.gold ?? 0,
      updatedAt: s.updated_at,
      clientUpdatedAt: s.client_updated_at,
      createdAt: s.created_at,
    }));

    if (data.search) {
      const q = data.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.userId.toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q),
      );
    }

    return { rows, total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });
