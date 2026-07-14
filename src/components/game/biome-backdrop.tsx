import { useEffect, useState } from "react";

// Bioma dinâmico derivado do estágio salvo em localStorage.
// Não altera gameplay — apenas lê o save para escolher a paleta/tema visual
// do fundo lateral em telas widescreen (idle RPG web premium).
// Quando os biomas se repetem (após um ciclo completo), o nível de bioma
// aumenta, com paleta mais intensa e etiqueta indicando "Nível N".

type Biome = {
  key: string;
  label: string;
  gradient: string;
  glow: string;
  particles: "spark" | "leaf" | "sand" | "ember" | "snow" | "bubble" | "dust" | "petal" | "star" | "rune";
};

const STAGES_PER_BIOME = 20;

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
    label: "Floresta Encantada",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #2f6b3a 0%, #1e4a2a 35%, #0f2a1c 70%, #050f0a 100%)",
    glow: "#8ff0a4",
    particles: "leaf",
  },
  {
    key: "deserto",
    label: "Deserto de Ossos",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #d9a441 0%, #a56d1e 35%, #5e3a10 70%, #2a1806 100%)",
    glow: "#ffe7a3",
    particles: "sand",
  },
  {
    key: "pantano",
    label: "Pântano Sombrio",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #4a5b3a 0%, #2e3a24 35%, #1a2415 70%, #0a1108 100%)",
    glow: "#c8ff8a",
    particles: "dust",
  },
  {
    key: "vulcao",
    label: "Vulcão Ancestral",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #b83a2a 0%, #7a1b12 35%, #3d0a06 70%, #180302 100%)",
    glow: "#ff8a5a",
    particles: "ember",
  },
  {
    key: "gelo",
    label: "Tundra Congelada",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #a8d8f5 0%, #5a92c4 35%, #23486b 70%, #0a1c30 100%)",
    glow: "#e6f7ff",
    particles: "snow",
  },
  {
    key: "abissal",
    label: "Reino Abissal",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #1a5f7a 0%, #0f3f5a 35%, #071f36 70%, #030a18 100%)",
    glow: "#7de3ff",
    particles: "bubble",
  },
  {
    key: "sakura",
    label: "Jardim das Sakuras",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #f2a4c4 0%, #b8628a 35%, #6a2e50 70%, #2a0f1e 100%)",
    glow: "#ffd6ea",
    particles: "petal",
  },
  {
    key: "celeste",
    label: "Cidadela Celeste",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #c9b8ff 0%, #7a63d4 35%, #3a2a7a 70%, #120a2e 100%)",
    glow: "#e9deff",
    particles: "star",
  },
  {
    key: "ruinas",
    label: "Ruínas Arcanas",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #6a4ac9 0%, #3e2a86 35%, #1e134a 70%, #08041c 100%)",
    glow: "#c6a8ff",
    particles: "rune",
  },
  {
    key: "cerrado",
    label: "Cerrado Brasileiro",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #cf7a2a 0%, #8a4d18 35%, #4a2a0e 70%, #1a0f06 100%)",
    glow: "#ffcf88",
    particles: "spark",
  },
  {
    key: "voidscape",
    label: "Vazio Além",
    gradient:
      "radial-gradient(1200px 700px at 50% 0%, #2a1a5a 0%, #150c3a 35%, #08041e 70%, #02010a 100%)",
    glow: "#ff5ad0",
    particles: "star",
  },
];

function biomeForStage(stage: number): { biome: Biome; cycle: number; stageInBiome: number } {
  const total = Math.max(0, stage - 1);
  const idx = Math.floor(total / STAGES_PER_BIOME) % BIOMES.length;
  const cycle = Math.floor(total / (STAGES_PER_BIOME * BIOMES.length)) + 1;
  const stageInBiome = (total % STAGES_PER_BIOME) + 1;
  return { biome: BIOMES[idx], cycle, stageInBiome };
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
  const [showBadge, setShowBadge] = useState(false);
  const [lastKey, setLastKey] = useState<string>("");

  useEffect(() => {
    const id = window.setInterval(() => setStage(readStage()), 4000);
    return () => window.clearInterval(id);
  }, []);

  const { biome, cycle, stageInBiome } = biomeForStage(stage);
  const key = `${biome.key}-${cycle}`;

  useEffect(() => {
    if (key !== lastKey) {
      setLastKey(key);
      setShowBadge(true);
      const t = window.setTimeout(() => setShowBadge(false), 4200);
      return () => window.clearTimeout(t);
    }
  }, [key, lastKey]);

  // Intensidade extra para ciclos repetidos (saturação/brilho crescentes)
  const intensity = Math.min(1, (cycle - 1) * 0.18);
  const filter = cycle > 1 ? `saturate(${1 + intensity * 0.6}) contrast(${1 + intensity * 0.3}) hue-rotate(${(cycle - 1) * 12}deg)` : undefined;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-[background,filter] duration-1000"
        style={{ background: biome.gradient, filter }}
      >
        <div
          className="absolute inset-0 opacity-40 animate-[biomeDrift_40s_ease-in-out_infinite_alternate]"
          style={{
            background: `radial-gradient(600px 400px at 15% 30%, ${biome.glow}22, transparent 60%), radial-gradient(600px 400px at 85% 70%, ${biome.glow}22, transparent 60%)`,
          }}
        />
        {/* Névoa extra para ciclos superiores — deixa claro que é uma versão "mais profunda" */}
        {cycle > 1 && (
          <div
            className="absolute inset-0 mix-blend-screen opacity-30"
            style={{
              background: `radial-gradient(800px 500px at 50% 50%, ${biome.glow}${cycle > 2 ? "44" : "22"}, transparent 70%)`,
            }}
          />
        )}
        <Particles kind={biome.particles} color={biome.glow} density={cycle} />
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
          @keyframes biomeBadgeIn {
            0% { transform: translate(-50%, -20px); opacity: 0; }
            15% { transform: translate(-50%, 0); opacity: 1; }
            85% { transform: translate(-50%, 0); opacity: 1; }
            100% { transform: translate(-50%, -10px); opacity: 0; }
          }
        `}</style>
      </div>

      {/* Etiqueta de bioma — anuncia mudança de cenário e nível quando repete */}
      {showBadge && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-20 z-40"
          style={{
            animation: "biomeBadgeIn 4.2s ease-out forwards",
          }}
        >
          <div
            className="rounded-2xl border px-5 py-2.5 backdrop-blur-md shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${biome.glow}22, #00000066)`,
              borderColor: `${biome.glow}88`,
              boxShadow: `0 0 40px ${biome.glow}55`,
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/70">
              Novo Cenário {cycle > 1 && `• Nível ${cycle}`}
            </div>
            <div className="text-lg font-bold text-white drop-shadow">
              {biome.label}
              {cycle > 1 && (
                <span className="ml-2 text-sm font-semibold" style={{ color: biome.glow }}>
                  {romanize(cycle)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-white/60">
              Estágio {stage} · fase {stageInBiome}/{STAGES_PER_BIOME}
              {cycle > 1 && " · versão mais perigosa"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function romanize(n: number): string {
  const map: Array<[number, string]> = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let x = n;
  for (const [v, s] of map) {
    while (x >= v) { out += s; x -= v; }
  }
  return out || "I";
}

function Particles({ kind, color, density }: { kind: Biome["particles"]; color: string; density: number }) {
  const count = Math.min(60, 24 + (density - 1) * 12);
  const items = Array.from({ length: count });
  return (
    <div className="absolute inset-0">
      {items.map((_, i) => {
        const left = (i * 41) % 100;
        const size =
          kind === "sand" ? 2 :
          kind === "snow" || kind === "bubble" ? 4 :
          kind === "petal" ? 5 :
          kind === "star" ? 2 :
          3;
        const dur = 12 + ((i * 7) % 18);
        const delay = (i * 1.3) % dur;
        const shape =
          kind === "leaf" || kind === "petal"
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
