import { useEffect, useState } from "react";

type User = {
  _id: string;
  username: string;
  email: string;
  profilePic?: string | null;
  status?: string;
  totalPoints?: number;
  correctMatches?: number;
  correctScores?: number;
};

type MyPosition = {
  position: number;
  totalUsers: number;
  totalPoints: number;
  correctMatches: number;
  correctScores: number;
  percentile: number;
};

type PredictionsSummary = {
  groups: {
    total: number;
    completed: number;
    pointsEarned: number;
  };
  matches: {
    total: number;
    pointsEarned: number;
  };
  tournament: {
    champion: string | null;
    runnerUp: string | null;
  } | null;
};

type Props = {
  apiBase: string;
};

export default function ProfileClient({ apiBase }: Props) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [myPosition, setMyPosition] = useState<MyPosition | null>(null);
  const [predictions, setPredictions] = useState<PredictionsSummary | null>(null);

  async function loadAuthStatus() {
    try {
      const res = await fetch(`${apiBase}/auth/status`, {
        credentials: "include",
      });
      const data = await res.json();

      console.log("AUTH STATUS FRONT:", data);

      setLoggedIn(data.loggedIn);
      setUser(data.user ?? null);

      // Si está logueado, cargar datos adicionales
      if (data.loggedIn) {
        loadRankingPosition();
        loadPredictionsSummary();
      }
    } catch (err) {
      console.error("Error cargando /auth/status", err);
      setLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadRankingPosition() {
    try {
      const res = await fetch(`${apiBase}/api/leaderboard/my-position`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMyPosition(data);
      }
    } catch (err) {
      console.error("Error cargando posición en ranking:", err);
    }
  }

  async function loadPredictionsSummary() {
    try {
      const res = await fetch(`${apiBase}/api/predictions/summary`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions);
      }
    } catch (err) {
      console.error("Error cargando resumen de predicciones:", err);
    }
  }

  useEffect(() => {
    loadAuthStatus();
  }, []);

  async function handleLogout() {
    try {
      await fetch(`${apiBase}/logout`, {
        method: "POST",
        credentials: "include",
      });
      await loadAuthStatus();
    } catch (err) {
      console.error("Error cerrando sesión", err);
    }
  }

  const googleAuthUrl = `${apiBase}/auth/google`;

  const displayName = loggedIn && user ? user.username : "Invitado";
  const email =
    loggedIn && user
      ? user.email
      : "Inicia sesión para guardar tus predicciones";
  const statusLabel = loading
    ? "Verificando..."
    : loggedIn
    ? "Autenticado"
    : "No autenticado";
  const statusColor = loading
    ? "text-slate-300"
    : loggedIn
    ? "text-emerald-300"
    : "text-red-300";

  const totalPoints =
    loggedIn && user?.totalPoints != null ? user.totalPoints : 0;
  const correctMatches =
    loggedIn && user?.correctMatches != null ? user.correctMatches : 0;
  const correctScores =
    loggedIn && user?.correctScores != null ? user.correctScores : 0;

  return (
    <>
      {/* CABECERA PERFIL / AUTENTICACIÓN */}
      <section className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            {loggedIn && user?.profilePic ? (
              <img
                src={user.profilePic}
                alt={displayName}
                className="h-20 w-20 md:h-24 md:w-24 rounded-full object-cover border-2 border-yellow-400/80 shadow-lg"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-yellow-400 via-emerald-400 to-sky-400 flex items-center justify-center text-3xl font-bold text-slate-900">
                {loggedIn && user
                  ? (user.username?.[0] ?? "?").toUpperCase()
                  : "?"}
              </div>
            )}

            {loggedIn && (
              <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 h-6 pl-1.5 pr-2 rounded-full bg-slate-950/90 border border-emerald-400/80 text-[10px] font-semibold text-emerald-200 shadow">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-bebas text-3xl md:text-4xl text-white tracking-[0.18em]">
              {displayName}
            </h1>
            <p className="text-xs md:text-sm text-slate-200">
              {loggedIn
                ? "Tus predicciones, puntos y ranking están vinculados a tu cuenta de Google."
                : "Conecta tu cuenta de Google para guardar tus predicciones, puntos y ranking en el Mundial 2026."}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Estado actual:{" "}
              <span className={`font-semibold ${statusColor}`}>
                {statusLabel}
              </span>
              {loggedIn && user && (
                <>
                  {" "}
                  <span className="text-slate-500">·</span>{" "}
                  <span className="text-slate-200">{email}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* CTA principal: Google OAuth / Logout */}
        <div className="flex flex-col items-stretch md:items-end gap-2">
          {loggedIn ? (
            <>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-red-500/90 text-white text-xs md:text-sm font-semibold shadow hover:bg-red-400 transition-colors"
              >
                Cerrar sesión
              </button>
              <p className="text-[11px] text-slate-400 text-center md:text-right max-w-xs">
                Puedes volver a iniciar sesión con la misma cuenta en cualquier
                momento y tus predicciones seguirán asociadas a tu perfil.
              </p>
            </>
          ) : (
            <>
              <a
                href={googleAuthUrl}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 text-xs md:text-sm font-semibold shadow hover:bg-slate-100 transition-colors"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[11px]">
                  G
                </span>
                <span>Iniciar sesión con Google</span>
              </a>
              <p className="text-[11px] text-slate-400 text-center md:text-right max-w-xs">
                Al continuar serás redirigido a Google para autorizar el acceso.
                Después volverás a esta página con tu sesión iniciada.
              </p>
            </>
          )}
        </div>
      </section>

      {/* POSICIÓN EN EL RANKING - Solo si está logueado */}
      {loggedIn && myPosition && (
        <section className="mt-6 bg-gradient-to-r from-yellow-400/10 via-yellow-500/10 to-orange-400/10 rounded-2xl border border-yellow-400/20 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bebas text-xl text-white tracking-[0.18em]">
                    TU POSICIÓN EN EL RANKING
                  </h2>
                  <p className="text-xs text-slate-400">Comparado con todos los participantes</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Posición</p>
                  <p className="text-2xl font-bold text-yellow-400">#{myPosition.position}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Percentil</p>
                  <p className="text-2xl font-bold text-emerald-400">Top {100 - myPosition.percentile}%</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">De</p>
                  <p className="text-2xl font-bold text-blue-400">{myPosition.totalUsers}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Puntos</p>
                  <p className="text-2xl font-bold text-purple-400">{myPosition.totalPoints}</p>
                </div>
              </div>
            </div>

            <a
              href="/leaderboard"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ver Ranking Completo
            </a>
          </div>
        </section>
      )}

      {/* RESUMEN DE PUNTOS */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-[0.16em]">
            Puntos totales
          </h2>
          <p className="text-2xl font-semibold text-yellow-300">
            {totalPoints}
          </p>
          <p className="text-[11px] text-slate-300">
            Puntos acumulados según tus aciertos en partidos, grupos y
            predicciones especiales.
          </p>
        </article>

        <article className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-[0.16em]">
            Aciertos partido
          </h2>
          <p className="text-2xl font-semibold text-emerald-300">
            {correctMatches}
          </p>
          <p className="text-[11px] text-slate-300">
            Cantidad de resultados en los que acertaste al ganador o al empate
            del encuentro.
          </p>
        </article>

        <article className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-[0.16em]">
            Marcador exacto
          </h2>
          <p className="text-2xl font-semibold text-sky-300">
            {correctScores}
          </p>
          <p className="text-[11px] text-slate-300">
            Número de veces que clavaste el marcador exacto del partido.
          </p>
        </article>
      </section>

      {/* RESUMEN DE PREDICCIONES - Solo si está logueado */}
      {loggedIn && predictions && (
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-[0.16em]">
                Fase de Grupos
              </h2>
              <div className="w-8 h-8 bg-yellow-400/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">
                {predictions.groups.completed}
                <span className="text-lg text-slate-500">/{predictions.groups.total}</span>
              </p>
              <p className="text-xs text-yellow-400 font-semibold">
                +{predictions.groups.pointsEarned} pts ganados
              </p>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all"
                style={{ width: `${(predictions.groups.completed / predictions.groups.total) * 100}%` }}
              />
            </div>
          </article>

          <article className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-[0.16em]">
                Predicciones Partidos
              </h2>
              <div className="w-8 h-8 bg-emerald-400/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">
                {predictions.matches.total}
              </p>
              <p className="text-xs text-emerald-400 font-semibold">
                +{predictions.matches.pointsEarned} pts ganados
              </p>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                style={{ width: `${Math.min((predictions.matches.total / 64) * 100, 100)}%` }}
              />
            </div>
          </article>

          <article className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-[0.16em]">
                Predicción Final
              </h2>
              <div className="w-8 h-8 bg-purple-400/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <div>
              {predictions.tournament?.champion ? (
                <>
                  <p className="text-lg font-bold text-white mb-1">
                    🏆 {predictions.tournament.champion}
                  </p>
                  {predictions.tournament.runnerUp && (
                    <p className="text-sm text-slate-400">
                      🥈 {predictions.tournament.runnerUp}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">Sin predicción aún</p>
              )}
            </div>
          </article>
        </section>
      )}

      {/* CALL TO ACTION para no logueados */}
      {!loggedIn && (
        <section className="mt-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-700/30 p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">
                ¿Listo para competir?
              </h3>
              <p className="text-slate-300 text-sm">
                Inicia sesión para hacer tus predicciones, ganar puntos y aparecer en el ranking global del Mundial 2026.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={googleAuthUrl}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-bold rounded-xl transition-all transform hover:scale-105 text-center"
              >
                Comenzar ahora
              </a>
              <a
                href="/leaderboard"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors text-center text-sm"
              >
                Ver Ranking
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}