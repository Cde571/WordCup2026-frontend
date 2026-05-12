import { useEffect, useState } from "react";

const WORLD_CUP_START = new Date("2026-06-11T15:00:00-05:00").getTime();

function getTimeLeft() {
  const diff = Math.max(0, WORLD_CUP_START - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export default function WorldCupCountdown() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const id = window.setInterval(() => setTime(getTimeLeft()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const items = [
    { label: "Días", value: time.days },
    { label: "Horas", value: time.hours },
    { label: "Min", value: time.minutes },
    { label: "Seg", value: time.seconds },
  ];

  return (
    <section className="relative -mt-16 px-4 pb-10 md:-mt-24">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-slate-950/75 p-4 shadow-2xl backdrop-blur-2xl md:p-6">
        <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-yellow-200">Cuenta regresiva oficial de la experiencia</p>
            <h2 className="mt-1 font-bebas text-3xl text-white md:text-4xl">El torneo empieza el 11 de junio de 2026</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">
              Predice grupos, arma eliminatorias y compite por puntos antes de que ruede el balón.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {items.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-4 text-center">
                <div className="font-bebas text-3xl text-yellow-200 md:text-4xl tabular-nums">{String(item.value).padStart(2, "0")}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
