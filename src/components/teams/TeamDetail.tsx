// src/components/teams/TeamDetail.tsx
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

type Player = {
  _id: string;
  name: string;
  position: "GK" | "DF" | "MF" | "FW" | "Unknown" | string;
  number?: number | null;
  club?: string | null;
  age?: number | null;
  photo?: string | null;
};

type TeamDetailProps = {
  teamId: string;
};

// API base
const API_BASE =
  import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:4000";

// Mapa FIFA -> ISO2 (igual que en TeamsExplorer / GroupStagePicker)
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
  return `https://flagpedia.net/data/flags/w40/${iso2}.png`;
}

export default function TeamDetail({ teamId }: TeamDetailProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Pedimos equipo y jugadores en paralelo
        const [teamRes, playersRes] = await Promise.all([
          fetch(`${API_BASE}/api/teams/${teamId}`),
          fetch(`${API_BASE}/api/teams/${teamId}/players`),
        ]);

        if (!teamRes.ok) {
          throw new Error(`Error cargando equipo (${teamRes.status})`);
        }
        const teamJson = await teamRes.json();

        if (!playersRes.ok) {
          throw new Error(`Error cargando jugadores (${playersRes.status})`);
        }
        const playersJson = await playersRes.json();

        setTeam(teamJson as Team);
        setPlayers((playersJson.players ?? []) as Player[]);
      } catch (err: any) {
        console.error(err);
        setError("No se pudo cargar la información de esta selección.");
      } finally {
        setLoading(false);
      }
    }

    if (teamId) {
      loadData();
    }
  }, [teamId]);

  const flagUrl = team ? getFlagUrlFromFifaCode(team.code) : null;

  // Agrupamos jugadores por posición
  const playersByPosition = useMemo(() => {
    const groups: Record<string, Player[]> = {
      GK: [],
      DF: [],
      MF: [],
      FW: [],
      OTHER: [],
    };

    for (const p of players) {
      const pos = (p.position || "Unknown").toUpperCase();
      if (pos === "GK") groups.GK.push(p);
      else if (pos === "DF") groups.DF.push(p);
      else if (pos === "MF") groups.MF.push(p);
      else if (pos === "FW") groups.FW.push(p);
      else groups.OTHER.push(p);
    }

    return groups;
  }, [players]);

  const totalPlayers = players.length;

  if (loading) {
    return (
      <div className="mt-6 text-sm text-slate-300">
        Cargando datos del equipo...
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="mt-6 rounded-2xl border border-red-500/50 bg-red-900/20 px-4 py-3 text-xs text-red-100">
        {error ?? "No se encontró esta selección."}
      </div>
    );
  }

  const groupLabel = team.group
    ? `Grupo ${team.group.toUpperCase()}`
    : "Grupo por definir";

  return (
    <section className="space-y-6 mt-4">
      {/* CABECERA + INFO BÁSICA */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {/* Bandera + escudo */}
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
            {flagUrl && (
              <img
                src={flagUrl}
                alt={team.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-100">
              {team.code}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">
              Selección nacional
            </p>
            <h1 className="font-bebas text-3xl md:text-4xl text-white tracking-[0.22em]">
              {team.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
              {team.confederation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700 px-2 py-[2px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {team.confederation}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700 px-2 py-[2px]">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                {groupLabel}
              </span>
              {typeof team.fifaRanking === "number" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-400/60 px-2 py-[2px] text-amber-100">
                  Ranking FIFA #{team.fifaRanking}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* resumen plantilla + back */}
        <div className="flex flex-col items-end gap-3">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2">
            <div className="flex flex-col text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
                Plantilla registrada
              </span>
              <span className="text-xs md:text-sm text-slate-100">
                {totalPlayers} jugador{totalPlayers === 1 ? "" : "es"}
              </span>
            </div>
          </div>

          <a
            href="/equipos"
            className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800 transition-colors"
          >
            ← Volver a todas las selecciones
          </a>
        </div>
      </header>

      {/* GRID PRINCIPAL: PLANTILLA POR POSICIÓN */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PlayersColumn
          title="Porteros"
          short="GK"
          players={playersByPosition.GK}
          accent="from-sky-500 to-sky-700"
        />
        <PlayersColumn
          title="Defensas"
          short="DF"
          players={playersByPosition.DF}
          accent="from-emerald-500 to-emerald-700"
        />
        <PlayersColumn
          title="Centrocampistas"
          short="MF"
          players={playersByPosition.MF}
          accent="from-amber-500 to-amber-700"
        />
        <PlayersColumn
          title="Delanteros"
          short="FW"
          players={playersByPosition.FW}
          accent="from-rose-500 to-rose-700"
        />
      </div>

      {/* Otros / sin posición clara */}
      {playersByPosition.OTHER.length > 0 && (
        <section className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-[0.16em] mb-2">
            Otros / posición no definida
          </h2>
          <div className="space-y-1.5">
            {playersByPosition.OTHER.map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between text-[11px] text-slate-200"
              >
                <span>
                  #{p.number ?? "—"} {p.name}
                </span>
                <span className="text-slate-400">
                  {p.club || "Club desconocido"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

// Subcomponente columna de jugadores
type PlayersColumnProps = {
  title: string;
  short: string;
  players: Player[];
  accent: string; // clases tailwind del gradiente
};

function PlayersColumn({ title, short, players, accent }: PlayersColumnProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className={`h-7 w-7 rounded-full bg-gradient-to-br ${accent} flex items-center justify-center text-[10px] font-bold text-white`}
          >
            {short}
          </div>
          <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-[0.14em]">
            {title}
          </h2>
        </div>
        <span className="text-[10px] text-slate-400">
          {players.length} jugador{players.length === 1 ? "" : "es"}
        </span>
      </div>

      <div className="space-y-1.5">
        {players.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            Aún no hay jugadores registrados en esta posición.
          </p>
        ) : (
          players.map((p) => (
            <div
              key={p._id}
              className="flex items-center justify-between rounded-xl bg-slate-900/80 border border-slate-800 px-2 py-1.5 text-[11px] text-slate-200"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-slate-100">
                  {p.number ?? "?"}
                </span>
                <span className="truncate">{p.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 ml-2 truncate">
                {p.club || "Club desconocido"}
              </span>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
