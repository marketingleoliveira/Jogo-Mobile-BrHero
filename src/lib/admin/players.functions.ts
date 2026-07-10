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
  hasSave: boolean;
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

async function ensureAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await context.supabase.rpc("is_admin", {
    _user_id: context.userId,
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden");
}

export const listAdminPlayers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => InputSchema.parse(raw ?? {}))
  .handler(async ({ data, context }): Promise<ListPlayersResult> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // 1) Enumerate ALL real players from auth.users (source of truth).
    const users: { id: string; email: string | null; created_at: string }[] = [];
    let authPage = 1;
    // Fetch up to 5000 users (50 per page * 100 pages max) — safe for small games.
    for (let i = 0; i < 100; i++) {
      const { data: page, error } = await supabaseAdmin.auth.admin.listUsers({
        page: authPage,
        perPage: 200,
      });
      if (error) throw new Error(error.message);
      const list = page?.users ?? [];
      if (list.length === 0) break;
      for (const u of list) {
        users.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at ?? new Date().toISOString(),
        });
      }
      if (list.length < 200) break;
      authPage++;
    }

    const userIds = users.map((u) => u.id);

    // 2) Left-join saves + wallets in one query each.
    const [savesRes, walletsRes] = await Promise.all([
      userIds.length
        ? supabaseAdmin
            .from("player_saves")
            .select(
              "user_id, level, stage, max_stage, prestige_level, gems, essence, updated_at, client_updated_at",
            )
            .in("user_id", userIds)
        : Promise.resolve({ data: [], error: null } as const),
      userIds.length
        ? supabaseAdmin
            .from("player_wallet")
            .select("user_id, gold, gems")
            .in("user_id", userIds)
        : Promise.resolve({ data: [], error: null } as const),
    ]);
    if (savesRes.error) throw new Error(savesRes.error.message);
    if (walletsRes.error) throw new Error(walletsRes.error.message);

    const saveMap = new Map(
      (savesRes.data ?? []).map((s: any) => [s.user_id, s]),
    );
    const walletMap = new Map(
      (walletsRes.data ?? []).map((w: any) => [
        w.user_id,
        { gold: Number(w.gold ?? 0), gems: Number(w.gems ?? 0) },
      ]),
    );

    let rows: AdminPlayerRow[] = users.map((u) => {
      const s: any = saveMap.get(u.id);
      const w = walletMap.get(u.id);
      return {
        userId: u.id,
        email: u.email,
        level: s?.level ?? 1,
        stage: s?.stage ?? 1,
        maxStage: s?.max_stage ?? 1,
        prestigeLevel: s?.prestige_level ?? 0,
        gems: s?.gems ?? w?.gems ?? 0,
        essence: s?.essence ?? 0,
        gold: w?.gold ?? 0,
        updatedAt: s?.updated_at ?? u.created_at,
        clientUpdatedAt: s?.client_updated_at ?? u.created_at,
        createdAt: u.created_at,
        hasSave: Boolean(s),
      };
    });

    // 3) Search / sort / paginate in JS (small player base).
    if (data.search) {
      const q = data.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.userId.toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) => {
      switch (data.sort) {
        case "level": return b.level - a.level;
        case "stage": return b.maxStage - a.maxStage;
        case "prestige": return b.prestigeLevel - a.prestigeLevel;
        case "gems": return b.gems - a.gems;
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    const total = rows.length;
    const from = (data.page - 1) * data.pageSize;
    const paged = rows.slice(from, from + data.pageSize);
    return { rows: paged, total, page: data.page, pageSize: data.pageSize };
  });

// ---------- Edição individual ----------

const UpdateSchema = z.object({
  userId: z.string().uuid(),
  patch: z.object({
    level: z.number().int().min(1).max(9999).optional(),
    stage: z.number().int().min(1).max(999999).optional(),
    maxStage: z.number().int().min(1).max(999999).optional(),
    prestigeLevel: z.number().int().min(0).max(9999).optional(),
    essence: z.number().int().min(0).max(1_000_000_000).optional(),
    gems: z.number().int().min(0).max(1_000_000_000).optional(),
    gold: z.number().int().min(0).max(1_000_000_000_000).optional(),
  }),
  reason: z.string().trim().max(240).default(""),
});

export type UpdateAdminPlayerInput = z.infer<typeof UpdateSchema>;

export const updateAdminPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => UpdateSchema.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { userId, patch } = data;

    // --- 1) Atualiza player_saves (mirror + save_data JSONB) ---
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("player_saves")
      .select("save_data, level, stage, max_stage, prestige_level, gems, essence")
      .eq("user_id", userId)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);

    const now = new Date().toISOString();
    const base = (existing?.save_data as Record<string, unknown> | null) ?? {};
    const merged: Record<string, unknown> = { ...base };
    if (patch.level !== undefined) merged.level = patch.level;
    if (patch.stage !== undefined) merged.stage = patch.stage;
    if (patch.maxStage !== undefined) merged.maxStage = patch.maxStage;
    if (patch.prestigeLevel !== undefined) merged.prestigeLevel = patch.prestigeLevel;
    if (patch.essence !== undefined) merged.essence = patch.essence;
    if (patch.gems !== undefined) merged.gems = patch.gems;
    if (patch.gold !== undefined) merged.gold = patch.gold;
    merged.lastSeenAt = Date.now();

    const savesPayload = {
      user_id: userId,
      save_data: merged as never,
      save_version: 1,
      level: patch.level ?? existing?.level ?? 1,
      stage: patch.stage ?? existing?.stage ?? 1,
      max_stage: patch.maxStage ?? existing?.max_stage ?? 1,
      prestige_level: patch.prestigeLevel ?? existing?.prestige_level ?? 0,
      gems: patch.gems ?? existing?.gems ?? 0,
      essence: patch.essence ?? existing?.essence ?? 0,
      client_updated_at: now,
    };
    const { error: upErr } = await supabaseAdmin
      .from("player_saves")
      .upsert(savesPayload, { onConflict: "user_id" });
    if (upErr) throw new Error(upErr.message);

    // --- 2) Atualiza player_wallet (gems/gold espelho) ---
    if (patch.gems !== undefined || patch.gold !== undefined) {
      const { data: w } = await supabaseAdmin
        .from("player_wallet")
        .select("gems, gold")
        .eq("user_id", userId)
        .maybeSingle();
      const wPayload = {
        user_id: userId,
        gems: patch.gems ?? w?.gems ?? 0,
        gold: patch.gold ?? Number(w?.gold ?? 0),
      };
      const { error: wErr } = await supabaseAdmin
        .from("player_wallet")
        .upsert(wPayload, { onConflict: "user_id" });
      if (wErr) throw new Error(wErr.message);
    }

    // --- 3) Audit log (best-effort) ---
    try {
      await supabaseAdmin.from("admin_audit_logs").insert({
        admin_id: context.userId,
        admin_role: "super_admin",
        module: "players",
        action: "edit",
        target: userId,
        reason: data.reason || "Edição manual via painel",
        after: patch as never,
      });
    } catch { /* audit não bloqueia */ }

    return { ok: true };
  });
