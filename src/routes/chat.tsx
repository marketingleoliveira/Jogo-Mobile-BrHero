import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Send, MessageSquare, Trash2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat Global — BRHero" },
      { name: "description", content: "Converse em tempo real com outros heróis logados no BRHero." },
      { property: "og:title", content: "Chat Global — BRHero" },
      { property: "og:description", content: "Chat global multiplayer em tempo real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
    ],
  }),
  component: ChatPage,
});

interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

const MAX_HISTORY = 200;
const MAX_LEN = 300;

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function colorForUser(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 80% 70%)`;
}

function readLocalName(): string {
  try {
    return localStorage.getItem("brhero_display_name_v1") || "";
  } catch {
    return "";
  }
}

function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auth
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load history
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data, error: err } = await supabase
        .from("chat_messages")
        .select("id,user_id,display_name,content,created_at")
        .order("created_at", { ascending: false })
        .limit(MAX_HISTORY);
      if (cancelled) return;
      if (err) {
        setError(err.message);
        return;
      }
      setMessages(((data ?? []) as ChatMessage[]).reverse());
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chat_messages_global")
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
          requestAnimationFrame(() => {
            const el = scrollRef.current;
            if (!el) return;
            const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            if (near) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          });
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
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const send = useCallback(async () => {
    if (!user) return;
    const content = input.trim();
    if (!content) return;
    if (content.length > MAX_LEN) {
      setError(`Mensagem passa de ${MAX_LEN} caracteres`);
      return;
    }
    setSending(true);
    setError(null);
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const display_name =
      readLocalName() ||
      (meta.full_name as string) ||
      (meta.name as string) ||
      user.email?.split("@")[0] ||
      "Herói";
    const { error: err } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, display_name, content });
    setSending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInput("");
    inputRef.current?.focus();
  }, [user, input]);

  const remove = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("chat_messages").delete().eq("id", id);
    if (err) setError(err.message);
  }, []);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1A0F08] text-amber-300">
        Carregando…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 bg-[#2D1B0E] p-6 text-center text-amber-100">
        <MessageSquare className="h-10 w-10 text-amber-300" />
        <h1 className="text-xl font-black">Chat Global</h1>
        <p className="text-sm opacity-80">
          Faça login para conversar com outros heróis em tempo real.
        </p>
        <Link
          to="/"
          className="rounded-md border-2 border-amber-500 bg-amber-500/20 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-500/30"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#2D1B0E] text-amber-50">
      <header className="flex items-center justify-between gap-2 border-b-2 border-[#8B4513] bg-gradient-to-b from-[#3E2723] to-[#2D1B0E] px-3 py-2">
        <Link
          to="/game"
          className="flex items-center gap-1 rounded-md border border-amber-900/60 bg-black/40 px-2 py-1 text-[11px] font-bold text-amber-200 hover:bg-black/60"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar
        </Link>
        <h1 className="flex items-center gap-1.5 text-sm font-black text-amber-100">
          <MessageSquare className="h-4 w-4" /> Chat Global
        </h1>
        <span className="text-[10px] opacity-70">{messages.length} msgs</span>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
      >
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-xs opacity-60">
            Nenhuma mensagem ainda. Seja o primeiro a falar!
          </p>
        ) : (
          messages.map((m) => {
            const own = m.user_id === user.id;
            return (
              <div
                key={m.id}
                className={`flex ${own ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`group max-w-[85%] rounded-lg border border-black/50 px-2.5 py-1.5 text-xs shadow ${
                    own ? "bg-amber-700/40" : "bg-black/40"
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <Link
                      to="/perfil/$userId"
                      params={{ userId: m.user_id }}
                      className="font-black hover:underline"
                      style={{ color: colorForUser(m.user_id) }}
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
                        title="Apagar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="mt-0.5 whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="border-t border-red-500/50 bg-red-950/60 px-3 py-1 text-[11px] text-red-200">
          {error}
        </div>
      )}

      <form
        className="flex items-center gap-2 border-t-2 border-[#8B4513] bg-black/60 px-2 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
          placeholder="Escreva uma mensagem…"
          maxLength={MAX_LEN}
          className="flex-1 rounded-md border border-amber-900/60 bg-[#1A0F08] px-2 py-1.5 text-sm text-amber-50 placeholder:text-amber-100/40 focus:border-amber-500 focus:outline-none"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="flex items-center gap-1 rounded-md border-2 border-amber-500 bg-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-100 hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" /> Enviar
        </button>
      </form>
      <div className="bg-black/40 px-3 py-1 text-right text-[9px] opacity-60">
        {input.length}/{MAX_LEN}
      </div>
    </div>
  );
}
