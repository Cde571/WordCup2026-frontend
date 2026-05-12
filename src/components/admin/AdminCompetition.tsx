import React, { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type Team = {
  _id: string;
  name: string;
  code: string;
};

type Match = {
  _id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  matchDate?: string;
  stadium?: string | null;
  group?: string | null;
  phase?: string | null;
  status?: string | null;
};

type ScoreDraft = {
  home: number;
  away: number;
};

function formatDate(value?: string) {
  if (!value) return "Fecha pendiente";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha pendiente";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminCompetition() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAdmin() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const check = await apiFetch("/api/admin/check").catch(() => null);

      setIsAdmin(Boolean(check?.isAdmin));
      setAdminEmail(check?.email || "");

      const data = await apiFetch("/api/matches");
      const list = Array.isArray(data?.matches) ? data.matches : [];

      setMatches(list);

      const initialScores: Record<string, ScoreDraft> = {};

      for (const match of list) {
        initialScores[match._id] = {
          home: Number(match.homeScore ?? 0),
          away: Number(match.awayScore ?? 0),
        };
      }

      setScores(initialScores);
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el panel admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmin();
  }, []);

  function updateScore(matchId: string, side: "home" | "away", value: number) {
    setScores((current) => ({
      ...current,
      [matchId]: {
        home: current[matchId]?.home ?? 0,
        away: current[matchId]?.away ?? 0,
        [side]: Math.max(0, value),
      },
    }));
  }

  async function finishMatch(match: Match) {
    setSavingId(match._id);
    setError("");
    setMessage("");

    try {
      if (!isAdmin) {
        throw new Error("No tienes permisos de administrador. Tu correo debe estar en ADMIN_EMAILS del backend.");
      }

      const score = scores[match._id] || { home: 0, away: 0 };

      await apiFetch(`/api/admin/matches/${match._id}`, {
        method: "PUT",
        body: JSON.stringify({
          homeScore: score.home,
          awayScore: score.away,
          status: "Finished",
        }),
      });

      setMessage("Resultado guardado. El backend calculó los puntos de ese partido.");
      await loadAdmin();
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el resultado.");
    } finally {
      setSavingId("");
    }
  }

  async function recalculateAll() {
    setError("");
    setMessage("");

    try {
      if (!isAdmin) {
        throw new Error("No tienes permisos de administrador.");
      }

      await apiFetch("/api/admin/calculate-all-points", {
        method: "POST",
      });

      setMessage("Puntos recalculados para todos los usuarios.");
    } catch (err: any) {
      setError(err?.message || "No se pudo recalcular.");
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-nav">
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
<a href="/oraculo">Oráculo</a>
          <a href="/equipos">Equipos</a>
          <a href="/ranking">Ranking</a>
          <a href="/perfil">Perfil</a>
          <a className="active" href="/admin">Admin</a>
        </nav>
      </header>

      <section className="hero">
        <span>Panel administrativo</span>
        <h1>Resultados y puntos</h1>
        <p>
          Desde aquí puedes marcar partidos como finalizados, guardar marcadores reales y recalcular puntos.
        </p>
      </section>

      {loading ? (
        <section className="panel loading">
          <div className="spinner" />
          <p>Cargando panel admin...</p>
        </section>
      ) : (
        <>
          {!isAdmin && (
            <div className="alert error">
              No tienes permisos de administrador. Revisa que tu correo esté en <strong>ADMIN_EMAILS</strong> dentro del archivo <strong>.env</strong> del backend.
            </div>
          )}

          {isAdmin && (
            <div className="alert success">
              Administrador activo: {adminEmail}
            </div>
          )}

          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}

          <section className="panel toolbar">
            <div>
              <strong>Gestión de resultados</strong>
              <p>Al finalizar un partido, el backend calcula puntos de las predicciones de usuarios.</p>
            </div>

            <button onClick={recalculateAll} disabled={!isAdmin}>
              Recalcular todo
            </button>
          </section>

          <section className="matches-grid">
            {matches.map((match) => {
              const score = scores[match._id] || { home: 0, away: 0 };

              return (
                <article key={match._id} className="match-card">
                  <div className="match-top">
                    <span>Grupo {match.group || "-"}</span>
                    <span>{match.status || "Scheduled"}</span>
                  </div>

                  <div className="team-row">
                    <div>
                      <strong>{match.homeTeam?.name || "Local"}</strong>
                      <span>{match.homeTeam?.code || "---"}</span>
                    </div>

                    <input
                      type="number"
                      min={0}
                      value={score.home}
                      onChange={(event) => updateScore(match._id, "home", Number(event.target.value))}
                    />
                  </div>

                  <div className="team-row">
                    <div>
                      <strong>{match.awayTeam?.name || "Visitante"}</strong>
                      <span>{match.awayTeam?.code || "---"}</span>
                    </div>

                    <input
                      type="number"
                      min={0}
                      value={score.away}
                      onChange={(event) => updateScore(match._id, "away", Number(event.target.value))}
                    />
                  </div>

                  <div className="match-bottom">
                    <span>{formatDate(match.matchDate)}</span>

                    <button
                      onClick={() => finishMatch(match)}
                      disabled={!isAdmin || savingId === match._id}
                    >
                      {savingId === match._id ? "Guardando..." : "Finalizar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      <style>{`
        body {
          margin: 0;
          background:
            radial-gradient(circle at top left, rgba(255, 201, 40, .08), transparent 34%),
            radial-gradient(circle at top right, rgba(73, 130, 255, .1), transparent 28%),
            linear-gradient(180deg, #050816 0%, #070b18 48%, #050816 100%);
          color: #f8fafc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .admin-page {
          width: min(1480px, calc(100% - 32px));
          margin: 0 auto;
          padding: 16px 0 56px;
        }

        .admin-nav {
          min-height: 74px;
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr);
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
        }

        .brand {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 7px 10px 7px 7px;
          border: 2px solid rgba(255,255,255,.85);
          border-radius: 4px;
          text-decoration: none;
          color: #fff;
          background: rgba(8, 13, 29, .75);
        }

        .brand span {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          color: #fff477;
          border: 1px solid rgba(255, 244, 119, .55);
          background: #111827;
          font-size: 1.25rem;
          font-weight: 1000;
        }

        .brand strong {
          display: block;
          font-size: 1.25rem;
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

        .admin-nav nav {
          justify-self: center;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 999px;
          background: rgba(255,255,255,.045);
          overflow-x: auto;
        }

        .admin-nav nav a {
          min-width: max-content;
          padding: 11px 14px;
          border-radius: 999px;
          color: rgba(248,250,252,.78);
          text-align: center;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: .74rem;
          font-weight: 900;
        }

        .admin-nav nav a.active {
          color: #111827;
          background: linear-gradient(135deg, #ffc928, #ffb800);
        }

        .hero,
        .panel,
        .match-card,
        .alert {
          border: 1px solid rgba(255,255,255,.12);
          background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025)), #0d1428;
          box-shadow: 0 18px 50px rgba(0,0,0,.26);
        }

        .hero {
          margin-bottom: 18px;
          padding: 28px 30px;
          border-radius: 28px;
        }

        .hero span {
          display: inline-flex;
          margin-bottom: 12px;
          color: #ffc928;
          font-size: .74rem;
          letter-spacing: .16em;
          text-transform: uppercase;
          font-weight: 1000;
        }

        .hero h1 {
          margin: 0;
          max-width: 980px;
          font-size: clamp(2rem, 4.2vw, 4.55rem);
          line-height: .94;
          letter-spacing: -.055em;
        }

        .hero p {
          max-width: 760px;
          margin: 16px 0 0;
          color: #9ca3af;
          line-height: 1.65;
        }

        .panel {
          border-radius: 26px;
          padding: 22px;
          margin-bottom: 18px;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }

        .toolbar p {
          color: #9ca3af;
          margin-bottom: 0;
        }

        button {
          min-height: 42px;
          border: 0;
          cursor: pointer;
          padding: 0 18px;
          border-radius: 999px;
          color: #111827;
          background: linear-gradient(135deg, #ffc928, #ffb800);
          font-weight: 1000;
        }

        button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .matches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 16px;
        }

        .match-card {
          border-radius: 24px;
          padding: 16px;
        }

        .match-top,
        .match-bottom {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #9ca3af;
          font-size: .84rem;
        }

        .team-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 78px;
          gap: 12px;
          align-items: center;
          margin-top: 14px;
        }

        .team-row strong,
        .team-row span {
          display: block;
        }

        .team-row span {
          color: #9ca3af;
          margin-top: 3px;
        }

        .team-row input {
          height: 48px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 16px;
          color: white;
          background: #10172a;
          text-align: center;
          font-weight: 1000;
          font-size: 1.1rem;
          outline: none;
        }

        .match-bottom {
          align-items: center;
          margin-top: 16px;
        }

        .alert {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 18px;
          font-weight: 900;
        }

        .alert.success {
          color: #d8ffe8;
          border-color: rgba(0,199,132,.32);
        }

        .alert.error {
          color: #ffe1e1;
          border-color: rgba(239,68,68,.32);
        }

        .loading {
          min-height: 280px;
          display: grid;
          place-items: center;
          text-align: center;
        }

        .spinner {
          width: 54px;
          height: 54px;
          border-radius: 999px;
          border: 3px solid rgba(255, 201, 40, .25);
          border-top-color: #ffc928;
          animation: spin 1s linear infinite;
          margin: 0 auto 14px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1050px) {
          .admin-nav {
            grid-template-columns: 1fr;
          }

          .admin-nav nav {
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

