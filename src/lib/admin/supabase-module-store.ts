// Adapter genérico para persistir entidades de módulos do Admin CMS no Supabase.
// Silencioso em caso de erro: mocks locais continuam sendo fonte de verdade
// quando não há sessão/permissão/tabela.

import { supabase } from "@/integrations/supabase/client";
import { isSupabaseAdminAvailable } from "./supabase-admin";

export type ModuleName = "codes" | "liveops" | "shop" | "items";

export interface RemoteEntity<T = unknown> {
  entity_id: string;
  data: T;
  updated_at: string;
}

/** Lê todas as entidades de um módulo. Retorna null se indisponível. */
export async function remoteList<T>(module: ModuleName): Promise<RemoteEntity<T>[] | null> {
  if (!(await isSupabaseAdminAvailable())) return null;
  try {
    const { data, error } = await supabase
      .from("admin_module_entities")
      .select("entity_id,data,updated_at")
      .eq("module", module);
    if (error || !data) return null;
    return data.map((r) => ({
      entity_id: r.entity_id,
      data: r.data as T,
      updated_at: r.updated_at,
    }));
  } catch {
    return null;
  }
}

/** Upsert de uma entidade. Fire-and-forget seguro. */
export async function remoteUpsert(module: ModuleName, entityId: string, data: unknown): Promise<void> {
  if (!(await isSupabaseAdminAvailable())) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("admin_module_entities").upsert(
      {
        module,
        entity_id: entityId,
        data: data as never,
        updated_by: session?.user.id ?? null,
      },
      { onConflict: "module,entity_id" },
    );
  } catch { /* silencioso */ }
}

/** Remove uma entidade. Fire-and-forget seguro. */
export async function remoteDelete(module: ModuleName, entityId: string): Promise<void> {
  if (!(await isSupabaseAdminAvailable())) return;
  try {
    await supabase
      .from("admin_module_entities")
      .delete()
      .eq("module", module)
      .eq("entity_id", entityId);
  } catch { /* silencioso */ }
}

/**
 * Hidrata um módulo a partir do Supabase se disponível, chamando `apply`
 * com a lista de entidades remotas. Silencioso e não bloqueante.
 */
export async function hydrateModule<T>(
  module: ModuleName,
  apply: (entities: T[]) => void,
): Promise<void> {
  const list = await remoteList<T>(module);
  if (!list || list.length === 0) return;
  apply(list.map((r) => r.data));
}

// ---- Balanceamento (usa admin_settings, chave/valor único) ----

const BALANCING_KEY = "balancing.config";

export async function remoteLoadBalancing<T>(): Promise<T | null> {
  if (!(await isSupabaseAdminAvailable())) return null;
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", BALANCING_KEY)
      .maybeSingle();
    if (error || !data) return null;
    return data.value as T;
  } catch {
    return null;
  }
}

export async function remoteSaveBalancing(value: unknown): Promise<void> {
  if (!(await isSupabaseAdminAvailable())) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("admin_settings").upsert(
      { key: BALANCING_KEY, value: value as never, updated_by: session?.user.id ?? null },
      { onConflict: "key" },
    );
  } catch { /* silencioso */ }
}
