// src/components/admin/GroupsTab.tsx
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000";

type Team = {
  _id: string;
  name: string;
  code?: string;
  group?: string;
  logo?: string;
};

type GroupStanding = {
  group: string;
  first: string | null;
  second: string | null;
  third: string | null;
};

type GroupsTabProps = {
  standings: Record<string, GroupStanding>;
  setStandings: (standings: Record<string, GroupStanding>) => void;
  onRecalculate: () => Promise<void>;
  loading: boolean;
};

// Mapeo de códigos a grupos (igual que en GroupStagePicker)
const FALLBACK_GROUP_BY_CODE: Record<string, string> = {
  MEX: "A", KOR: "A", CAN: "B", QAT: "B", SUI: "B", BRA: "C",
  MAR: "C", HAI: "C", SCO: "C", USA: "D", PAR: "D", AUS: "D",
  GER: "E", CUW: "E", CIV: "E", ECU: "E", NED: "F", JPN: "F",
  BEL: "G", EGY: "G", IRN: "G", NZL: "G", ESP: "H", CPV: "H",
  KSA: "H", URU: "H", FRA: "I", SEN: "I", NOR: "I", ARG: "J",
  AUT: "J", ALG: "J", JOR: "J", POR: "K", COL: "K", UZB: "K",
  ENG: "L", CRO: "L", PAN: "L",
};

const FIFA_TO_ISO2: Record<string, string> = {
  ALG: "dz", ARG: "ar", AUS: "au", AUT: "at", BEL: "be", BRA: "br",
  CMR: "cm", CAN: "ca", CPV: "cv", COL: "co", CRO: "hr", CUW: "cw",
  ECU: "ec", EGY: "eg", ENG: "gb-eng", FRA: "fr", GER: "de", HAI: "ht",
  IRN: "ir", CIV: "ci", JPN: "jp", JOR: "jo", MEX: "mx", MAR: "ma",
  NED: "nl", NZL: "nz", NGA: "ng", NOR: "no", PAN: "pa", PAR: "py",
  POR: "pt", QAT: "qa", KSA: "sa", SCO: "gb-sct", SEN: "sn", KOR: "kr",
  ESP: "es", SUI: "ch", USA: "us", URU: "uy", UZB: "uz",
};

function getFlagUrl(code: string | undefined): string | null {
  if (!code) return null;
  const iso2 = FIFA_TO_ISO2[code.toUpperCase()];
  if (!iso2) return null;
  return `https://flagpedia.net/data/flags/w40/${iso2}.png`;
}

function getGroupKey(team: Team): string {
  if (team.group) return team.group.toUpperCase();
  const fromMap = FALLBACK_GROUP_BY_CODE[team.code?.toUpperCase() || ""];
  if (fromMap) return fromMap;
  return "Z";
}

export default function GroupsTab({ 
  standings, 
  setStandings,
  onRecalculate,
  loading
}: GroupsTabProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsByGroup, setTeamsByGroup] = useState<Record<string, Team[]>>({});
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      const res = await fetch(`${API_BASE}/api/teams`);
      const data = await res.json();
      const allTeams: Team[] = data.teams || [];
      setTeams(allTeams);

      // Agrupar equipos por grupo
      const grouped: Record<string, Team[]> = {};
      
      for (const team of allTeams) {
        const groupKey = getGroupKey(team);
        if (groupKey === "Z") continue; // Ignorar equipos sin grupo
        
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(team);
      }

      // Ordenar equipos dentro de cada grupo alfabéticamente
      for (const group in grouped) {
        grouped[group].sort((a, b) => a.name.localeCompare(b.name));
      }

      setTeamsByGroup(grouped);
    } catch (err) {
      console.error("Error cargando equipos:", err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

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

  const getCompletionStats = () => {
    const totalGroups = groups.length;
    const completedGroups = Object.values(standings).filter(
      s => s.first && s.second && s.third
    ).length;
    return {
      total: totalGroups,
      completed: completedGroups,
      percentage: Math.round((completedGroups / totalGroups) * 100)
    };
  };

  const stats = getCompletionStats();

  if (loadingTeams) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Cargando equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info y Progress */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <p className="text-blue-200 text-sm mb-2">
              <strong>Instrucciones:</strong> Selecciona los equipos que quedaron en 1º, 2º y 3º lugar de cada grupo según los resultados reales del torneo.
            </p>
            <p className="text-blue-300 text-xs">
              Los equipos están organizados automáticamente por grupo. Luego presiona "Recalcular Puntos" para actualizar los puntos de todos los usuarios.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300">
              Progreso: {stats.completed}/{stats.total} grupos completados
            </span>
            <span className="text-xs font-semibold text-blue-400">
              {stats.percentage}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid de Grupos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => {
          const groupTeams = teamsByGroup[group] || [];
          const standing = standings[group];
          const isComplete = standing?.first && standing?.second && standing?.third;

          if (groupTeams.length === 0) {
            return (
              <div key={group} className="bg-slate-900/70 rounded-xl border border-slate-800 p-4">
                <h3 className="text-xl font-bold text-white mb-4">Grupo {group}</h3>
                <p className="text-slate-500 text-sm">No hay equipos en este grupo</p>
              </div>
            );
          }

          return (
            <div 
              key={group} 
              className={`rounded-xl border p-4 transition-all ${
                isComplete 
                  ? "bg-emerald-900/10 border-emerald-500/50" 
                  : "bg-slate-900/70 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Grupo {group}</h3>
                {isComplete && (
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              
              <div className="space-y-3">
                {/* 1º Lugar */}
                <div>
                  <label className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                    <span className="text-lg">🥇</span>
                    <span className="font-semibold">1º Lugar</span>
                  </label>
                  <select
                    value={standing?.first || ""}
                    onChange={(e) => updateStanding(group, "first", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Seleccionar equipo</option>
                    {groupTeams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.code} - {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2º Lugar */}
                <div>
                  <label className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                    <span className="text-lg">🥈</span>
                    <span className="font-semibold">2º Lugar</span>
                  </label>
                  <select
                    value={standing?.second || ""}
                    onChange={(e) => updateStanding(group, "second", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="">Seleccionar equipo</option>
                    {groupTeams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.code} - {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3º Lugar */}
                <div>
                  <label className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                    <span className="text-lg">🥉</span>
                    <span className="font-semibold">3º Lugar</span>
                  </label>
                  <select
                    value={standing?.third || ""}
                    onChange={(e) => updateStanding(group, "third", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Seleccionar equipo</option>
                    {groupTeams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.code} - {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview de selección */}
              {isComplete && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Preview:</p>
                  <div className="space-y-1">
                    {standing.first && (
                      <div className="flex items-center gap-2 text-xs">
                        <img 
                          src={getFlagUrl(groupTeams.find(t => t._id === standing.first)?.code) || ''} 
                          alt=""
                          className="w-4 h-3 object-cover rounded"
                          onError={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'}
                        />
                        <span className="text-yellow-400">1º</span>
                        <span className="text-slate-300">{groupTeams.find(t => t._id === standing.first)?.name}</span>
                      </div>
                    )}
                    {standing.second && (
                      <div className="flex items-center gap-2 text-xs">
                        <img 
                          src={getFlagUrl(groupTeams.find(t => t._id === standing.second)?.code) || ''} 
                          alt=""
                          className="w-4 h-3 object-cover rounded"
                          onError={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'}
                        />
                        <span className="text-slate-400">2º</span>
                        <span className="text-slate-300">{groupTeams.find(t => t._id === standing.second)?.name}</span>
                      </div>
                    )}
                    {standing.third && (
                      <div className="flex items-center gap-2 text-xs">
                        <img 
                          src={getFlagUrl(groupTeams.find(t => t._id === standing.third)?.code) || ''} 
                          alt=""
                          className="w-4 h-3 object-cover rounded"
                          onError={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'}
                        />
                        <span className="text-orange-400">3º</span>
                        <span className="text-slate-300">{groupTeams.find(t => t._id === standing.third)?.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón de Recalcular */}
      <div className="sticky bottom-4">
        <button
          onClick={onRecalculate}
          disabled={loading || stats.completed === 0}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Recalculando puntos...
            </span>
          ) : (
            `🧮 Recalcular Puntos (${stats.completed} grupos completos)`
          )}
        </button>
      </div>

      {stats.completed > 0 && stats.completed < stats.total && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
          <p className="text-yellow-200 text-sm">
            ⚠️ <strong>Atención:</strong> Has completado {stats.completed} de {stats.total} grupos. 
            Puedes recalcular ahora o completar todos primero.
          </p>
        </div>
      )}
    </div>
  );
}