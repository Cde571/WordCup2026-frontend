import { useEffect, useMemo, useState } from "react";

type Team = {
  _id: string;
  name: string;
  code: string;
  confederation?: string | null;
  group?: string | null;
  logo?: string | null;
};

type GroupPrediction = {
  first: string | null;
  second: string | null;
  third: string | null;
};

type PredictionsState = Record<string, GroupPrediction>;

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

// Configuración de API
const API_BASE = "http://localhost:4000";
const TEAMS_API = `${API_BASE}/api/teams`;

const FIFA_TO_ISO2: Record<string, string> = {
  ALG: "dz", ARG: "ar", AUS: "au", AUT: "at", BEL: "be", BRA: "br",
  CMR: "cm", CAN: "ca", CPV: "cv", COL: "co", CRO: "hr", CUW: "cw",
  ECU: "ec", EGY: "eg", ENG: "gb-eng", FRA: "fr", GER: "de", HAI: "ht",
  IRN: "ir", CIV: "ci", JPN: "jp", JOR: "jo", MEX: "mx", MAR: "ma",
  NED: "nl", NZL: "nz", NGA: "ng", NOR: "no", PAN: "pa", PAR: "py",
  POR: "pt", QAT: "qa", KSA: "sa", SCO: "gb-sct", SEN: "sn", KOR: "kr",
  ESP: "es", SUI: "ch", USA: "us", URU: "uy", UZB: "uz",
};

const FALLBACK_GROUP_BY_CODE: Record<string, string> = {
  MEX: "A", KOR: "A", CAN: "B", QAT: "B", SUI: "B", BRA: "C",
  MAR: "C", HAI: "C", SCO: "C", USA: "D", PAR: "D", AUS: "D",
  GER: "E", CUW: "E", CIV: "E", ECU: "E", NED: "F", JPN: "F",
  BEL: "G", EGY: "G", IRN: "G", NZL: "G", ESP: "H", CPV: "H",
  KSA: "H", URU: "H", FRA: "I", SEN: "I", NOR: "I", ARG: "J",
  AUT: "J", ALG: "J", JOR: "J", POR: "K", COL: "K", UZB: "K",
  ENG: "L", CRO: "L", PAN: "L",
};

function getFlagUrlFromFifaCode(code: string | undefined | null): string | null {
  if (!code) return null;
  const iso2 = FIFA_TO_ISO2[code.toUpperCase()];
  if (!iso2) return null;
  return `https://flagpedia.net/data/flags/w40/${iso2}.png`;
}

function getGroupKey(team: Team): string {
  if (team.group) return team.group.toUpperCase();
  const fromMap = FALLBACK_GROUP_BY_CODE[team.code?.toUpperCase()];
  if (fromMap) return fromMap;
  return "Z";
}

export default function GroupStagePicker() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionsState>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const grouped = useMemo(() => {
    if (!teams.length) return [] as { key: string; label: string; teams: Team[] }[];
    const byGroup: Record<string, Team[]> = {};
    for (const team of teams) {
      const key = getGroupKey(team);
      if (!byGroup[key]) byGroup[key] = [];
      byGroup[key].push(team);
    }
    return Object.entries(byGroup)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        key,
        label: key === "Z" ? "Sin grupo" : `Grupo ${key}`,
        teams: value,
      }));
  }, [teams]);

  const addToast = (message: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleSelectPosition = (
    groupKey: string,
    teamCode: string,
    position: keyof GroupPrediction
  ) => {
    setPredictions((prev) => {
      const current = prev[groupKey] || { first: null, second: null, third: null };
      const newPrediction: GroupPrediction = {
        first: current.first === teamCode && position !== "first" ? null : current.first,
        second: current.second === teamCode && position !== "second" ? null : current.second,
        third: current.third === teamCode && position !== "third" ? null : current.third,
      };
      newPrediction[position] = teamCode;
      return { ...prev, [groupKey]: newPrediction };
    });
  };

  const getCompletionStats = () => {
    const totalGroups = grouped.filter(g => g.key !== "Z").length;
    const completedGroups = Object.values(predictions).filter(
      p => p.first && p.second && p.third
    ).length;
    return { 
      total: totalGroups, 
      completed: completedGroups, 
      percentage: totalGroups > 0 ? Math.round((completedGroups / totalGroups) * 100) : 0 
    };
  };

  // ✅ NUEVA VERSIÓN: usar /api/predictions/groups/bulk
  const handleSave = async () => {
    setSaving(true);
    
    const hasAnyPrediction = Object.values(predictions).some(
      p => p.first || p.second || p.third
    );
    
    if (!hasAnyPrediction) {
      addToast("Debes hacer al menos una predicción", "error");
      setSaving(false);
      return;
    }

    try {
      // 1. Guardar en localStorage (backup local)
      localStorage.setItem("wc26_group_predictions", JSON.stringify(predictions));
      
      // 2. Convertir códigos de equipo a IDs para el endpoint bulk
      const predictionsWithIds: Record<
        string,
        { first: string; second: string; third: string | null }
      > = {};

      for (const [groupKey, groupPred] of Object.entries(predictions)) {
        if (!groupPred.first || !groupPred.second) continue;

        const firstTeam = teams.find(t => t.code === groupPred.first);
        const secondTeam = teams.find(t => t.code === groupPred.second);
        const thirdTeam = groupPred.third ? teams.find(t => t.code === groupPred.third) : null;

        if (!firstTeam || !secondTeam) continue;

        predictionsWithIds[groupKey] = {
          first: firstTeam._id,
          second: secondTeam._id,
          third: thirdTeam?._id || null,
        };
      }

      if (Object.keys(predictionsWithIds).length === 0) {
        addToast("No hay grupos completos (1.º y 2.º) para guardar", "error");
        setSaving(false);
        return;
      }

      // 3. Enviar todo en un solo request
      const response = await fetch(`${API_BASE}/api/predictions/groups/bulk`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictions: predictionsWithIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Error guardando predicciones");
      }

      const result = await response.json();

      addToast(
        `¡Predicciones guardadas! ${result.saved}/${result.total} grupos procesados`,
        "success"
      );

      if (result.errors && result.errors.length > 0) {
        addToast("Algunos grupos tuvieron errores. Revisa la consola.", "error");
        console.error("Errores en predicciones:", result.errors);
      }

      setTimeout(() => setShowSummary(true), 500);
      
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Error al guardar. Intenta de nuevo.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Cargar predicciones guardadas en el backend
  const loadPredictionsFromBackend = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/predictions/groups/my-predictions`,
        { credentials: "include" }
      );
      
      if (!response.ok) {
        // Usuario no autenticado o sin predicciones
        return null;
      }
      
      const data = await response.json();
      // Formato esperado:
      // { predictions: { "A": { first: "MEX", second: "KOR", third: "CAN", ... }, ... } }
      return data.predictions || {};
    } catch (error) {
      console.error("Error cargando predicciones del backend:", error);
      return null;
    }
  };

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(TEAMS_API);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        const list: Team[] = data.teams || [];
        setTeams(list);
        
        // Intentar cargar predicciones del backend primero
        const backendPredictions = await loadPredictionsFromBackend();
        
        if (backendPredictions && Object.keys(backendPredictions).length > 0) {
          setPredictions(backendPredictions);
          addToast("Predicciones cargadas desde el servidor", "info");
        } else {
          // Fallback a localStorage si no hay predicciones en backend
          const saved = localStorage.getItem("wc26_group_predictions");
          if (saved) {
            setPredictions(JSON.parse(saved));
            addToast("Predicciones locales cargadas", "info");
          }
        }
        
      } catch (err: any) {
        console.error(err);
        setError("No se pudieron cargar las selecciones. Intenta más tarde.");
      } finally {
        setLoading(false);
      }
    }
    
    loadTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Cargando equipos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-700/50 rounded-2xl p-6 max-w-md">
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  const stats = getCompletionStats();

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
          <h1 className="font-bebas text-4xl md:text-5xl text-white tracking-[0.18em] mb-2">
            FASE DE GRUPOS
          </h1>
          <p className="text-slate-400">Predice los 3 primeros lugares de cada grupo</p>
        </div>

        {/* Progress Bar y Botón */}
        <div className="mb-6 bg-slate-900/70 rounded-2xl border border-slate-800 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">
                  Progreso: {stats.completed}/{stats.total} grupos
                </span>
                <span className="text-sm font-semibold text-yellow-400">
                  {stats.percentage}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-semibold rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "💾 Guardar Predicciones"}
            </button>
          </div>
        </div>

        {/* Modal de Resumen */}
        {showSummary && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Resumen de Predicciones</h2>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                {grouped.filter(g => g.key !== "Z").map(group => {
                  const pred = predictions[group.key];
                  if (!pred?.first) return null;
                  
                  return (
                    <div key={group.key} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                      <h3 className="font-semibold text-yellow-400 mb-2">{group.label}</h3>
                      <div className="space-y-1 text-sm">
                        {pred.first && <div className="text-slate-300">🥇 {teams.find(t => t.code === pred.first)?.name}</div>}
                        {pred.second && <div className="text-slate-300">🥈 {teams.find(t => t.code === pred.second)?.name}</div>}
                        {pred.third && <div className="text-slate-300">🥉 {teams.find(t => t.code === pred.third)?.name}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
                <p className="text-sm text-blue-200">
                  💡 <strong>Próximo paso:</strong> Con estas posiciones de grupo, se podrán generar automáticamente los cruces de octavos de final en la siguiente pantalla de bracket.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de grupos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grouped.map((group) => (
            <GroupCard
              key={group.key}
              groupKey={group.key}
              label={group.label}
              teams={group.teams}
              prediction={predictions[group.key] || { first: null, second: null, third: null }}
              onSelectPosition={handleSelectPosition}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type GroupCardProps = {
  groupKey: string;
  label: string;
  teams: Team[];
  prediction: GroupPrediction;
  onSelectPosition: (groupKey: string, teamCode: string, position: keyof GroupPrediction) => void;
};

function GroupCard({ groupKey, label, teams, prediction, onSelectPosition }: GroupCardProps) {
  const isComplete = prediction.first && prediction.second && prediction.third;
  
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
      isComplete 
        ? "border-emerald-500/50 bg-emerald-900/10" 
        : "border-slate-800 bg-slate-900/70"
    }`}>
      <div className="flex items-center justify-between">
        <h2 className="font-bebas text-lg md:text-xl text-white tracking-[0.18em]">{label}</h2>
        {isComplete && (
          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
        )}
      </div>

      <div className="space-y-2">
        {teams.map((team) => {
          const flagUrl = getFlagUrlFromFifaCode(team.code);
          return (
            <div key={team._id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="relative h-7 w-7 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                  {flagUrl && (
                    <img
                      src={flagUrl}
                      alt={team.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-slate-100">
                    {team.code}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-50">{team.name}</span>
                  {team.confederation && (
                    <span className="text-[10px] text-slate-400">
                      {team.confederation}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <PositionChip
                  label="1.º"
                  active={prediction.first === team.code}
                  onClick={() => onSelectPosition(groupKey, team.code, "first")}
                />
                <PositionChip
                  label="2.º"
                  active={prediction.second === team.code}
                  onClick={() => onSelectPosition(groupKey, team.code, "second")}
                />
                <PositionChip
                  label="3.º"
                  active={prediction.third === team.code}
                  onClick={() => onSelectPosition(groupKey, team.code, "third")}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type PositionChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function PositionChip({ label, active, onClick }: PositionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors " +
        (active
          ? "bg-yellow-400 text-slate-900 border-yellow-300"
          : "bg-slate-900 text-slate-200 border-slate-600 hover:bg-slate-800")
      }
    >
      {label}
    </button>
  );
}
