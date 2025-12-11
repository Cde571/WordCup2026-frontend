// src/components/teams/TeamSquadViewer.tsx
import { useEffect, useState } from "react";

type Team = {
  _id: string;
  name: string;
  code: string;
  confederation?: string | null;
  group?: string | null;
  logo?: string | null;
};

type Player = {
  _id: string;
  name: string;
  position: string;
  number?: number | null;
  club?: string | null;
  age?: number | null;
  photo?: string | null;

  // Stats opcionales (si luego los guardas en Mongo)
  pace?: number | null; // VEL
  shooting?: number | null; // TIR
  passing?: number | null; // PAS
  dribbling?: number | null; // DRI
  defending?: number | null; // DEF
  physical?: number | null; // FIS
};

const API_BASE =
  import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:4000";

// Mapa código FIFA -> código ISO2 para Flagpedia
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

function getFlagUrlFromFifaCode(code?: string | null): string | null {
  if (!code) return null;
  const iso2 = FIFA_TO_ISO2[code.toUpperCase()];
  if (!iso2) return null;
  // puedes subir a w80 si quieres verla más grande
  return `https://flagpedia.net/data/flags/w40/${iso2}.png`;
}

// Avatar genérico desde internet si no hay foto del jugador
function getAvatarUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  // Fondo dorado, texto oscuro, estilo acorde al diseño
  return `https://ui-avatars.com/api/?name=${encoded}&background=facc15&color=1e293b&bold=true&size=256`;
}

export default function TeamSquadViewer() {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamId = params.get("teamId");

    if (!teamId) {
      setError(
        "No se especificó ninguna selección. Vuelve desde la página de equipos."
      );
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Datos del equipo
        const teamRes = await fetch(`${API_BASE}/api/teams/${teamId}`);
        if (!teamRes.ok) throw new Error("No se pudo cargar la selección.");
        const teamData = await teamRes.json();

        // 2) Jugadores
        const playersRes = await fetch(
          `${API_BASE}/api/teams/${teamId}/players`
        );
        if (!playersRes.ok) throw new Error("No se pudo cargar la plantilla.");
        const playersData = await playersRes.json();

        setTeam(teamData);
        setPlayers(playersData.players ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error cargando la plantilla.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <p className="mt-4 text-sm text-slate-300">
        Cargando plantilla de la selección...
      </p>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-2xl border border-red-500/50 bg-red-900/20 px-4 py-3 text-xs text-red-100">
        {error}
      </div>
    );
  }

  if (!team) {
    return (
      <p className="mt-4 text-sm text-slate-300">
        No se encontró información de la selección.
      </p>
    );
  }

  const flagUrl = getFlagUrlFromFifaCode(team.code);

  return (
    <section className="space-y-6">
      {/* CABECERA SELECCIÓN */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Escudo / bandera grande */}
          <div className="relative h-16 w-16 rounded-2xl bg-slate-900 border border-yellow-400/60 flex items-center justify-center overflow-hidden">
            {flagUrl && (
              <img
                src={flagUrl}
                alt={team.name}
                className="h-full w-full object-cover opacity-90"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="absolute inset-0 flex items-center justify-center font-bebas text-2xl text-slate-950/80 bg-yellow-300/80">
              {team.code}
            </span>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-sky-300">
              Plantilla oficial (demo)
            </p>
            <h1 className="font-bebas text-3xl md:text-4xl text-white tracking-[0.22em]">
              {team.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-300">
              Cartas estilo FIFA para visualizar rápidamente la plantilla.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1 text-[11px] text-slate-400">
          {team.confederation && (
            <span>
              Confederación:{" "}
              <span className="font-semibold text-slate-100">
                {team.confederation}
              </span>
            </span>
          )}
          {team.group && (
            <span>
              Grupo:{" "}
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2 py-[2px] text-[10px] text-slate-200 bg-slate-800/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Grupo {team.group.toUpperCase()}
              </span>
            </span>
          )}
        </div>
      </header>

      {/* GRID DE CARTAS FIFA */}
      {players.length === 0 ? (
        <p className="text-xs text-slate-300">
          Todavía no hay jugadores registrados para esta selección.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {players.map((p) => (
            <FifaCard key={p._id} player={p} team={team} />
          ))}
        </div>
      )}
    </section>
  );
}

// =====================================================
// Componente Carta FIFA
// =====================================================

function FifaCard({ player, team }: { player: Player; team: Team }) {
  const flagUrl = getFlagUrlFromFifaCode(team.code);

  // Rating: si no hay stats, usamos uno por defecto
  const rating =
    player.pace ??
    player.shooting ??
    player.passing ??
    player.dribbling ??
    player.defending ??
    player.physical ??
    85;

  const statOrDash = (v?: number | null) =>
    typeof v === "number" ? v : "--";

  const pos = player.position || "??";

  // Avatar/foto: si no hay photo en Mongo, generamos uno online
  const photoUrl =
    player.photo && player.photo.trim().length > 0
      ? player.photo
      : getAvatarUrl(player.name);

  const initials = player.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="relative mx-auto h-[260px] w-[170px] md:h-[280px] md:w-[190px] rounded-[26px] bg-gradient-to-b from-[#f9f2c7] via-[#f2da7a] to-[#d0aa4d] shadow-xl border border-[#f9f2c7]/60 flex flex-col overflow-hidden">
      {/* Borde interior */}
      <div className="m-[6px] h-[calc(100%-12px)] w-[calc(100%-12px)] rounded-[22px] bg-gradient-to-b from-[#f8edbe] via-[#f5d87a] to-[#c89a3f] relative flex flex-col px-2 pt-2 pb-3">
        {/* Rating + posición */}
        <div className="flex justify-between items-start text-[#3c2b16]">
          <div className="flex flex-col leading-none items-start">
            <span className="text-3xl md:text-4xl font-black">
              {rating}
            </span>
            <span className="mt-1 text-xs font-semibold tracking-wide">
              {pos}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            {/* Bandera */}
            <div className="h-5 w-8 border border-[#3c2b16]/40 overflow-hidden rounded-[3px] bg-[#e8cf8e] flex items-center justify-center">
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
            </div>
            {/* Club (o selección) */}
            <span className="mt-[2px] text-[8px] font-semibold uppercase tracking-wide text-[#3c2b16] line-clamp-2 text-right max-w-[70px]">
              {player.club || team.name}
            </span>
          </div>
        </div>

        {/* Foto jugador */}
        <div className="mt-1 flex-1 flex items-center justify-center">
          <div className="relative h-24 w-24 md:h-26 md:w-26 rounded-full bg-[#e9d18c] border-[3px] border-[#d3b567] overflow-hidden flex items-center justify-center">
            <img
              src={photoUrl}
              alt={player.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                // si fallara la carga del avatar, mostramos iniciales
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            {/* capa de respaldo: iniciales si la imagen no se ve */}
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-[#3c2b16]">
              {initials}
            </span>
          </div>
        </div>

        {/* Nombre */}
        <div className="mt-1 flex justify-center">
          <span className="font-bebas text-xl tracking-[0.18em] text-[#3c2b16] text-center">
            {player.name.toUpperCase()}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-1 flex justify-center">
          <div className="w-[120px] border-t border-[#c6a75d] pt-1 flex justify-between text-[#3c2b16]">
            <div className="flex flex-col text-[10px] font-semibold leading-tight gap-1">
              <StatRow label="VEL" value={statOrDash(player.pace)} />
              <StatRow label="TIR" value={statOrDash(player.shooting)} />
              <StatRow label="PAS" value={statOrDash(player.passing)} />
            </div>
            <div className="flex flex-col text-[10px] font-semibold leading-tight gap-1">
              <StatRow label="DRI" value={statOrDash(player.dribbling)} />
              <StatRow label="DEF" value={statOrDash(player.defending)} />
              <StatRow label="FIS" value={statOrDash(player.physical)} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline gap-[4px]">
      <span className="text-xs font-black w-6 text-right">{value}</span>
      <span className="text-[9px] tracking-wide">{label}</span>
    </div>
  );
}
