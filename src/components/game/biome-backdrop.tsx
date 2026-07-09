import { useEffect, useState } from "react";

// Bioma dinâmico derivado do estágio salvo em localStorage.
// Não altera gameplay — apenas lê o save para escolher a paleta/tema visual
// do fundo lateral em telas widescreen (idle RPG web premium).

type Biome = {
  key: string;
  label: string;
  gradient: string;
  glow: string;
  particles: "spark" | "leaf" | "sand" | "ember" | "snow";
};

const BIOMES: Biome[] = [
  {
    key: "campos",
    label: "Campos Iniciais",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #4a7dbf 0%, #2c5892 30%, #14356a 60%, #0a1c3a 100%)",
    glow: "#a7d8ff",
    particles: "spark",
  },
  {
    key: "floresta",
    label: "Floresta",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #2f6b3a 0%, #1e4a2a 35%, #0f2a1c 70%, #050f0a 100%)",
    glow: "#8ff0a4",
    particles: "leaf",
  },
  {
    key: "deserto",
    label: "Deserto",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #d9a441 0%, #a56d1e 35%, #5e3a10 70%, #2a1806 100%)",
    glow: "#ffe7a3",
    particles: "sand",
  },
  {
    key: "vulcao",
    label: "Vulcão",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #b83a2a 0%, #7a1b12 35%, #3d0a06 70%, #180302 100%)",
    glow: "#ff8a5a",
    particles: "ember",
  },
  {
    key: "gelo",
    label: "Gelo",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #a8d8f5 0%, #5a92c4 35%, #23486b 70%, #0a1c30 100%)",
    glow: "#e6f7ff",
    particles: "snow",
  },
];

function biomeForStage(stage: number): Biome {
  // Ciclo a cada 40 estágios: campos → floresta → deserto → vulcão → gelo
  const idx = Math.floor(Math.max(0, stage - 1) / 40) % BIOMES.length;
  return BIOMES[idx];
}

const STORAGE_KEY = "hero-rise-idle-v4";

function readStage(): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 1;
    const parsed = JSON.parse(raw) as { stage?: number };
    return typeof parsed.stage === "number" ? parsed.stage : 1;
  } catch {
    return 1;
  }
}

export function BiomeBackdrop() {
  const [stage, setStage] = useState<number>(() => readStage());

  useEffect(() => {
    // Poll leve — não interfere no loop do jogo
    const id = window.setInterval(() => setStage(readStage()), 4000);
    return () => window.clearInterval(id);
  }, []);

  const biome = biomeForStage(stage);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-[background] duration-1000"
      style={{ background: biome.gradient }}
    >
      {/* Camada parallax suave */}
      <div
        className="absolute inset-0 opacity-40 animate-[biomeDrift_40s_ease-in-out_infinite_alternate]"
        style={{
          background: `radial-gradient(600px 400px at 15% 30%, ${biome.glow}22, transparent 60%), radial-gradient(600px 400px at 85% 70%, ${biome.glow}22, transparent 60%)`,
        }}
      />
      {/* Partículas */}
      <Particles kind={biome.particles} color={biome.glow} />
      <style>{`
        @keyframes biomeDrift {
          0% { transform: translate3d(0,0,0) scale(1); }
          100% { transform: translate3d(0,-2%,0) scale(1.05); }
        }
        @keyframes biomeFloat {
          0% { transform: translate3d(0,100vh,0); opacity: 0; }
          10% { opacity: 0.7; }
          100% { transform: translate3d(0,-10vh,0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Particles({ kind, color }: { kind: Biome["particles"]; color: string }) {
  const count = 24;
  const items = Array.from({ length: count });
  return (
    <div className="absolute inset-0">
      {items.map((_, i) => {
        const left = (i * 41) % 100;
        const size = kind === "sand" ? 2 : kind === "snow" ? 4 : 3;
        const dur = 12 + ((i * 7) % 18);
        const delay = (i * 1.3) % dur;
        const shape =
          kind === "leaf"
            ? "rounded-[40%_60%_60%_40%/40%_40%_60%_60%]"
            : "rounded-full";
        return (
          <span
            key={i}
            className={`absolute ${shape}`}
            style={{
              left: `${left}%`,
              bottom: `-10vh`,
              width: size,
              height: size,
              background: color,
              boxShadow: `0 0 ${size * 2}px ${color}`,
              opacity: 0.5,
              animation: `biomeFloat ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
