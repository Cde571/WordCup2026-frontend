import React, { useEffect, useState } from "react";
import { apiFetch, unwrapList } from "../../lib/api"; import { FlagBadge, GROUPS, PlayerMiniCard, Shell } from "../wc26-fixed/Shared";
import type { Player, Team } from "../wc26-fixed/Shared";
export default function TeamsCompetition() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Team | null>(null);
  const [group, setGroup] = useState("ALL");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function loadPlayers(team: Team) {
    setSelected(team);
    setError("");
    const data = await apiFetch(`/api/players?teamId=${team._id}`).catch((err) => {
      setError(err?.message || "No se pudieron cargar jugadores.");
      return { players: [] };
    });
    setPlayers(unwrapList<Player>(data, "players"));
  }

  async function load() {
    try {
      const data = await apiFetch("/api/teams");
      const list = unwrapList<Team>(data, "teams");
      setTeams(list);
      if (list[0]) await loadPlayers(list[0]);
    } catch (err: any) { setError(err?.message || "No se pudieron cargar equipos."); }
  }

  useEffect(() => { load(); }, []);

  const filtered = teams.filter((team) => {
    const q = query.toLowerCase().trim();
    return (group === "ALL" || team.group === group) && (!q || team.name.toLowerCase().includes(q) || team.code.toLowerCase().includes(q));
  });

  return (
    <Shell active="equipos" title="Equipos y jugadores" subtitle="Explora selecciones con banderas y tarjetas de jugadores con foto real o avatar visual.">
      <section className="wc-panel" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar selección..." />
        <select value={group} onChange={(e) => setGroup(e.target.value)}><option value="ALL">Todos los grupos</option>{GROUPS.map((g) => <option key={g} value={g}>Grupo {g}</option>)}</select>
      </section>
      {error && <div className="wc-alert error">{error}</div>}
      <section className="wc-two" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 440px", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 16 }}>
          {filtered.map((team) => (
            <article key={team._id} className="wc-card" onClick={() => loadPlayers(team)} style={{ cursor: "pointer", borderColor: selected?._id === team._id ? "rgba(255,201,40,.55)" : undefined }}>
              <FlagBadge team={team} />
              <h3 style={{ marginBottom: 4 }}>{team.name}</h3>
              <p style={{ color: "#9ca3af", margin: 0 }}>Grupo {team.group || "-"} · {team.confederation || "Sin confederación"}</p>
            </article>
          ))}
        </div>
        <aside className="wc-panel">
          <span className="wc-kicker">Plantilla</span><h2>{selected?.name || "Selecciona equipo"}</h2>
          <div className="wc-grid" style={{ marginTop: 16 }}>
            {players.length ? players.map((player) => <PlayerMiniCard key={player._id} player={player} />) : <div className="wc-card" style={{ color: "#9ca3af" }}>No hay jugadores cargados.</div>}
          </div>
        </aside>
      </section>
    </Shell>
  );
}
