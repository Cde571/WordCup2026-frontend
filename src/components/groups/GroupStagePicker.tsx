import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, apiFetch, unwrapList, positionLabel } from "../../lib/api";

type Team = {
  _id: string;
  name: string;
  code: string;
  group?: string | null;
  confederation?: string | null;
  logo?: string | null;
};

type Player = {
  _id: string;
  name: string;
  number?: number | null;
  position?: string | null;
  club?: string | null;
  age?: number | null;
  photo?: string | null;
  team?: Team | string;
};

type PickGroup = {
  first?: string;
  second?: string;
  third?: string;
};

const GROUPS = "ABCDEFGHIJKL".split("");

const ISO_BY_CODE: Record<string, string> = {
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  USA: "us", PAR: "py", AUS: "au", TUR: "tr",
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec",
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no",
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
};

function flagUrl(code?: string | null) {
  const iso = ISO_BY_CODE[String(code || "").toUpperCase()];
  return iso ? `https://flagcdn.com/w80/${iso}.png` : "";
}

function generatedAvatar(player: Player) {
  const seed = encodeURIComponent(`${player.name || "player"}-${player._id || ""}`);
  return `https://api.dicebear.com/9.x/personas/svg?seed=${seed}&backgroundColor=172033,26324d,0f172a`;
}

function isBadPlayerName(name?: string | null) {
  const value = String(name || "").trim();

  if (!value) return true;
  if (value.length < 3) return true;
  if (/^\d/.test(value)) return true;
  if (/\b(18|19|20)\d{2}\s*[-–]\s*(18|19|20)\d{2}\b/.test(value)) return true;
  if (/\b(19|20)\d{2}\b/.test(value) && value.length < 40) return true;
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value)) return true;
  if (/\b(años|edad|fecha|nacimiento|entrenador|seleccionador|director técnico|director tecnico|coach|dt)\b/i.test(value)) return true;

  const letters = value.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || [];
  return letters.length < 3;
}

function TeamFlag({ team }: { team?: Team | null }) {
  const src = flagUrl(team?.code);

  return (
    <div className="team-flag">
      {src ? <img src={src} alt={team?.code || "flag"} /> : null}
      <span>{team?.code || "--"}</span>
    </div>
  );
}

function PlayerPhoto({ player }: { player: Player }) {
  const [photo, setPhoto] = useState(player.photo || "");

  useEffect(() => {
    let alive = true;

    async function resolvePhoto() {
      if (player.photo) {
        setPhoto(player.photo);
        return;
      }

      try {
        const data = await apiFetch<any>(`/api/players/photo?playerId=${player._id}`);
        const resolved = data?.photo || data?.url || "";

        if (alive) {
          setPhoto(resolved || generatedAvatar(player));
        }
      } catch {
        if (alive) {
          setPhoto(generatedAvatar(player));
        }
      }
    }

    resolvePhoto();

    return () => {
      alive = false;
    };
  }, [player._id, player.photo, player.name]);

  return (
    <img
      className="player-photo"
      src={photo || generatedAvatar(player)}
      alt={player.name}
      loading="lazy"
      onError={() => setPhoto(generatedAvatar(player))}
    />
  );
}

function positionOfTeam(pick: PickGroup, teamId: string) {
  if (pick.first === teamId) return "1";
  if (pick.second === teamId) return "2";
  if (pick.third === teamId) return "3";
  return "";
}

export default function GroupStagePicker() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeGroup, setActiveGroup] = useState("A");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");
  const [picks, setPicks] = useState<Record<string, PickGroup>>({});
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPlayers(team: Team) {
    setSelectedTeam(team);
    setPlayerSearch("");

    try {
      const data = await apiFetch(`/api/players?teamId=${team._id}`);
      setPlayers(unwrapList<Player>(data, "players"));
    } catch {
      setPlayers([]);
    }
  }

  async function load() {
    try {
      setError("");

      const teamsData = await apiFetch("/api/teams");
      const loadedTeams = unwrapList<Team>(teamsData, "teams");
      setTeams(loadedTeams);

      const firstTeam = loadedTeams.find((team) => team.group === activeGroup) || loadedTeams[0];
      if (firstTeam) {
        await loadPlayers(firstTeam);
      }

      const saved = await apiFetch<any>("/api/predictions/group").catch(() => null);

      const nextPicks: Record<string, PickGroup> = {};
      const nextLocked: Record<string, boolean> = {};

      for (const pred of saved?.predictions || []) {
        const group = String(pred.group || "").toUpperCase();

        nextPicks[group] = {
          first: pred.firstPlaceTeam?._id || pred.firstPlaceTeam,
          second: pred.secondPlaceTeam?._id || pred.secondPlaceTeam,
          third: pred.thirdPlaceTeam?._id || pred.thirdPlaceTeam || "",
        };

        nextLocked[group] = true;
      }

      setPicks(nextPicks);
      setLocked(nextLocked);
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar los grupos.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const groupedTeams = useMemo(() => {
    const map: Record<string, Team[]> = {};

    for (const group of GROUPS) {
      map[group] = [];
    }

    for (const team of teams) {
      const group = String(team.group || "").toUpperCase();
      if (map[group]) {
        map[group].push(team);
      }
    }

    for (const group of GROUPS) {
      map[group].sort((a, b) => a.name.localeCompare(b.name));
    }

    return map;
  }, [teams]);

  const activeTeams = groupedTeams[activeGroup] || [];
  const activePick = picks[activeGroup] || {};
  const isLocked = Boolean(locked[activeGroup]);

  const visiblePlayers = useMemo(() => {
    const clean = players.filter((player) => !isBadPlayerName(player.name));

    if (!playerSearch.trim()) return clean;

    const q = playerSearch.toLowerCase();

    return clean.filter((player) => {
      return (
        player.name.toLowerCase().includes(q) ||
        String(player.club || "").toLowerCase().includes(q) ||
        String(player.position || "").toLowerCase().includes(q)
      );
    });
  }, [players, playerSearch]);

  function choosePosition(teamId: string, position: "first" | "second" | "third") {
    if (isLocked) return;

    setPicks((current) => {
      const oldPick = current[activeGroup] || {};
      const next: PickGroup = { ...oldPick };

      for (const key of ["first", "second", "third"] as const) {
        if (next[key] === teamId) {
          next[key] = "";
        }
      }

      next[position] = teamId;

      return {
        ...current,
        [activeGroup]: next,
      };
    });
  }

  async function saveGroup() {
    try {
      setMessage("");
      setError("");

      if (isLocked) return;

      if (!activePick.first || !activePick.second) {
        setError("Debes elegir mínimo 1° y 2° lugar del grupo.");
        return;
      }

      if (activePick.first === activePick.second || activePick.first === activePick.third || activePick.second === activePick.third) {
        setError("No puedes repetir la misma selección en varias posiciones.");
        return;
      }

      await apiFetch("/api/predictions/group", {
        method: "POST",
        body: JSON.stringify({
          group: activeGroup,
          firstPlaceTeam: activePick.first,
          secondPlaceTeam: activePick.second,
          thirdPlaceTeam: activePick.third || null,
        }),
      });

      setLocked((current) => ({
        ...current,
        [activeGroup]: true,
      }));

      setMessage(`Grupo ${activeGroup} guardado y bloqueado.`);
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar la predicción. Inicia sesión si aún no lo has hecho.");
    }
  }

  function teamName(teamId?: string) {
    const team = teams.find((item) => item._id === teamId);
    return team?.name || "Sin elegir";
  }

  return (
    <main className="groups-page">
      <header className="top-nav">
        <a href="/" className="brand">
          <span>26</span>
          <div>
            <strong>WC26 Arena</strong>
            <small>Predictor Mundial</small>
          </div>
        </a>

        <nav>
          <a className="active" href="/grupos">Grupos</a>
          <a href="/bracket">Bracket</a>
          <a href="/partidos">Partidos</a>
          <a href="/oraculo">Oráculo</a>
          <a href="/equipos">Equipos</a>
          <a href="/ranking">Ranking</a>
          <a href="/perfil">Perfil</a>
        </nav>

        <button onClick={() => (window.location.href = `${API_BASE}/auth/google`)}>
          Mi cuenta
        </button>
      </header>

      <section className="hero">
        <span>Predicción de fase de grupos</span>
        <h1>Elige tus clasificados del Mundial 2026</h1>
        <p>
          Selecciona 1°, 2° y 3° de cada grupo. Cuando guardes, la predicción queda bloqueada para mantener la competencia justa.
        </p>
      </section>

      <section className="group-tabs">
        {GROUPS.map((group) => (
          <button
            key={group}
            className={activeGroup === group ? "active" : ""}
            onClick={() => {
              setActiveGroup(group);
              const first = groupedTeams[group]?.[0];
              if (first) loadPlayers(first);
            }}
          >
            Grupo {group}
          </button>
        ))}
      </section>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <section className="main-grid">
        <div className="left-zone">
          <div className="section-head">
            <div>
              <span>Grupo {activeGroup}</span>
              <h2>Tabla proyectada</h2>
            </div>

            <button className="save-btn" disabled={isLocked} onClick={saveGroup}>
              {isLocked ? "Bloqueado" : "Guardar grupo"}
            </button>
          </div>

          <div className="projected-table">
            <article>
              <strong>1°</strong>
              <span>{teamName(activePick.first)}</span>
            </article>
            <article>
              <strong>2°</strong>
              <span>{teamName(activePick.second)}</span>
            </article>
            <article>
              <strong>3°</strong>
              <span>{teamName(activePick.third)}</span>
            </article>
          </div>

          <div className="team-grid">
            {activeTeams.map((team) => {
              const position = positionOfTeam(activePick, team._id);
              const selected = Boolean(position);

              return (
                <article
                  key={team._id}
                  className={selected ? "team-card selected" : "team-card"}
                  onClick={() => loadPlayers(team)}
                >
                  <div className="team-main">
                    <TeamFlag team={team} />

                    <div>
                      <h3>{team.name}</h3>
                      <p>{team.confederation || "Confederación pendiente"}</p>
                    </div>

                    {position && <span className="position-badge">{position}°</span>}
                  </div>

                  <div className="pick-buttons">
                    <button
                      disabled={isLocked}
                      className={activePick.first === team._id ? "active first" : ""}
                      onClick={(event) => {
                        event.stopPropagation();
                        choosePosition(team._id, "first");
                      }}
                    >
                      1°
                    </button>

                    <button
                      disabled={isLocked}
                      className={activePick.second === team._id ? "active second" : ""}
                      onClick={(event) => {
                        event.stopPropagation();
                        choosePosition(team._id, "second");
                      }}
                    >
                      2°
                    </button>

                    <button
                      disabled={isLocked}
                      className={activePick.third === team._id ? "active third" : ""}
                      onClick={(event) => {
                        event.stopPropagation();
                        choosePosition(team._id, "third");
                      }}
                    >
                      3°
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="players-panel">
          <div className="players-head">
            <div>
              <span>Jugadores</span>
              <h2>{selectedTeam?.name || "Selecciona una selección"}</h2>
            </div>

            {selectedTeam && <TeamFlag team={selectedTeam} />}
          </div>

          <input
            className="player-search"
            value={playerSearch}
            placeholder="Buscar jugador por nombre, club o posición..."
            onChange={(event) => setPlayerSearch(event.target.value)}
          />

          <div className="players-list">
            {visiblePlayers.length === 0 ? (
              <div className="empty-card">
                No hay jugadores limpios para mostrar.
              </div>
            ) : (
              visiblePlayers.map((player) => (
                <article key={player._id} className="player-card">
                  <PlayerPhoto player={player} />

                  <div>
                    <strong>
                      #{player.number || "--"} · {player.name}
                    </strong>

                    <p>
                      {positionLabel(player.position)} · {player.club || "Club sin dato"}
                    </p>

                    <small>Edad: {player.age || "—"}</small>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </section>

      <style>{`
        body {
          margin: 0;
          background:
            radial-gradient(circle at top left, rgba(255, 201, 40, .10), transparent 34%),
            radial-gradient(circle at top right, rgba(73, 130, 255, .14), transparent 30%),
            linear-gradient(180deg, #050816 0%, #070b18 48%, #050816 100%);
          color: #f8fafc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .groups-page {
          width: min(1480px, calc(100% - 32px));
          margin: 0 auto;
          padding: 16px 0 56px;
        }

        .top-nav {
          min-height: 74px;
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          margin-bottom: 20px;
        }

        .brand {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 7px 10px 7px 7px;
          border: 2px solid rgba(255,255,255,.86);
          border-radius: 5px;
          color: #fff;
          text-decoration: none;
          background: rgba(8, 13, 29, .75);
        }

        .brand span {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          color: #fff477;
          border: 1px solid rgba(255,244,119,.55);
          background: #111827;
          font-size: 1.25rem;
          font-weight: 1000;
        }

        .brand strong {
          display: block;
          font-size: 1.2rem;
          line-height: 1;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .brand small {
          display: block;
          margin-top: 6px;
          color: #a7b0c5;
          font-size: .7rem;
          letter-spacing: .19em;
          text-transform: uppercase;
        }

        .top-nav nav {
          justify-self: center;
          display: flex;
          gap: 6px;
          padding: 7px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 999px;
          background: rgba(255,255,255,.045);
          overflow-x: auto;
        }

        .top-nav nav a {
          padding: 11px 14px;
          border-radius: 999px;
          color: rgba(248,250,252,.78);
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: .72rem;
          font-weight: 900;
          white-space: nowrap;
        }

        .top-nav nav a.active,
        .top-nav nav a:hover {
          color: #111827;
          background: linear-gradient(135deg, #ffc928, #ffb800);
        }

        .top-nav button,
        .save-btn {
          min-height: 44px;
          border: 0;
          cursor: pointer;
          padding: 0 18px;
          border-radius: 999px;
          color: #111827;
          background: linear-gradient(135deg, #ffc928, #ffb800);
          font-weight: 1000;
        }

        button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .hero,
        .left-zone,
        .players-panel,
        .team-card,
        .alert,
        .projected-table article,
        .empty-card {
          border: 1px solid rgba(255,255,255,.14);
          background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025)), #0d1428;
          box-shadow: 0 18px 50px rgba(0,0,0,.28);
        }

        .hero {
          border-radius: 30px;
          padding: 28px 30px;
          margin-bottom: 18px;
        }

        .hero span,
        .section-head span,
        .players-head span {
          color: #ffc928;
          font-size: .74rem;
          letter-spacing: .16em;
          text-transform: uppercase;
          font-weight: 1000;
        }

        .hero h1 {
          max-width: 900px;
          margin: 12px 0 0;
          font-size: clamp(2.3rem, 5vw, 5.4rem);
          line-height: .92;
          letter-spacing: -.065em;
        }

        .hero p {
          max-width: 760px;
          color: #b7c2d8;
          line-height: 1.65;
        }

        .group-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 8px;
          margin-bottom: 18px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 999px;
          background: rgba(255,255,255,.045);
        }

        .group-tabs button {
          min-width: 96px;
          min-height: 42px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 999px;
          color: #dbe4f4;
          background: #10172a;
          cursor: pointer;
          font-weight: 1000;
        }

        .group-tabs button.active {
          color: #111827;
          border-color: transparent;
          background: linear-gradient(135deg, #ffc928, #ffb800);
        }

        .alert {
          border-radius: 18px;
          padding: 14px 16px;
          margin-bottom: 18px;
          font-weight: 900;
        }

        .alert.success {
          color: #d8ffe8;
          border-color: rgba(0,199,132,.35);
        }

        .alert.error {
          color: #ffe1e1;
          border-color: rgba(239,68,68,.35);
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 430px;
          gap: 18px;
        }

        .left-zone,
        .players-panel {
          border-radius: 28px;
          padding: 18px;
        }

        .section-head,
        .players-head {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-head h2,
        .players-head h2 {
          margin: 6px 0 0;
          color: #fff;
        }

        .projected-table {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .projected-table article {
          border-radius: 20px;
          padding: 14px;
          background:
            radial-gradient(circle at top left, rgba(255,201,40,.13), transparent 45%),
            #10172a;
        }

        .projected-table strong {
          display: block;
          color: #ffc928;
          font-size: 1.5rem;
        }

        .projected-table span {
          display: block;
          margin-top: 4px;
          color: #ffffff;
          font-weight: 900;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 14px;
        }

        .team-card {
          min-height: 170px;
          cursor: pointer;
          border-radius: 24px;
          padding: 14px;
          transition: .2s ease;
          background:
            linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.025)),
            #111a31;
        }

        .team-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,201,40,.46);
        }

        .team-card.selected {
          border-color: rgba(255,201,40,.95);
          box-shadow:
            0 0 0 2px rgba(255,201,40,.18),
            0 18px 50px rgba(255,201,40,.13);
        }

        .team-main {
          display: grid;
          grid-template-columns: 70px minmax(0,1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .team-card h3 {
          margin: 0;
          color: #ffffff;
          font-size: 1.08rem;
        }

        .team-card p {
          color: #c7d2ea;
          margin: 6px 0 0;
        }

        .position-badge {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          color: #111827;
          background: #ffc928;
          font-weight: 1000;
        }

        .team-flag {
          position: relative;
          width: 70px;
          height: 58px;
          border-radius: 18px;
          overflow: hidden;
          display: grid;
          place-items: center;
          background: #ffc928;
          color: #111827;
          font-weight: 1000;
          border: 1px solid rgba(255,255,255,.12);
        }

        .team-flag img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .team-flag span {
          position: relative;
          z-index: 2;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(5,8,22,.74);
          color: #fff;
          font-size: .72rem;
        }

        .pick-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 14px;
        }

        .pick-buttons button {
          min-height: 42px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 16px;
          color: #ffffff;
          background: #080f22;
          cursor: pointer;
          font-weight: 1000;
        }

        .pick-buttons button.active.first {
          color: #111827;
          border-color: transparent;
          background: linear-gradient(135deg, #ffc928, #ffb800);
        }

        .pick-buttons button.active.second {
          color: #07111f;
          border-color: transparent;
          background: linear-gradient(135deg, #dbeafe, #93c5fd);
        }

        .pick-buttons button.active.third {
          color: #07111f;
          border-color: transparent;
          background: linear-gradient(135deg, #bbf7d0, #22c55e);
        }

        .players-panel {
          align-self: start;
          position: sticky;
          top: 16px;
          max-height: calc(100vh - 32px);
          overflow: auto;
        }

        .player-search {
          width: 100%;
          min-height: 48px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 16px;
          color: #ffffff;
          background: #080f22;
          padding: 0 14px;
          outline: none;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .player-search::placeholder {
          color: #8292b4;
        }

        .player-search:focus {
          border-color: rgba(255,201,40,.75);
          box-shadow: 0 0 0 3px rgba(255,201,40,.13);
        }

        .players-list {
          display: grid;
          gap: 12px;
        }

        .player-card {
          display: grid;
          grid-template-columns: 68px minmax(0,1fr);
          gap: 14px;
          align-items: center;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 22px;
          padding: 12px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025)),
            #111a31;
        }

        .player-photo {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          object-fit: cover;
          background: #111827;
          border: 1px solid rgba(255,255,255,.12);
        }

        .player-card strong {
          display: block;
          color: #ffffff;
          font-size: .98rem;
        }

        .player-card p {
          color: #d7e1f4;
          margin: 5px 0 0;
        }

        .player-card small {
          color: #9fb0ce;
        }

        .empty-card {
          border-radius: 20px;
          padding: 16px;
          color: #cbd5e1;
        }

        @media (max-width: 1120px) {
          .top-nav,
          .main-grid {
            grid-template-columns: 1fr;
          }

          .top-nav nav {
            justify-self: stretch;
          }

          .players-panel {
            position: static;
            max-height: none;
          }

          .projected-table {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
