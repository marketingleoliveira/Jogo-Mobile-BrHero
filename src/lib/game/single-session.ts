// Enforça UMA sessão ativa por conta.
// Ao logar, gera um session_id novo e grava em `player_sessions`.
// Um poll periódico verifica se o session_id no banco ainda é o nosso;
// se outro dispositivo tomou o lugar, desloga com uma mensagem clara.
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "brhero_session_id_v1";
const POLL_MS = 15_000;

function newSessionId(): string {
  try { return crypto.randomUUID(); } catch { /* fallback */ }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function claimSession(userId: string, sessionId: string) {
  await supabase.from("player_sessions").upsert(
    {
      user_id: userId,
      session_id: sessionId,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 240) : null,
    },
    { onConflict: "user_id" },
  );
}

export function useSingleSessionGuard(onKick?: (reason: string) => void) {
  const kickedRef = useRef(false);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let mySession = "";
    let myUserId = "";

    const kick = async (reason: string) => {
      if (kickedRef.current) return;
      kickedRef.current = true;
      try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
      try { await supabase.auth.signOut(); } catch { /* noop */ }
      if (onKick) onKick(reason);
      else alert(reason);
    };

    const setup = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid || stop) return;
      myUserId = uid;

      // Sessão nova por login (ou reaproveita a persistida na aba atual).
      let sid = "";
      try { sid = localStorage.getItem(LS_KEY) ?? ""; } catch { /* noop */ }
      if (!sid) {
        sid = newSessionId();
        try { localStorage.setItem(LS_KEY, sid); } catch { /* noop */ }
      }
      mySession = sid;
      await claimSession(uid, sid);

      // Poll: se outro device virou "dono", desloga.
      timer = setInterval(async () => {
        if (stop) return;
        const { data: row } = await supabase
          .from("player_sessions")
          .select("session_id")
          .eq("user_id", myUserId)
          .maybeSingle();
        if (!row) {
          // Alguém apagou / conta removida: reclama esta sessão.
          await claimSession(myUserId, mySession);
          return;
        }
        if (row.session_id !== mySession) {
          await kick("⚠️ Sua conta foi acessada em outro dispositivo. Esta sessão foi desconectada.");
        }
      }, POLL_MS);
    };

    void setup();

    // Renova ao trocar de aba/voltar do background.
    const onVisible = () => {
      if (document.visibilityState === "visible" && myUserId && mySession && !kickedRef.current) {
        void claimSession(myUserId, mySession);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    // Reage a mudanças de auth.
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const sid = newSessionId();
        try { localStorage.setItem(LS_KEY, sid); } catch { /* noop */ }
        mySession = sid;
        myUserId = session.user.id;
        kickedRef.current = false;
        await claimSession(myUserId, sid);
      }
      if (event === "SIGNED_OUT") {
        try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
      }
    });

    return () => {
      stop = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      sub.subscription.unsubscribe();
    };
  }, [onKick]);
}

export async function forceSignOut() {
  try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
  await supabase.auth.signOut();
}
