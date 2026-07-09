// Fase 3 · Bloco 3 — Loja/Eventos read-only no gameplay.
// Lê ofertas publicadas no Admin (admin_module_entities módulo `shop`).
// NÃO ativa compra real em BRL nem entrega recompensas automaticamente.
// Cache local em localStorage para uso offline.

import { useEffect, useState } from "react";
import { remoteList } from "@/lib/admin/supabase-module-store";

export type RemoteShopCurrency = "gems" | "gold" | "essence" | "brl";
export type RemoteShopRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

interface RemoteShopItemRaw {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: RemoteShopCurrency;
  quantity: number;
  perPlayerLimit: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  featured: boolean;
  rarity: RemoteShopRarity;
  reward: string;
  sold: number;
}

export interface RemoteOffer {
  id: string;
  name: string;
  price: number;
  currency: RemoteShopCurrency;
  reward: string;
  rarity: RemoteShopRarity;
  featured: boolean;
  endsAt: string | null;
  isPaid: boolean; // true quando currency = brl (não vendável no jogo)
}

const CACHE_KEY = "brhero_remote_shop_cache_v1";
let items: RemoteShopItemRaw[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function loadCache(): RemoteShopItemRaw[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as RemoteShopItemRaw[];
  } catch { /* ignore */ }
  return [];
}
function saveCache(list: RemoteShopItemRaw[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

function isActive(i: RemoteShopItemRaw, now: number): boolean {
  if (!i.active) return false;
  if (i.startsAt && new Date(i.startsAt).getTime() > now) return false;
  if (i.endsAt && new Date(i.endsAt).getTime() < now) return false;
  if (i.quantity > 0 && i.sold >= i.quantity) return false;
  return true;
}

export function getRemoteOffers(): RemoteOffer[] {
  const now = Date.now();
  return items
    .filter((i) => isActive(i, now))
    .map<RemoteOffer>((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      currency: i.currency,
      reward: i.reward,
      rarity: i.rarity,
      featured: !!i.featured,
      endsAt: i.endsAt,
      isPaid: i.currency === "brl",
    }))
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

function emit() { listeners.forEach((l) => l()); }

export async function hydrateRemoteShop(): Promise<void> {
  items = loadCache();
  emit();
  try {
    const list = await remoteList<RemoteShopItemRaw>("shop");
    if (list) {
      items = list.map((r) => r.data);
      saveCache(items);
      emit();
    }
  } catch { /* silencioso */ }
  hydrated = true;
}

// Kick-off + refresh a cada 5 min
void hydrateRemoteShop();
if (typeof window !== "undefined") {
  window.setInterval(() => { void hydrateRemoteShop(); }, 5 * 60 * 1000);
}

export function isRemoteShopHydrated() { return hydrated; }

export function useRemoteOffers(): RemoteOffer[] {
  const [offers, setOffers] = useState<RemoteOffer[]>(() => getRemoteOffers());
  useEffect(() => {
    const l = () => setOffers(getRemoteOffers());
    listeners.add(l);
    l();
    return () => { listeners.delete(l); };
  }, []);
  return offers;
}
