import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

const NATIVE_CALLBACK_FLAG = "brhero_native";
const NATIVE_CALLBACK_VALUE = "1";
const OAUTH_STATE_KEY = "brhero-native-oauth-state-v1";

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
  };
};

function createState(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readHashParams(hash: string): URLSearchParams {
  return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
}

export function isBrHeroNativeApp(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (Capacitor.isNativePlatform()) return true;
    const platform = Capacitor.getPlatform();
    if (platform === "android" || platform === "ios") return true;
  } catch {
    // Fall through to runtime markers below.
  }

  const nativeBridge = (window as CapacitorWindow).Capacitor;
  try {
    if (nativeBridge?.isNativePlatform?.()) return true;
    const platform = nativeBridge?.getPlatform?.();
    if (platform && platform !== "web") return true;
  } catch {
    // Ignore malformed/native bridge failures and use the user-agent marker.
  }

  return /\b(BRHeroApp|BRHeroNative|CapacitorNative)\b/i.test(navigator.userAgent);
}

export function getNativePostLoginRedirectUri(): string {
  const url = new URL("/game", window.location.origin);
  url.searchParams.set(NATIVE_CALLBACK_FLAG, NATIVE_CALLBACK_VALUE);
  return url.toString();
}

export async function startNativeGoogleSignIn(): Promise<void> {
  const state = createState();
  try {
    window.sessionStorage.setItem(OAUTH_STATE_KEY, state);
  } catch {
    // Session storage is a defense-in-depth state check; OAuth can continue without it.
  }

  const oauthUrl = new URL("/~oauth/initiate", window.location.origin);
  oauthUrl.searchParams.set("provider", "google");
  oauthUrl.searchParams.set("redirect_uri", getNativePostLoginRedirectUri());
  oauthUrl.searchParams.set("state", state);
  oauthUrl.searchParams.set("prompt", "select_account");

  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: oauthUrl.toString(), toolbarColor: "#0a1c3a" });
  } catch {
    window.location.assign(oauthUrl.toString());
  }
}

export async function closeNativeAuthBrowser(): Promise<void> {
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    // The current APK may not include the Browser plugin yet; closing is best-effort.
  }
}

export async function completeNativeOAuthFromUrl(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  const hashParams = readHashParams(url.hash);
  const isNativeCallback =
    url.searchParams.get(NATIVE_CALLBACK_FLAG) === NATIVE_CALLBACK_VALUE ||
    hashParams.get(NATIVE_CALLBACK_FLAG) === NATIVE_CALLBACK_VALUE;
  const accessToken = hashParams.get("access_token") ?? url.searchParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token") ?? url.searchParams.get("refresh_token");
  const code = url.searchParams.get("code");
  const error = hashParams.get("error_description") ?? url.searchParams.get("error_description") ?? hashParams.get("error") ?? url.searchParams.get("error");

  if (!isNativeCallback && !accessToken && !code) return false;
  if (error) throw new Error(error);

  const returnedState = hashParams.get("state") ?? url.searchParams.get("state");
  try {
    const expectedState = window.sessionStorage.getItem(OAUTH_STATE_KEY);
    if (expectedState && returnedState && expectedState !== returnedState) {
      throw new Error("Estado do login inválido. Tente entrar novamente.");
    }
    window.sessionStorage.removeItem(OAUTH_STATE_KEY);
  } catch (stateError) {
    if (stateError instanceof Error) throw stateError;
  }

  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) throw sessionError;
    return true;
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return true;
  }

  return isNativeCallback;
}