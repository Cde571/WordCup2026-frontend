// src/components/ranking/FifaRankingTable.tsx
import { useMemo, useState } from "react";

type Confederation =
  | "CONMEBOL"
  | "UEFA"
  | "CONCACAF"
  | "CAF"
  | "AFC"
  | "OFC";

type Movement = "same" | "up" | "down";

type RankingItem = {
  position: number;
  name: string;
  code: string;
  confederation: Confederation;
  points: number;
  movement: Movement;
  movementSteps: number;
};

// =========================================
// LISTA ESTÁTICA (sin API)
// =========================================
const RANKING_DATA: RankingItem[] = [
  { position: 1, name: "España", code: "ESP", confederation: "UEFA", points: 1877.18, movement: "same", movementSteps: 0 },
  { position: 2, name: "Argentina", code: "ARG", confederation: "CONMEBOL", points: 1873.33, movement: "same", movementSteps: 0 },
  { position: 3, name: "Francia", code: "FRA", confederation: "UEFA", points: 1870, movement: "same", movementSteps: 0 },
  { position: 4, name: "Inglaterra", code: "ENG", confederation: "UEFA", points: 1834.12, movement: "same", movementSteps: 0 },
  { position: 5, name: "Brasil", code: "BRA", confederation: "CONMEBOL", points: 1760.46, movement: "up", movementSteps: 2 },
  { position: 6, name: "Portugal", code: "POR", confederation: "UEFA", points: 1760.38, movement: "down", movementSteps: 1 },
  { position: 7, name: "Países Bajos", code: "NED", confederation: "UEFA", points: 1756.27, movement: "down", movementSteps: 1 },
  { position: 8, name: "Bélgica", code: "BEL", confederation: "UEFA", points: 1730.71, movement: "same", movementSteps: 0 },
  { position: 9, name: "Alemania", code: "GER", confederation: "UEFA", points: 1724.15, movement: "up", movementSteps: 1 },
  { position: 10, name: "Croacia", code: "CRO", confederation: "UEFA", points: 1716.88, movement: "up", movementSteps: 1 },
  { position: 11, name: "Marruecos", code: "MAR", confederation: "CAF", points: 1713.12, movement: "up", movementSteps: 1 },
  { position: 12, name: "Italia", code: "ITA", confederation: "UEFA", points: 1702.06, movement: "down", movementSteps: 3 },
  { position: 13, name: "Colombia", code: "COL", confederation: "CONMEBOL", points: 1701.3, movement: "same", movementSteps: 0 },
  { position: 14, name: "Estados Unidos", code: "USA", confederation: "CONCACAF", points: 1681.88, movement: "up", movementSteps: 2 },
  { position: 15, name: "México", code: "MEX", confederation: "CONCACAF", points: 1675.75, movement: "down", movementSteps: 1 },
  { position: 16, name: "Uruguay", code: "URU", confederation: "CONMEBOL", points: 1672.62, movement: "down", movementSteps: 1 },
  { position: 17, name: "Suiza", code: "SUI", confederation: "UEFA", points: 1654.69, movement: "same", movementSteps: 0 },
  { position: 18, name: "Japón", code: "JPN", confederation: "AFC", points: 1650.12, movement: "up", movementSteps: 1 },
  { position: 19, name: "Senegal", code: "SEN", confederation: "CAF", points: 1648.07, movement: "down", movementSteps: 1 },
  { position: 20, name: "Irán", code: "IRN", confederation: "AFC", points: 1617.02, movement: "up", movementSteps: 1 },
];

// =========================================
// Bandera desde Flagpedia (estático también)
// =========================================
const FIFA_TO_ISO2: Record<string, string> = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BRA: "br",
  CMR: "cm",
  CAN: "ca",
  CPV: "cv",
  COL: "co",
  CRO: "hr",
  CUW: "cw",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  HAI: "ht",
  IRN: "ir",
  CIV: "ci",
  ITA: "it",
  JPN: "jp",
  JOR: "jo",
  MEX: "mx",
  MAR: "ma",
  NED: "nl",
  NZL: "nz",
  NGA: "ng",
  NOR: "no",
  PAN: "pa",
  PAR: "py",
  POR: "pt",
  QAT: "qa",
  KSA: "sa",
  SCO: "gb-sct",
  SEN: "sn",
  KOR: "kr",
  SUI: "ch",
  USA: "us",
  URU: "uy",
  UZB: "uz",
};

function getFlagUrlFromFifaCode(code?: string | null): string | null {
  if (!code) return null;
  const iso2 = FIFA_TO_ISO2[code.toUpperCase()];
  if (!iso2) return null;
  return `https://flagpedia.net/data/flags/w40/${iso2}.png`;
}

// =========================================
// Filtros UI (pero todo en memoria)
// =========================================
const CONFED_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "CONMEBOL", label: "CONMEBOL" },
  { value: "UEFA", label: "UEFA" },
  { value: "CONCACAF", label: "CONCACAF" },
  { value: "CAF", label: "CAF" },
  { value: "AFC", label: "AFC" },
  { value: "OFC", label: "OFC" },
] as const;

const CONFED_LABEL_EXTENDED: Record<string, string> = {
  CONMEBOL: "Sudamérica (CONMEBOL)",
  UEFA: "Europa (UEFA)",
  CONCACAF: "Norte, Centro y Caribe (CONCACAF)",
  CAF: "África (CAF)",
  AFC: "Asia (AFC)",
  OFC: "Oceanía (OFC)",
};

// =========================================
// COMPONENTE PRINCIPAL (SIN FETCH, SIN ERROR)
// =========================================
export default function FifaRankingTable() {
  const [confedFilter, setConfedFilter] =
    useState<(typeof CONFED_OPTIONS)[number]["value"]>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...RANKING_DATA];

    if (confedFilter !== "ALL") {
      list = list.filter(
        (t) => t.confederation.toUpperCase() === confedFilter
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.confederation.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => a.position - b.position);
    return list;
  }, [confedFilter, search]);

  const totalTeams = RANKING_DATA.length;

  if (!filtered.length) {
    return (
      <section className="space-y-4">
        <p className="mt-6 text-sm text-slate-300">
          No se encontraron selecciones para los filtros actuales.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* CABECERA / CONTROLES */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-yellow-300">
            Ranking FIFA 2026
          </p>
          <h1 className="font-bebas text-3xl md:text-4xl text-white tracking-[0.22em]">
            Clasificación mundial de selecciones
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl">
            Tabla manual basada en el ranking FIFA actual. Úsala como referencia
            rápida para ver qué selecciones llegan como favoritas al Mundial
            2026 y cómo se distribuyen por confederación.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-start md:items-end">
          <div className="inline-flex items-center gap-4 rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2">
            <div className="flex flex-col text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
                Resumen ranking
              </span>
              <div className="flex gap-3 text-xs md:text-sm text-slate-100 mt-1">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                  Top {totalTeams} selecciones
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por país, código o confederación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-72 rounded-full bg-slate-950/70 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/80"
            />
            <select
              value={confedFilter}
              onChange={(e) =>
                setConfedFilter(
                  e.target
                    .value as (typeof CONFED_OPTIONS)[number]["value"]
                )
              }
              className="w-full md:w-72 rounded-full bg-slate-950/70 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-yellow-400/80"
            >
              {CONFED_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === "ALL"
                    ? "Todas las confederaciones"
                    : CONFED_LABEL_EXTENDED[opt.value] ?? opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* LISTA DE RANKING */}
      <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
        <div className="hidden md:grid grid-cols-[70px_minmax(0,2fr)_minmax(0,1.3fr)_110px] gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 border-b border-slate-800 bg-slate-900/80">
          <span>#</span>
          <span>Selección</span>
          <span>Confederación</span>
          <span className="text-right">Puntos</span>
        </div>

        <ul className="divide-y divide-slate-800">
          {filtered.map((team) => {
            const flagUrl = getFlagUrlFromFifaCode(team.code);
            const confed = team.confederation;
            const movementLabel =
              team.movement === "same"
                ? "Sin cambios"
                : team.movement === "up"
                ? `+${team.movementSteps}`
                : `-${team.movementSteps}`;

            const movementClass =
              team.movement === "same"
                ? "bg-slate-800 text-slate-200 border-slate-600"
                : team.movement === "up"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/60"
                : "bg-red-500/10 text-red-300 border-red-400/60";

            const movementArrow =
              team.movement === "same"
                ? "⟳"
                : team.movement === "up"
                ? "↑"
                : "↓";

            return (
              <li
                key={team.position}
                className="px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-900/70 transition-colors"
              >
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-[70px_minmax(0,2fr)_minmax(0,1.3fr)_110px] gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                        (team.position <= 3
                          ? "bg-yellow-400 text-slate-900"
                          : "bg-slate-800 text-slate-100")
                      }
                    >
                      {team.position}
                    </span>
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[10px] " +
                        movementClass
                      }
                    >
                      <span className="text-[9px]">{movementArrow}</span>
                      <span>{movementLabel}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-9 w-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {flagUrl && (
                        <img
                          src={flagUrl}
                          alt={team.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-slate-100">
                        {team.code}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white truncate">
                        {team.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Código FIFA:{" "}
                        <span className="font-mono text-[10px] text-slate-200">
                          {team.code}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2.5 py-[3px] text-[10px] text-slate-200 bg-slate-800/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      {CONFED_LABEL_EXTENDED[confed] ?? confed}
                    </span>
                  </div>

                  <div className="flex flex-col items-end text-[11px] text-slate-300">
                    <span className="font-semibold">
                      {team.points.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Puntos FIFA
                    </span>
                  </div>
                </div>

                {/* Mobile */}
                <div className="flex md:hidden items-center gap-3">
                  <span
                    className={
                      "inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                      (team.position <= 3
                        ? "bg-yellow-400 text-slate-900"
                        : "bg-slate-800 text-slate-100")
                    }
                  >
                    {team.position}
                  </span>

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative h-9 w-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {flagUrl && (
                        <img
                          src={flagUrl}
                          alt={team.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-slate-100">
                        {team.code}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white truncate">
                        {team.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {CONFED_LABEL_EXTENDED[confed] ?? confed}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {team.points.toFixed(2)} pts · {movementLabel}
                      </span>
                    </div>

                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[9px] " +
                        movementClass
                      }
                    >
                      <span>{movementArrow}</span>
                      <span>{movementLabel}</span>
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
