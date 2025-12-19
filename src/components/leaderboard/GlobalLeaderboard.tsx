import { useEffect, useState } from "react";

type LeaderboardUser = {
  position: number;
  username: string;
  profilePic?: string | null;
  totalPoints: number;
  correctMatches: number;
  correctScores: number;
};

type MyPosition = {
  position: number;
  totalUsers: number;
  totalPoints: number;
  correctMatches: number;
  correctScores: number;
  percentile: number;
};

type PredictionResult = {
  matchId: number;
  matchCode: string;
  phase: string;
  myPrediction: string | null;
  actualWinner: string | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  matchDate?: string;
};

type PredictionsSummary = {
  totalPredictions: number;
  completedMatches: number;
  correctPredictions: number;
  pendingMatches: number;
  pointsFromKnockout: number;
  byPhase: {
    phase: string;
    total: number;
    completed: number;
    correct: number;
    points: number;
  }[];
};

const API_BASE = "http://localhost:4000";

export default function GlobalLeaderboard() {
  const [activeTab, setActiveTab] = useState<"ranking" | "myPredictions">("ranking");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [myPosition, setMyPosition] = useState<MyPosition | null>(null);
  const [predictionResults, setPredictionResults] = useState<PredictionResult[]>([]);
  const [summary, setSummary] = useState<PredictionsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar ranking
      const resLeaderboard = await fetch(`${API_BASE}/api/leaderboard?page=1&limit=50`, {
        credentials: "include",
      });
      
      if (resLeaderboard.ok) {
        const dataLeaderboard = await resLeaderboard.json();
        setLeaderboard(dataLeaderboard.leaderboard || []);
      }

      // Cargar mi posición
      const resPosition = await fetch(`${API_BASE}/api/leaderboard/my-position`, {
        credentials: "include",
      });
      
      if (resPosition.ok) {
        const dataPosition = await resPosition.json();
        setMyPosition(dataPosition);
      }

      // Cargar comparación de predicciones vs realidad
      const resPredictions = await fetch(`${API_BASE}/api/predictions/knockout/results`, {
        credentials: "include",
      });
      
      if (resPredictions.ok) {
        const dataPredictions = await resPredictions.json();
        setPredictionResults(dataPredictions.results || []);
        setSummary(dataPredictions.summary || null);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-400/10 via-blue-500/10 to-purple-400/10 rounded-2xl border border-purple-400/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-400/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-3xl md:text-4xl text-white tracking-wide">
                TABLA DE POSICIONES
              </h1>
              <p className="text-sm text-slate-400">Ranking y seguimiento de predicciones</p>
            </div>
          </div>

          {myPosition && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Tu Posición</p>
                <p className="text-2xl font-bold text-purple-400">#{myPosition.position}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Tus Puntos</p>
                <p className="text-2xl font-bold text-blue-400">{myPosition.totalPoints}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Aciertos</p>
                <p className="text-2xl font-bold text-emerald-400">{myPosition.correctMatches}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Percentil</p>
                <p className="text-2xl font-bold text-yellow-400">Top {Math.max(1, 100 - myPosition.percentile)}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab("ranking")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "ranking"
                ? "bg-purple-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🏆 Ranking Global
          </button>
          <button
            onClick={() => setActiveTab("myPredictions")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "myPredictions"
                ? "bg-purple-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📊 Mis Predicciones
          </button>
        </div>

        {/* Content */}
        {activeTab === "ranking" ? (
          <RankingTab leaderboard={leaderboard} myPosition={myPosition} />
        ) : (
          <MyPredictionsTab results={predictionResults} summary={summary} />
        )}
      </div>
    </div>
  );
}

function RankingTab({ 
  leaderboard, 
  myPosition 
}: { 
  leaderboard: LeaderboardUser[];
  myPosition: MyPosition | null;
}) {
  return (
    <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Pos</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Usuario</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Puntos</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Aciertos</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Marcadores</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {leaderboard.map((user) => {
              const isMe = myPosition && user.position === myPosition.position;
              return (
                <tr key={user.position} className={isMe ? "bg-purple-400/10" : "hover:bg-slate-800/30"}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {user.position <= 3 && (
                        <span className="text-2xl">
                          {user.position === 1 ? "🥇" : user.position === 2 ? "🥈" : "🥉"}
                        </span>
                      )}
                      <span className={`text-lg font-bold ${
                        user.position <= 3 ? "text-yellow-400" : "text-purple-400"
                      }`}>
                        #{user.position}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=7c3aed&color=fff`}
                        alt={user.username}
                        className="w-10 h-10 rounded-full border-2 border-slate-700"
                      />
                      <span className={`font-semibold ${isMe ? "text-purple-400" : "text-slate-200"}`}>
                        {user.username} {isMe && <span className="text-xs text-purple-300">(Tú)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-xl font-bold text-white">{user.totalPoints}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-emerald-400 font-semibold">{user.correctMatches}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-blue-400 font-semibold">{user.correctScores}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MyPredictionsTab({ 
  results, 
  summary 
}: { 
  results: PredictionResult[];
  summary: PredictionsSummary | null;
}) {
  const [selectedPhase, setSelectedPhase] = useState<string>("all");

  const filteredResults = selectedPhase === "all" 
    ? results 
    : results.filter(r => r.phase === selectedPhase);

  const phases = ["Round of 32", "Round of 16", "Quarter Finals", "Semi Finals", "Third Place", "Final"];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-4 border border-blue-700/50">
            <p className="text-xs text-blue-300 mb-1">Total Predicciones</p>
            <p className="text-3xl font-bold text-white">{summary.totalPredictions}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-xs text-emerald-300 mb-1">Aciertos</p>
            <p className="text-3xl font-bold text-white">{summary.correctPredictions}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 rounded-xl p-4 border border-yellow-700/50">
            <p className="text-xs text-yellow-300 mb-1">Partidos Jugados</p>
            <p className="text-3xl font-bold text-white">{summary.completedMatches}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-4 border border-purple-700/50">
            <p className="text-xs text-purple-300 mb-1">Pts. Knockout</p>
            <p className="text-3xl font-bold text-white">{summary.pointsFromKnockout}</p>
          </div>
        </div>
      )}

      {/* Phase Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedPhase("all")}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
            selectedPhase === "all"
              ? "bg-purple-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Todas
        </button>
        {phases.map(phase => (
          <button
            key={phase}
            onClick={() => setSelectedPhase(phase)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              selectedPhase === phase
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {phase === "Round of 32" ? "R32" : 
             phase === "Round of 16" ? "R16" :
             phase === "Quarter Finals" ? "Cuartos" :
             phase === "Semi Finals" ? "Semis" :
             phase === "Third Place" ? "3er" : "Final"}
          </button>
        ))}
      </div>

      {/* Results Table */}
      <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Partido</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Mi Predicción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Resultado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No hay predicciones para esta fase
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => (
                  <tr key={result.matchId} className="hover:bg-slate-800/30">
                    <td className="px-4 py-4">
                      <div>
                        <span className="font-semibold text-purple-400">{result.matchCode}</span>
                        <p className="text-xs text-slate-500">{result.phase}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-slate-200 font-medium">
                        {result.myPrediction || <span className="text-slate-500">Sin predicción</span>}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {result.actualWinner ? (
                        <span className="text-white font-semibold">{result.actualWinner}</span>
                      ) : (
                        <span className="text-slate-500 text-sm">Por jugar</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {result.isCorrect === null ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          Pendiente
                        </span>
                      ) : result.isCorrect ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          Correcto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                          </svg>
                          Incorrecto
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-lg font-bold ${
                        result.pointsEarned > 0 ? "text-yellow-400" : "text-slate-500"
                      }`}>
                        +{result.pointsEarned}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}