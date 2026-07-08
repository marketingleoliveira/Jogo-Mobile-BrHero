import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.brhero.game",
  appName: "BRHero",
  webDir: "dist",
  // Hot-reload from the published web build. Comment `server` for a fully
  // offline / Play Store build (uses bundled webDir instead).
  server: {
    url: "https://brhero.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0a1c3a",
  },
};

export default config;
