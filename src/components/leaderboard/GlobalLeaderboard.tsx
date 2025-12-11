
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

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function GlobalLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [myPosition, setMyPosition] = useState<MyPosition | null>(null);
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
      const dataLeaderboard = await resLeaderboard.json();
      setLeaderboard(dataLeaderboard.leaderboard || []);

      // Cargar mi posición
      const resPosition = await fetch(`${API_BASE}/api/leaderboard/my-position`, {
        credentials: "include",
      });
      if (resPosition.ok) {
        const dataPosition = await resPosition.json();
        setMyPosition(dataPosition);
      }
    } catch (err) {
      console.error("Error cargando leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Cargando ranking...</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bebas text-3xl md:text-4xl text-white tracking-[0.22em]">
                TABLA DE POSICIONES
              </h1>
              <p className="text-sm text-slate-400">Ranking de usuarios por puntos</p>
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

        {/* Tabla */}
        <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Pos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Puntos</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Aciertos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leaderboard.map((user) => {
                  const isMe = myPosition && user.position === myPosition.position;
                  return (
                    <tr key={user.position} className={isMe ? "bg-purple-400/10" : "hover:bg-slate-800/30"}>
                      <td className="px-4 py-4">
                        <span className="text-lg font-bold text-purple-400">#{user.position}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`}
                            alt={user.username}
                            className="w-10 h-10 rounded-full border-2 border-slate-700"
                          />
                          <span className={`font-semibold ${isMe ? "text-purple-400" : "text-slate-200"}`}>
                            {user.username} {isMe && "(Tú)"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xl font-bold text-white">{user.totalPoints}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-emerald-400 font-semibold">{user.correctMatches}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

