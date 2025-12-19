// src/components/teams/TeamsExplorer.tsx
import { useEffect, useMemo, useState } from "react";

type Team = {
  _id: string;
  name: string;
  code: string;
  confederation?: string | null;
  group?: string | null;
  logo?: string | null;
  fifaRanking?: number | null;
};

// =========================================
// 1) API base (igual que en otros componentes)
// =========================================
const API_BASE =
  import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const TEAMS_API = `${API_BASE}/api/teams`;

// =========================================
// 2) Mapa FIFA (3 letras) -> ISO2 Flagpedia
//    REUSAMOS LA MISMA LÓGICA
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
  FRA: "fr",
  GER: "de",
  HAI: "ht",
  IRN: "ir",
  CIV: "ci",
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
  ESP: "es",
  SUI: "ch",
  USA: "us",
  URU: "uy",
  UZB: "uz",
};

function getFlagUrlFromFifaCode(
  code: string | undefined | null
): string | null {
  if (!code) return null;
  const iso2 = FIFA_TO_ISO2[code.toUpperCase()];
  if (!iso2) return null;

  // Flagpedia 40px wide
  return `https://flagpedia.net/data/flags/w40/${iso2}.png`;
}

// =========================================
// 3) Fallback de grupo por código (igual filosofía)
// =========================================
const FALLBACK_GROUP_BY_CODE: Record<string, string> = {
  // Grupo A
  MEX: "A",
  KOR: "A",
  // faltan RSA, UEFA4 cuando los tengas

  // Grupo B
  CAN: "B",
  QAT: "B",
  SUI: "B",

  // Grupo C
  BRA: "C",
  MAR: "C",
  HAI: "C",
  SCO: "C",

  // Grupo D
  USA: "D",
  PAR: "D",
  AUS: "D",

  // Grupo E
  GER: "E",
  CUW: "E",
  CIV: "E",
  ECU: "E",

  // Grupo F
  NED: "F",
  JPN: "F",
  // TUN: "F",

  // Grupo G
  BEL: "G",
  EGY: "G",
  IRN: "G",
  NZL: "G",

  // Grupo H
  ESP: "H",
  CPV: "H",
  KSA: "H",
  URU: "H",

  // Grupo I
  FRA: "I",
  SEN: "I",
  NOR: "I",

  // Grupo J
  ARG: "J",
  AUT: "J",
  ALG: "J",
  JOR: "J",

  // Grupo K
  POR: "K",
  COL: "K",
  UZB: "K",

  // Grupo L
  ENG: "L",
  CRO: "L",
  PAN: "L",
};

function getGroupKey(team: Team): string {
  if (team.group) return team.group.toUpperCase();
  const fromMap = FALLBACK_GROUP_BY_CODE[team.code?.toUpperCase()];
  if (fromMap) return fromMap;
  return "Z"; // sin grupo definido
}

// =========================================
// 4) Opciones de filtro por confederación
// =========================================
const CONFED_OPTIONS = [
  { value: "ALL", label: "Todas las confederaciones" },
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
  CONCACAF: "Norte, Centroamérica y Caribe (CONCACAF)",
  CAF: "África (CAF)",
  AFC: "Asia (AFC)",
  OFC: "Oceanía (OFC)",
};

// =========================================
// 5) Componente principal
// =========================================
export default function TeamsExplorer() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confedFilter, setConfedFilter] =
    useState<(typeof CONFED_OPTIONS)[number]["value"]>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(TEAMS_API);
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data = await res.json();
        const list: Team[] = data.teams || [];
        setTeams(list);
      } catch (err: any) {
        console.error(err);
        setError("No se pudieron cargar las selecciones. Intenta más tarde.");
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  // Derivamos lista filtrada
  const filtered = useMemo(() => {
    let list = [...teams];

    // filtro confederación
    if (confedFilter !== "ALL") {
      list = list.filter(
        (t) => t.confederation?.toUpperCase() === confedFilter
      );
    }

    // filtro búsqueda
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.confederation || "").toLowerCase().includes(q)
      );
    }

    // ordenar por grupo y luego nombre
    list.sort((a, b) => {
      const gA = getGroupKey(a);
      const gB = getGroupKey(b);
      if (gA !== gB) return gA.localeCompare(gB);
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [teams, confedFilter, search]);

  // Stats simples
  const totalTeams = teams.length;
  const totalGroups = new Set(teams.map((t) => getGroupKey(t))).size;

  if (loading) {
    return (
      <div className="mt-6 text-sm text-slate-300">
        Cargando selecciones clasificadas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-red-500/50 bg-red-900/20 px-4 py-3 text-xs text-red-100">
        {error}
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="mt-6 text-sm text-slate-300">
        No se encontraron selecciones para los filtros actuales.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* CABECERA / CONTROLES */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">
            Explorador de selecciones
          </p>
          <h1 className="font-bebas text-3xl md:text-4xl text-white tracking-[0.22em]">
            Equipos clasificados
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl">
            Filtra por confederación, busca por nombre o código FIFA y revisa
            rápidamente en qué grupo está cada selección para apoyar tus
            predicciones.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
           
          </p>
        </div>

        <div className="flex flex-col gap-3 items-start md:items-end">
          {/* stats */}
          <div className="inline-flex items-center gap-4 rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2">
            <div className="flex flex-col text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
                Resumen actual
              </span>
              <div className="flex gap-3 text-xs md:text-sm text-slate-100 mt-1">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {totalTeams} equipos
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  {totalGroups} grupos
                </span>
              </div>
            </div>
          </div>

          {/* controles: búsqueda + select confed */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por nombre, código o confederación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-72 rounded-full bg-slate-950/70 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
            />
            <select
              value={confedFilter}
              onChange={(e) =>
                setConfedFilter(e.target.value as (typeof CONFED_OPTIONS)[number]["value"])
              }
              className="w-full md:w-72 rounded-full bg-slate-950/70 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
            >
              {CONFED_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label === "ALL"
                    ? "Todas las confederaciones"
                    : CONFED_LABEL_EXTENDED[opt.value] ?? opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* GRID DE EQUIPOS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((team) => {
          const flagUrl = getFlagUrlFromFifaCode(team.code);
          const groupKey = getGroupKey(team);

          return (
            <article
              key={team._id}
              className="group relative overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-emerald-400/60 hover:bg-slate-900/90 transition-colors duration-200 shadow-sm hover:shadow-xl"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl" />
              </div>

              <div className="relative flex items-center gap-3 px-3 pt-3">
                {/* Bandera circular */}
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
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

                <div className="flex flex-col leading-tight flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-white truncate">
                    {team.name}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    {team.confederation && (
                      <span>{team.confederation}</span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2 py-[2px] text-[10px] text-slate-200 bg-slate-800/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Grupo {groupKey === "Z" ? "?" : groupKey}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative px-3 pb-3 pt-2 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    ID:{" "}
                    <span className="font-mono text-[9px]">
                      {String(team._id).slice(-6)}
                    </span>
                  </span>
                  {typeof team.fifaRanking === "number" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-400/40 px-2 py-[1px] text-[9px] text-amber-200">
                      Ranking FIFA #{team.fifaRanking}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-500">
                    Código FIFA:{" "}
                    <span className="font-mono text-[10px] text-slate-200">
                      {team.code}
                    </span>
                  </span>

                 
                    <button
                    type="button"
                    onClick={() => {
                        // Navegar a la plantilla de ESTA selección
                        window.location.href = `/plantilla?teamId=${team._id}`;
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium text-emerald-200 group-hover:bg-emerald-500/15"
                    >
                    Ver plantilla
                    <span className="text-[9px]">↗</span>
                    </button>


                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
