// Fase 4 · Bloco 4 — Hook compartilhado da carteira do jogador.
// Lê player_wallet e player_titles do usuário autenticado. RLS por auth.uid()
// garante que só o dono enxerga seus dados; offline/anônimo cai em fallback zero.
// Não altera personagem, rebirth, pets, runas ou skins.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WalletData {
  gems: number;
  gold: number;
}

export interface PlayerTitle {
  id: string;
  title: string;
  source_season_key: string | null;
  awarded_at: string;
}

export interface UseWalletResult {
  wallet: WalletData;
  titles: PlayerTitle[];
  equippedTitle: string | null;
  loading: boolean;
  error: string | null;
  userId: string | null;
  refresh: () => Promise<void>;
  equipTitle: (title: string | null) => void;
}

const EQUIPPED_TITLE_KEY = "brhero_equipped_title_v1";
const EMPTY: WalletData = { gems: 0, gold: 0 };

function readEquipped(): string | null {
  try { return localStorage.getItem(EQUIPPED_TITLE_KEY); } catch { return null; }
}
function writeEquipped(t: string | null) {
  try {
    if (t) localStorage.setItem(EQUIPPED_TITLE_KEY, t);
    else localStorage.removeItem(EQUIPPED_TITLE_KEY);
  } catch { /* noop */ }
}

export function useWallet(): UseWalletResult {
  const [wallet, setWallet] = useState<WalletData>(EMPTY);
  const [titles, setTitles] = useState<PlayerTitle[]>([]);
  const [equippedTitle, setEquippedTitleState] = useState<string | null>(() => readEquipped());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id ?? null;
      setUserId(uid);
      if (!uid) {
        setWallet(EMPTY);
        setTitles([]);
        setLoading(false);
        return;
      }
      const [{ data: w, error: we }, { data: t, error: te }] = await Promise.all([
        supabase.from("player_wallet").select("gems,gold").eq("user_id", uid).maybeSingle(),
        supabase.from("player_titles").select("id,title,source_season_key,awarded_at")
          .eq("user_id", uid).order("awarded_at", { ascending: false }),
      ]);
      if (we) throw new Error(we.message);
      if (te) throw new Error(te.message);
      setWallet(w ? { gems: Number(w.gems) || 0, gold: Number(w.gold) || 0 } : EMPTY);
      setTitles((t ?? []) as unknown as PlayerTitle[]);
    } catch (e) {
      // Fallback seguro: mantém valores zero em vez de crashar o HUD.
      console.warn("[useWallet] fallback:", (e as Error).message);
      setError((e as Error).message);
      setWallet(EMPTY);
      setTitles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const equipTitle = useCallback((t: string | null) => {
    setEquippedTitleState(t);
    writeEquipped(t);
  }, []);

  return {
    wallet, titles, equippedTitle, loading, error, userId,
    refresh: load, equipTitle,
  };
}
