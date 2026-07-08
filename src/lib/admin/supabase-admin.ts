// Camada de acesso Supabase para o Admin CMS.
// Faz fallback silencioso para os mocks quando Supabase não está disponível
// (sem sessão, sem tabelas, sem rede). Nada quebra o Admin CMS mock existente.

import { supabase } from "@/integrations/supabase/client";
import type { AdminModule, AdminRole } from "./rbac";

export interface RemoteAdmin {
  userId: string;
  role: AdminRole;
  displayName: string;
}

let cachedAvailability: boolean | null = null;

/** Retorna true se existir sessão + o usuário for admin no backend. */
export async function isSupabaseAdminAvailable(): Promise<boolean> {
  if (cachedAvailability !== null) return cachedAvailability;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { cachedAvailability = false; return false; }
    const { data, error } = await supabase.rpc("is_admin", { _user_id: session.user.id });
    cachedAvailability = !error && data === true;
    return cachedAvailability;
  } catch {
    cachedAvailability = false;
    return false;
  }
}

export function resetSupabaseAdminCache() { cachedAvailability = null; }

/** Retorna papel + perfil do admin autenticado ou null. */
export async function getRemoteAdmin(): Promise<RemoteAdmin | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const uid = session.user.id;
    const [roleRes, profileRes] = await Promise.all([
      supabase.rpc("get_admin_role", { _user_id: uid }),
      supabase.from("admin_profiles").select("display_name").eq("id", uid).maybeSingle(),
    ]);
    if (roleRes.error || !roleRes.data) return null;
    return {
      userId: uid,
      role: roleRes.data as AdminRole,
      displayName: profileRes.data?.display_name ?? session.user.email ?? "Admin",
    };
  } catch {
    return null;
  }
}

/** Verifica permissão via RPC. Fallback true (mocks já checam via RBAC local). */
export async function checkRemotePermission(module: AdminModule, action: string): Promise<boolean | null> {
  try {
    const { data, error } = await supabase.rpc("has_admin_permission", {
      _module: module, _action: action,
    });
    if (error) return null;
    return data === true;
  } catch {
    return null;
  }
}

export interface RemoteLogInput {
  module: AdminModule;
  action: string;
  target: string;
  reason: string;
  before?: unknown;
  after?: unknown;
  role: AdminRole;
}

/** Persiste um log de auditoria. Silencioso em caso de erro. */
export async function persistRemoteLog(input: RemoteLogInput): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("admin_audit_logs").insert({
      admin_id: session.user.id,
      admin_role: input.role,
      module: input.module,
      action: input.action,
      target: input.target,
      reason: input.reason,
      before: (input.before ?? null) as never,
      after: (input.after ?? null) as never,
    });
  } catch {
    /* fallback silencioso */
  }
}

/** Bootstrap: reivindica papel de Super Admin se ainda não existir. */
export async function claimSuperAdmin(displayName?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc("claim_super_admin", {
      _display_name: displayName ?? undefined,
    });
    if (error) return { ok: false, error: error.message };
    resetSupabaseAdminCache();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}
