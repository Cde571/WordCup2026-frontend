import { useEffect, useMemo, useState } from "react";

const WORLD_CUP_START = new Date("2026-06-11T15:00:00").getTime();

function getTimeLeft() {
  const now = Date.now();
  const diff = WORLD_CUP_START - now;

  if (diff <= 0) {
    return { total: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const totalDays = Math.floor(totalSeconds / (60 * 60 * 24));

  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;

  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { total: diff, months, days, hours, minutes, seconds };
}

export default function WorldCupCountdownRetroSilver() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  // id único para inyectar estilos sin colisionar si lo renderizas varias veces
  const styleId = useMemo(
    () => `wc-retro-silver-${Math.random().toString(36).slice(2)}`,
    []
  );

  if (time.total <= 0) {
    return (
      <div className="relative rounded-2xl border border-white/20 bg-black/55 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
        <span className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-white/10 via-white/25 to-white/10 blur-sm" />
        <span className="relative">¡EL MUNDIAL YA COMENZÓ!</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <style id={styleId}>{css}</style>

      <div className="wcSilverWrap">
        {/* halo exterior */}
        <div className="wcHalo" />

        {/* caja principal */}
        <div className="wcShell">
          {/* “cromo” borde */}
          <div className="wcChromeBorder" />

          {/* brillo superior */}
          <div className="wcTopShine" />

          <div className="wcInner">
            <div className="wcBadge" aria-hidden="true" />

            <div className="flex flex-col gap-1">
              <span className="wcLabel">EL MUNDIAL COMIENZA EN:</span>

              <div className="flex flex-wrap gap-2 text-center">
                <FlipBox label="MESES" value={time.months} />
                <FlipBox label="DÍAS" value={time.days} />
                <FlipBox label="HS" value={time.hours} />
                <FlipBox label="MIN" value={time.minutes} />
                <FlipBox label="SEG" value={time.seconds} />
              </div>
            </div>
          </div>

          {/* scanline */}
          <div className="wcScanline" />
        </div>
      </div>
    </div>
  );
}

function FlipBox({ label, value }: { label: string; value: number }) {
  const v = String(value).padStart(2, "0");

  return (
    <div className="wcTile" role="group" aria-label={`${label}: ${v}`}>
      <div className="wcTileChrome" />
      <div className="wcTileInner">
        <div className="wcDigits">
          {/* “placa” superior/inferior para look retro */}
          <div className="wcPlate wcPlateTop" />
          <div className="wcPlate wcPlateBottom" />

          {/* dígito con glow */}
          <span className="wcDigitText">{v}</span>

          {/* highlight */}
          <span className="wcDigitGloss" aria-hidden="true" />
        </div>

        <span className="wcMiniLabel">{label}</span>
      </div>
    </div>
  );
}

const css = `
/* ====== CONTENEDOR GENERAL ====== */
.wcSilverWrap{
  position: relative;
  display: inline-block;
  border-radius: 18px;
}

/* halo retroiluminado */
.wcHalo{
  position:absolute;
  inset:-10px;
  border-radius: 22px;
  background:
    radial-gradient(60% 80% at 30% 20%, rgba(255,255,255,.35), transparent 60%),
    radial-gradient(60% 80% at 70% 80%, rgba(190,210,255,.18), transparent 60%),
    linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.05));
  filter: blur(10px);
  opacity: .85;
  pointer-events:none;
  animation: wcPulse 2.8s ease-in-out infinite;
}

@keyframes wcPulse{
  0%,100%{ transform: scale(1); opacity:.75; }
  50%{ transform: scale(1.02); opacity:.95; }
}

/* caja principal: fondo oscuro tipo “panel” */
.wcShell{
  position: relative;
  border-radius: 18px;
  padding: 12px 14px;
  background:
    radial-gradient(120% 140% at 20% 10%, rgba(255,255,255,.08), transparent 45%),
    linear-gradient(180deg, rgba(15,18,25,.92), rgba(6,8,12,.92));
  box-shadow:
    0 18px 60px rgba(0,0,0,.55),
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 -1px 0 rgba(0,0,0,.55);
  overflow:hidden;
}

/* borde cromado plateado */
.wcChromeBorder{
  position:absolute;
  inset:0;
  border-radius:18px;
  padding:1px;
  background: linear-gradient(135deg,
    rgba(255,255,255,.65),
    rgba(255,255,255,.18) 30%,
    rgba(255,255,255,.55) 55%,
    rgba(255,255,255,.10) 80%,
    rgba(255,255,255,.45));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events:none;
  opacity:.9;
}

/* brillo superior */
.wcTopShine{
  position:absolute;
  left:-30%;
  top:-55%;
  width:160%;
  height:120%;
  background: radial-gradient(circle at 50% 60%, rgba(255,255,255,.18), transparent 65%);
  transform: rotate(-8deg);
  pointer-events:none;
}

/* scanline sutil */
.wcScanline{
  position:absolute;
  inset:0;
  background: repeating-linear-gradient(
    180deg,
    rgba(255,255,255,.03) 0px,
    rgba(255,255,255,.03) 1px,
    transparent 3px,
    transparent 6px
  );
  mix-blend-mode: overlay;
  opacity:.35;
  pointer-events:none;
}

.wcInner{
  position: relative;
  display:flex;
  align-items:center;
  gap:12px;
}

/* badge plateado retro */
.wcBadge{
  width:42px;
  height:42px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 35% 30%, rgba(255,255,255,.95), rgba(255,255,255,.10) 55%, rgba(0,0,0,.35) 100%),
    linear-gradient(135deg, rgba(255,255,255,.65), rgba(255,255,255,.12));
  box-shadow:
    0 12px 30px rgba(0,0,0,.45),
    inset 0 1px 0 rgba(255,255,255,.65),
    inset 0 -8px 20px rgba(0,0,0,.35);
  border: 1px solid rgba(255,255,255,.18);
}

/* label superior */
.wcLabel{
  font-size: 11px;
  letter-spacing: .12em;
  font-weight: 800;
  color: rgba(230,235,255,.92);
  text-transform: uppercase;
  text-shadow: 0 0 14px rgba(220,235,255,.35);
}

/* ====== TILES (cajas) ====== */
.wcTile{
  position: relative;
  width: 74px;
  border-radius: 14px;
}

.wcTileChrome{
  position:absolute;
  inset:0;
  border-radius:14px;
  background: linear-gradient(135deg,
    rgba(255,255,255,.55),
    rgba(255,255,255,.10) 35%,
    rgba(255,255,255,.45) 60%,
    rgba(255,255,255,.08));
  filter: blur(.2px);
  opacity:.7;
}

.wcTileInner{
  position: relative;
  border-radius: 14px;
  padding: 8px 8px 7px;
  background: linear-gradient(180deg, rgba(12,14,20,.92), rgba(5,6,10,.92));
  border: 1px solid rgba(255,255,255,.12);
  box-shadow:
    0 10px 26px rgba(0,0,0,.45),
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 -1px 0 rgba(0,0,0,.65);
}

.wcDigits{
  position: relative;
  height: 44px;
  border-radius: 12px;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  background:
    radial-gradient(120% 120% at 40% 20%, rgba(255,255,255,.10), transparent 55%),
    linear-gradient(180deg, rgba(20,24,34,.92), rgba(8,10,16,.92));
  border: 1px solid rgba(255,255,255,.10);
}

/* placas “flip clock” */
.wcPlate{
  position:absolute;
  left:0;
  right:0;
  height:50%;
  background: rgba(255,255,255,.03);
  pointer-events:none;
}
.wcPlateTop{
  top:0;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.wcPlateBottom{
  bottom:0;
  border-top: 1px solid rgba(0,0,0,.35);
}

/* texto dígito con retroiluminado plateado/azulado */
.wcDigitText{
  position: relative;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: .06em;
  color: rgba(245,248,255,.95);
  text-shadow:
    0 0 10px rgba(220,235,255,.45),
    0 0 22px rgba(190,210,255,.22);
}

/* gloss diagonal */
.wcDigitGloss{
  position:absolute;
  top:-30%;
  left:-40%;
  width: 160%;
  height: 120%;
  background: linear-gradient(110deg,
    transparent 0%,
    rgba(255,255,255,.20) 35%,
    rgba(255,255,255,.08) 50%,
    transparent 70%);
  transform: rotate(-10deg);
  opacity:.9;
  animation: wcGlint 3.6s ease-in-out infinite;
}

@keyframes wcGlint{
  0%{ transform: translateX(-12%) rotate(-10deg); opacity:.55;}
  50%{ transform: translateX(10%) rotate(-10deg); opacity:.95;}
  100%{ transform: translateX(-12%) rotate(-10deg); opacity:.55;}
}

.wcMiniLabel{
  display:block;
  margin-top: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .12em;
  color: rgba(210,220,245,.78);
  text-transform: uppercase;
}

/* responsivo */
@media (max-width: 480px){
  .wcTile{ width: 66px; }
  .wcDigitText{ font-size: 20px; }
}
`;
