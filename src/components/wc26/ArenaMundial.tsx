import React, { useEffect, useState } from "react";
import { apiFetch, unwrapList } from "../../lib/api"; import { FlagBadge, PlayerMiniCard, Shell, formatDate } from "../wc26-fixed/Shared";
import type { Match, Player, Team } from "../wc26-fixed/Shared";
type Props = { initialTab?: "overview" | "groups" | "matches" | "players" };

export default function ArenaMundial({ initialTab = "overview" }: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [teamData, matchData, playerData] = await Promise.all([
        apiFetch("/api/teams").catch(() => ({ teams: [] })),
        apiFetch("/api/matches").catch(() => ({ matches: [] })),
        apiFetch("/api/players").catch(() => ({ players: [] })),
      ]);
      setTeams(unwrapList<Team>(teamData, "teams"));
      setMatches(unwrapList<Match>(matchData, "matches"));
      setPlayers(unwrapList<Player>(playerData, "players"));
    } catch (err: any) { setError(err?.message || "No se pudo cargar arena."); }
  }
  useEffect(() => { load(); }, []);

  return (
    <Shell active="arena" title="Centro interactivo WC26" subtitle="Resumen de equipos, partidos y jugadores conectados al backend.">
      {error && <div className="wc-alert error">{error}</div>}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        <div className="wc-card"><span className="wc-kicker">Equipos</span><h2>{teams.length}</h2></div>
        <div className="wc-card"><span className="wc-kicker">Partidos</span><h2>{matches.length}</h2></div>
        <div className="wc-card"><span className="wc-kicker">Jugadores</span><h2>{players.length}</h2></div>
      </section>
      <section className="wc-panel"><span className="wc-kicker">Próximos partidos</span><div style={{ display: "grid", gap: 12, marginTop: 14 }}>{matches.slice(0, 8).map((m) => <article key={m._id} className="wc-card" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", gap: 12, alignItems: "center" }}><div><FlagBadge team={m.homeTeam} /><strong>{m.homeTeam?.name}</strong></div><span>VS</span><div><FlagBadge team={m.awayTeam} /><strong>{m.awayTeam?.name}</strong></div><small style={{ gridColumn: "1/-1", color: "#9ca3af" }}>{formatDate(m.matchDate)}</small></article>)}</div></section>
      <section className="wc-panel"><span className="wc-kicker">Jugadores</span><div style={{ display: "grid", gap: 12, marginTop: 14 }}>{players.slice(0, 8).map((p) => <PlayerMiniCard key={p._id} player={p} />)}</div></section>
    </Shell>
  );
}
