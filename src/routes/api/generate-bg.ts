import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-bg")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { biome, stage } = (await request.json()) as {
          biome: string;
          stage?: number;
        };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const prompt = `Cenário 2D de jogo mobile RPG cartoon estilo Legend of Mushroom, vista lateral, formato paisagem 16:9, bioma: ${biome}. Fase ${stage ?? 1}. Cores vibrantes, contornos grossos, iluminação suave, sem personagens, sem texto, sem UI, sem HUD, apenas o cenário de fundo (montanhas/árvores/rochas/nuvens ao fundo e chão em primeiro plano). Estilo pintura digital chapada, altamente estilizado.`;

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3.1-flash-image",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          },
        );

        if (!upstream.ok) {
          const txt = await upstream.text().catch(() => "");
          return new Response(txt || "Upstream error", { status: upstream.status });
        }
        const json = (await upstream.json()) as {
          data?: Array<{ b64_json?: string }>;
        };
        const b64 = json.data?.[0]?.b64_json;
        if (!b64) return new Response("No image", { status: 502 });
        return Response.json({ dataUrl: `data:image/png;base64,${b64}` });
      },
    },
  },
});
