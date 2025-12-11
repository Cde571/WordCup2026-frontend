import { useEffect, useState } from "react";

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

export default function WorldCupCountdown() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (time.total <= 0) {
    return (
      <div className="rounded-2xl bg-white/90 px-6 py-3 text-sm font-semibold text-slate-800 shadow">
        ¡EL MUNDIAL YA COMENZÓ!
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/95 px-6 py-3 shadow">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500" />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-600">
          EL MUNDIAL COMIENZA EN:
        </span>
        <div className="flex gap-2 text-center">
          <Box label="MESES" value={time.months} />
          <Box label="DÍAS" value={time.days} />
          <Box label="HS" value={time.hours} />
          <Box label="SEG." value={time.seconds} />
        </div>
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center w-16 rounded-xl bg-slate-50 border border-slate-200 px-2 py-1">
      <span className="text-xl font-bold text-slate-800">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-semibold text-slate-500">
        {label}
      </span>
    </div>
  );
}
