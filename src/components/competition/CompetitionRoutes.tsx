import React, { useEffect, useMemo, useState } from "react";
import { apiFetch, unwrapList, positionLabel } from "../../lib/api";
import { getFlagUrlFromFifaCode } from "../../utils/flags";

type Team = { _id: string; name: string; code: string; group?: string | null; confederation?: string | null; groupPosition?: number | null; logo?: string | null };
type Match = { _id: string; homeTeam?: Team; awayTeam?: Team; matchDate?: string; stadium?: string | null; group?: string | null; status?: string | null; phase?: string | null; matchOrder?: number | null };
type Player = { _id: string; name: string; position?: string | null; number?: number | null; club?: string | null; age?: number | null; photo?: string | null; team?: Team | string };

type Msg = { type: "success" | "error" | "info"; text: string } | null;
const GROUPS = "ABCDEFGHIJKL".split("");
const STAGES = ["Round of 32", "Round of 16", "Quarter Finals", "Semi Finals", "Final"];

function Flag({ code, small=false }: { code?: string | null; small?: boolean }) {
  const url = getFlagUrlFromFifaCode(code);
  return <div className={`${small ? "h-9 w-12" : "h-12 w-16"} flex items-center justify-center overflow-hidden rounded-2xl bg-[#ffcb13] text-xs font-black text-slate-900`}>{url ? <img src={url} alt={code || "flag"} className="h-full w-full object-cover" onError={(e)=>((e.currentTarget as HTMLImageElement).style.display="none")} /> : (code || "--")}</div>;
}
function Panel({ children }: { children: React.ReactNode }) { return <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20">{children}</section>; }
function Message({ msg }: { msg: Msg }) { if (!msg) return null; return <div className={`mb-4 rounded-2xl border px-5 py-4 text-sm font-bold ${msg.type==="success"?"border-emerald-400/30 bg-emerald-500/10 text-emerald-100":msg.type==="error"?"border-red-400/30 bg-red-500/10 text-red-100":"border-cyan-400/30 bg-cyan-500/10 text-cyan-100"}`}>{msg.text}</div>; }
function formatDate(v?: string) { if (!v) return "Fecha pendiente"; const d = new Date(v); return isNaN(d.getTime()) ? "Fecha pendiente" : new Intl.DateTimeFormat("es-CO", { dateStyle:"medium", timeStyle:"short" }).format(d); }
function winner(home:number, away:number) { return home > away ? "HOME" : away > home ? "AWAY" : "DRAW"; }
function PlayerPhoto({ player }: { player: Player }) {
  const [photo, setPhoto] = useState(player.photo || "");
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  useEffect(() => {
    let alive = true;

    async function resolvePhoto() {
      if (player.photo) {
        setPhoto(player.photo);
        return;
      }

      if (!player._id) return;

      try {
        setLoadingPhoto(true);

        const data = await apiFetch<any>(`/api/players/photo?playerId=${player._id}`);

        if (!alive) return;

        const resolved = data?.photo || data?.url || "";
        if (resolved) {
          setPhoto(resolved);
        }
      } catch (error) {
        console.warn("No se pudo resolver foto del jugador:", player.name, error);
      } finally {
        if (alive) setLoadingPhoto(false);
      }
    }

    resolvePhoto();

    return () => {
      alive = false;
    };
  }, [player._id, player.photo]);

  if (photo) {
    return (
      <img
        className="wcx-player-photo"
        src={photo}
        alt={player.name}
        loading="lazy"
        onError={() => setPhoto("")}
      />
    );
  }

  return (
    <div className="wcx-player-photo fallback">
      {loadingPhoto ? "..." : initials(player.name)}
    </div>
  );
}

function buildSeeds(teams:Team[], groupPreds:any){ const ids:string[]=[]; const thirds:string[]=[]; for(const g of GROUPS){ const p=groupPreds?.[g]; if(p?.firstTeam?._id){ids.push(p.firstTeam._id); if(p.secondTeam?._id)ids.push(p.secondTeam._id); if(p.thirdTeam?._id)thirds.push(p.thirdTeam._id);} } ids.push(...thirds.slice(0,8)); if(ids.length<32){ const used=new Set(ids); const rest=teams.filter(t=>!used.has(t._id)).sort((a,b)=>String(a.group||"").localeCompare(String(b.group||"")) || Number(a.groupPosition||99)-Number(b.groupPosition||99)).map(t=>t._id); ids.push(...rest.slice(0,32-ids.length)); } return ids.slice(0,32); }
function pairs(list:(string|null)[]){ const r:Array<[string|null,string|null]>=[]; for(let i=0;i<list.length;i+=2)r.push([list[i]||null,list[i+1]||null]); return r; }
export function BracketCompetition(){ const [teams,setTeams]=useState<Team[]>([]); const [picks,setPicks]=useState<Record<string,Record<number,string>>>({}); const [locked,setLocked]=useState<Record<string,boolean>>({}); const [msg,setMsg]=useState<Msg>(null);
  useEffect(()=>{(async()=>{ const td=await apiFetch("/api/teams"); const tl=unwrapList<Team>(td,"teams"); setTeams(tl); let gp:any={}; try{gp=(await apiFetch<any>("/api/predictions/groups/my-predictions"))?.predictions||{};}catch{} try{ const ko=await apiFetch<any>("/api/predictions/knockout"); const p:Record<string,Record<number,string>>={}; const l:Record<string,boolean>={}; for(const x of ko?.predictions||[]){ if(!p[x.stage])p[x.stage]={}; p[x.stage][Number(x.matchOrder)]=x.predictedWinnerTeam?._id||x.predictedWinnerTeam; l[`${x.stage}#${x.matchOrder}`]=true;} setPicks(p); setLocked(l);}catch{} })().catch(e=>setMsg({type:"error",text:e.message}));},[]);
  const byId=useMemo(()=>new Map(teams.map(t=>[t._id,t])),[teams]); const seeds=useMemo(()=>buildSeeds(teams,{}),[teams]);
  const r32=pairs(seeds); const r16=pairs(Array.from({length:16},(_,i)=>picks["Round of 32"]?.[i+1]||null)); const qf=pairs(Array.from({length:8},(_,i)=>picks["Round of 16"]?.[i+1]||null)); const sf=pairs(Array.from({length:4},(_,i)=>picks["Quarter Finals"]?.[i+1]||null)); const fin=pairs(Array.from({length:2},(_,i)=>picks["Semi Finals"]?.[i+1]||null)); const rounds=[ ["Round of 32",r32], ["Round of 16",r16], ["Quarter Finals",qf], ["Semi Finals",sf], ["Final",fin] ] as const;
  function choose(stage:string,order:number,id:string|null){ if(!id || locked[`${stage}#${order}`]) return; setPicks({...picks,[stage]:{...(picks[stage]||{}),[order]:id}}); }
  async function save(){ try{ const newLocked={...locked}; for(const [stage,ps] of rounds){ for(let i=0;i<ps.length;i++){const order=i+1; const key=`${stage}#${order}`; const id=picks[stage]?.[order]; if(!id||newLocked[key])continue; await apiFetch("/api/predictions/knockout",{method:"POST",body:JSON.stringify({stage,matchOrder:order,homeTeam:ps[i][0],awayTeam:ps[i][1],predictedWinnerTeam:id})}); newLocked[key]=true; }} const champ=picks.Final?.[1]; if(champ){const finalPair=fin[0]||[]; const runner=finalPair.find(x=>x&&x!==champ)||null; try{await apiFetch("/api/predictions/tournament",{method:"POST",body:JSON.stringify({championTeam:champ,runnerUpTeam:runner})});}catch{}} setLocked(newLocked); setMsg({type:"success",text:"Bracket guardado y bloqueado."}); }catch(e:any){setMsg({type:"error",text:e.message});}}
  return <><Panel><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[.25em] text-[#ffcb13]">Bracket completo</p><h1 className="text-5xl font-black text-white">Camino al campeón</h1><p className="mt-2 text-slate-300">Elige ganadores. Cada cruce guardado queda bloqueado.</p></div><button onClick={save} className="rounded-full bg-[#ffcb13] px-6 py-3 font-black text-slate-900">Guardar bracket</button></div></Panel><Message msg={msg}/><div className="grid gap-4 overflow-x-auto xl:grid-cols-5">{rounds.map(([stage,ps])=><section key={stage} className="min-w-[270px] rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4"><h2 className="mb-4 text-2xl font-black text-[#ffcb13]">{stage}</h2><div className="space-y-4">{ps.map(([a,b],i)=>{const order=i+1; const key=`${stage}#${order}`; const lock=locked[key]; return <article key={key} className="rounded-2xl bg-slate-950/35 p-2">{[a,b].map(id=>{const t=id?byId.get(id):null; const sel=picks[stage]?.[order]===id; return <button key={id||Math.random()} disabled={!id||lock} onClick={()=>choose(stage,order,id)} className={`mb-2 grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-xl border p-2 text-left disabled:opacity-60 ${sel?"border-emerald-400/30 bg-emerald-500/20":"border-white/10 bg-white/[0.04]"}`}><Flag code={t?.code} small/><span className="truncate font-bold text-white">{t?.name||"Pendiente"}</span></button>})}{lock&&<p className="px-2 pb-1 text-xs font-bold text-emerald-300">Bloqueado</p>}</article>})}</div></section>)}</div></> }

export function TeamsCompetition(){ const [teams,setTeams]=useState<Team[]>([]); const [players,setPlayers]=useState<Player[]>([]); const [selected,setSelected]=useState<Team|null>(null); const [q,setQ]=useState(""); useEffect(()=>{(async()=>{const td=await apiFetch("/api/teams"); const tl=unwrapList<Team>(td,"teams"); setTeams(tl); if(tl[0]) openTeam(tl[0]);})()},[]); async function openTeam(t:Team){setSelected(t); const pd=await apiFetch(`/api/players?teamId=${t._id}`).catch(()=>({players:[]})); setPlayers(unwrapList<Player>(pd,"players"));} const filtered=teams.filter(t=>!q||t.name.toLowerCase().includes(q.toLowerCase())||t.code.toLowerCase().includes(q.toLowerCase())); return <><Panel><p className="text-[11px] font-black uppercase tracking-[.25em] text-[#ffcb13]">Equipos</p><h1 className="text-5xl font-black text-white">Selecciones y planteles</h1><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar equipo" className="mt-4 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"/></Panel><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(t=><article key={t._id} onClick={()=>openTeam(t)} className={`cursor-pointer rounded-[1.5rem] border p-4 ${selected?._id===t._id?"border-yellow-300/40 bg-yellow-300/10":"border-white/10 bg-white/[0.035]"}`}><Flag code={t.code}/><h3 className="mt-3 text-2xl font-black text-white">{t.name}</h3><p className="text-slate-400">Grupo {t.group} · {t.confederation}</p></article>)}</div><Panel><h2 className="mb-4 text-3xl font-black text-white">{selected?.name||"Plantel"}</h2><div className="space-y-3">{players.length?players.map(p=><article key={p._id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3"><PlayerPhoto player={p}/><div><strong className="text-white">#{p.number||"--"} {p.name}</strong><p className="text-sm text-slate-300">{positionLabel(p.position)} · {p.club||"Club sin dato"}</p><p className="text-xs text-slate-500">Edad: {p.age||"—"}</p></div></article>):<p className="text-slate-400">Sin jugadores cargados.</p>}</div></Panel></div></> }
export function RankingCompetition(){ const [rows,setRows]=useState<any[]>([]); const [mine,setMine]=useState<any>(null); useEffect(()=>{(async()=>{const d=await apiFetch<any>("/api/leaderboard?page=1&limit=100"); setRows(d?.leaderboard||[]); try{setMine(await apiFetch("/api/leaderboard/my-position"));}catch{}})()},[]); return <><Panel><p className="text-[11px] font-black uppercase tracking-[.25em] text-[#ffcb13]">Ranking</p><h1 className="text-5xl font-black text-white">Tabla de competencia</h1><p className="mt-2 text-slate-300">{mine?`Tu posición: #${mine.position} · ${mine.totalPoints} puntos`:"Inicia sesión para ver tu posición."}</p></Panel><Panel><table className="w-full border-collapse"><thead><tr className="text-left text-[#ffcb13]"><th className="p-3">#</th><th className="p-3">Usuario</th><th className="p-3">Puntos</th><th className="p-3">Exactos</th><th className="p-3">Aciertos</th></tr></thead><tbody>{rows.map(r=><tr key={`${r.position}-${r.username}`} className="border-t border-white/10 text-white"><td className="p-3">{r.position}</td><td className="p-3">{r.username||"Usuario"}</td><td className="p-3">{r.totalPoints||0}</td><td className="p-3">{r.correctScores||0}</td><td className="p-3">{r.correctMatches||0}</td></tr>)}</tbody></table></Panel></> }

