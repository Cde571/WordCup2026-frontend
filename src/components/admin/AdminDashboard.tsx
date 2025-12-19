import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000";

type Match = {
  _id: string;
  code?: string;
  homeTeam: { _id: string; name: string; code?: string };
  awayTeam: { _id: string; name: string; code?: string };
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  status: "Scheduled" | "Live" | "Finished" | "Postponed" | "Cancelled";
  phase: string;
  group?: string;
};

type GroupStanding = {
  group: string;
  first: string | null;
  second: string | null;
  third: string | null;
};

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"matches" | "groups" | "calculate">("matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [groupStandings, setGroupStandings] = useState<Record<string, GroupStanding>>({});
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    loadMatches();
  }, []);

  const addToast = (message: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const loadMatches = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/matches`, { credentials: "include" });
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error("Error cargando partidos:", err);
      addToast("Error cargando partidos", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateMatchResult = async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/matches/${matchId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeScore, awayScore, status: "Finished" }),
      });

      if (!res.ok) throw new Error("Error actualizando partido");

      addToast("Partido actualizado correctamente", "success");
      await loadMatches();
      
      // Auto-calcular puntos después de actualizar
      await calculateAllPoints();
    } catch (err: any) {
      addToast(err.message || "Error actualizando partido", "error");
    }
  };

  const calculateAllPoints = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/calculate-all-points`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error calculando puntos");

      const data = await res.json();
      addToast(`Puntos calculados: ${data.usersUpdated} usuarios actualizados`, "success");
    } catch (err: any) {
      console.error("Error calculando puntos:", err);
    }
  };

  const recalculateGroupPoints = async () => {
    if (!Object.keys(groupStandings).length) {
      addToast("Define las posiciones de grupo primero", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/recalculate-group-points`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupResults: groupStandings }),
      });

      if (!res.ok) throw new Error("Error recalculando puntos");

      const data = await res.json();
      addToast(`Puntos recalculados: ${data.updated} predicciones actualizadas`, "success");
    } catch (err: any) {
      addToast(err.message || "Error recalculando puntos", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`animate-slide-in px-4 py-3 rounded-xl shadow-lg border backdrop-blur ${
                toast.type === "success" 
                  ? "bg-emerald-900/90 border-emerald-600 text-emerald-100"
                  : toast.type === "error"
                  ? "bg-red-900/90 border-red-600 text-red-100"
                  : "bg-blue-900/90 border-blue-600 text-blue-100"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-4xl text-white tracking-wide">PANEL DE ADMINISTRACIÓN</h1>
              <p className="text-slate-400">Gestión de partidos y cálculo de puntos</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-900/50 rounded-xl p-1 border border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "matches"
                ? "bg-red-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚽ Actualizar Partidos
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "groups"
                ? "bg-red-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📊 Posiciones de Grupo
          </button>
          <button
            onClick={() => setActiveTab("calculate")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "calculate"
                ? "bg-red-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🧮 Calcular Puntos
          </button>
        </div>

        {/* Content */}
        {activeTab === "matches" && (
          <MatchesTab matches={matches} onUpdate={updateMatchResult} loading={loading} />
        )}
        
        {activeTab === "groups" && (
          <GroupsTab 
            standings={groupStandings} 
            setStandings={setGroupStandings}
            onRecalculate={recalculateGroupPoints}
            loading={loading}
          />
        )}
        
        {activeTab === "calculate" && (
          <CalculateTab onCalculate={calculateAllPoints} />
        )}
      </div>
    </div>
  );
}

function MatchesTab({ 
  matches, 
  onUpdate, 
  loading 
}: { 
  matches: Match[];
  onUpdate: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
  loading: boolean;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);

  const filteredMatches = filter === "all" 
    ? matches 
    : matches.filter(m => m.phase === filter || m.status === filter);

  const phases = ["Group Stage", "Round of 32", "Round of 16", "Quarter Finals", "Semi Finals", "Final"];
  const statuses = ["Scheduled", "Live", "Finished"];

  const handleEdit = (match: Match) => {
    setEditingMatch(match._id);
    setHomeScore(match.homeScore || 0);
    setAwayScore(match.awayScore || 0);
  };

  const handleSave = async (matchId: string) => {
    await onUpdate(matchId, homeScore, awayScore);
    setEditingMatch(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${
            filter === "all" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400"
          }`}
        >
          Todos
        </button>
        {phases.map(phase => (
          <button
            key={phase}
            onClick={() => setFilter(phase)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${
              filter === phase ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {phase}
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      <div className="grid gap-4">
        {filteredMatches.map(match => (
          <div key={match._id} className="bg-slate-900/70 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-semibold text-purple-400">{match.phase}</span>
                {match.group && <span className="ml-2 text-xs text-slate-500">Grupo {match.group}</span>}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                match.status === "Finished" ? "bg-emerald-900/40 text-emerald-400" :
                match.status === "Live" ? "bg-red-900/40 text-red-400" :
                "bg-slate-700 text-slate-300"
              }`}>
                {match.status}
              </span>
            </div>

            {editingMatch === match._id ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-slate-400 mb-1">{match.homeTeam.name}</p>
                    <input
                      type="number"
                      value={homeScore}
                      onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      min="0"
                    />
                  </div>
                  <span className="text-2xl text-slate-600">-</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-400 mb-1">{match.awayTeam.name}</p>
                    <input
                      type="number"
                      value={awayScore}
                      onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(match._id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg"
                  >
                    ✓ Guardar
                  </button>
                  <button
                    onClick={() => setEditingMatch(null)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{match.homeTeam.name}</p>
                  </div>
                  <div className="flex items-center gap-4 mx-4">
                    <span className="text-3xl font-bold text-white">
                      {match.homeScore ?? "-"}
                    </span>
                    <span className="text-slate-600">-</span>
                    <span className="text-3xl font-bold text-white">
                      {match.awayScore ?? "-"}
                    </span>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-white font-semibold">{match.awayTeam.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(match)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
                >
                  ✏️ Editar Resultado
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupsTab({ 
  standings, 
  setStandings,
  onRecalculate,
  loading
}: {
  standings: Record<string, GroupStanding>;
  setStandings: (standings: Record<string, GroupStanding>) => void;
  onRecalculate: () => Promise<void>;
  loading: boolean;
}) {
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teams`);
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error("Error cargando equipos:", err);
    }
  };

  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  const getTeamsByGroup = (group: string) => {
    return teams.filter(t => t.group?.toUpperCase() === group);
  };

  const updateStanding = (group: string, position: "first" | "second" | "third", teamId: string) => {
    setStandings({
      ...standings,
      [group]: {
        group,
        first: position === "first" ? teamId : standings[group]?.first || null,
        second: position === "second" ? teamId : standings[group]?.second || null,
        third: position === "third" ? teamId : standings[group]?.third || null,
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
        <p className="text-blue-200 text-sm">
          💡 <strong>Instrucciones:</strong> Selecciona los equipos que quedaron en 1º, 2º y 3º lugar de cada grupo. 
          Luego presiona "Recalcular Puntos" para actualizar los puntos de todos los usuarios según sus predicciones.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => {
          const groupTeams = getTeamsByGroup(group);
          const standing = standings[group];

          return (
            <div key={group} className="bg-slate-900/70 rounded-xl border border-slate-800 p-4">
              <h3 className="text-xl font-bold text-white mb-4">Grupo {group}</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">🥇 1º Lugar</label>
                  <select
                    value={standing?.first || ""}
                    onChange={(e) => updateStanding(group, "first", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Seleccionar equipo</option>
                    {groupTeams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">🥈 2º Lugar</label>
                  <select
                    value={standing?.second || ""}
                    onChange={(e) => updateStanding(group, "second", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Seleccionar equipo</option>
                    {groupTeams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">🥉 3º Lugar</label>
                  <select
                    value={standing?.third || ""}
                    onChange={(e) => updateStanding(group, "third", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Seleccionar equipo</option>
                    {groupTeams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onRecalculate}
        disabled={loading || Object.keys(standings).length === 0}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl text-lg transition-all"
      >
        {loading ? "Recalculando..." : "🧮 Recalcular Puntos de Todos los Usuarios"}
      </button>
    </div>
  );
}

function CalculateTab({ onCalculate }: { onCalculate: () => Promise<void> }) {
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    setCalculating(true);
    await onCalculate();
    setCalculating(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-8 text-center">
        <div className="w-20 h-20 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Calcular Todos los Puntos</h2>
        <p className="text-slate-400 mb-6">
          Esto recalculará los puntos de <strong>todos los usuarios</strong> basándose en:
        </p>
        
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-emerald-400">✓</span>
            Predicciones de fase de grupos vs posiciones finales
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-emerald-400">✓</span>
            Predicciones de partidos vs resultados reales
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-emerald-400">✓</span>
            Predicciones de fase eliminatoria vs ganadores
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg"
        >
          {calculating ? "⏳ Calculando..." : "🚀 Calcular Puntos Ahora"}
        </button>
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
        <p className="text-blue-200 text-sm">
          <strong>Nota:</strong> Esta operación puede tomar varios segundos dependiendo de la cantidad de usuarios y predicciones. 
          Se actualizarán automáticamente los rankings y estadísticas.
        </p>
      </div>
    </div>
  );
}