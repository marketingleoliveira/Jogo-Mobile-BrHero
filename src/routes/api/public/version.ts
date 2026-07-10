// Endpoint público que devolve a versão atual do build servido no momento.
// O bundle do cliente carrega uma constante __APP_VERSION__ estampada no build dele;
// quando o servidor for redeployado, este endpoint passa a devolver um valor NOVO,
// e o VersionGuard no cliente detecta a divergência e força atualização.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/version")({
  server: {
    handlers: {
      GET: () => {
        return new Response(
          JSON.stringify({ version: __APP_VERSION__ }),
          {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              // Nunca cachear: precisa refletir o deploy atual em tempo real.
              "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
            },
          },
        );
      },
    },
  },
});
