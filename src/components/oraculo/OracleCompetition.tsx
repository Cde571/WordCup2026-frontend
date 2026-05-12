import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, apiFetch, unwrapList } from "../../lib/api";

type Team = {
  _id: string;
  name: string;
  code: string;
  group?: string | null;
  confederation?: string | null;
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

type OracleValues = Record<string, any>;

const PLAYER_FIELDS = [
  ["topScorerPlayer", "Máximo goleador", "Quién marcará más goles en el Mundial."],
  ["bestPlayer", "Mejor jugador", "El jugador más determinante del torneo."],
  ["bestGoalkeeper", "Mejor arquero", "El portero que será figura."],
  ["bestYoungPlayer", "Mejor joven", "La revelación juvenil del Mundial."],
  ["assistKing", "Rey de asistencias", "El jugador que más goles va a crear."],
  ["bestGoalPlayer", "Autor del mejor gol", "Quién hará el gol más recordado."],
  ["firstHatTrickPlayer", "Primer hat-trick", "Quién marcará el primer triplete."],
];

const TEAM_FIELDS = [
  ["surpriseTeam", "Selección sorpresa", "El equipo que llegará más lejos de lo esperado."],
  ["darkHorseChampion", "Tapado campeón", "Una selección que podría dar el golpe."],
];

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

function generatedAvatar(name: string) {
  const seed = encodeURIComponent(name || "player");
  return `https://api.dicebear.com/9.x/personas/svg?seed=${seed}&backgroundColor=172033,26324d,0f172a`;
}

function playerTeamCode(player?: Player | null) {
  if (!player) return "";
  if (typeof player.team === "object") return player.team?.code || "";
  return "";
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

function PlayerVisual({ name, photo }: { name: string; photo?: string | null }) {
  const [src, setSrc] = useState(photo || generatedAvatar(name));

  useEffect(() => {
    setSrc(photo || generatedAvatar(name));
  }, [photo, name]);

  return (
    <img
      className="player-photo"
      src={src}
      alt={name}
      onError={() => setSrc(generatedAvatar(name))}
    />
  );
}

export default function OracleCompetition() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [values, setValues] = useState<OracleValues>({ totalGoals: 172 });
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeAssign, setActiveAssign] = useState("topScorerPlayer");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const playerById = useMemo(() => {
    return new Map(players.map((player) => [player._id, player]));
  }, [players]);

  const teamById = useMemo(() => {
    return new Map(teams.map((team) => [team._id, team]));
  }, [teams]);

  const cleanPlayers = useMemo(() => {
    return players.filter((player) => !isBadPlayerName(player.name));
  }, [players]);

  async function load() {
    try {
      setError("");

      const [teamsData, playersData] = await Promise.all([
        apiFetch("/api/teams"),
        apiFetch("/api/players"),
      ]);

      const loadedTeams = unwrapList<Team>(teamsData, "teams");
      const loadedPlayers = unwrapList<Player>(playersData, "players").filter(
        (player) => !isBadPlayerName(player.name)
      );

      setTeams(loadedTeams);
      setPlayers(loadedPlayers);

      const localSaved = localStorage.getItem("wc26_oracle_local");
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        setValues(parsed.predictions || {});
        setLocked(Boolean(parsed.locked));
      }

      const saved = await apiFetch<any>("/api/predictions/oracle").catch(() => null);

      if (saved?.predictions) {
        setValues(saved.predictions);
        setLocked(Boolean(saved.locked));
        setMessage(saved.locked ? "Tu Oráculo está guardado y bloqueado." : "");
      }
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el Oráculo.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateValue(key: string, value: any) {
    if (locked) return;

    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function choosePlayer(fieldKey: string, player: Player) {
    if (locked) return;

    setValues((current) => ({
      ...current,
      [fieldKey]: player._id,
      [`${fieldKey}Name`]: player.name,
      [`${fieldKey}Photo`]: player.photo || generatedAvatar(player.name),
      [`${fieldKey}Club`]: player.club || "",
      [`${fieldKey}TeamCode`]: playerTeamCode(player),
    }));

    setMessage(`${player.name} fue asignado a ${fieldKey}.`);
  }

  async function searchPlayer() {
    if (!search.trim()) {
      setError("Escribe el nombre de un jugador.");
      return;
    }

    setError("");
    setMessage("");

    const q = search.trim().toLowerCase();

    const local = cleanPlayers
      .filter((player) => {
        return (
          player.name.toLowerCase().includes(q) ||
          String(player.club || "").toLowerCase().includes(q) ||
          playerTeamCode(player).toLowerCase().includes(q)
        );
      })
      .slice(0, 12);

    if (local.length > 0) {
      setSearchResults(local);
      return;
    }

    try {
      const data = await apiFetch<any>(`/api/players/search-photo?q=${encodeURIComponent(search.trim())}`);

      const externalName = data?.results?.[0]?.name || search.trim();
      const externalPhoto = data?.results?.[0]?.photo || data?.results?.[0]?.url || generatedAvatar(externalName);

      const pseudoPlayer: Player = {
        _id: `external-${Date.now()}`,
        name: externalName,
        photo: externalPhoto,
        club: "Fuente externa",
        position: "Unknown",
      };

      setSearchResults([pseudoPlayer]);
    } catch {
      const pseudoPlayer: Player = {
        _id: `manual-${Date.now()}`,
        name: search.trim(),
        photo: generatedAvatar(search.trim()),
        club: "Jugador manual",
        position: "Unknown",
      };

      setSearchResults([pseudoPlayer]);
    }
  }

  async function saveOracle() {
    if (locked) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        predictions: values,
      };

      try {
        await apiFetch("/api/predictions/oracle", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setLocked(true);
        localStorage.setItem(
          "wc26_oracle_local",
          JSON.stringify({
            predictions: values,
            locked: true,
          })
        );

        setMessage("Oráculo guardado y bloqueado.");
      } catch {
        localStorage.setItem(
          "wc26_oracle_local",
          JSON.stringify({
            predictions: values,
            locked: true,
          })
        );

        setLocked(true);
        setMessage("Oráculo guardado localmente y bloqueado. Inicia sesión para guardarlo en tu usuario.");
      }
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el Oráculo.");
    } finally {
      setSaving(false);
    }
  }

  function selectedPlayerData(fieldKey: string) {
    const id = values[fieldKey];
    const dbPlayer = id ? playerById.get(String(id)) : null;

    return {
      name: values[`${fieldKey}Name`] || dbPlayer?.name || "Sin elegir",
      photo: values[`${fieldKey}Photo`] || dbPlayer?.photo || generatedAvatar(values[`${fieldKey}Name`] || dbPlayer?.name || "Sin elegir"),
      club: values[`${fieldKey}Club`] || dbPlayer?.club || "Pendiente",
      teamCode: values[`${fieldKey}TeamCode`] || playerTeamCode(dbPlayer),
    };
  }

  return (
    <main className="oracle-page">
      {saving && (
        <div className="saving-overlay">
          <div className="saving-card">
            <div className="crystal">
              <div className="ring r1" />
              <div className="ring r2" />
              <div className="core">26</div>
            </div>

            <span>Oráculo WC26</span>
            <h2>Guardando predicción</h2>
            <p>Estamos sellando tu bola de cristal mundialista.</p>
          </div>
        </div>
      )}

      <header className="top-nav">
        <a href="/" className="brand">
          <span>26</span>
          <div>
            <strong>WC26 Arena</strong>
            <small>Predictor Mundial</small>
          </div>
        </a>

        <nav>
          <a href="/grupos">Grupos</a>
          <a href="/bracket">Bracket</a>
          <a href="/partidos">Partidos</a>
          <a className="active" href="/oraculo">Oráculo</a>
          <a href="/equipos">Equipos</a>
          <a href="/ranking">Ranking</a>
          <a href="/perfil">Perfil</a>
        </nav>

        <button onClick={() => (window.location.href = `${API_BASE}/auth/google`)}>
          Mi cuenta
        </button>
      </header>

      <section className="hero">
        <span>Predicción especial</span>
        <h1>Oráculo del Mundial 2026</h1>
        <p>
          Completa tus predicciones especiales: goleador, mejor jugador, mejor arquero, selección sorpresa y total de goles.
        </p>
      </section>

      <section className="toolbar">
        <div>
          <strong>{locked ? "Oráculo bloqueado" : "Oráculo editable"}</strong>
          <p>
            {locked
              ? "Ya guardaste esta predicción. No se puede modificar."
              : "Cuando guardes, esta predicción quedará bloqueada."}
          </p>
        </div>

        <button disabled={locked || saving} onClick={saveOracle}>
          {locked ? "Bloqueado" : "Guardar Oráculo"}
        </button>
      </section>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <section className="search-panel">
        <div className="search-copy">
          <span>Buscador de jugadores</span>
          <h2>Busca y asigna jugadores al Oráculo</h2>
          <p>Escribe el nombre del jugador y luego asígnalo a una categoría.</p>
        </div>

        <div className="search-row">
          <select
            disabled={locked}
            value={activeAssign}
            onChange={(event) => setActiveAssign(event.target.value)}
          >
            {PLAYER_FIELDS.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <input
            disabled={locked}
            value={search}
            placeholder="Buscar: Messi, Cristiano, Mbappé, Luis Díaz..."
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") searchPlayer();
            }}
          />

          <button disabled={locked} onClick={searchPlayer}>
            Buscar
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((player) => (
              <article key={player._id} className="search-card">
                <PlayerVisual name={player.name} photo={player.photo} />

                <div>
                  <strong>{player.name}</strong>
                  <p>{player.club || "Club pendiente"} {playerTeamCode(player) ? `· ${playerTeamCode(player)}` : ""}</p>

                  <button disabled={locked} onClick={() => choosePlayer(activeAssign, player)}>
                    Asignar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="oracle-grid">
        {PLAYER_FIELDS.map(([key, label, description]) => {
          const selected = selectedPlayerData(key);

          return (
            <article key={key} className="oracle-card">
              <div className="card-top">
                <PlayerVisual name={selected.name} photo={selected.photo} />

                <div>
                  <span>Jugador</span>
                  <h2>{label}</h2>
                </div>
              </div>

              <p>{description}</p>

              <div className="selected-box">
                <strong>{selected.name}</strong>
                <small>{selected.club} {selected.teamCode ? `· ${selected.teamCode}` : ""}</small>
              </div>

              <select
                disabled={locked}
                value={values[key] || ""}
                onChange={(event) => {
                  const player = playerById.get(event.target.value);
                  if (player) choosePlayer(key, player);
                }}
              >
                <option value="">Selecciona jugador</option>
                {cleanPlayers.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.name} · {player.club || "Club"} {playerTeamCode(player) ? `· ${playerTeamCode(player)}` : ""}
                  </option>
                ))}
              </select>
            </article>
          );
        })}

        {TEAM_FIELDS.map(([key, label, description]) => {
          const team = values[key] ? teamById.get(values[key]) : null;

          return (
            <article key={key} className="oracle-card">
              <div className="card-top">
                <TeamFlag team={team} />

                <div>
                  <span>Selección</span>
                  <h2>{label}</h2>
                </div>
              </div>

              <p>{description}</p>

              <div className="selected-box">
                <strong>{team?.name || "Sin elegir"}</strong>
                <small>Grupo {team?.group || "pendiente"} {team?.confederation ? `· ${team.confederation}` : ""}</small>
              </div>

              <select
                disabled={locked}
                value={values[key] || ""}
                onChange={(event) => updateValue(key, event.target.value)}
              >
                <option value="">Selecciona selección</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} · Grupo {team.group || "-"}
                  </option>
                ))}
              </select>
            </article>
          );
        })}

        <article className="oracle-card number-card">
          <div className="number-icon">#</div>
          <span>Número</span>
          <h2>Total de goles</h2>
          <p>Tu predicción del total de goles del Mundial 2026.</p>

          <input
            disabled={locked}
            type="number"
            min={1}
            value={Number(values.totalGoals || 0)}
            onChange={(event) => updateValue("totalGoals", Number(event.target.value))}
          />
        </article>
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

        .oracle-page {
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
        .toolbar button,
        .search-row button,
        .search-card button {
          min-height: 44px;
          border: 0;
          cursor: pointer;
          padding: 0 18px;
          border-radius: 999px;
          color: #111827;
          background: linear-gradient(135deg, #ffc928, #ffb800);
          font-weight: 1000;
        }

        button:disabled,
        input:disabled,
        select:disabled {
          opacity: .58;
          cursor: not-allowed;
        }

        .hero,
        .toolbar,
        .search-panel,
        .oracle-card,
        .alert {
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
        .search-copy span,
        .oracle-card span {
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

        .hero p,
        .toolbar p,
        .search-copy p,
        .oracle-card p {
          max-width: 760px;
          color: #b7c2d8;
          line-height: 1.65;
        }

        .toolbar,
        .search-panel {
          border-radius: 26px;
          padding: 18px;
          margin-bottom: 18px;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
        }

        .toolbar strong {
          color: #fff;
          font-size: 1.1rem;
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

        .search-row {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr) auto;
          gap: 12px;
          margin-top: 14px;
        }

        select,
        input {
          width: 100%;
          min-height: 48px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 16px;
          color: #ffffff;
          background: #080f22;
          padding: 0 14px;
          outline: none;
          font-weight: 800;
        }

        select:focus,
        input:focus {
          border-color: rgba(255,201,40,.75);
          box-shadow: 0 0 0 3px rgba(255,201,40,.13);
        }

        option {
          color: #111827;
          background: #ffffff;
        }

        input::placeholder {
          color: #8292b4;
        }

        .search-results {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 14px;
          margin-top: 16px;
        }

        .search-card {
          display: grid;
          grid-template-columns: 76px minmax(0, 1fr);
          gap: 14px;
          align-items: center;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 22px;
          padding: 12px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025)),
            #111a31;
        }

        .search-card strong {
          color: #fff;
          display: block;
        }

        .search-card p {
          margin: 4px 0 10px;
          color: #d7e1f4;
        }

        .oracle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 16px;
        }

        .oracle-card {
          border-radius: 26px;
          padding: 18px;
          transition: .2s ease;
        }

        .oracle-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,201,40,.44);
        }

        .card-top {
          display: grid;
          grid-template-columns: 76px minmax(0, 1fr);
          gap: 14px;
          align-items: center;
          margin-bottom: 12px;
        }

        .card-top h2,
        .number-card h2 {
          color: #fff;
          margin: 4px 0 0;
          font-size: 1.35rem;
        }

        .player-photo,
        .team-flag,
        .number-icon {
          width: 76px;
          height: 76px;
          border-radius: 22px;
          overflow: hidden;
          display: grid;
          place-items: center;
          object-fit: cover;
          background: #111827;
          border: 1px solid rgba(255,255,255,.14);
        }

        .team-flag {
          position: relative;
          background: #ffc928;
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
          font-weight: 1000;
        }

        .number-icon {
          color: #111827;
          background: linear-gradient(135deg, #ffc928, #ffb800);
          font-size: 2rem;
          font-weight: 1000;
          margin-bottom: 12px;
        }

        .selected-box {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 18px;
          padding: 12px;
          background: rgba(5,8,22,.62);
          margin: 12px 0;
        }

        .selected-box strong,
        .selected-box small {
          display: block;
        }

        .selected-box strong {
          color: #fff;
        }

        .selected-box small {
          margin-top: 4px;
          color: #c7d2ea;
        }

        .saving-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: grid;
          place-items: center;
          background: rgba(2,6,23,.78);
          backdrop-filter: blur(10px);
        }

        .saving-card {
          width: min(420px, calc(100% - 30px));
          text-align: center;
          border-radius: 32px;
          padding: 32px;
          border: 1px solid rgba(255,255,255,.14);
          background: #091327;
          box-shadow: 0 0 90px rgba(0,0,0,.5);
        }

        .saving-card span {
          color: #ffc928;
          font-size: .72rem;
          letter-spacing: .18em;
          text-transform: uppercase;
          font-weight: 1000;
        }

        .saving-card h2 {
          margin: 8px 0;
          font-size: 2rem;
        }

        .saving-card p {
          color: #b7c2d8;
        }

        .crystal {
          position: relative;
          width: 170px;
          height: 170px;
          margin: 0 auto 22px;
          display: grid;
          place-items: center;
        }

        .core {
          width: 126px;
          height: 126px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 2.6rem;
          color: #fff477;
          font-weight: 1000;
          background:
            radial-gradient(circle at 35% 30%, rgba(140,255,244,.95), rgba(41,120,255,.65) 42%, rgba(10,20,44,.95) 76%),
            radial-gradient(circle at 65% 72%, rgba(255,206,67,.32), transparent 42%);
          box-shadow:
            0 0 35px rgba(89, 240, 255, 0.38),
            inset 0 0 30px rgba(255,255,255,0.12);
          animation: pulse 2.2s ease-in-out infinite;
        }

        .ring {
          position: absolute;
          border-radius: 999px;
          border: 1px solid rgba(255, 208, 66, 0.35);
        }

        .r1 {
          width: 160px;
          height: 160px;
          animation: spin 7s linear infinite;
        }

        .r2 {
          width: 186px;
          height: 110px;
          border-color: rgba(111, 222, 255, 0.45);
          animation: reverse 6.5s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes reverse {
          to { transform: rotate(-360deg); }
        }

        @keyframes pulse {
          50% { transform: scale(1.05); }
        }

        @media (max-width: 1100px) {
          .top-nav,
          .search-row {
            grid-template-columns: 1fr;
          }

          .top-nav nav {
            justify-self: stretch;
          }

          .toolbar {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </main>
  );
}
