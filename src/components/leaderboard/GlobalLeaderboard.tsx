import { useEffect, useState } from "react";
import { API_BASE } from "../../lib/api";

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
};

type PredictionsSummary = {
  totalPredictions: number;
  completedMatches: number;
  correctPredictions: number;
  pendingMatches: number;
  pointsFromKnockout: number;
  byPhase?: { phase: string; total: number; completed: number; correct: number; points: number }[];
};

export default function GlobalLeaderboard() {
  const [activeTab, setActiveTab] = useState<"ranking" | "myPredictions">("ranking");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [myPosition, setMyPosition] = useState<MyPosition | null>(null);
  const [predictionResults, setPredictionResults] = useState<PredictionResult[]>([]);
  const [summary, setSummary] = useState<PredictionsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ranking = await fetch(`${API_BASE}/api/leaderboard?page=1&limit=50`, { credentials: "include" });
        if (ranking.ok) setLeaderboard((await ranking.json()).leaderboard || []);

        const position = await fetch(`${API_BASE}/api/leaderboard/my-position`, { credentials: "include" });
        if (position.ok) setMyPosition(await position.json());

        const predictions = await fetch(`${API_BASE}/api/predictions/knockout/results`, { credentials: "include" });
        if (predictions.ok) {
          const data = await predictions.json();
          setPredictionResults(data.results || []);
          setSummary(data.summary || null);
        }
      } catch (err) {
        console.error("Error cargando ranking:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[2rem] border border-white/10 bg-slate-950/60">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-2 border-slate-700 border-t-yellow-300" />
          <p className="text-sm font-semibold text-slate-300">Cargando ranking...</p>
        </div>
      </div>
    );
  }

  const podium = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="wc-shell rounded-[2rem] p-6 md:p-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr,auto] lg:items-end">
          <div>
            <span className="wc-pill">Leaderboard competitivo</span>
            <h1 className="mt-4 font-bebas text-5xl text-white md:text-6xl">Tabla de posiciones</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Revisa puntos, aciertos y marcadores exactos. La pantalla está pensada como ranking de torneo, no como una tabla estática.
            </p>
          </div>
          {myPosition && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[34rem]">
              <Metric label="Posición" value={`#${myPosition.position}`} />
              <Metric label="Puntos" value={myPosition.totalPoints} />
              <Metric label="Aciertos" value={myPosition.correctMatches} />
              <Metric label="Top" value={`${Math.max(1, 100 - myPosition.percentile)}%`} />
            </div>
          )}
        </div>
      </section>

      {podium.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
          {podium.map((user, idx) => (
            <div key={user.position} className={`wc-card rounded-3xl p-5 ${idx === 0 ? "md:-translate-y-3 border-yellow-300/40" : ""}`}>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-200">Top {user.position}</p>
              <div className="mt-4 flex items-center gap-3">
                <img src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0f172a&color=fde68a`} alt={user.username} className="h-12 w-12 rounded-2xl border border-white/10 object-cover" />
                <div>
                  <h3 className="font-black text-white">{user.username}</h3>
                  <p className="text-sm text-slate-400">{user.totalPoints} puntos</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="flex rounded-2xl border border-white/10 bg-white/[0.035] p-1">
        <button onClick={() => setActiveTab("ranking")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${activeTab === "ranking" ? "bg-yellow-300 text-slate-950" : "text-slate-300 hover:bg-white/10"}`}>Ranking global</button>
        <button onClick={() => setActiveTab("myPredictions")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${activeTab === "myPredictions" ? "bg-yellow-300 text-slate-950" : "text-slate-300 hover:bg-white/10"}`}>Mis predicciones</button>
      </div>

      {activeTab === "ranking" ? <RankingTab leaderboard={leaderboard} myPosition={myPosition} /> : <MyPredictionsTab results={predictionResults} summary={summary} />}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 font-bebas text-3xl text-white">{value}</p>
    </div>
  );
}

function RankingTab({ leaderboard, myPosition }: { leaderboard: LeaderboardUser[]; myPosition: MyPosition | null }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-white/10 bg-white/[0.035]">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[.16em] text-slate-400">Pos</th>
              <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[.16em] text-slate-400">Usuario</th>
              <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-[.16em] text-slate-400">Puntos</th>
              <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-[.16em] text-slate-400">Aciertos</th>
              <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-[.16em] text-slate-400">Marcadores</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {leaderboard.map((user) => {
              const isMe = !!myPosition && user.position === myPosition.position;
              return (
                <tr key={`${user.position}-${user.username}`} className={isMe ? "bg-yellow-300/10" : "hover:bg-white/[0.035]"}>
                  <td className="px-4 py-4"><span className="font-bebas text-3xl text-yellow-200">#{user.position}</span></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0f172a&color=fde68a`} alt={user.username} className="h-11 w-11 rounded-2xl border border-white/10 object-cover" />
                      <div><p className="font-black text-white">{user.username}</p>{isMe && <p className="text-xs font-bold text-yellow-200">Tu cuenta</p>}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-black text-yellow-200">{user.totalPoints}</td>
                  <td className="px-4 py-4 text-center text-slate-200">{user.correctMatches}</td>
                  <td className="px-4 py-4 text-center text-slate-200">{user.correctScores}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MyPredictionsTab({ results, summary }: { results: PredictionResult[]; summary: PredictionsSummary | null }) {
  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Predicciones" value={summary.totalPredictions} />
          <Metric label="Completadas" value={summary.completedMatches} />
          <Metric label="Correctas" value={summary.correctPredictions} />
          <Metric label="Puntos bracket" value={summary.pointsFromKnockout} />
        </div>
      )}

      <div className="grid gap-3">
        {results.length === 0 ? (
          <div className="wc-card rounded-3xl p-8 text-center text-slate-300">Todavía no hay predicciones de eliminatorias para comparar.</div>
        ) : (
          results.map((r) => (
            <article key={`${r.matchCode}-${r.matchId}`} className="wc-card rounded-3xl p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[.18em] text-slate-400">{r.phase} · {r.matchCode}</p>
                  <h3 className="mt-1 font-black text-white">{r.myPrediction || "Sin predicción"} vs resultado: {r.actualWinner || "pendiente"}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${r.isCorrect === true ? "bg-emerald-400/10 text-emerald-200" : r.isCorrect === false ? "bg-rose-400/10 text-rose-200" : "bg-slate-400/10 text-slate-300"}`}>{r.pointsEarned} puntos</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
