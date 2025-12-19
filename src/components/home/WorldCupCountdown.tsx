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

// Diseño 1: Glassmorphism Luxury
function Design1() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-900 to-blue-900 p-8">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative backdrop-blur-3xl bg-white/10 rounded-3xl p-12 shadow-2xl border border-white/20 max-w-4xl w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
        
        <div className="relative">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/50">
                <span className="text-4xl">⚽</span>
              </div>
            </div>
            <h1 className="text-5xl font-black text-white mb-2 tracking-tight">MUNDIAL 2026</h1>
            <p className="text-white/70 text-lg font-light tracking-widest">EL SUEÑO COMIENZA EN</p>
          </div>

          <div className="grid grid-cols-5 gap-6">
            {[
              { label: "MESES", value: time.months },
              { label: "DÍAS", value: time.days },
              { label: "HORAS", value: time.hours },
              { label: "MINUTOS", value: time.minutes },
              { label: "SEGUNDOS", value: time.seconds }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/30 shadow-xl flex items-center justify-center mb-3 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="text-5xl font-black text-white relative z-10">
                    {String(item.value).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-white/60 text-xs font-bold tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Diseño 2: Neomorphic Dark
function Design2() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-5xl w-full">
        <div className="bg-gray-900 rounded-3xl p-12 shadow-[20px_20px_60px_#0a0a0a,-20px_-20px_60px_#262626]">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-2xl opacity-50"></div>
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-5xl">🏆</span>
              </div>
            </div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
              FIFA WORLD CUP 2026
            </h1>
            <p className="text-gray-500 text-sm font-semibold tracking-[0.3em] uppercase">Cuenta Regresiva</p>
          </div>

          <div className="flex justify-center gap-8">
            {[
              { label: "Meses", value: time.months },
              { label: "Días", value: time.days },
              { label: "Horas", value: time.hours },
              { label: "Min", value: time.minutes },
              { label: "Seg", value: time.seconds }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-28 h-32 rounded-2xl bg-gray-900 shadow-[inset_8px_8px_16px_#0a0a0a,inset_-8px_-8px_16px_#262626] flex items-center justify-center mb-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="text-5xl font-black bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {String(item.value).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-gray-600 text-xs font-bold tracking-wider uppercase">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Diseño 3: Gradient Glow
function Design3() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-8 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative max-w-6xl w-full">
        <div className="text-center mb-20">
          <div className="inline-block mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-full blur-3xl opacity-60 animate-pulse"></div>
            <div className="relative">
              <span className="text-8xl">⚽</span>
            </div>
          </div>
          <h1 className="text-7xl font-black text-white mb-4 tracking-tighter">
            WORLD CUP <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">2026</span>
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-6"></div>
          <p className="text-gray-400 text-xl font-light tracking-[0.2em]">LA ESPERA TERMINA EN</p>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {[
            { label: "MESES", value: time.months, color: "from-purple-500 to-pink-500" },
            { label: "DÍAS", value: time.days, color: "from-cyan-500 to-blue-500" },
            { label: "HORAS", value: time.hours, color: "from-green-500 to-emerald-500" },
            { label: "MINUTOS", value: time.minutes, color: "from-orange-500 to-red-500" },
            { label: "SEGUNDOS", value: time.seconds, color: "from-pink-500 to-rose-500" }
          ].map((item, i) => (
            <div key={i} className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300`}></div>
              <div className="relative bg-black/80 backdrop-blur-xl rounded-3xl p-8 border border-white/10 group-hover:border-white/20 transition-colors duration-300">
                <div className="text-center">
                  <div className={`text-6xl font-black bg-gradient-to-br ${item.color} bg-clip-text text-transparent mb-4`}>
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-gray-400 text-xs font-bold tracking-widest uppercase">{item.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Diseño 4: Minimal Luxury
function Design4() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-black to-amber-50 p-8">
      <div className="max-w-5xl w-full">
        <div className="bg-white rounded-3xl p-16 shadow-2xl border border-amber-200/50">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-8">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 animate-pulse"></div>
              <span className="text-amber-800 text-sm font-semibold tracking-[0.3em] uppercase">En Vivo</span>
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 animate-pulse"></div>
            </div>
            <h1 className="text-7xl font-light text-gray-900 mb-2 tracking-tight">FIFA World Cup</h1>
            <p className="text-6xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">2026</p>
          </div>

          <div className="flex justify-center gap-12 mb-12">
            {[
              { label: "Meses", value: time.months },
              { label: "Días", value: time.days },
              { label: "Horas", value: time.hours },
              { label: "Minutos", value: time.minutes },
              { label: "Segundos", value: time.seconds }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="mb-3 relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative text-7xl font-light text-gray-900 tabular-nums">
                    {String(item.value).padStart(2, "0")}
                  </div>
                </div>
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mb-2"></div>
                <span className="text-amber-800 text-xs font-semibold tracking-widest uppercase">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
              <span>🏟️</span>
              <span>México • Estados Unidos • Canadá</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Selector de diseños
export default function PremiumCountdownDesigns() {
  const [design, setDesign] = useState(1);

  return (
    <div className="min-h-screen">
      {design === 1 && <Design1 />}
      {design === 2 && <Design2 />}
      {design === 3 && <Design3 />}
      {design === 4 && <Design4 />}
      
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-black/90 backdrop-blur-xl rounded-full px-6 py-3 flex gap-3 border border-white/20 shadow-2xl">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              onClick={() => setDesign(num)}
              className={`w-12 h-12 rounded-full font-bold transition-all duration-300 ${
                design === num
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-500/50 scale-110'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}