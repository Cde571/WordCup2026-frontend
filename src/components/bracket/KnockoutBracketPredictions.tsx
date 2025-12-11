// src/components/bracket/KnockoutBracketPredictions.tsx
import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Team = {
  _id: string;
  name: string;
  code?: string;
  group?: string | null;
  logo?: string | null;
};

// Lo hacemos flexible: cualquier cosa por grupo
type GroupPredictions = Record<string, any>;

type SeedSlot =
  | { type: "winner"; group: string } // 1.º del grupo X
  | { type: "runnerUp"; group: string } // 2.º del grupo X
  | { type: "thirdPool"; groups: string[] }; // Mejores terceros

type KnockoutMatchTemplate = {
  id: number;
  phase:
    | "Round of 32"
    | "Round of 16"
    | "Quarter Finals"
    | "Semi Finals"
    | "Third Place"
    | "Final";
  code: string;
  from?: string[];
  home: SeedSlot | { fromMatchId: number };
  away: SeedSlot | { fromMatchId: number };
};

// -----------------------------------------------------------
// PLANTILLA KNOCKOUT FORMATO 48 EQUIPOS (M73–M104)
// -----------------------------------------------------------

// Round of 32 (16 partidos)
const ROUND_OF_32: KnockoutMatchTemplate[] = [
  {
    id: 73,
    phase: "Round of 32",
    code: "M73",
    home: { type: "runnerUp", group: "A" },
    away: { type: "runnerUp", group: "B" },
  },
  {
    id: 74,
    phase: "Round of 32",
    code: "M74",
    home: { type: "winner", group: "C" },
    away: { type: "runnerUp", group: "F" },
  },
  {
    id: 75,
    phase: "Round of 32",
    code: "M75",
    home: { type: "winner", group: "E" },
    away: { type: "thirdPool", groups: ["A", "B", "C", "D", "F"] },
  },
  {
    id: 76,
    phase: "Round of 32",
    code: "M76",
    home: { type: "winner", group: "F" },
    away: { type: "runnerUp", group: "C" },
  },
  {
    id: 77,
    phase: "Round of 32",
    code: "M77",
    home: { type: "runnerUp", group: "E" },
    away: { type: "runnerUp", group: "I" },
  },
  {
    id: 78,
    phase: "Round of 32",
    code: "M78",
    home: { type: "winner", group: "I" },
    away: { type: "thirdPool", groups: ["C", "D", "F", "G", "H"] },
  },
  {
    id: 79,
    phase: "Round of 32",
    code: "M79",
    home: { type: "winner", group: "A" },
    away: { type: "thirdPool", groups: ["C", "E", "F", "H", "I"] },
  },
  {
    id: 80,
    phase: "Round of 32",
    code: "M80",
    home: { type: "winner", group: "L" },
    away: { type: "thirdPool", groups: ["E", "H", "I", "J", "K"] },
  },
  {
    id: 81,
    phase: "Round of 32",
    code: "M81",
    home: { type: "winner", group: "G" },
    away: { type: "thirdPool", groups: ["A", "E", "H", "I", "J"] },
  },
  {
    id: 82,
    phase: "Round of 32",
    code: "M82",
    home: { type: "winner", group: "D" },
    away: { type: "thirdPool", groups: ["B", "E", "F", "I", "J"] },
  },
  {
    id: 83,
    phase: "Round of 32",
    code: "M83",
    home: { type: "winner", group: "H" },
    away: { type: "runnerUp", group: "J" },
  },
  {
    id: 84,
    phase: "Round of 32",
    code: "M84",
    home: { type: "runnerUp", group: "K" },
    away: { type: "runnerUp", group: "L" },
  },
  {
    id: 85,
    phase: "Round of 32",
    code: "M85",
    home: { type: "winner", group: "B" },
    away: { type: "thirdPool", groups: ["E", "F", "G", "I", "J"] },
  },
  {
    id: 86,
    phase: "Round of 32",
    code: "M86",
    home: { type: "runnerUp", group: "D" },
    away: { type: "runnerUp", group: "G" },
  },
  {
    id: 87,
    phase: "Round of 32",
    code: "M87",
    home: { type: "winner", group: "J" },
    away: { type: "runnerUp", group: "H" },
  },
  {
    id: 88,
    phase: "Round of 32",
    code: "M88",
    home: { type: "winner", group: "K" },
    away: { type: "thirdPool", groups: ["D", "E", "I", "J", "L"] },
  },
];

// Round of 16
const ROUND_OF_16: KnockoutMatchTemplate[] = [
  { id: 89, phase: "Round of 16", code: "M89", home: { fromMatchId: 73 }, away: { fromMatchId: 75 } },
  { id: 90, phase: "Round of 16", code: "M90", home: { fromMatchId: 74 }, away: { fromMatchId: 77 } },
  { id: 91, phase: "Round of 16", code: "M91", home: { fromMatchId: 76 }, away: { fromMatchId: 78 } },
  { id: 92, phase: "Round of 16", code: "M92", home: { fromMatchId: 79 }, away: { fromMatchId: 80 } },
  { id: 93, phase: "Round of 16", code: "M93", home: { fromMatchId: 83 }, away: { fromMatchId: 84 } },
  { id: 94, phase: "Round of 16", code: "M94", home: { fromMatchId: 81 }, away: { fromMatchId: 82 } },
  { id: 95, phase: "Round of 16", code: "M95", home: { fromMatchId: 86 }, away: { fromMatchId: 88 } },
  { id: 96, phase: "Round of 16", code: "M96", home: { fromMatchId: 85 }, away: { fromMatchId: 87 } },
];

// Cuartos
const QUARTERS: KnockoutMatchTemplate[] = [
  { id: 97, phase: "Quarter Finals", code: "M97", home: { fromMatchId: 89 }, away: { fromMatchId: 90 } },
  { id: 98, phase: "Quarter Finals", code: "M98", home: { fromMatchId: 93 }, away: { fromMatchId: 94 } },
  { id: 99, phase: "Quarter Finals", code: "M99", home: { fromMatchId: 91 }, away: { fromMatchId: 92 } },
  { id: 100, phase: "Quarter Finals", code: "M100", home: { fromMatchId: 95 }, away: { fromMatchId: 96 } },
];

// Semis, tercer puesto y final
const SEMIS_AND_FINAL: KnockoutMatchTemplate[] = [
  {
    id: 101,
    phase: "Semi Finals",
    code: "M101",
    home: { fromMatchId: 97 },
    away: { fromMatchId: 98 },
  },
  {
    id: 102,
    phase: "Semi Finals",
    code: "M102",
    home: { fromMatchId: 99 },
    away: { fromMatchId: 100 },
  },
  {
    id: 103,
    phase: "Third Place",
    code: "M103",
    home: { fromMatchId: 101 }, // perdedor 101 (visual)
    away: { fromMatchId: 102 }, // perdedor 102
  },
  {
    id: 104,
    phase: "Final",
    code: "M104",
    home: { fromMatchId: 101 }, // ganador 101 (visual)
    away: { fromMatchId: 102 }, // ganador 102
  },
];

const ALL_MATCHES_TEMPLATE: KnockoutMatchTemplate[] = [
  ...ROUND_OF_32,
  ...ROUND_OF_16,
  ...QUARTERS,
  ...SEMIS_AND_FINAL,
];

// -----------------------------------------------------------
// HELPERS · RESOLVER EQUIPO SEGÚN PREDICCIÓN
// -----------------------------------------------------------

// Intenta obtener el "equipo predicho" en crudo para un seed concreto
function getRawPredictionSeed(
  groupPred: any,
  place: "first" | "second" | "third"
) {
  if (!groupPred) return { code: null as string | null, id: null as string | null, team: null as any };

  // Por código (forma típica de wc26_group_predictions)
  const code =
    groupPred[place] ??
    groupPred[`${place}Code`] ??
    groupPred[`${place}Team`]?.code ??
    null;

  // Por id (si guardaste Mongo IDs)
  const id =
    groupPred[`${place}Id`] ??
    groupPred[`${place}Team`]?._id ??
    null;

  const team = groupPred[`${place}Team`] ?? null;

  return { code, id, team };
}

function resolveTeamName(
  place: "first" | "second" | "third",
  group: string,
  predictions: GroupPredictions | null,
  teamsByGroup: Map<string, Team[]>,
  fallbackLabel: string
): string {
  if (!predictions) return fallbackLabel;

  const pred = predictions[group];
  if (!pred) return fallbackLabel;

  const { code, id, team } = getRawPredictionSeed(pred, place);
  const list = teamsByGroup.get(group) ?? [];

  // 1) Intentar machar por código
  if (code) {
    const foundByCode = list.find(
      (t) => t.code && t.code.toUpperCase() === String(code).toUpperCase()
    );
    if (foundByCode) return foundByCode.name;
  }

  // 2) Intentar por _id
  if (id) {
    const foundById = list.find((t) => t._id === id);
    if (foundById) return foundById.name;
  }

  // 3) Si viene un objeto "Team" completo
  if (team?.name) return team.name;

  return fallbackLabel;
}

function getTeamNameFromPredictions(
  seed: SeedSlot,
  teamsByGroup: Map<string, Team[]>,
  predictions: GroupPredictions | null
): string {
  if (seed.type === "winner") {
    const g = seed.group.toUpperCase();
    const baseLabel = `1.º Grupo ${g}`;
    return resolveTeamName("first", g, predictions, teamsByGroup, baseLabel);
  }

  if (seed.type === "runnerUp") {
    const g = seed.group.toUpperCase();
    const baseLabel = `2.º Grupo ${g}`;
    return resolveTeamName("second", g, predictions, teamsByGroup, baseLabel);
  }

  // thirdPool → no depende de una predicción directa
  const groupsLabel = seed.groups.join("/");
  return `Mejor 3.º ${groupsLabel}`;
}

function getSlotLabel(
  slot: SeedSlot | { fromMatchId: number },
  teamsByGroup: Map<string, Team[]>,
  predictions: GroupPredictions | null,
  byId: Map<number, KnockoutMatchTemplate>
): string {
  if ("fromMatchId" in slot) {
    const source = byId.get(slot.fromMatchId);
    if (!source) return `Ganador M${slot.fromMatchId}`;
    return `Ganador ${source.code}`;
  }
  return getTeamNameFromPredictions(slot as SeedSlot, teamsByGroup, predictions);
}

// -----------------------------------------------------------
// COMPONENTE PRINCIPAL
// -----------------------------------------------------------

export default function KnockoutBracketPredictions() {
  const [teamsByGroup, setTeamsByGroup] = useState<Map<string, Team[]>>(
    () => new Map()
  );
  const [predictions, setPredictions] = useState<GroupPredictions | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/teams`);
        const data = await res.json();
        const teams = (data.teams ?? []) as Team[];

        const map = new Map<string, Team[]>();
        for (const t of teams) {
          const g = (t.group || "").toUpperCase();
          if (!g) continue;
          if (!map.has(g)) map.set(g, []);
          map.get(g)!.push(t);
        }

        for (const [g, list] of map.entries()) {
          map.set(
            g,
            [...list].sort((a, b) => a.name.localeCompare(b.name))
          );
        }

        setTeamsByGroup(map);
      } catch (err) {
        console.error("Error cargando equipos para bracket:", err);
      }
    };

    const loadPredictions = async () => {
      // 1) Intentar desde backend (sesión + DB)
      try {
        const res = await fetch(
          `${API_BASE}/api/predictions/groups/my-predictions`,
          { credentials: "include" }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.predictions && typeof data.predictions === "object") {
            const normalized: GroupPredictions = {};
            for (const [group, value] of Object.entries<any>(data.predictions)) {
              const g = group.toUpperCase();
              normalized[g] = value;
            }
            setPredictions(normalized);
            console.log("Predicciones cargadas desde backend:", normalized);
            return;
          }
        }
      } catch (err) {
        console.warn("No se pudieron cargar predicciones del backend:", err);
      }

      // 2) Fallback: localStorage (GroupStage offline)
      try {
        const raw = window.localStorage.getItem("wc26_group_predictions");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const normalized: GroupPredictions = {};
          for (const [group, value] of Object.entries<any>(parsed)) {
            const g = group.toUpperCase();
            normalized[g] = value;
          }
          setPredictions(normalized);
          console.log("Predicciones cargadas desde localStorage:", normalized);
        }
      } catch (err) {
        console.error("Error leyendo predicciones de grupos:", err);
      }
    };

    fetchTeams();
    loadPredictions();
  }, []);

  const byId = new Map<number, KnockoutMatchTemplate>();
  for (const m of ALL_MATCHES_TEMPLATE) {
    byId.set(m.id, m);
  }

  const phasesInOrder: KnockoutMatchTemplate["phase"][] = [
    "Round of 32",
    "Round of 16",
    "Quarter Finals",
    "Semi Finals",
    "Third Place",
    "Final",
  ];

  const matchesByPhase = new Map<
    KnockoutMatchTemplate["phase"],
    KnockoutMatchTemplate[]
  >();

  for (const m of ALL_MATCHES_TEMPLATE) {
    if (!matchesByPhase.has(m.phase)) matchesByPhase.set(m.phase, []);
    matchesByPhase.get(m.phase)!.push(m);
  }

  const getPhaseLabel = (phase: KnockoutMatchTemplate["phase"]) => {
    switch (phase) {
      case "Round of 32":
        return "Ronda de 32";
      case "Round of 16":
        return "Octavos de final";
      case "Quarter Finals":
        return "Cuartos de final";
      case "Semi Finals":
        return "Semifinales";
      case "Third Place":
        return "Tercer puesto";
      case "Final":
        return "Gran Final";
      default:
        return phase;
    }
  };

  const getPhaseDates = (phase: KnockoutMatchTemplate["phase"]) => {
    // Fechas oficiales aproximadas del Mundial 2026
    switch (phase) {
      case "Round of 32":
        return "28 junio – 3 julio 2026";
      case "Round of 16":
        return "4 – 7 julio 2026";
      case "Quarter Finals":
        return "9 – 11 julio 2026";
      case "Semi Finals":
        return "14 – 15 julio 2026";
      case "Third Place":
        return "18 julio 2026";
      case "Final":
        return "19 julio 2026";
      default:
        return "";
    }
  };

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 md:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* CABECERA */}
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-purple-300 mb-1">
            Mundial 2026 · Llaves
          </p>
          <h1 className="font-bebas text-3xl md:text-4xl lg:text-5xl text-white tracking-[0.22em]">
            BRACKET INTERACTIVO
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-2">
            Visualiza cómo quedarían las llaves del Mundial 2026 (48 equipos, 12
            grupos A–L) según tus predicciones de fase de grupos. A medida que
            definas 1.º, 2.º y mejores terceros, se irán completando los cruces
            desde la Ronda de 32 hasta la Gran Final.
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            Consejo: guarda tus predicciones en la pantalla de{" "}
            <span className="font-semibold">Grupos</span> y luego ven aquí para
            ver el bracket armado con tus favoritos.
          </p>
        </header>

        {/* GRID HORIZONTAL TIPO BRACKET */}
        <div className="mt-4 overflow-x-auto pb-6">
          <div
            className="min-w-[1200px] grid gap-6 lg:gap-8"
            style={{
              gridTemplateColumns: `repeat(${phasesInOrder.length}, minmax(0, 1fr))`,
            }}
          >
            {phasesInOrder.map((phase) => {
              const list = matchesByPhase.get(phase) ?? [];
              if (list.length === 0) return null;

              return (
                <div key={phase} className="flex flex-col gap-3">
                  {/* Título de fase */}
                  <div className="bg-gradient-to-br from-purple-900/90 to-slate-900/90 border border-purple-700/50 rounded-xl px-4 py-3 shadow-lg">
                    <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em] text-center">
                      {getPhaseLabel(phase)}
                    </h2>
                    <p className="mt-1 text-[10px] text-purple-200 text-center">
                      {getPhaseDates(phase)} · {list.length} partido
                      {list.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  {/* Partidos de la fase */}
                  <div
                    className="flex flex-col gap-4 pb-6 mt-1"
                    style={{
                      justifyContent:
                        list.length <= 2 ? "center" : "flex-start",
                      minHeight: list.length <= 2 ? "400px" : "auto",
                    }}
                  >
                    {list.map((m) => {
                      const homeLabel = getSlotLabel(
                        m.home as any,
                        teamsByGroup,
                        predictions,
                        byId
                      );
                      const awayLabel = getSlotLabel(
                        m.away as any,
                        teamsByGroup,
                        predictions,
                        byId
                      );

                      return (
                        <article
                          key={m.id}
                          className="relative rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-3 flex flex-col gap-2.5 hover:border-purple-500/70 hover:bg-slate-900/90 transition-all duration-200 shadow-md hover:shadow-xl"
                        >
                          <span className="absolute -left-2 -top-2 inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-400/40 px-2.5 text-[10px] font-bold text-white shadow-md">
                            {m.code}
                          </span>

                          {/* Equipos / seeds */}
                          <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/40">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold">
                                H
                              </div>
                              <span className="text-xs font-semibold text-slate-100 truncate flex-1">
                                {homeLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/40">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-[10px] font-bold">
                                A
                              </div>
                              <span className="text-xs font-semibold text-slate-100 truncate flex-1">
                                {awayLabel}
                              </span>
                            </div>
                          </div>

                          <div className="mt-1 flex items-center justify-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 text-[10px] text-emerald-300 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Fase eliminatoria
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
