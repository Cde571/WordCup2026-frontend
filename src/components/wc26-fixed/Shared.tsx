import React, { useEffect, useState } from "react";
import { API_BASE, apiFetch, initials } from "../../lib/api";

export type Team = {
  _id: string;
  name: string;
  code: string;
  group?: string | null;
  confederation?: string | null;
  groupPosition?: number | null;
  logo?: string | null;
};

export type Player = {
  _id: string;
  name: string;
  number?: number | null;
  position?: string | null;
  club?: string | null;
  age?: number | null;
  photo?: string | null;
  caps?: number | null;
  goals?: number | null;
  team?: Team | string;
};

export type Match = {
  _id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  matchDate?: string;
  stadium?: string | null;
  group?: string | null;
  phase?: string | null;
  status?: string | null;
  matchOrder?: number | null;
};

export const GROUPS = "ABCDEFGHIJKL".split("");

export const OFFICIAL_GROUP_CODES: Record<string, string[]> = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"],
};

const ISO_BY_CODE: Record<string, string> = {
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  USA: "us", PAR: "py", AUS: "au", TUR: "tr",
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec",
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no",
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
};

export function flagUrl(code?: string | null) {
  const iso = ISO_BY_CODE[String(code || "").toUpperCase()];
  return iso ? `https://flagcdn.com/w80/${iso}.png` : "";
}

export function positionText(position?: string | null) {
  const value = String(position || "").toUpperCase();
  if (value === "GK") return "Portero";
  if (value === "DF") return "Defensa";
  if (value === "MF") return "Mediocampo";
  if (value === "FW") return "Delantero";
  return "Jugador";
}

export function formatDate(value?: string) {
  if (!value) return "Fecha pendiente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function generatedAvatar(player: Player) {
  const seed = encodeURIComponent(`${player.name || "player"}-${player._id || ""}`);
  return `https://api.dicebear.com/9.x/personas/svg?seed=${seed}&backgroundColor=172033,26324d,0f172a`;
}

export function teamShort(team?: Team | null) {
  return team?.code || "---";
}

export function FlagBadge({ team, code, small = false }: { team?: Team | null; code?: string | null; small?: boolean }) {
  const finalCode = team?.code || code || "";
  const src = flagUrl(finalCode);
  return (
    <div className={small ? "wc-flag wc-flag-sm" : "wc-flag"}>
      {src ? <img src={src} alt={finalCode} loading="lazy" /> : null}
      <small>{finalCode || "--"}</small>
    </div>
  );
}

export function TeamPill({ team, code }: { team?: Team | null; code?: string | null }) {
  return (
    <div className="wc-team-pill">
      <FlagBadge team={team} code={code} small />
      <span>{team?.name || code || "Pendiente"}</span>
    </div>
  );
}

export function PlayerPhoto({ player }: { player: Player }) {
  const [photo, setPhoto] = useState(player.photo || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    async function resolvePhoto() {
      if (player.photo) {
        setPhoto(player.photo);
        return;
      }
      if (!player._id) {
        setPhoto(generatedAvatar(player));
        return;
      }
      try {
        setLoading(true);
        const data = await apiFetch<any>(`/api/players/photo?playerId=${player._id}`);
        const resolved = data?.photo || data?.url || "";
        if (alive) setPhoto(resolved || generatedAvatar(player));
      } catch {
        if (alive) setPhoto(generatedAvatar(player));
      } finally {
        if (alive) setLoading(false);
      }
    }
    resolvePhoto();
    return () => {
      alive = false;
    };
  }, [player._id, player.photo, player.name]);

  if (loading && !photo) {
    return (
      <div className="wc-player-photo fallback">
        <span className="wc-spinner" />
      </div>
    );
  }

  return (
    <img
      className="wc-player-photo"
      src={photo || generatedAvatar(player)}
      alt={player.name}
      loading="lazy"
      onError={() => setPhoto(generatedAvatar(player))}
    />
  );
}

export function PlayerMiniCard({ player, onClick }: { player: Player; onClick?: () => void }) {
  return (
    <article className="wc-player-mini" onClick={onClick}>
      <PlayerPhoto player={player} />
      <div>
        <strong>#{player.number || "--"} {player.name}</strong>
        <span>{positionText(player.position)} · {player.club || "Club sin dato"}</span>
        <small>Edad: {player.age || "—"} · Goles: {player.goals ?? "—"}</small>
      </div>
    </article>
  );
}

export function CrystalBallOverlay({ title = "Consultando el oráculo", text = "La bola de cristal está guardando tu predicción." }: { title?: string; text?: string }) {
  return (
    <div className="wc-oracle-overlay">
      <div className="wc-oracle-modal">
        <div className="wc-oracle-shell">
          <div className="wc-oracle-ring ring-a" />
          <div className="wc-oracle-ring ring-b" />
          <div className="wc-oracle-core"><span>⚽</span></div>
        </div>
        <p className="wc-kicker">Oráculo del balón</p>
        <h2>{title}</h2>
        <span>{text}</span>
      </div>
    </div>
  );
}

export function Shell({ active, title, subtitle, children }: { active: string; title: string; subtitle: string; children: React.ReactNode }) {
  const nav = [
    ["grupos", "/grupos", "Grupos"],
    ["bracket", "/bracket", "Bracket"],
    ["partidos", "/partidos", "Partidos"],
    ["oraculo", "/oraculo", "Oráculo"],
    ["equipos", "/equipos", "Equipos"],
    ["ranking", "/ranking", "Ranking"],
    ["perfil", "/perfil", "Perfil"],
  ];

  return (
    <main className="wc-page">
      <header className="wc-nav">
        <a href="/" className="wc-brand">
          <span>26</span>
          <div><strong>WC26 Arena</strong><small>Predictor Mundial</small></div>
        </a>
        <nav>{nav.map(([key, href, label]) => <a key={key} className={active === key ? "active" : ""} href={href}>{label}</a>)}</nav>
        <button onClick={() => (window.location.href = `${API_BASE}/auth/google`)}>Mi cuenta</button>
      </header>
      <section className="wc-hero"><span>Competencia de predicción</span><h1>{title}</h1><p>{subtitle}</p></section>
      {children}
      <style>{styles}</style>
    </main>
  );
}

const styles = `
  body{margin:0;background:radial-gradient(circle at top left,rgba(255,201,40,.08),transparent 34%),radial-gradient(circle at top right,rgba(73,130,255,.1),transparent 28%),linear-gradient(180deg,#050816 0%,#070b18 48%,#050816 100%);color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wc-page{width:min(1480px,calc(100% - 32px));margin:0 auto;padding:16px 0 56px}.wc-nav{min-height:74px;display:grid;grid-template-columns:270px minmax(0,1fr) auto;gap:18px;align-items:center;margin-bottom:20px}.wc-brand{width:fit-content;display:flex;align-items:center;gap:12px;padding:7px 10px 7px 7px;border:2px solid rgba(255,255,255,.85);border-radius:4px;text-decoration:none;color:white;background:rgba(8,13,29,.75)}.wc-brand span{width:48px;height:48px;display:grid;place-items:center;border-radius:16px;color:#fff477;border:1px solid rgba(255,244,119,.55);background:#111827;font-size:1.25rem;font-weight:1000}.wc-brand strong{display:block;font-size:1.25rem;line-height:1;letter-spacing:.13em;text-transform:uppercase}.wc-brand small{display:block;margin-top:6px;color:#a7b0c5;font-size:.7rem;letter-spacing:.19em;text-transform:uppercase}.wc-nav nav{justify-self:center;display:flex;gap:6px;padding:7px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.045);overflow-x:auto}.wc-nav nav a{padding:11px 14px;border-radius:999px;color:rgba(248,250,252,.78);text-decoration:none;text-transform:uppercase;letter-spacing:.12em;font-size:.74rem;font-weight:900;white-space:nowrap}.wc-nav nav a.active{color:#111827;background:linear-gradient(135deg,#ffc928,#ffb800)}.wc-nav button,.wc-btn{min-height:42px;border:0;cursor:pointer;padding:0 18px;border-radius:999px;color:#111827;background:linear-gradient(135deg,#ffc928,#ffb800);font-weight:1000}.wc-btn.secondary{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.12)}.wc-btn:disabled{opacity:.55;cursor:not-allowed}.wc-hero,.wc-panel,.wc-card,.wc-alert{border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025)),#0d1428;box-shadow:0 18px 50px rgba(0,0,0,.26)}.wc-hero{margin-bottom:18px;padding:28px 30px;border-radius:28px}.wc-hero span,.wc-kicker{color:#ffc928;font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;font-weight:1000}.wc-hero h1{margin:12px 0 0;font-size:clamp(2rem,4.2vw,4.55rem);line-height:.94;letter-spacing:-.055em}.wc-hero p{max-width:820px;margin:16px 0 0;color:#9ca3af;line-height:1.65}.wc-panel{border-radius:26px;padding:18px;margin-bottom:18px}.wc-card{border-radius:24px;padding:16px}.wc-alert{padding:14px 16px;border-radius:18px;margin-bottom:18px;font-weight:900}.wc-alert.success{color:#d8ffe8;border-color:rgba(0,199,132,.32)}.wc-alert.error{color:#ffe1e1;border-color:rgba(239,68,68,.32)}.wc-grid{display:grid;gap:16px}.wc-flag{width:66px;height:56px;display:grid;place-items:center;overflow:hidden;border-radius:18px;background:#ffc928;color:#111827;font-weight:1000;position:relative;flex:0 0 auto}.wc-flag-sm{width:48px;height:38px;border-radius:14px}.wc-flag img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}.wc-flag small{position:relative;z-index:2;padding:2px 6px;border-radius:999px;background:rgba(5,8,22,.68);color:white;font-size:.68rem}.wc-team-pill{display:flex;align-items:center;gap:10px;min-width:0}.wc-team-pill span{font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wc-player-photo{width:62px;height:62px;border-radius:18px;object-fit:cover;background:#111827;border:1px solid rgba(255,255,255,.1)}.wc-player-photo.fallback{display:grid;place-items:center}.wc-player-mini{display:grid;grid-template-columns:62px minmax(0,1fr);gap:12px;align-items:center;padding:12px;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);cursor:pointer}.wc-player-mini strong,.wc-player-mini span,.wc-player-mini small{display:block}.wc-player-mini span{color:#cbd5e1;margin-top:3px}.wc-player-mini small{color:#9ca3af;margin-top:3px}.wc-spinner{width:22px;height:22px;border:2px solid rgba(255,201,40,.25);border-top-color:#ffc928;border-radius:999px;animation:wcSpin .8s linear infinite}@keyframes wcSpin{to{transform:rotate(360deg)}}input,select{min-height:44px;border:1px solid rgba(255,255,255,.12);border-radius:16px;color:white;background:#10172a;padding:0 12px;outline:none}select option{color:#111827}.wc-oracle-overlay{position:fixed;inset:0;z-index:100;display:grid;place-items:center;background:rgba(2,6,23,.78);backdrop-filter:blur(14px)}.wc-oracle-modal{width:min(440px,calc(100% - 32px));border-radius:32px;padding:34px;text-align:center;background:linear-gradient(180deg,rgba(14,22,45,.98),rgba(7,12,28,.98));border:1px solid rgba(255,201,40,.22);box-shadow:0 0 90px rgba(0,0,0,.45)}.wc-oracle-modal h2{margin:8px 0 8px;font-size:2.2rem}.wc-oracle-modal span{color:#cbd5e1}.wc-oracle-shell{position:relative;width:170px;height:170px;margin:0 auto 18px;display:grid;place-items:center}.wc-oracle-core{width:128px;height:128px;border-radius:999px;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,rgba(140,255,244,.95),rgba(41,120,255,.65) 42%,rgba(10,20,44,.95) 76%);box-shadow:0 0 35px rgba(89,240,255,.38),inset 0 0 30px rgba(255,255,255,.12);animation:wcPulse 2.4s ease-in-out infinite}.wc-oracle-core span{font-size:52px;animation:wcFloat 2s ease-in-out infinite}.wc-oracle-ring{position:absolute;border-radius:999px;border:1px solid rgba(255,208,66,.35)}.ring-a{width:160px;height:160px;animation:wcSpin 7s linear infinite}.ring-b{width:186px;height:110px;border-color:rgba(111,222,255,.45);animation:wcSpin 6.5s linear infinite reverse}@keyframes wcFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes wcPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}@media(max-width:1050px){.wc-nav{grid-template-columns:1fr}.wc-nav nav{justify-self:stretch}.wc-two{grid-template-columns:1fr!important}}
`;
