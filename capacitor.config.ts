import type { CapacitorConfig } from "@capacitor/cli";

// BRHero é um jogo mobile Android nativo empacotado no APK.
// O conteúdo é servido a partir de `webDir` (build local em `dist/`),
// NÃO a partir de um site remoto. Não reintroduza `server.url` — isso
// transformaria o APK em uma WebView dependente de brhero.lovable.app,
// quebrando o jogo offline e reprovando na Play Store.
const config: CapacitorConfig = {
  appId: "app.brhero.game",
  appName: "BRHero",
  webDir: "dist",
  appendUserAgent: "BRHeroApp/1 CapacitorNative",
  android: {
    backgroundColor: "#0a1c3a",
    appendUserAgent: "BRHeroApp/1 CapacitorNative",
    allowMixedContent: false,
  },
};

export default config;
