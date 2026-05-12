import React, { useEffect, useMemo, useState } from "react";

type Team = {
  _id: string;
  name: string;
  code: string;
  group?: string | null;
  confederation?: string | null;
  logo?: string | null;
};

type AuthStatus = {
  loggedIn: boolean;
  user?: {
    username?: string;
    email?: string;
    profilePic?: string;
    totalPoints?: number;
  } | null;
  isAdmin?: boolean;
};

type GroupSelection = {
  first?: string;
  second?: string;
  third?: string;
};

const API_BASE =
  (
    import.meta.env.PUBLIC_API_BASE_URL ||
    import.meta.env.PUBLIC_BACKEND_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");

const GROUPS = "ABCDEFGHIJKL".split("");

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    const body = isJson
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    const message =
      body?.error ||
      body?.message ||
      body ||
      `Error HTTP ${response.status}`;

    throw new Error(String(message));
  }

  return isJson ? response.json() : null;
}

function getTeamsFromResponse(data: any): Team[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.teams)) return data.teams;
  return [];
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "WC"
  );
}

function placeLabel(place: keyof GroupSelection) {
  if (place === "first") return "1°";
  if (place === "second") return "2°";
  return "3°";
}

function placeText(place: keyof GroupSelection) {
  if (place === "first") return "Primero";
  if (place === "second") return "Segundo";
  return "Tercero";
}

function nextIncompleteGroup(selections: Record<string, GroupSelection>) {
  return GROUPS.find((group) => {
    const selected = selections[group] || {};
    return !selected.first || !selected.second;
  });
}

export default function GroupPredictionArena() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [auth, setAuth] = useState<AuthStatus>({ loggedIn: false });
  const [activeGroup, setActiveGroup] = useState("A");
  const [selections, setSelections] = useState<Record<string, GroupSelection>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    setStatusMessage("");

    try {
      const [teamsData, authData] = await Promise.all([
        apiFetch("/api/teams"),
        apiFetch("/auth/status").catch(() => ({ loggedIn: false })),
      ]);

      const loadedTeams = getTeamsFromResponse(teamsData).filter((team) => team.group);
      setTeams(loadedTeams);
      setAuth(authData);

      if (authData?.loggedIn) {
        const saved = await apiFetch("/api/predictions/groups/my-predictions").catch(() => null);

        if (saved?.predictions) {
          const restored: Record<string, GroupSelection> = {};

          for (const group of GROUPS) {
            const pred = saved.predictions[group];
            if (!pred) continue;

            const firstId =
              pred.firstTeam?._id ||
              loadedTeams.find((team) => team.code === pred.first)?._id;

            const secondId =
              pred.secondTeam?._id ||
              loadedTeams.find((team) => team.code === pred.second)?._id;

            const thirdId =
              pred.thirdTeam?._id ||
              loadedTeams.find((team) => team.code === pred.third)?._id;

            restored[group] = {
              first: firstId,
              second: secondId,
              third: thirdId,
            };
          }

          setSelections(restored);
          setStatusMessage("Predicciones anteriores cargadas desde tu usuario.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "No se pudo conectar con el backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const teamsByGroup = useMemo(() => {
    const map = new Map<string, Team[]>();

    for (const group of GROUPS) {
      map.set(group, []);
    }

    for (const team of teams) {
      const group = String(team.group || "").toUpperCase();
      if (!map.has(group)) map.set(group, []);
      map.get(group)?.push(team);
    }

    for (const group of GROUPS) {
      map.get(group)?.sort((a, b) => a.name.localeCompare(b.name));
    }

    return map;
  }, [teams]);

  const completedGroups = useMemo(() => {
    return GROUPS.filter((group) => {
      const selected = selections[group] || {};
      return Boolean(selected.first && selected.second);
    }).length;
  }, [selections]);

  const progressPercent = Math.round((completedGroups / 12) * 100);
  const incompleteGroup = nextIncompleteGroup(selections);

  function selectTeam(group: string, teamId: string, place: keyof GroupSelection) {
    setSelections((current) => {
      const groupSelection = { ...(current[group] || {}) };

      for (const key of ["first", "second", "third"] as Array<keyof GroupSelection>) {
        if (groupSelection[key] === teamId) {
          delete groupSelection[key];
        }
      }

      if (current[group]?.[place] === teamId) {
        delete groupSelection[place];
      } else {
        groupSelection[place] = teamId;
      }

      return {
        ...current,
        [group]: groupSelection,
      };
    });
  }

  function clearGroup(group: string) {
    setSelections((current) => ({
      ...current,
      [group]: {},
    }));
  }

  function autoPickGroup(group: string) {
    const groupTeams = teamsByGroup.get(group) || [];
    if (groupTeams.length < 2) return;

    setSelections((current) => ({
      ...current,
      [group]: {
        first: groupTeams[0]?._id,
        second: groupTeams[1]?._id,
        third: groupTeams[2]?._id,
      },
    }));
  }

  async function saveAll() {
    setSaving(true);
    setError("");
    setStatusMessage("");

    try {
      if (!auth.loggedIn) {
        throw new Error("Debes iniciar sesión con Google para guardar tus predicciones.");
      }

      const predictions: Record<string, { first: string; second: string; third?: string | null }> = {};

      for (const group of GROUPS) {
        const selected = selections[group] || {};

        if (selected.first && selected.second) {
          predictions[group] = {
            first: selected.first,
            second: selected.second,
            third: selected.third || null,
          };
        }
      }

      if (Object.keys(predictions).length === 0) {
        throw new Error("Selecciona al menos un grupo antes de guardar.");
      }

      const result = await apiFetch("/api/predictions/groups/bulk", {
        method: "POST",
        body: JSON.stringify({ predictions }),
      });

      setStatusMessage(
        `Predicciones guardadas en tu usuario: ${result?.saved ?? Object.keys(predictions).length}/${Object.keys(predictions).length}. Ya estás participando en la competencia.`
      );
    } catch (err: any) {
      setError(err?.message || "No se pudieron guardar las predicciones.");
    } finally {
      setSaving(false);
    }
  }

  function login() {
    window.location.href = `${API_BASE}/auth/google`;
  }

  const activeTeams = teamsByGroup.get(activeGroup) || [];
  const activeSelection = selections[activeGroup] || {};

  return (
    <section className="gp-shell">
      <div className="gp-hero">
        <div>
          <span className="gp-kicker">Fase de grupos · Competencia de predicción</span>
          <h1>Elige los clasificados de cada grupo</h1>
          <p>
            Selecciona primero, segundo y tercero. La app evita duplicados,
            mide tu avance y guarda tus picks en tu cuenta.
          </p>
        </div>

        <div className="gp-status-card">
          <span>Progreso</span>
          <strong>{completedGroups}/12</strong>
          <div className="gp-progress">
            <div style={{ width: `${progressPercent}%` }} />
          </div>
          <small>{progressPercent}% completado</small>
        </div>
      </div>

      <div className="gp-flow-bar">
        <div className="gp-flow-step active">
          <span>1</span>
          Inicia sesión
        </div>
        <div className="gp-flow-step active">
          <span>2</span>
          Ordena grupos
        </div>
        <div className="gp-flow-step">
          <span>3</span>
          Guarda picks
        </div>
        <div className="gp-flow-step">
          <span>4</span>
          Compite en ranking
        </div>
      </div>

      <div className="gp-top-actions">
        <div className="gp-user-box">
          {auth.loggedIn ? (
            <>
              <strong>{auth.user?.username || auth.user?.email || "Usuario conectado"}</strong>
              <span>Tus predicciones se guardan en tu usuario y entran al ranking</span>
            </>
          ) : (
            <>
              <strong>Modo vista previa</strong>
              <span>Puedes probar, pero para participar debes iniciar sesión</span>
            </>
          )}
        </div>

        <div className="gp-action-row">
          {!auth.loggedIn && (
            <button type="button" onClick={login} className="gp-button secondary">
              Iniciar con Google
            </button>
          )}

          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="gp-button primary"
          >
            {saving ? "Guardando..." : "Guardar predicciones"}
          </button>
        </div>
      </div>

      {error && <div className="gp-alert error">{error}</div>}
      {statusMessage && <div className="gp-alert success">{statusMessage}</div>}

      <div className="gp-tabs">
        {GROUPS.map((group) => {
          const selected = selections[group] || {};
          const done = Boolean(selected.first && selected.second);

          return (
            <button
              key={group}
              type="button"
              className={activeGroup === group ? "active" : ""}
              onClick={() => setActiveGroup(group)}
            >
              <span>Grupo {group}</span>
              <small>{done ? "Completo" : "Pendiente"}</small>
            </button>
          );
        })}
      </div>

      <div className="gp-main-grid">
        <article className="gp-group-panel">
          <div className="gp-group-head">
            <div>
              <span>Predicción activa</span>
              <h2>Grupo {activeGroup}</h2>
            </div>

            <div className="gp-group-actions">
              <button type="button" onClick={() => autoPickGroup(activeGroup)}>
                Auto demo
              </button>
              <button type="button" onClick={() => clearGroup(activeGroup)}>
                Limpiar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="gp-loading">Cargando equipos...</div>
          ) : activeTeams.length === 0 ? (
            <div className="gp-empty">
              No hay equipos cargados para este grupo. Revisa `/api/teams`.
            </div>
          ) : (
            <div className="gp-team-list">
              {activeTeams.map((team) => {
                const selectedPlace = (["first", "second", "third"] as Array<keyof GroupSelection>)
                  .find((place) => activeSelection[place] === team._id);

                return (
                  <div
                    key={team._id}
                    className={`gp-team-card ${selectedPlace ? "selected" : ""}`}
                  >
                    <div className="gp-team-info">
                      <div className="gp-team-badge">
                        <span className="gp-flag">{flagForTeam(team)}</span>
                        <small>{team.code}</small>
                      </div>
                      <div>
                        <h3>{team.name}</h3>
                        <p>{team.confederation || "Confederación pendiente"}</p>
                      </div>
                    </div>

                    <div className="gp-place-buttons">
                      {(["first", "second", "third"] as Array<keyof GroupSelection>).map((place) => (
                        <button
                          key={place}
                          type="button"
                          className={activeSelection[place] === team._id ? "active" : ""}
                          onClick={() => selectTeam(activeGroup, team._id, place)}
                          title={placeText(place)}
                        >
                          {placeLabel(place)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <aside className="gp-summary-panel">
          <div className="gp-summary-head">
            <span>Tu tabla</span>
            <h2>Grupo {activeGroup}</h2>
          </div>

          {(["first", "second", "third"] as Array<keyof GroupSelection>).map((place) => {
            const teamId = activeSelection[place];
            const team = activeTeams.find((item) => item._id === teamId);

            return (
              <div key={place} className={`gp-podium-row ${team ? "filled" : ""}`}>
                <div className="gp-podium-place">{placeLabel(place)}</div>
                <div>
                  <strong>
                    {team ? `${flagForTeam(team)} ${team.name}` : `${placeText(place)} lugar`}
                  </strong>
                  <span>{team?.code || "Sin seleccionar"}</span>
                </div>
              </div>
            );
          })}

          <div className="gp-rules">
            <h3>Sistema de puntos</h3>
            <ul>
              <li>1° exacto: 5 puntos</li>
              <li>2° exacto: 3 puntos</li>
              <li>3° exacto: 2 puntos</li>
              <li>Grupo perfecto: bono de 5 puntos</li>
            </ul>
          </div>

          {incompleteGroup && (
            <button
              type="button"
              className="gp-next-button"
              onClick={() => setActiveGroup(incompleteGroup)}
            >
              Ir al siguiente pendiente: Grupo {incompleteGroup}
            </button>
          )}
        </aside>
      </div>

      <style>{`
        .gp-shell {
          width: min(1440px, calc(100% - 32px));
          margin: 0 auto;
          padding: 28px 0 56px;
          color: #f8fafc;
        }

        .gp-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 18px;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 32px;
          background:
            radial-gradient(circle at 12% 0%, rgba(255, 204, 0, 0.18), transparent 32%),
            radial-gradient(circle at 90% 10%, rgba(0, 219, 255, 0.16), transparent 34%),
            linear-gradient(135deg, rgba(10, 15, 35, 0.96), rgba(8, 12, 28, 0.92));
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38);
        }

        .gp-kicker {
          display: inline-flex;
          margin-bottom: 14px;
          color: #ffd45a;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .gp-hero h1 {
          margin: 0;
          max-width: 850px;
          font-size: clamp(2.3rem, 5vw, 5.2rem);
          line-height: 0.9;
          letter-spacing: -0.07em;
        }

        .gp-hero p {
          max-width: 760px;
          margin: 18px 0 0;
          color: rgba(248, 250, 252, 0.68);
          font-size: 1rem;
          line-height: 1.7;
        }

        .gp-status-card {
          align-self: stretch;
          display: grid;
          align-content: center;
          gap: 9px;
          padding: 22px;
          border-radius: 26px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.08);
        }

        .gp-status-card span,
        .gp-status-card small {
          color: rgba(248, 250, 252, 0.62);
          font-weight: 700;
        }

        .gp-status-card strong {
          font-size: 3.2rem;
          line-height: 1;
          color: #ffd45a;
        }

        .gp-progress {
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
        }

        .gp-progress div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #ffd45a, #00e0ff, #28f29c);
          transition: width 0.25s ease;
        }

        .gp-flow-bar,
        .gp-top-actions,
        .gp-tabs,
        .gp-group-panel,
        .gp-summary-panel {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.065);
          backdrop-filter: blur(18px);
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.24);
        }

        .gp-flow-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 16px;
          padding: 12px;
          border-radius: 24px;
        }

        .gp-flow-step {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          color: rgba(248, 250, 252, 0.62);
          border-radius: 18px;
          font-weight: 800;
        }

        .gp-flow-step span {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
        }

        .gp-flow-step.active {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.08);
        }

        .gp-flow-step.active span {
          color: #07111f;
          background: linear-gradient(135deg, #ffd45a, #00e0ff);
        }

        .gp-top-actions {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin-top: 16px;
          padding: 16px;
          border-radius: 24px;
        }

        .gp-user-box {
          display: grid;
          gap: 3px;
        }

        .gp-user-box span {
          color: rgba(248, 250, 252, 0.62);
          font-size: 0.9rem;
        }

        .gp-action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .gp-button,
        .gp-group-actions button,
        .gp-next-button {
          border: 0;
          cursor: pointer;
          min-height: 44px;
          padding: 0 16px;
          border-radius: 999px;
          font-weight: 900;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .gp-button:hover,
        .gp-group-actions button:hover,
        .gp-next-button:hover {
          transform: translateY(-2px);
        }

        .gp-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .gp-button.primary {
          color: #04111d;
          background: linear-gradient(135deg, #ffd45a, #00e0ff);
        }

        .gp-button.secondary,
        .gp-group-actions button {
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.08);
        }

        .gp-alert {
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 18px;
          font-weight: 800;
        }

        .gp-alert.error {
          color: #ffdada;
          border: 1px solid rgba(255, 107, 107, 0.35);
          background: rgba(255, 107, 107, 0.11);
        }

        .gp-alert.success {
          color: #d8ffe8;
          border: 1px solid rgba(40, 242, 156, 0.35);
          background: rgba(40, 242, 156, 0.11);
        }

        .gp-tabs {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 8px;
          margin-top: 16px;
          padding: 10px;
          border-radius: 24px;
        }

        .gp-tabs button {
          min-height: 58px;
          border: 0;
          cursor: pointer;
          border-radius: 18px;
          color: rgba(248, 250, 252, 0.72);
          background: rgba(255, 255, 255, 0.055);
          display: grid;
          place-items: center;
          gap: 2px;
          font-weight: 900;
        }

        .gp-tabs button small {
          font-size: 0.68rem;
          color: rgba(248, 250, 252, 0.5);
        }

        .gp-tabs button.active {
          color: #04111d;
          background: linear-gradient(135deg, #ffd45a, #00e0ff);
        }

        .gp-tabs button.active small {
          color: rgba(4, 17, 29, 0.74);
        }

        .gp-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 18px;
          margin-top: 18px;
        }

        .gp-group-panel,
        .gp-summary-panel {
          border-radius: 28px;
          padding: 20px;
        }

        .gp-group-head,
        .gp-summary-head {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          margin-bottom: 18px;
        }

        .gp-group-head span,
        .gp-summary-head span {
          color: #ffd45a;
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 900;
        }

        .gp-group-head h2,
        .gp-summary-head h2 {
          margin: 4px 0 0;
          font-size: 2rem;
        }

        .gp-group-actions {
          display: flex;
          gap: 8px;
        }

        .gp-team-list {
          display: grid;
          gap: 12px;
        }

        .gp-team-card {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          padding: 16px;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(4, 8, 20, 0.38);
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .gp-team-card:hover,
        .gp-team-card.selected {
          transform: translateY(-2px);
          border-color: rgba(0, 224, 255, 0.42);
          background: rgba(0, 224, 255, 0.08);
        }

        .gp-team-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .gp-team-badge {
          width: 64px;
          height: 58px;
          display: grid;
          place-items: center;
          gap: 1px;
          border-radius: 18px;
          color: #04111d;
          font-weight: 1000;
          background: linear-gradient(135deg, #ffd45a, #00e0ff);
        }

        .gp-team-badge .gp-flag {
          display: block;
          font-size: 1.55rem;
          line-height: 1;
        }

        .gp-team-badge small {
          display: block;
          font-size: 0.68rem;
          line-height: 1;
          letter-spacing: 0.04em;
        }

        .gp-team-info h3 {
          margin: 0;
          font-size: 1.08rem;
        }

        .gp-team-info p {
          margin: 4px 0 0;
          color: rgba(248, 250, 252, 0.58);
        }

        .gp-place-buttons {
          display: flex;
          gap: 8px;
        }

        .gp-place-buttons button {
          width: 48px;
          height: 42px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          cursor: pointer;
          color: rgba(248, 250, 252, 0.78);
          background: rgba(255, 255, 255, 0.075);
          font-weight: 1000;
        }

        .gp-place-buttons button.active {
          color: #04111d;
          border-color: transparent;
          background: linear-gradient(135deg, #ffd45a, #28f29c);
        }

        .gp-podium-row {
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr);
          gap: 12px;
          align-items: center;
          padding: 13px;
          margin-bottom: 10px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.065);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .gp-podium-row.filled {
          border-color: rgba(255, 212, 90, 0.38);
          background: rgba(255, 212, 90, 0.08);
        }

        .gp-podium-place {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          color: #04111d;
          font-weight: 1000;
          background: linear-gradient(135deg, #ffd45a, #00e0ff);
        }

        .gp-podium-row strong,
        .gp-podium-row span {
          display: block;
        }

        .gp-podium-row span {
          margin-top: 3px;
          color: rgba(248, 250, 252, 0.56);
          font-size: 0.86rem;
        }

        .gp-rules {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .gp-rules h3 {
          margin: 0 0 10px;
        }

        .gp-rules ul {
          margin: 0;
          padding-left: 18px;
          color: rgba(248, 250, 252, 0.68);
          line-height: 1.75;
        }

        .gp-next-button {
          width: 100%;
          margin-top: 18px;
          color: #04111d;
          background: linear-gradient(135deg, #00e0ff, #28f29c);
        }

        .gp-empty,
        .gp-loading {
          padding: 24px;
          color: rgba(248, 250, 252, 0.66);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.06);
        }

        @media (max-width: 1100px) {
          .gp-hero,
          .gp-main-grid {
            grid-template-columns: 1fr;
          }

          .gp-tabs {
            grid-template-columns: repeat(6, 1fr);
          }

          .gp-flow-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 680px) {
          .gp-shell {
            width: min(100% - 20px, 1440px);
          }

          .gp-hero,
          .gp-group-panel,
          .gp-summary-panel {
            padding: 16px;
            border-radius: 22px;
          }

          .gp-tabs {
            grid-template-columns: repeat(3, 1fr);
          }

          .gp-flow-bar,
          .gp-top-actions {
            grid-template-columns: 1fr;
            flex-direction: column;
            align-items: stretch;
          }

          .gp-team-card {
            align-items: stretch;
            flex-direction: column;
          }

          .gp-place-buttons button {
            flex: 1;
          }
        }
      `}</style>
    </section>
  );
}

