import React, { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api"; import { Shell } from "../wc26-fixed/Shared";

export default function RankingCompetition() {
  const [rows, setRows] = useState<any[]>([]);
  const [mine, setMine] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiFetch("/api/leaderboard?page=1&limit=100");
      setRows(data?.leaderboard || []);
      const position = await apiFetch("/api/leaderboard/my-position").catch(() => null);
      setMine(position);
    } catch (err: any) { setError(err?.message || "No se pudo cargar ranking."); }
  }
  useEffect(() => { load(); }, []);

  return (
    <Shell active="ranking" title="Ranking de predicción" subtitle="Tabla de posiciones con puntos, aciertos y marcadores exactos.">
      {error && <div className="wc-alert error">{error}</div>}
      {mine && <section className="wc-panel"><strong>Tu posición: #{mine.position}</strong><p style={{ color: "#9ca3af", margin: "4px 0 0" }}>{mine.totalPoints} puntos</p></section>}
      <section className="wc-panel">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th>#</th><th>Usuario</th><th>Puntos</th><th>Marcadores exactos</th><th>Aciertos</th></tr></thead>
          <tbody>{rows.map((user) => <tr key={`${user.position}-${user.username}`}><td>{user.position}</td><td>{user.username || "Usuario"}</td><td>{user.totalPoints || 0}</td><td>{user.correctScores || 0}</td><td>{user.correctMatches || 0}</td></tr>)}</tbody>
        </table>
      </section>
      <style>{`th,td{padding:14px;text-align:left;border-bottom:1px solid rgba(255,255,255,.09)}th{color:#ffc928;text-transform:uppercase;font-size:.74rem;letter-spacing:.11em}`}</style>
    </Shell>
  );
}
