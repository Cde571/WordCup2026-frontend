import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.PUBLIC_BACKEND_URL ?? "http://localhost:4000";

type Team = {
  _id: string;
  name: string;
  code?: string;
  group?: string | null;
  logo?: string | null;
};

const FIFA_TO_ISO2: Record<string, string> = {
  ALG: "dz", ARG: "ar", AUS: "au", AUT: "at", BEL: "be", BRA: "br",
  CMR: "cm", CAN: "ca", CPV: "cv", COL: "co", CRO: "hr", CUW: "cw",
  ECU: "ec", EGY: "eg", ENG: "gb-eng", FRA: "fr", GER: "de", HAI: "ht",
  IRN: "ir", CIV: "ci", JPN: "jp", JOR: "jo", MEX: "mx", MAR: "ma",
  NED: "nl", NZL: "nz", NGA: "ng", NOR: "no", PAN: "pa", PAR: "py",
  POR: "pt", QAT: "qa", KSA: "sa", SCO: "gb-sct", SEN: "sn", KOR: "kr",
  ESP: "es", SUI: "ch", USA: "us", URU: "uy", UZB: "uz", TUN: "tn", RSA: "za",
};

function getFlagUrl(code: string | undefined | null): string | null {
  if (!code) return null;
  const iso2 = FIFA_TO_ISO2[code.toUpperCase()];
  if (!iso2) return null;
  return `https://flagpedia.net/data/flags/w40/${iso2}.png`;
}

type GroupPredictions = Record<string, any>;

type KnockoutPrediction = {
  matchId: number;
  winnerId: string | null;
  winnerName: string | null;
  winnerCode: string | null;
};

type SeedSlot =
  | { type: "winner"; group: string }
  | { type: "runnerUp"; group: string }
  | { type: "thirdPool"; groups: string[] };

type KnockoutMatchTemplate = {
  id: number;
  phase: "Round of 32" | "Round of 16" | "Quarter Finals" | "Semi Finals" | "Third Place" | "Final";
  code: string;
  home: SeedSlot | { fromMatchId: number };
  away: SeedSlot | { fromMatchId: number };
};

// PLANTILLA KNOCKOUT (M73-M104)
const ROUND_OF_32: KnockoutMatchTemplate[] = [
  { id: 73, phase: "Round of 32", code: "M73", home: { type: "runnerUp", group: "A" }, away: { type: "runnerUp", group: "B" } },
  { id: 74, phase: "Round of 32", code: "M74", home: { type: "winner", group: "C" }, away: { type: "runnerUp", group: "F" } },
  { id: 75, phase: "Round of 32", code: "M75", home: { type: "winner", group: "E" }, away: { type: "thirdPool", groups: ["A", "B", "C", "D", "F"] } },
  { id: 76, phase: "Round of 32", code: "M76", home: { type: "winner", group: "F" }, away: { type: "runnerUp", group: "C" } },
  { id: 77, phase: "Round of 32", code: "M77", home: { type: "runnerUp", group: "E" }, away: { type: "runnerUp", group: "I" } },
  { id: 78, phase: "Round of 32", code: "M78", home: { type: "winner", group: "I" }, away: { type: "thirdPool", groups: ["C", "D", "F", "G", "H"] } },
  { id: 79, phase: "Round of 32", code: "M79", home: { type: "winner", group: "A" }, away: { type: "thirdPool", groups: ["C", "E", "F", "H", "I"] } },
  { id: 80, phase: "Round of 32", code: "M80", home: { type: "winner", group: "L" }, away: { type: "thirdPool", groups: ["E", "H", "I", "J", "K"] } },
  { id: 81, phase: "Round of 32", code: "M81", home: { type: "winner", group: "G" }, away: { type: "thirdPool", groups: ["A", "E", "H", "I", "J"] } },
  { id: 82, phase: "Round of 32", code: "M82", home: { type: "winner", group: "D" }, away: { type: "thirdPool", groups: ["B", "E", "F", "I", "J"] } },
  { id: 83, phase: "Round of 32", code: "M83", home: { type: "winner", group: "H" }, away: { type: "runnerUp", group: "J" } },
  { id: 84, phase: "Round of 32", code: "M84", home: { type: "runnerUp", group: "K" }, away: { type: "runnerUp", group: "L" } },
  { id: 85, phase: "Round of 32", code: "M85", home: { type: "winner", group: "B" }, away: { type: "thirdPool", groups: ["E", "F", "G", "I", "J"] } },
  { id: 86, phase: "Round of 32", code: "M86", home: { type: "runnerUp", group: "D" }, away: { type: "runnerUp", group: "G" } },
  { id: 87, phase: "Round of 32", code: "M87", home: { type: "winner", group: "J" }, away: { type: "runnerUp", group: "H" } },
  { id: 88, phase: "Round of 32", code: "M88", home: { type: "winner", group: "K" }, away: { type: "thirdPool", groups: ["D", "E", "I", "J", "L"] } },
];

const ROUND_OF_16: KnockoutMatchTemplate[] = [
  { id: 89, phase: "Round of 16", code: "M89", home: { fromMatchId: 73 }, away: { fromMatchId: 75 } },
  { id: 90, phase: "Round of 16", code: "M90", home: { fromMatchId: 74 }, away: { fromMatchId: 77 } },
  { id: 91, phase: "Round of 16", code: "M91", home: { fromMatchId: 76 }, away: { fromMatchId: 78 } },
  { id: 92, phase: "Round of 16", code: "M92", home: { fromMatchId: 79 }, away: { fromMatchId: 80 } },
  { id: 93, phase: "Round of 16", code: "M93", home: { fromMatchId: 83 }, away: { fromMatchId: 84 } },
  { id: 94, phase: "Round of 16", code: "M94", home: { fromMatchId: 81 }, away: { fromMatchId: 82 } },
  { id: 95, phase: "Round of 16", code: "M95", home: { fromMatchId: 86 }, away: { fromMatchId: 88 } },
  { id: 96, phase: "Round of 16", code: "M96", home: { fromMatchId: 85 }, away: { fromMatchId: 87 } },
];

const QUARTERS: KnockoutMatchTemplate[] = [
  { id: 97, phase: "Quarter Finals", code: "M97", home: { fromMatchId: 89 }, away: { fromMatchId: 90 } },
  { id: 98, phase: "Quarter Finals", code: "M98", home: { fromMatchId: 93 }, away: { fromMatchId: 94 } },
  { id: 99, phase: "Quarter Finals", code: "M99", home: { fromMatchId: 91 }, away: { fromMatchId: 92 } },
  { id: 100, phase: "Quarter Finals", code: "M100", home: { fromMatchId: 95 }, away: { fromMatchId: 96 } },
];

const SEMIS_AND_FINAL: KnockoutMatchTemplate[] = [
  { id: 101, phase: "Semi Finals", code: "M101", home: { fromMatchId: 97 }, away: { fromMatchId: 98 } },
  { id: 102, phase: "Semi Finals", code: "M102", home: { fromMatchId: 99 }, away: { fromMatchId: 100 } },
  { id: 103, phase: "Third Place", code: "M103", home: { fromMatchId: 101 }, away: { fromMatchId: 102 } },
  { id: 104, phase: "Final", code: "M104", home: { fromMatchId: 101 }, away: { fromMatchId: 102 } },
];

const ALL_MATCHES_TEMPLATE: KnockoutMatchTemplate[] = [
  ...ROUND_OF_32,
  ...ROUND_OF_16,
  ...QUARTERS,
  ...SEMIS_AND_FINAL,
];

function getRawPredictionSeed(groupPred: any, place: "first" | "second" | "third") {
  if (!groupPred) return { code: null as string | null, id: null as string | null, team: null as any };

  const code =
    groupPred[place] ??
    groupPred[`${place}Code`] ??
    groupPred[`${place}Team`]?.code ??
    null;

  const id =
    groupPred[`${place}Id`] ??
    groupPred[`${place}Team`]?._id ??
    null;

  const team = groupPred[`${place}Team`] ?? null;

  return { code: code ? String(code) : null, id: id ? String(id) : null, team };
}

function resolveTeamFromGroup(
  place: "first" | "second" | "third",
  group: string,
  predictions: GroupPredictions | null,
  teamsByGroup: Map<string, Team[]>,
  fallbackLabel: string
): { name: string; code: string | null; id: string | null; placeholder: boolean } {
  if (!predictions) return { name: fallbackLabel, code: null, id: null, placeholder: true };

  const pred = predictions[group];
  if (!pred) return { name: fallbackLabel, code: null, id: null, placeholder: true };

  const { code, id, team } = getRawPredictionSeed(pred, place);
  const list = teamsByGroup.get(group) ?? [];

  if (id) {
    const found = list.find((t) => t._id === id);
    if (found) return { name: found.name, code: found.code || null, id: found._id, placeholder: false };
  }

  if (code) {
    const found = list.find((t) => t.code?.toUpperCase() === code.toUpperCase());
    if (found) return { name: found.name, code: found.code || null, id: found._id, placeholder: false };
  }

  if (team?.name) return { name: team.name, code: team.code || null, id: team._id || null, placeholder: false };

  return { name: fallbackLabel, code: null, id: null, placeholder: true };
}

function resolveSlotTeam(
  slot: SeedSlot | { fromMatchId: number },
  teamsByGroup: Map<string, Team[]>,
  predictions: GroupPredictions | null,
  knockoutPreds: Map<number, KnockoutPrediction>,
  byId: Map<number, KnockoutMatchTemplate>
): { name: string; code: string | null; id: string | null; placeholder: boolean } {
  if ("fromMatchId" in slot) {
    const pred = knockoutPreds.get(slot.fromMatchId);
    if (pred?.winnerId) {
      return { name: pred.winnerName || `Ganador M${slot.fromMatchId}`, code: pred.winnerCode, id: pred.winnerId, placeholder: false };
    }
    const source = byId.get(slot.fromMatchId);
    return { name: source ? `Ganador ${source.code}` : `Ganador M${slot.fromMatchId}`, code: null, id: null, placeholder: true };
  }

  if (slot.type === "winner") {
    const g = slot.group.toUpperCase();
    return resolveTeamFromGroup("first", g, predictions, teamsByGroup, `1.º Grupo ${g}`);
  }

  if (slot.type === "runnerUp") {
    const g = slot.group.toUpperCase();
    return resolveTeamFromGroup("second", g, predictions, teamsByGroup, `2.º Grupo ${g}`);
  }

  // thirdPool aún no está resuelto (placeholder seguro)
  const groupsLabel = slot.groups.join("/");
  return { name: `Mejor 3.º ${groupsLabel}`, code: null, id: null, placeholder: true };
}

export default function KnockoutBracketPredictions() {
  const [teamsByGroup, setTeamsByGroup] = useState<Map<string, Team[]>>(new Map());
  const [predictions, setPredictions] = useState<GroupPredictions | null>(null);
  const [knockoutPreds, setKnockoutPreds] = useState<Map<number, KnockoutPrediction>>(new Map());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [auth, setAuth] = useState<{ loggedIn: boolean; user?: any } | null>(null);

  const byId = useMemo(() => {
    const map = new Map<number, KnockoutMatchTemplate>();
    for (const m of ALL_MATCHES_TEMPLATE) map.set(m.id, m);
    return map;
  }, []);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/status`, { credentials: "include" });
        const data = await res.json();
        setAuth(data?.loggedIn ? { loggedIn: true, user: data.user } : { loggedIn: false });
      } catch {
        setAuth({ loggedIn: false });
      }
    };

    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/teams`);
        const data = await res.json();
        const teams = (data.teams ?? []) as Team[];

        const map = new Map<string, Team[]>();
        for (const t of teams) {
          const g = (t.group || "").toUpperCase();
          if (!g) continue;
          if (!map.has(g)) map.set(g, []);
          map.get(g)!.push(t);
        }
        for (const [g, list] of map.entries()) {
          map.set(g, [...list].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setTeamsByGroup(map);
      } catch (err) {
        console.error("Error cargando equipos:", err);
      }
    };

    const loadGroupPredictions = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/predictions/groups/my-predictions`, { credentials: "include" });
        if (!res.ok) return;

        const data = await res.json();
        if (data.predictions && typeof data.predictions === "object") {
          const normalized: GroupPredictions = {};
          for (const [group, value] of Object.entries<any>(data.predictions)) {
            normalized[String(group).toUpperCase()] = value;
          }
          setPredictions(normalized);
        }
      } catch (err) {
        console.warn("No se pudieron cargar predicciones de grupos:", err);
      }
    };

    const loadKnockoutPredictions = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/predictions/knockout`, { credentials: "include" });
        if (!res.ok) return;

        const data = await res.json();
        const map = new Map<number, KnockoutPrediction>();

        if (Array.isArray(data.predictions)) {
          for (const pred of data.predictions) {
            const key = Number(pred.matchOrder ?? pred.matchId);
            map.set(key, {
              matchId: key,
              winnerId: pred.predictedWinnerTeam?._id || null,
              winnerName: pred.predictedWinnerTeam?.name || null,
              winnerCode: pred.predictedWinnerTeam?.code || null,
            });
          }
        }
        setKnockoutPreds(map);
      } catch (err) {
        console.warn("No se pudieron cargar predicciones knockout:", err);
      }
    };

    fetchAuth();
    fetchTeams();
    loadGroupPredictions();
    loadKnockoutPredictions();
  }, []);

  const phasesInOrder: KnockoutMatchTemplate["phase"][] = [
    "Round of 32",
    "Round of 16",
    "Quarter Finals",
    "Semi Finals",
    "Third Place",
    "Final",
  ];

  const matchesByPhase = useMemo(() => {
    const map = new Map<KnockoutMatchTemplate["phase"], KnockoutMatchTemplate[]>();
    for (const m of ALL_MATCHES_TEMPLATE) {
      if (!map.has(m.phase)) map.set(m.phase, []);
      map.get(m.phase)!.push(m);
    }
    return map;
  }, []);

  const getPhaseLabel = (phase: KnockoutMatchTemplate["phase"]) => {
    switch (phase) {
      case "Round of 32": return "Ronda de 32";
      case "Round of 16": return "Octavos de final";
      case "Quarter Finals": return "Cuartos de final";
      case "Semi Finals": return "Semifinales";
      case "Third Place": return "Tercer puesto";
      case "Final": return "Gran Final";
      default: return phase;
    }
  };

  const getPhaseDates = (phase: KnockoutMatchTemplate["phase"]) => {
    switch (phase) {
      case "Round of 32": return "28 junio – 3 julio 2026";
      case "Round of 16": return "4 – 7 julio 2026";
      case "Quarter Finals": return "9 – 11 julio 2026";
      case "Semi Finals": return "14 – 15 julio 2026";
      case "Third Place": return "18 julio 2026";
      case "Final": return "19 julio 2026";
      default: return "";
    }
  };

  async function saveKnockout(match: KnockoutMatchTemplate, homeId: string | null, awayId: string | null, winnerId: string) {
    await fetch(`${API_BASE}/api/predictions/knockout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: match.phase,
        matchOrder: match.id,
        predictedWinnerTeam: winnerId,
        homeTeam: homeId,
        awayTeam: awayId,
      }),
    });
  }

  const handleSelectWinner = async (matchId: number, pick: { id: string | null; name: string; code: string | null; placeholder: boolean }, isHome: boolean) => {
    const match = byId.get(matchId);
    if (!match) return;

    if (!auth?.loggedIn) {
      window.location.href = `${API_BASE}/auth/google`;
      return;
    }

    if (!pick.id || pick.placeholder) {
      // placeholder seguro: evita guardar basura y evita errores
      console.warn("Slot aún no resuelto (placeholder):", pick.name);
      return;
    }

    const homeSlot = resolveSlotTeam(match.home as any, teamsByGroup, predictions, knockoutPreds, byId);
    const awaySlot = resolveSlotTeam(match.away as any, teamsByGroup, predictions, knockoutPreds, byId);

    const homeId = homeSlot.id;
    const awayId = awaySlot.id;

    // Actualiza UI local inmediato
    const newPreds = new Map(knockoutPreds);
    newPreds.set(matchId, {
      matchId,
      winnerId: pick.id,
      winnerName: pick.name,
      winnerCode: pick.code,
    });
    setKnockoutPreds(newPreds);

    const key = `${matchId}-${isHome ? "H" : "A"}`;
    setSavingKey(key);
    try {
      await saveKnockout(match, homeId, awayId, pick.id);
    } catch (err) {
      console.error("Error guardando predicción:", err);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    // Full-bleed: rompe el max-width del MainLayout y ocupa pantalla completa
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 md:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-widest text-purple-300 mb-1">
            Mundial 2026 · Llaves
          </p>
          <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl text-white tracking-wide">
            BRACKET INTERACTIVO
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-2">
            Visualiza y predice cómo quedarían las llaves del Mundial 2026 según tus picks de fase de grupos.
          </p>

          {!auth?.loggedIn && (
            <div className="mt-4 flex items-center gap-3">
              <a
                href={`${API_BASE}/auth/google`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 text-xs font-semibold"
              >
                Iniciar sesión con Google
              </a>
              <span className="text-[11px] text-slate-300">
                Necesitas sesión para guardar tu bracket.
              </span>
            </div>
          )}
        </header>

        <div className="mt-4 overflow-x-auto pb-6">
          <div
            className="min-w-[1400px] grid gap-6 lg:gap-8"
            style={{ gridTemplateColumns: `repeat(${phasesInOrder.length}, minmax(0, 1fr))` }}
          >
            {phasesInOrder.map((phase) => {
              const list = matchesByPhase.get(phase) ?? [];
              if (!list.length) return null;

              return (
                <div key={phase} className="flex flex-col gap-3">
                  <div className="bg-gradient-to-br from-purple-900/90 to-slate-900/90 border border-purple-700/50 rounded-xl px-4 py-3 shadow-lg">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider text-center">
                      {getPhaseLabel(phase)}
                    </h2>
                    <p className="mt-1 text-[10px] text-purple-200 text-center">
                      {getPhaseDates(phase)} · {list.length} partido{list.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 pb-6 mt-1">
                    {list.map((m) => {
                      const home = resolveSlotTeam(m.home as any, teamsByGroup, predictions, knockoutPreds, byId);
                      const away = resolveSlotTeam(m.away as any, teamsByGroup, predictions, knockoutPreds, byId);
                      const winner = knockoutPreds.get(m.id);

                      const isSavingHome = savingKey === `${m.id}-H`;
                      const isSavingAway = savingKey === `${m.id}-A`;

                      const homeDisabled = home.placeholder || !home.id || !!savingKey;
                      const awayDisabled = away.placeholder || !away.id || !!savingKey;

                      return (
                        <article
                          key={m.id}
                          className="relative rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-3 flex flex-col gap-2.5 hover:border-purple-500/70 transition-all duration-200 shadow-md"
                        >
                          <span className="absolute -left-2 -top-2 inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-400/40 px-2.5 text-[10px] font-bold text-white shadow-md">
                            {m.code}
                          </span>

                          <div className="flex flex-col gap-2 mt-2">
                            <button
                              disabled={homeDisabled}
                              onClick={() => handleSelectWinner(m.id, home, true)}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 border transition-all ${
                                winner?.winnerId && winner.winnerId === home.id
                                  ? "bg-emerald-900/40 border-emerald-500/60"
                                  : "bg-slate-800/50 border-slate-700/40 hover:border-blue-500/50"
                              } ${homeDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                              title={home.placeholder ? "Completa grupos / cruces previos para habilitar" : ""}
                            >
                              <div className="relative flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                {home.code && getFlagUrl(home.code) ? (
                                  <img
                                    src={getFlagUrl(home.code)!}
                                    alt={home.code}
                                    className="w-full h-full object-cover"
                                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold">
                                    H
                                  </div>
                                )}
                              </div>

                              <span className="text-xs font-semibold text-slate-100 truncate flex-1">
                                {home.name}
                              </span>

                              {isSavingHome && (
                                <span className="text-[10px] text-slate-300">Guardando…</span>
                              )}

                              {winner?.winnerId && winner.winnerId === home.id && !isSavingHome && (
                                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                              )}
                            </button>

                            <button
                              disabled={awayDisabled}
                              onClick={() => handleSelectWinner(m.id, away, false)}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 border transition-all ${
                                winner?.winnerId && winner.winnerId === away.id
                                  ? "bg-emerald-900/40 border-emerald-500/60"
                                  : "bg-slate-800/50 border-slate-700/40 hover:border-red-500/50"
                              } ${awayDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                              title={away.placeholder ? "Completa grupos / cruces previos para habilitar" : ""}
                            >
                              <div className="relative flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                {away.code && getFlagUrl(away.code) ? (
                                  <img
                                    src={getFlagUrl(away.code)!}
                                    alt={away.code}
                                    className="w-full h-full object-cover"
                                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-[10px] font-bold">
                                    A
                                  </div>
                                )}
                              </div>

                              <span className="text-xs font-semibold text-slate-100 truncate flex-1">
                                {away.name}
                              </span>

                              {isSavingAway && (
                                <span className="text-[10px] text-slate-300">Guardando…</span>
                              )}

                              {winner?.winnerId && winner.winnerId === away.id && !isSavingAway && (
                                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-[11px] text-slate-400">
          Nota: Los slots “Mejor 3.º …” quedan deshabilitados hasta que implementemos la regla real de mejores terceros.
        </p>
      </div>
    </section>
  );
}
