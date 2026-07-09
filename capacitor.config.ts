import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.brhero.game",
  appName: "BRHero",
  webDir: "dist",
  appendUserAgent: "BRHeroApp/1 CapacitorNative",
  // Hot-reload from the published web build. Comment `server` for a fully
  // offline / Play Store build (uses bundled webDir instead).
  server: {
    url: "https://brhero.lovable.app",
    cleartext: false,
    androidScheme: "https",
    appStartPath: "/game",
  },
  android: {
    backgroundColor: "#0a1c3a",
    appendUserAgent: "BRHeroApp/1 CapacitorNative",
  },
};

export default config;
