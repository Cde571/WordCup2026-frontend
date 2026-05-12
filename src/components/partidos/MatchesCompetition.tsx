import React, { useEffect, useState } from "react";
import { apiFetch, unwrapList } from "../../lib/api"; import { CrystalBallOverlay, FlagBadge, formatDate, GROUPS, Shell, TeamPill } from "../wc26-fixed/Shared";
import type { Match } from "../wc26-fixed/Shared";
function winnerFromScore(home: number, away: number) { return home > away ? "HOME" : away > home ? "AWAY" : "DRAW"; }

export default function MatchesCompetition() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Record<string, { home: number; away: number }>>({});
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [group, setGroup] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiFetch("/api/matches");
      setMatches(unwrapList<Match>(data, "matches"));
      const mine = await apiFetch<any>("/api/predictions/match").catch(() => null);
      const nextScores: Record<string, { home: number; away: number }> = {};
      const nextLocked: Record<string, boolean> = {};
      for (const pred of mine?.predictions || []) {
        const id = pred.match?._id || pred.match;
        if (!id) continue;
        nextScores[id] = { home: pred.homeGoalsPred ?? 0, away: pred.awayGoalsPred ?? 0 };
        nextLocked[id] = true;
      }
      setScores(nextScores); setLocked(nextLocked);
    } catch (err: any) { setError(err?.message || "No se pudieron cargar los partidos."); }
  }
  useEffect(() => { load(); }, []);

  function update(id: string, side: "home" | "away", value: number) {
    if (locked[id]) return;
    setScores((current) => ({ ...current, [id]: { home: current[id]?.home ?? 0, away: current[id]?.away ?? 0, [side]: Math.max(0, value) } }));
  }

  async function save(match: Match) {
    if (locked[match._id]) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const score = scores[match._id] || { home: 0, away: 0 };
      await apiFetch("/api/predictions/match", { method: "POST", body: JSON.stringify({ matchId: match._id, homeGoalsPred: score.home, awayGoalsPred: score.away, winnerPred: winnerFromScore(score.home, score.away) }) });
      setLocked((c) => ({ ...c, [match._id]: true }));
      setMessage("Predicción guardada y bloqueada.");
    } catch (err: any) { setError(err?.message || "No se pudo guardar."); }
    finally { setSaving(false); }
  }

  const filtered = matches.filter((m) => group === "ALL" || m.group === group);

  return (
    <Shell active="partidos" title="Predicción de partidos" subtitle="Pronostica marcador por marcador. Cada predicción guardada queda bloqueada.">
      {saving && <CrystalBallOverlay title="Guardando marcador" text="El oráculo está registrando tu pronóstico." />}
      <section className="wc-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <select value={group} onChange={(e) => setGroup(e.target.value)}><option value="ALL">Todos los grupos</option>{GROUPS.map((g) => <option key={g} value={g}>Grupo {g}</option>)}</select>
        <strong>{filtered.length} partidos</strong>
      </section>
      {message && <div className="wc-alert success">{message}</div>}{error && <div className="wc-alert error">{error}</div>}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 16 }}>
        {filtered.map((match) => {
          const score = scores[match._id] || { home: 0, away: 0 };
          const isLocked = Boolean(locked[match._id]);
          return (
            <article key={match._id} className="wc-card">
              <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: ".84rem" }}><span>Grupo {match.group || "-"}</span><span>{formatDate(match.matchDate)}</span></div>
              {([ ["home", match.homeTeam], ["away", match.awayTeam] ] as const).map(([side, team]) => (
                <div key={side} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 78px", gap: 12, alignItems: "center", marginTop: 14 }}>
                  <TeamPill team={team} />
                  <input type="number" min={0} disabled={isLocked} value={side === "home" ? score.home : score.away} onChange={(e) => update(match._id, side, Number(e.target.value))} style={{ textAlign: "center", fontWeight: 1000 }} />
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 12 }}><span style={{ color: "#9ca3af" }}>{match.stadium || "TBD"}</span><button className="wc-btn" disabled={isLocked} onClick={() => save(match)}>{isLocked ? "Bloqueado" : "Guardar"}</button></div>
            </article>
          );
        })}
      </section>
    </Shell>
  );
}
