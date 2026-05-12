import React, { useEffect, useState } from "react";
import { API_BASE, apiFetch } from "../../lib/api";

type AuthStatus = {
  loggedIn: boolean;
  user?: any;
  isAdmin?: boolean;
};

export default function ProfileCompetition() {
  const [auth, setAuth] = useState<AuthStatus>({ loggedIn: false });
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [position, setPosition] = useState<any>(null);
  const [pointsSystem, setPointsSystem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadProfile() {
    setLoading(true);

    try {
      const authData = await apiFetch<AuthStatus>("/auth/status").catch(() => ({
        loggedIn: false,
        user: null,
      }));

      setAuth(authData);

      const profileData = await apiFetch("/profile-data").catch(() => null);
      setProfile(profileData);

      const pointsData = await apiFetch("/api/points-system").catch(() => null);
      setPointsSystem(pointsData);

      if (authData.loggedIn) {
        const summaryData = await apiFetch("/api/predictions/summary").catch(() => null);
        const positionData = await apiFetch("/api/leaderboard/my-position").catch(() => null);

        setSummary(summaryData);
        setPosition(positionData);
      }
    } catch (error: any) {
      setMessage(error?.message || "No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function login() {
    window.location.href = `${API_BASE}/auth/google`;
  }

  async function logout() {
    await apiFetch("/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/";
  }

  const username =
    profile?.username ||
    auth.user?.username ||
    auth.user?.email ||
    "Invitado";

  const email =
    profile?.email ||
    auth.user?.email ||
    "Sin correo conectado";

  const totalPoints =
    summary?.user?.totalPoints ??
    profile?.totalPoints ??
    auth.user?.totalPoints ??
    0;

  const groupsCompleted =
    summary?.predictions?.groups?.completed ?? 0;

  const matchesPredicted =
    summary?.predictions?.matches?.total ?? 0;

  const correctMatches =
    summary?.user?.correctMatches ??
    profile?.correctMatches ??
    0;

  const correctScores =
    summary?.user?.correctScores ??
    profile?.correctScores ??
    0;

  return (
    <main className="profile-page">
      <header className="profile-nav">
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
          <a className="active" href="/perfil">Perfil</a>
        </nav>

        {auth.loggedIn ? (
          <button onClick={logout}>Salir</button>
        ) : (
          <button onClick={login}>Iniciar sesión</button>
        )}
      </header>

      <section className="hero">
        <span>Mi competencia</span>
        <h1>Perfil de predicción</h1>
        <p>
          Aquí puedes revisar tu usuario, tus puntos, tu avance de predicciones y tu posición dentro del ranking.
        </p>
      </section>

      {loading ? (
        <section className="panel loading">
          <div className="spinner" />
          <p>Cargando perfil...</p>
        </section>
      ) : (
        <>
          {message && <div className="alert">{message}</div>}

          <section className="profile-grid">
            <article className="panel user-card">
              <div className="avatar">
                {profile?.profilePic ? (
                  <img src={profile.profilePic} alt={username} />
                ) : (
                  <span>{String(username).slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              <div>
                <span className="eyebrow">Usuario</span>
                <h2>{username}</h2>
                <p>{email}</p>

                {auth.loggedIn ? (
                  <div className="status online">Cuenta conectada</div>
                ) : (
                  <button className="primary" onClick={login}>
                    Iniciar sesión con Google
                  </button>
                )}
              </div>
            </article>

            <article className="panel score-card">
              <span className="eyebrow">Puntos totales</span>
              <strong>{totalPoints}</strong>
              <p>
                Posición: {position?.position ? `#${position.position}` : "Sin ranking todavía"}
              </p>
            </article>
          </section>

          <section className="stats-grid">
            <article className="stat">
              <span>Grupos completados</span>
              <strong>{groupsCompleted}/12</strong>
            </article>

            <article className="stat">
              <span>Partidos pronosticados</span>
              <strong>{matchesPredicted}</strong>
            </article>

            <article className="stat">
              <span>Aciertos de ganador</span>
              <strong>{correctMatches}</strong>
            </article>

            <article className="stat">
              <span>Marcadores exactos</span>
              <strong>{correctScores}</strong>
            </article>
          </section>

          <section className="profile-grid">
            <article className="panel">
              <span className="eyebrow">Flujo de participación</span>
              <h2>Cómo compites</h2>

              <div className="flow">
                <a href="/grupos">1. Guardar fase de grupos</a>
                <a href="/bracket">2. Armar bracket completo</a>
                <a href="/partidos">3. Pronosticar marcadores</a>
                <a href="/ranking">4. Revisar ranking</a>
              </div>
            </article>

            <article className="panel">
              <span className="eyebrow">Sistema de puntos</span>
              <h2>Reglas principales</h2>

              <ul className="rules">
                <li>Primero de grupo exacto: {pointsSystem?.groups?.firstPlace ?? 5} puntos</li>
                <li>Segundo de grupo exacto: {pointsSystem?.groups?.secondPlace ?? 3} puntos</li>
                <li>Tercero exacto: {pointsSystem?.groups?.thirdPlace ?? 2} puntos</li>
                <li>Campeón exacto: {pointsSystem?.tournament?.champion ?? 10} puntos</li>
                <li>Marcador exacto: {pointsSystem?.matches?.correctScore ?? 5} puntos</li>
              </ul>
            </article>
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

        .profile-page {
          width: min(1480px, calc(100% - 32px));
          margin: 0 auto;
          padding: 16px 0 56px;
        }

        .profile-nav {
          min-height: 74px;
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr) auto;
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

        .profile-nav nav {
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

        .profile-nav nav a {
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

        .profile-nav nav a.active {
          color: #111827;
          background: linear-gradient(135deg, #ffc928, #ffb800);
        }

        .profile-nav button,
        .primary {
          min-height: 44px;
          border: 0;
          cursor: pointer;
          padding: 0 18px;
          border-radius: 999px;
          color: #111827;
          background: linear-gradient(135deg, #ffc928, #ffb800);
          font-weight: 1000;
        }

        .hero,
        .panel,
        .stat,
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

        .hero span,
        .eyebrow {
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

        .profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
          gap: 18px;
          margin-bottom: 18px;
        }

        .panel {
          border-radius: 26px;
          padding: 22px;
        }

        .user-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 18px;
          align-items: center;
        }

        .avatar {
          width: 92px;
          height: 92px;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,.14);
          background: linear-gradient(135deg, #ffc928, #ffb800);
          display: grid;
          place-items: center;
          color: #111827;
          font-size: 2rem;
          font-weight: 1000;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        h2 {
          margin: 0;
          font-size: 2rem;
        }

        p {
          color: #9ca3af;
        }

        .status {
          width: fit-content;
          margin-top: 12px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: .82rem;
          font-weight: 900;
        }

        .online {
          color: #dcfff0;
          background: rgba(0,199,132,.14);
          border: 1px solid rgba(0,199,132,.25);
        }

        .score-card strong {
          display: block;
          font-size: 4.6rem;
          line-height: 1;
          color: #ffc928;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .stat {
          border-radius: 22px;
          padding: 18px;
        }

        .stat span {
          display: block;
          color: #9ca3af;
          font-size: .88rem;
          margin-bottom: 10px;
        }

        .stat strong {
          font-size: 2.2rem;
          color: #fff;
        }

        .flow {
          display: grid;
          gap: 10px;
        }

        .flow a {
          padding: 14px;
          border-radius: 18px;
          color: #fff;
          text-decoration: none;
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.08);
          font-weight: 900;
        }

        .rules {
          color: #cbd5e1;
          line-height: 1.9;
          padding-left: 20px;
        }

        .alert {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 18px;
          color: #ffe1e1;
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
          .profile-nav {
            grid-template-columns: 1fr;
          }

          .profile-nav nav {
            justify-self: stretch;
          }

          .profile-grid,
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

