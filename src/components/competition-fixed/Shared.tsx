import React from "react";
import { API_BASE } from "../../lib/api";

export type Team = {
  _id: string;
  name: string;
  code: string;
  group?: string | null;
  confederation?: string | null;
  groupPosition?: number | null;
};

export type Match = {
  _id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  matchDate?: string;
  stadium?: string | null;
  group?: string | null;
  status?: string | null;
};

export type Player = {
  _id: string;
  name: string;
  number?: number | null;
  position?: string | null;
  club?: string | null;
  age?: number | null;
  photo?: string | null;
  team?: Team | string;
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

export const GROUPS = "ABCDEFGHIJKL".split("");

export function flagUrl(code?: string | null) {
  const iso = ISO_BY_CODE[String(code || "").toUpperCase()];
  return iso ? `https://flagcdn.com/w80/${iso}.png` : "";
}

export function FlagBadge({ team, code }: { team?: Team | null; code?: string | null }) {
  const finalCode = team?.code || code || "";
  const src = flagUrl(finalCode);

  return (
    <div className="wc-flag">
      {src ? <img src={src} alt={finalCode} loading="lazy" /> : null}
      <small>{finalCode || "--"}</small>
    </div>
  );
}

export function formatDate(value?: string) {
  if (!value) return "Fecha pendiente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha pendiente";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function positionLabel(position?: string | null) {
  const value = String(position || "").toUpperCase();
  if (value === "GK") return "Portero";
  if (value === "DF") return "Defensa";
  if (value === "MF") return "Mediocampo";
  if (value === "FW") return "Delantero";
  return "Jugador";
}

export function Shell({
  active,
  title,
  subtitle,
  children,
}: {
  active: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const nav = [
    ["grupos", "/grupos", "Grupos"],
    ["bracket", "/bracket", "Bracket"],
    ["partidos", "/partidos", "Partidos"],
    ["oraculo", "/oraculo", "Oráculo"],
    ["equipos", "/equipos", "Equipos"],
    ["ranking", "/ranking", "Ranking"],
    ["perfil", "/perfil", "Perfil"],
    ["admin", "/admin", "Admin"],
  ];

  return (
    <main className="wc-page">
      <header className="wc-nav">
        <a href="/" className="wc-brand">
          <span>26</span>
          <div>
            <strong>WC26 Arena</strong>
            <small>Predictor Mundial</small>
          </div>
        </a>

        <nav>
          {nav.map(([key, href, label]) => (
            <a key={key} className={active === key ? "active" : ""} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <button onClick={() => (window.location.href = `${API_BASE}/auth/google`)}>
          Mi cuenta
        </button>
      </header>

      <section className="wc-hero">
        <span>Competencia de predicción</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>

      {children}

      <style>{`
        body {
          margin: 0;
          background:
            radial-gradient(circle at top left, rgba(255, 201, 40, .08), transparent 34%),
            radial-gradient(circle at top right, rgba(73, 130, 255, .1), transparent 28%),
            linear-gradient(180deg, #050816 0%, #070b18 48%, #050816 100%);
          color: #f8fafc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .wc-page {
          width: min(1480px, calc(100% - 32px));
          margin: 0 auto;
          padding: 16px 0 56px;
        }

        .wc-nav {
          min-height: 74px;
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          margin-bottom: 20px;
        }

        .wc-brand {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 7px 10px 7px 7px;
          border: 2px solid rgba(255,255,255,.85);
          border-radius: 4px;
          text-decoration: none;
          color: white;
          background: rgba(8, 13, 29, .75);
        }

        .wc-brand span {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          color: #fff477;
          border: 1px solid rgba(255, 244, 119, .55);
          background: #111827;
          font-size: 1.25rem;
          font-weight: 1000;
        }

        .wc-brand strong {
          display: block;
          font-size: 1.25rem;
          line-height: 1;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .wc-brand small {
          display: block;
          margin-top: 6px;
          color: #a7b0c5;
          font-size: .7rem;
          letter-spacing: .19em;
          text-transform: uppercase;
        }

        .wc-nav nav {
          justify-self: center;
          display: flex;
          gap: 6px;
          padding: 7px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 999px;
          background: rgba(255,255,255,.045);
          overflow-x: auto;
        }

        .wc-nav nav a {
          padding: 11px 14px;
          border-radius: 999px;
          color: rgba(248,250,252,.78);
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: .74rem;
          font-weight: 900;
        }

        .wc-nav nav a.active {
          color: #111827;
          background: linear-gradient(135deg, #ffc928, #ffb800);
        }

        .wc-nav button,
        .wc-btn {
          min-height: 42px;
          border: 0;
          cursor: pointer;
          padding: 0 18px;
          border-radius: 999px;
          color: #111827;
          background: linear-gradient(135deg, #ffc928, #ffb800);
          font-weight: 1000;
        }

        .wc-btn:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .wc-hero,
        .wc-panel,
        .wc-card,
        .wc-alert {
          border: 1px solid rgba(255,255,255,.12);
          background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025)), #0d1428;
          box-shadow: 0 18px 50px rgba(0,0,0,.26);
        }

        .wc-hero {
          margin-bottom: 18px;
          padding: 28px 30px;
          border-radius: 28px;
        }

        .wc-hero span,
        .wc-kicker {
          color: #ffc928;
          font-size: .74rem;
          letter-spacing: .16em;
          text-transform: uppercase;
          font-weight: 1000;
        }

        .wc-hero h1 {
          margin: 12px 0 0;
          font-size: clamp(2rem, 4.2vw, 4.55rem);
          line-height: .94;
          letter-spacing: -.055em;
        }

        .wc-hero p {
          max-width: 760px;
          margin: 16px 0 0;
          color: #9ca3af;
          line-height: 1.65;
        }

        .wc-panel {
          border-radius: 26px;
          padding: 18px;
          margin-bottom: 18px;
        }

        .wc-card {
          border-radius: 24px;
          padding: 16px;
        }

        .wc-alert {
          padding: 14px 16px;
          border-radius: 18px;
          margin-bottom: 18px;
          font-weight: 900;
        }

        .wc-alert.success { color: #d8ffe8; border-color: rgba(0,199,132,.32); }
        .wc-alert.error { color: #ffe1e1; border-color: rgba(239,68,68,.32); }

        .wc-flag {
          width: 66px;
          height: 56px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 18px;
          background: #ffc928;
          color: #111827;
          font-weight: 1000;
        }

        .wc-flag img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .wc-flag small {
          font-size: .68rem;
        }

        input, select {
          min-height: 44px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 16px;
          color: white;
          background: #10172a;
          padding: 0 12px;
          outline: none;
        }

        select option { color: #111827; }

        @media (max-width: 1050px) {
          .wc-nav { grid-template-columns: 1fr; }
          .wc-nav nav { justify-self: stretch; }
        }
      `}</style>
    </main>
  );
}

