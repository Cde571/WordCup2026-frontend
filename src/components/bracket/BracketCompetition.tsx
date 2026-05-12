import React, { useEffect, useMemo, useState } from "react";
import { apiFetch, unwrapList } from "../../lib/api"; import { CrystalBallOverlay, FlagBadge, GROUPS, OFFICIAL_GROUP_CODES, Shell, TeamPill } from "../wc26-fixed/Shared";
import type { Team } from "../wc26-fixed/Shared";
type BracketPicks = Record<string, Record<number, string>>;
type GroupStanding = { first?: string | null; second?: string | null; third?: string | null };

const STAGES = [
  { key: "Round of 32", title: "Round of 32", count: 16 },
  { key: "Round of 16", title: "Round of 16", count: 8 },
  { key: "Quarter Finals", title: "Cuartos", count: 4 },
  { key: "Semi Finals", title: "Semifinales", count: 2 },
  { key: "Final", title: "Final", count: 1 },
];

function pair(list: Array<string | null>) {
  const result: Array<[string | null, string | null]> = [];
  for (let i = 0; i < list.length; i += 2) result.push([list[i] || null, list[i + 1] || null]);
  return result;
}

function officialFallbackCodes() {
  const winners: string[] = [];
  const seconds: string[] = [];
  const thirds: string[] = [];
  for (const group of GROUPS) {
    const codes = OFFICIAL_GROUP_CODES[group] || [];
    if (codes[0]) winners.push(codes[0]);
    if (codes[1]) seconds.push(codes[1]);
    if (codes[2]) thirds.push(codes[2]);
  }
  return [...winners, ...seconds, ...thirds.slice(0, 8)].slice(0, 32);
}

export default function BracketCompetition() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [standings, setStandings] = useState<Record<string, GroupStanding>>({});
  const [picks, setPicks] = useState<BracketPicks>({});
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const teamById = useMemo(() => new Map(teams.map((team) => [team._id, team])), [teams]);
  const teamByCode = useMemo(() => new Map(teams.map((team) => [team.code, team])), [teams]);

  async function load() {
    try {
      const teamsData = await apiFetch("/api/teams");
      const loadedTeams = unwrapList<Team>(teamsData, "teams");
      setTeams(loadedTeams);

      const savedGroups = await apiFetch<any>("/api/predictions/groups/my-predictions").catch(() => null);
      const nextStandings: Record<string, GroupStanding> = {};
      if (savedGroups?.predictions) {
        for (const group of GROUPS) {
          const item = savedGroups.predictions[group];
          if (!item) continue;
          nextStandings[group] = { first: item.first || null, second: item.second || null, third: item.third || null };
        }
      }
      setStandings(nextStandings);

      const saved = await apiFetch<any>("/api/predictions/knockout").catch(() => null);
      const restored: BracketPicks = {};
      for (const pred of saved?.predictions || []) {
        if (!restored[pred.stage]) restored[pred.stage] = {};
        restored[pred.stage][Number(pred.matchOrder)] = pred.predictedWinnerTeam?._id || pred.predictedWinnerTeam;
      }
      if (Object.keys(restored).length > 0) {
        setPicks(restored);
        setLocked(true);
      }
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el bracket.");
    }
  }

  useEffect(() => { load(); }, []);

  const seeds = useMemo(() => {
    const codes: string[] = [];
    const thirds: string[] = [];
    for (const group of GROUPS) {
      const st = standings[group];
      if (st?.first) codes.push(st.first);
      if (st?.second) codes.push(st.second);
      if (st?.third) thirds.push(st.third);
    }
    const sourceCodes = codes.length >= 24 ? [...codes, ...thirds.slice(0, 8)] : officialFallbackCodes();
    return sourceCodes.map((code) => teamByCode.get(code)?._id || null).filter(Boolean) as string[];
  }, [standings, teamByCode]);

  function teamsForStage(index: number) {
    if (index === 0) return pair(seeds.slice(0, 32));
    const previous = STAGES[index - 1];
    const ids: Array<string | null> = [];
    for (let i = 1; i <= previous.count; i++) ids.push(picks[previous.key]?.[i] || null);
    return pair(ids);
  }

  function selectWinner(stage: string, order: number, teamId: string | null) {
    if (locked || !teamId) return;
    setPicks((current) => ({ ...current, [stage]: { ...(current[stage] || {}), [order]: teamId } }));
  }

  async function save() {
    if (locked) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const calls: Promise<any>[] = [];
      for (let stageIndex = 0; stageIndex < STAGES.length; stageIndex++) {
        const stage = STAGES[stageIndex];
        const matches = teamsForStage(stageIndex);
        matches.forEach(([home, away], index) => {
          const order = index + 1;
          const winner = picks[stage.key]?.[order];
          if (!winner) return;
          calls.push(apiFetch("/api/predictions/knockout", { method: "POST", body: JSON.stringify({ stage: stage.key, matchOrder: order, homeTeam: home, awayTeam: away, predictedWinnerTeam: winner }) }));
        });
      }
      if (!calls.length) throw new Error("Selecciona al menos un ganador.");
      await Promise.all(calls);
      const champion = picks.Final?.[1] || null;
      let runnerUp: string | null = null;
      const finalPair = teamsForStage(4)[0];
      if (finalPair && champion) runnerUp = finalPair.find((id) => id && id !== champion) || null;
      if (champion) await apiFetch("/api/predictions/tournament", { method: "POST", body: JSON.stringify({ championTeam: champion, runnerUpTeam: runnerUp }) });
      setLocked(true);
      setMessage("Bracket guardado y bloqueado. Camino al campeón registrado.");
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el bracket.");
    } finally { setSaving(false); }
  }

  return (
    <Shell active="bracket" title="Bracket completo del Mundial" subtitle="Empieza desde tus grupos guardados. Si aún no los guardaste, usa el orden oficial como simulación inicial.">
      {saving && <CrystalBallOverlay title="Guardando bracket" text="La bola de cristal está sellando tu camino al campeón." />}
      <section className="wc-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div><strong>{locked ? "Bracket bloqueado" : "Bracket editable"}</strong><p style={{ color: "#9ca3af", margin: 0 }}>{Object.keys(standings).length ? "Usando tus predicciones de grupos." : "Usando orden oficial inicial hasta que guardes grupos."}</p></div>
        <button className="wc-btn" disabled={locked || saving} onClick={save}>{locked ? "Bloqueado" : "Guardar bracket"}</button>
      </section>
      {message && <div className="wc-alert success">{message}</div>}{error && <div className="wc-alert error">{error}</div>}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(280px,1fr))", gap: 14, overflowX: "auto", paddingBottom: 12 }}>
        {STAGES.map((stage, stageIndex) => (
          <div key={stage.key} className="wc-panel" style={{ minWidth: 280 }}>
            <h2>{stage.title}</h2>
            {teamsForStage(stageIndex).map(([home, away], index) => {
              const order = index + 1;
              const selected = picks[stage.key]?.[order];
              return (
                <article key={`${stage.key}-${order}`} className="wc-card" style={{ marginBottom: 12 }}>
                  {[home, away].map((id, idx) => {
                    const team = id ? teamById.get(id) : null;
                    return (
                      <button key={`${stage.key}-${order}-${idx}`} disabled={locked || !team} onClick={() => selectWinner(stage.key, order, id)} style={{ width: "100%", display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, marginBottom: 8, padding: 10, borderRadius: 16, border: "1px solid rgba(255,255,255,.1)", color: selected === id ? "#111827" : "white", background: selected === id ? "linear-gradient(135deg,#ffc928,#22c55e)" : "rgba(255,255,255,.05)", cursor: locked ? "not-allowed" : "pointer" }}>
                        <TeamPill team={team} />
                      </button>
                    );
                  })}
                </article>
              );
            })}
          </div>
        ))}
      </section>
    </Shell>
  );
}
