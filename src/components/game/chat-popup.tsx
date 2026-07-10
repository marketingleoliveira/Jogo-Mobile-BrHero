// Chat global em popup + notificação de novas mensagens.
// - Realtime sempre ativo enquanto montado (para contar unread mesmo fechado).
// - Ao abrir: carrega histórico, marca tudo como lido, mantém scroll.
// - Sem persistir mensagens localmente: sempre lê do servidor.

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Send, Trash2, MessageSquare } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

interface ChatPopupProps {
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (n: number) => void;
}

const MAX_HISTORY = 200;
const MAX_LEN = 300;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}
function colorForUser(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 80% 70%)`;
}
function readLocalName(): string {
  try { return localStorage.getItem("brhero_display_name_v1") || ""; } catch { return ""; }
}

export function ChatPopup({ open, onClose, onUnreadChange }: ChatPopupProps) {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);

  // Auth
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  // Carrega histórico quando abre
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    void (async () => {
      const { data, error: err } = await supabase
        .from("chat_messages")
        .select("id,user_id,display_name,content,created_at")
        .order("created_at", { ascending: false })
        .limit(MAX_HISTORY);
      if (cancelled) return;
      if (err) { setError(err.message); return; }
      setMessages(((data ?? []) as ChatMessage[]).reverse());
      onUnreadChange?.(0);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
        inputRef.current?.focus();
      });
    })();
    return () => { cancelled = true; };
  }, [open, user, onUnreadChange]);

  // Realtime sempre ativo (para notificar quando fechado)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chat_messages_global_popup")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const next = [...prev, row];
            return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
          });
          if (!openRef.current && row.user_id !== user.id) {
            onUnreadChange?.(-1); // sentinela: incrementa
          } else if (openRef.current) {
            requestAnimationFrame(() => {
              const el = scrollRef.current;
              if (!el) return;
              const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
              if (near) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const old = payload.old as { id?: string };
          if (!old?.id) return;
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, onUnreadChange]);

  const send = useCallback(async () => {
    if (!user) return;
    const content = input.trim();
    if (!content) return;
    setSending(true); setError(null);
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const display_name =
      readLocalName() ||
      (meta.full_name as string) ||
      (meta.name as string) ||
      user.email?.split("@")[0] ||
      "Herói";
    const { error: err } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, display_name, content: content.slice(0, MAX_LEN) });
    setSending(false);
    if (err) { setError(err.message); return; }
    setInput("");
    inputRef.current?.focus();
  }, [user, input]);

  const remove = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("chat_messages").delete().eq("id", id);
    if (err) setError(err.message);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-xl sm:rounded-xl border-2 border-[#8B4513] bg-[#2D1B0E] text-amber-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-2 border-b-2 border-[#8B4513] bg-gradient-to-b from-[#3E2723] to-[#2D1B0E] px-3 py-2">
          <h2 className="flex items-center gap-1.5 text-sm font-black">
            <MessageSquare className="h-4 w-4" /> Chat Global
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] opacity-70">{messages.length} msgs</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-amber-900/60 bg-black/40 p-1 text-amber-200 hover:bg-black/60"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {!user ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm opacity-80">Faça login para conversar em tempo real.</p>
            <Link
              to="/"
              className="rounded-md border-2 border-amber-500 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/30"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
              {messages.length === 0 ? (
                <p className="mt-8 text-center text-xs opacity-60">Nenhuma mensagem ainda. Seja o primeiro!</p>
              ) : messages.map((m) => {
                const own = m.user_id === user.id;
                return (
                  <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                    <div className={`group max-w-[85%] rounded-lg border border-black/50 px-2.5 py-1.5 text-xs shadow ${own ? "bg-amber-700/40" : "bg-black/40"}`}>
                      <div className="flex items-baseline gap-2">
                        <Link
                          to="/perfil/$userId"
                          params={{ userId: m.user_id }}
                          className="font-black hover:underline"
                          style={{ color: colorForUser(m.user_id) }}
                          onClick={onClose}
                        >
                          {m.display_name}
                        </Link>
                        <span className="text-[9px] opacity-60">{formatTime(m.created_at)}</span>
                        {own && (
                          <button
                            type="button"
                            onClick={() => void remove(m.id)}
                            className="ml-auto opacity-0 group-hover:opacity-70 hover:opacity-100"
                            aria-label="Apagar mensagem"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="mt-0.5 whitespace-pre-wrap break-words">{m.content}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="border-t border-red-500/50 bg-red-950/60 px-3 py-1 text-[11px] text-red-200">{error}</div>
            )}

            <form
              className="flex items-center gap-2 border-t-2 border-[#8B4513] bg-black/60 px-2 py-2"
              onSubmit={(e) => { e.preventDefault(); void send(); }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
                placeholder="Escreva uma mensagem…"
                maxLength={MAX_LEN}
                disabled={sending}
                className="flex-1 rounded-md border border-amber-900/60 bg-[#1A0F08] px-2 py-1.5 text-sm text-amber-50 placeholder:text-amber-100/40 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="flex items-center gap-1 rounded-md border-2 border-amber-500 bg-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-100 hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> Enviar
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
