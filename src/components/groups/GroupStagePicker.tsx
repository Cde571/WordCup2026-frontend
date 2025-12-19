import React, { useEffect, useMemo, useState } from "react";

/**
 * Notas importantes:
 * - Este frontend NO usa localStorage.
 * - Para guardar eliminatorias, el backend debe aceptar stage = "Round of 32".
 * - Si tu backend NO tiene DELETE /api/predictions/knockout, NO lo llamamos (evita 404).
 */

type Team = {
  _id: string;
  name: string;
  code: string;
  group?: string | null;
  logo?: string | null;
};

type GroupPrediction = {
  first: string | null;
  second: string | null;
  third: string | null;
};

type KnockoutStage = "Round of 32" | "Round of 16" | "Quarter Finals" | "Semi Finals" | "Final";

type KnockoutMatch = {
  id: string;
  stage: KnockoutStage;
  matchOrder: number;
  homeTeam: Team | null;
  awayTeam: Team | null;
  predictedWinner: string | null; // TEAM CODE
};

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

const API_BASE = "http://localhost:4000";

const FIFA_TO_ISO2: Record<string, string> = {
  ALG: "dz", ARG: "ar", AUS: "au", AUT: "at", BEL: "be", BRA: "br",
  CMR: "cm", CAN: "ca", CPV: "cv", COL: "co", CRO: "hr", CUW: "cw",
  ECU: "ec", EGY: "eg", ENG: "gb-eng", FRA: "fr", GER: "de", HAI: "ht",
  IRN: "ir", CIV: "ci", JPN: "jp", JOR: "jo", MEX: "mx", MAR: "ma",
  NED: "nl", NZL: "nz", NGA: "ng", NOR: "no", PAN: "pa", PAR: "py",
  POR: "pt", QAT: "qa", KSA: "sa", SCO: "gb-sct", SEN: "sn", KOR: "kr",
  ESP: "es", SUI: "ch", USA: "us", URU: "uy", UZB: "uz", RSA: "za", TUN: "tn",
};

// TUS GRUPOS (según lo pegado). OJO: si pones códigos que NO existen en backend,
// el UI los marcará como “No existe en backend” y NO dejará guardarlos.
const OFFICIAL_GROUPS: Record<string, string[]> = {
  A: ["MEX", "KOR", "CAN", "QAT"],
  B: ["USA", "PAR", "AUS", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["GER", "CUW", "CIV", "ECU"],
  E: ["NED", "JPN", "BEL", "EGY"],
  F: ["ESP", "CPV", "KSA", "URU"],
  G: ["FRA", "SEN", "NOR", "IRN"],
  H: ["ARG", "AUT", "ALG", "JOR"],
  I: ["POR", "COL", "UZB", "NZL"],
  J: ["ENG", "CRO", "PAN", "NGA"],
  K: ["TUN", "NZL", "CAN", "QAT"],
  L: ["RSA", "SUI", "HAI", "SCO"],
};

const ROUND_OF_32_MATCHUPS = [
  { home: { group: "A", pos: 1 }, away: { group: "E", pos: 3 } }, // 1
  { home: { group: "C", pos: 1 }, away: { group: "G", pos: 3 } }, // 2
  { home: { group: "I", pos: 1 }, away: { group: "L", pos: 3 } }, // 3
  { home: { group: "K", pos: 1 }, away: { group: "A", pos: 3 } }, // 4
  { home: { group: "E", pos: 1 }, away: { group: "C", pos: 3 } }, // 5
  { home: { group: "G", pos: 1 }, away: { group: "I", pos: 3 } }, // 6
  { home: { group: "B", pos: 1 }, away: { group: "D", pos: 3 } }, // 7
  { home: { group: "D", pos: 1 }, away: { group: "F", pos: 3 } }, // 8
  { home: { group: "A", pos: 2 }, away: { group: "B", pos: 2 } }, // 9
  { home: { group: "C", pos: 2 }, away: { group: "D", pos: 2 } }, // 10
  { home: { group: "E", pos: 2 }, away: { group: "F", pos: 2 } }, // 11
  { home: { group: "G", pos: 2 }, away: { group: "H", pos: 2 } }, // 12
  { home: { group: "I", pos: 2 }, away: { group: "J", pos: 2 } }, // 13
  { home: { group: "K", pos: 2 }, away: { group: "L", pos: 2 } }, // 14
  { home: { group: "F", pos: 1 }, away: { group: "H", pos: 1 } }, // 15
  { home: { group: "J", pos: 1 }, away: { group: "L", pos: 1 } }, // 16
];

const R16_FROM_R32: Array<[number, number]> = [
  [1, 9],
  [2, 10],
  [3, 11],
  [4, 12],
  [5, 13],
  [6, 14],
  [7, 15],
  [8, 16],
];

function getFlagUrl(code: string | undefined | null): string | null {
  if (!code) return null;
  const iso2 = FIFA_TO_ISO2[code.toUpperCase()];
  return iso2 ? `https://flagpedia.net/data/flags/w40/${iso2}.png` : null;
}

function keyOf(stage: KnockoutStage, matchOrder: number) {
  return `${stage}#${matchOrder}`;
}

function ensureUpperCode(code: string | null | undefined) {
  return code ? code.toUpperCase() : null;
}

function normalizeRoundOf32(matches: KnockoutMatch[]): KnockoutMatch[] {
  const r32 = matches
    .filter((m) => m.stage === "Round of 32")
    .sort((a, b) => a.matchOrder - b.matchOrder);

  const map = new Map<number, KnockoutMatch>();
  for (const m of r32) map.set(m.matchOrder, m);

  const fixed: KnockoutMatch[] = [];
  for (let i = 1; i <= 16; i++) {
    const found = map.get(i);
    fixed.push(
      found ?? {
        id: `r32-${i}`,
        stage: "Round of 32",
        matchOrder: i,
        homeTeam: null,
        awayTeam: null,
        predictedWinner: null,
      }
    );
  }
  return fixed;
}

function winnerTeamFromMatch(match: KnockoutMatch, teams: Team[]): Team | null {
  const code = ensureUpperCode(match.predictedWinner);
  if (!code) return null;
  return teams.find((t) => t.code.toUpperCase() === code) ?? null;
}

function predictedWinnerIsValid(match: KnockoutMatch): boolean {
  if (!match.predictedWinner || !match.homeTeam || !match.awayTeam) return false;
  const pw = match.predictedWinner.toUpperCase();
  return pw === match.homeTeam.code.toUpperCase() || pw === match.awayTeam.code.toUpperCase();
}

function buildFullBracketFromR32(
  r32Base: KnockoutMatch[],
  teams: Team[],
  existingPredMap: Map<string, string | null>
): KnockoutMatch[] {
  const r32 = normalizeRoundOf32(r32Base).map((m) => {
    const saved = existingPredMap.get(keyOf("Round of 32", m.matchOrder)) ?? null;
    const savedUpper = ensureUpperCode(saved);

    const predictedWinner =
      savedUpper &&
      m.homeTeam &&
      m.awayTeam &&
      (savedUpper === m.homeTeam.code.toUpperCase() || savedUpper === m.awayTeam.code.toUpperCase())
        ? savedUpper
        : null;

    return { ...m, stage: "Round of 32" as const, predictedWinner };
  });

  const r16: KnockoutMatch[] = R16_FROM_R32.map(([mA, mB], idx) => {
    const a = r32.find((x) => x.matchOrder === mA)!;
    const b = r32.find((x) => x.matchOrder === mB)!;

    const homeTeam = winnerTeamFromMatch(a, teams);
    const awayTeam = winnerTeamFromMatch(b, teams);

    const matchOrder = idx + 1;
    const saved = existingPredMap.get(keyOf("Round of 16", matchOrder)) ?? null;
    const savedUpper = ensureUpperCode(saved);

    const predictedWinner =
      savedUpper &&
      homeTeam &&
      awayTeam &&
      (savedUpper === homeTeam.code.toUpperCase() || savedUpper === awayTeam.code.toUpperCase())
        ? savedUpper
        : null;

    return {
      id: `r16-${matchOrder}`,
      stage: "Round of 16",
      matchOrder,
      homeTeam,
      awayTeam,
      predictedWinner,
    };
  });

  const qf: KnockoutMatch[] = Array.from({ length: 4 }).map((_, i) => {
    const m1 = r16[i * 2];
    const m2 = r16[i * 2 + 1];

    const homeTeam = winnerTeamFromMatch(m1, teams);
    const awayTeam = winnerTeamFromMatch(m2, teams);

    const matchOrder = i + 1;
    const saved = existingPredMap.get(keyOf("Quarter Finals", matchOrder)) ?? null;
    const savedUpper = ensureUpperCode(saved);

    const predictedWinner =
      savedUpper &&
      homeTeam &&
      awayTeam &&
      (savedUpper === homeTeam.code.toUpperCase() || savedUpper === awayTeam.code.toUpperCase())
        ? savedUpper
        : null;

    return {
      id: `qf-${matchOrder}`,
      stage: "Quarter Finals",
      matchOrder,
      homeTeam,
      awayTeam,
      predictedWinner,
    };
  });

  const sf: KnockoutMatch[] = Array.from({ length: 2 }).map((_, i) => {
    const m1 = qf[i * 2];
    const m2 = qf[i * 2 + 1];

    const homeTeam = winnerTeamFromMatch(m1, teams);
    const awayTeam = winnerTeamFromMatch(m2, teams);

    const matchOrder = i + 1;
    const saved = existingPredMap.get(keyOf("Semi Finals", matchOrder)) ?? null;
    const savedUpper = ensureUpperCode(saved);

    const predictedWinner =
      savedUpper &&
      homeTeam &&
      awayTeam &&
      (savedUpper === homeTeam.code.toUpperCase() || savedUpper === awayTeam.code.toUpperCase())
        ? savedUpper
        : null;

    return {
      id: `sf-${matchOrder}`,
      stage: "Semi Finals",
      matchOrder,
      homeTeam,
      awayTeam,
      predictedWinner,
    };
  });

  const finalHome = winnerTeamFromMatch(sf[0], teams);
  const finalAway = winnerTeamFromMatch(sf[1], teams);

  const finalSaved = existingPredMap.get(keyOf("Final", 1)) ?? null;
  const finalSavedUpper = ensureUpperCode(finalSaved);

  const finalPred =
    finalSavedUpper &&
    finalHome &&
    finalAway &&
    (finalSavedUpper === finalHome.code.toUpperCase() || finalSavedUpper === finalAway.code.toUpperCase())
      ? finalSavedUpper
      : null;

  const finalMatch: KnockoutMatch = {
    id: "final-1",
    stage: "Final",
    matchOrder: 1,
    homeTeam: finalHome,
    awayTeam: finalAway,
    predictedWinner: finalPred,
  };

  return [...r32, ...r16, ...qf, ...sf, finalMatch];
}

function extractPredMap(matches: KnockoutMatch[]): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const m of matches) {
    map.set(keyOf(m.stage, m.matchOrder), m.predictedWinner ? m.predictedWinner.toUpperCase() : null);
  }
  return map;
}

function getTeamFromGroupPrediction(
  group: string,
  position: number,
  predictions: Record<string, GroupPrediction>,
  teamsList: Team[]
): Team | null {
  const pred = predictions[group];
  if (!pred) return null;

  let teamCode: string | null = null;
  if (position === 1) teamCode = pred.first;
  else if (position === 2) teamCode = pred.second;
  else if (position === 3) teamCode = pred.third;

  if (!teamCode) return null;
  const codeUpper = teamCode.toUpperCase();
  return teamsList.find((t) => t.code.toUpperCase() === codeUpper) ?? null;
}

function generateR32FromGroups(predictions: Record<string, GroupPrediction>, teamsList: Team[]): KnockoutMatch[] {
  const matches: KnockoutMatch[] = [];
  let order = 1;

  for (const matchup of ROUND_OF_32_MATCHUPS) {
    const homeTeam = getTeamFromGroupPrediction(matchup.home.group, matchup.home.pos, predictions, teamsList);
    const awayTeam = getTeamFromGroupPrediction(matchup.away.group, matchup.away.pos, predictions, teamsList);

    matches.push({
      id: `r32-${order}`,
      stage: "Round of 32",
      matchOrder: order,
      homeTeam,
      awayTeam,
      predictedWinner: null,
    });
    order++;
  }

  return matches;
}

export default function WorldCupPredictor() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [groupPredictions, setGroupPredictions] = useState<Record<string, GroupPrediction>>({});
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);
  const [currentView, setCurrentView] = useState<"groups" | "knockout">("groups");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saving, setSaving] = useState(false);

  const teamsByCode = useMemo(() => {
    const map = new Map<string, Team>();
    for (const t of teams) map.set(t.code.toUpperCase(), t);
    return map;
  }, [teams]);

  const addToast = (message: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const teamsRes = await fetch(`${API_BASE}/api/teams`, { credentials: "include" });
        const teamsData = await teamsRes.json();
        const teamsList: Team[] = teamsData.teams || [];
        setTeams(teamsList);

        const groupRes = await fetch(`${API_BASE}/api/predictions/groups/my-predictions`, {
          credentials: "include",
        });

        let gp: Record<string, GroupPrediction> = {};
        if (groupRes.ok) {
          const groupData = await groupRes.json();
          if (groupData?.predictions) gp = groupData.predictions;
          setGroupPredictions(gp);
        }

        const r32Base = generateR32FromGroups(gp, teamsList);

        const predMap = new Map<string, string | null>();
        const knockoutRes = await fetch(`${API_BASE}/api/predictions/knockout`, {
          credentials: "include",
        });

        if (knockoutRes.ok) {
          const knockoutData = await knockoutRes.json();
          const saved = knockoutData?.predictions || [];
          for (const p of saved) {
            if (p?.stage && p?.matchOrder && p?.predictedWinnerTeam?.code) {
              const stage = p.stage as KnockoutStage;
              predMap.set(keyOf(stage, Number(p.matchOrder)), String(p.predictedWinnerTeam.code).toUpperCase());
            }
          }
        }

        const full = buildFullBracketFromR32(r32Base, teamsList, predMap);
        setKnockoutMatches(full);

        if (predMap.size > 0) addToast("Predicciones cargadas del servidor", "info");
        const OMIT_CODES = new Set(["TUN", "RSA"]);

        const missingCodes = expectedTeamCodes
          .map((c) => c.trim().toUpperCase())
          .filter((code) => !OMIT_CODES.has(code))
          .filter((code) => !teamByCode.has(code));


        // Aviso explícito si K/L tienen códigos que NO existen en backend
        const missing: string[] = [];
        for (const [g, codes] of Object.entries(OFFICIAL_GROUPS)) {
          for (const c of codes) {
            if (!teamsList.some(t => t.code.toUpperCase() === c.toUpperCase())) missing.push(`${g}:${c}`);
          }
        }
        if (missing.length) {
          addToast("Hay equipos en tus grupos que NO existen en el backend. Revisa consola.", "error");
          console.warn("Códigos inexistentes en /api/teams:", missing);
        }
      } catch (err) {
        console.error(err);
        addToast("Error cargando datos", "error");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleKnockoutPrediction = (matchId: string, winnerCode: string) => {
    setKnockoutMatches((prev) => {
      const target = prev.find((m) => m.id === matchId);
      if (!target) return prev;

      const r32Base = normalizeRoundOf32(prev);
      const predMap = extractPredMap(prev);
      predMap.set(keyOf(target.stage, target.matchOrder), winnerCode.toUpperCase());

      return buildFullBracketFromR32(r32Base, teams, predMap);
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1) Save groups (bulk) - requiere IDs
      const groupPredictionsWithIds: Record<string, any> = {};
      const errors: string[] = [];

      for (const [groupKeyRaw, pred] of Object.entries(groupPredictions)) {
        const groupKey = groupKeyRaw.toUpperCase().trim();
        if (!pred.first || !pred.second) continue;

        const firstCode = pred.first.toUpperCase();
        const secondCode = pred.second.toUpperCase();
        const thirdCode = pred.third ? pred.third.toUpperCase() : null;

        const firstTeam = teamsByCode.get(firstCode);
        const secondTeam = teamsByCode.get(secondCode);
        const thirdTeam = thirdCode ? teamsByCode.get(thirdCode) : null;

        if (!firstTeam) errors.push(`Grupo ${groupKey}: no existe en backend el código ${firstCode}`);
        if (!secondTeam) errors.push(`Grupo ${groupKey}: no existe en backend el código ${secondCode}`);
        if (thirdCode && !thirdTeam) errors.push(`Grupo ${groupKey}: no existe en backend el código ${thirdCode}`);

        if (firstTeam && secondTeam) {
          groupPredictionsWithIds[groupKey] = {
            first: firstTeam._id,
            second: secondTeam._id,
            third: thirdTeam?._id || null,
          };
        }
      }

      if (errors.length) {
        addToast("No se pueden guardar algunos grupos: hay códigos que no existen en backend.", "error");
        console.warn("Errores de conversión código->id:", errors);
      }

      if (!Object.keys(groupPredictionsWithIds).length) {
        throw new Error("No hay grupos válidos para guardar (verifica K/L y que existan sus equipos en /api/teams).");
      }

      const groupRes = await fetch(`${API_BASE}/api/predictions/groups/bulk`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictions: groupPredictionsWithIds }),
      });

      if (!groupRes.ok) {
        const errData = await groupRes.json().catch(() => null);
        throw new Error(errData?.error || "Error guardando predicciones de grupos");
      }

      // 2) Save knockout (per match) - NO hacemos DELETE (evita 404)
      const validKnockoutToSave = knockoutMatches
        .filter((m) => m.predictedWinner && m.homeTeam && m.awayTeam && predictedWinnerIsValid(m))
        .map((m) => {
          const winnerId = teamsByCode.get(m.predictedWinner!.toUpperCase())?._id;
          if (!winnerId) return null;
          return {
            stage: m.stage,
            matchOrder: m.matchOrder,
            homeTeam: m.homeTeam!._id,
            awayTeam: m.awayTeam!._id,
            predictedWinnerTeam: winnerId,
          };
        })
        .filter(Boolean) as Array<{
          stage: KnockoutStage;
          matchOrder: number;
          homeTeam: string;
          awayTeam: string;
          predictedWinnerTeam: string;
        }>;

      await Promise.all(
        validKnockoutToSave.map((pred) =>
          fetch(`${API_BASE}/api/predictions/knockout`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pred),
          })
        )
      );

      addToast("✅ ¡Todo guardado en el backend!", "success");
    } catch (error: any) {
      console.error(error);
      addToast(error?.message || "Error guardando predicciones", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Cargando Mundial 2026...</p>
        </div>
      </div>
    );
  }

  const r32Matches = knockoutMatches.filter((m) => m.stage === "Round of 32").sort((a, b) => a.matchOrder - b.matchOrder);
  const r16Matches = knockoutMatches.filter((m) => m.stage === "Round of 16").sort((a, b) => a.matchOrder - b.matchOrder);
  const qfMatches = knockoutMatches.filter((m) => m.stage === "Quarter Finals").sort((a, b) => a.matchOrder - b.matchOrder);
  const sfMatches = knockoutMatches.filter((m) => m.stage === "Semi Finals").sort((a, b) => a.matchOrder - b.matchOrder);
  const finalMatch = knockoutMatches.find((m) => m.stage === "Final");
  const totalCompleted = knockoutMatches.filter((m) => !!m.predictedWinner).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg border backdrop-blur ${
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

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">⚽ MUNDIAL 2026</h1>
          <p className="text-slate-400">Sistema de Predicciones (backend)</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6 justify-center items-center">
          <button
            onClick={() => setCurrentView("groups")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all w-full sm:w-auto ${
              currentView === "groups" ? "bg-yellow-400 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            📋 Fase de Grupos (12)
          </button>

          <button
            onClick={() => setCurrentView("knockout")}
            disabled={r32Matches.length === 0}
            className={`px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
              currentView === "knockout" ? "bg-yellow-400 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            🏆 Eliminatorias ({totalCompleted}/{knockoutMatches.length})
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all w-full sm:w-auto"
          >
            {saving ? "⏳ Guardando..." : "💾 Guardar Todo"}
          </button>
        </div>

        {currentView === "groups" ? (
          <GroupStageView
            teams={teams}
            teamsByCode={teamsByCode}
            predictions={groupPredictions}
            onUpdatePredictions={setGroupPredictions}
            onGenerateBracket={() => {
              const r32Base = generateR32FromGroups(groupPredictions, teams);
              const predMap = new Map<string, string | null>();
              const full = buildFullBracketFromR32(r32Base, teams, predMap);
              setKnockoutMatches(full);
              setCurrentView("knockout");
              addToast("Bracket generado (Round of 32 = 16 partidos)", "success");
            }}
          />
        ) : (
          <div className="space-y-6">
            <StageSection title="⚡ Dieciseisavos (Round of 32)" matches={r32Matches} onPredict={handleKnockoutPrediction} />
            <StageSection title="🔥 Octavos (Round of 16)" matches={r16Matches} onPredict={handleKnockoutPrediction} />
            <StageSection title="💪 Cuartos" matches={qfMatches} onPredict={handleKnockoutPrediction} />
            <StageSection title="⭐ Semifinales" matches={sfMatches} onPredict={handleKnockoutPrediction} />

            {finalMatch && (
              <div className="bg-gradient-to-r from-yellow-900/30 to-emerald-900/30 border-2 border-yellow-500/70 rounded-2xl p-6">
                <h2 className="text-3xl font-bold text-yellow-400 mb-4 text-center">🏆 GRAN FINAL 🏆</h2>
                <MatchCard match={finalMatch} onPredict={handleKnockoutPrediction} isFinal />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupStageView({
  teams,
  teamsByCode,
  predictions,
  onUpdatePredictions,
  onGenerateBracket,
}: {
  teams: Team[];
  teamsByCode: Map<string, Team>;
  predictions: Record<string, GroupPrediction>;
  onUpdatePredictions: any;
  onGenerateBracket: () => void;
}) {
  const officialGroups = useMemo(() => {
    return Object.entries(OFFICIAL_GROUPS).map(([groupKey, codes]) => {
      const groupTeams = codes.map((code) => {
        const t = teamsByCode.get(code.toUpperCase());
        return {
          code,
          exists: !!t,
          team: t || null,
          fallbackName: code,
          id: t?._id || `missing-${groupKey}-${code}`,
        };
      });

      return { key: groupKey, teams: groupTeams };
    });
  }, [teamsByCode]);

  const handleSelect = (group: string, teamCode: string, position: keyof GroupPrediction) => {
    onUpdatePredictions((prev: Record<string, GroupPrediction>) => {
      const current = prev[group] || { first: null, second: null, third: null };
      const updated: GroupPrediction = { ...current };

      if (updated.first === teamCode && position !== "first") updated.first = null;
      if (updated.second === teamCode && position !== "second") updated.second = null;
      if (updated.third === teamCode && position !== "third") updated.third = null;

      updated[position] = teamCode;
      return { ...prev, [group]: updated };
    });
  };

  const completedGroups = Object.values(predictions).filter((p) => p.first && p.second).length;
  const canGenerate = completedGroups >= 12;

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-slate-800/50 px-6 py-3 rounded-xl">
          <span className="text-slate-300">Grupos completados:</span>
          <span className="text-2xl font-bold text-yellow-400">{completedGroups}/12</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {officialGroups.map(({ key, teams: groupTeams }) => (
          <div key={key} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xl font-bold text-white mb-3 text-center">Grupo {key}</h3>

            <div className="space-y-2">
              {groupTeams.map((row) => {
                const t = row.team;
                const exists = row.exists;

                const code = row.code.toUpperCase();
                const name = t?.name || row.fallbackName;
                const flag = getFlagUrl(code);

                return (
                  <div
                    key={row.id}
                    className={`flex items-center justify-between rounded-lg p-2 border ${
                      exists ? "bg-slate-800/50 border-slate-700" : "bg-red-900/10 border-red-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {flag && (
                        <img
                          src={flag}
                          alt={code}
                          className="w-6 h-4 object-cover rounded flex-shrink-0"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs text-slate-200 truncate">{name}</div>
                        {!exists && (
                          <div className="text-[10px] text-red-300">
                            (No existe en backend: /api/teams)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      {(["first", "second", "third"] as const).map((pos) => (
                        <button
                          key={pos}
                          disabled={!exists}
                          onClick={() => handleSelect(key, code, pos)}
                          className={`px-2 py-1 text-xs rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            predictions[key]?.[pos] === code
                              ? "bg-yellow-400 text-slate-900 font-bold"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {pos === "first" ? "1°" : pos === "second" ? "2°" : "3°"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onGenerateBracket}
          disabled={!canGenerate}
          className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold rounded-xl transition-all disabled:cursor-not-allowed"
        >
          {canGenerate ? "🚀 Generar Eliminatorias" : "Completa todos los grupos (al menos 1° y 2°)"}
        </button>
      </div>
    </div>
  );
}

function StageSection({
  title,
  matches,
  onPredict,
}: {
  title: string;
  matches: KnockoutMatch[];
  onPredict: (id: string, winner: string) => void;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4">
        {title} <span className="text-slate-400 text-sm font-normal">({matches.length})</span>
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <MatchCard key={`${match.stage}-${match.matchOrder}`} match={match} onPredict={onPredict} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  onPredict,
  isFinal = false,
}: {
  match: KnockoutMatch;
  onPredict: (id: string, winner: string) => void;
  isFinal?: boolean;
}) {
  if (!match.homeTeam || !match.awayTeam) {
    return (
      <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-4 text-center">
        <p className="text-slate-500 text-sm">Por definir...</p>
      </div>
    );
  }

  const homeSelected = match.predictedWinner === match.homeTeam.code.toUpperCase();
  const awaySelected = match.predictedWinner === match.awayTeam.code.toUpperCase();

  return (
    <div
      className={`rounded-xl p-4 ${
        isFinal ? "bg-gradient-to-br from-yellow-900/30 to-emerald-900/30" : "bg-slate-800/50"
      } border border-slate-700`}
    >
      <div className="space-y-2">
        <button
          onClick={() => onPredict(match.id, match.homeTeam!.code)}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
            homeSelected ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <img
              src={getFlagUrl(match.homeTeam!.code) || ""}
              alt=""
              className="w-6 h-4 rounded"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span className="font-semibold text-sm">{match.homeTeam!.name}</span>
          </div>
          {homeSelected && <span className="text-lg">✓</span>}
        </button>

        <div className="text-center text-xs text-slate-500 font-bold">VS</div>

        <button
          onClick={() => onPredict(match.id, match.awayTeam!.code)}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
            awaySelected ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <img
              src={getFlagUrl(match.awayTeam!.code) || ""}
              alt=""
              className="w-6 h-4 rounded"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span className="font-semibold text-sm">{match.awayTeam!.name}</span>
          </div>
          {awaySelected && <span className="text-lg">✓</span>}
        </button>
      </div>
    </div>
  );
}
