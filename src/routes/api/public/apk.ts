// Rota pública que serve o APK do jogo com Content-Type correto
// (application/vnd.android.package-archive) para que o Android reconheça
// o arquivo como instalador. O APK é armazenado no bucket privado "apk"
// e enviado pelo painel admin em /admin/apk.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/apk")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("apk").download("latest.apk");
        if (error || !data) {
          return new Response("APK não disponível. Faça upload em /admin/apk.", { status: 404 });
        }
        const buffer = await data.arrayBuffer();
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.android.package-archive",
            "Content-Disposition": 'attachment; filename="brhero.apk"',
            "Content-Length": String(buffer.byteLength),
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
