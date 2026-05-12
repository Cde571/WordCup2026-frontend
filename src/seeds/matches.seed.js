// ============================================
// SEED: Partidos iniciales (idempotente)
// ============================================

// Placeholders para playoffs (nombres estables)
const PLACEHOLDER_TEAMS = [
  { name: "UEFA playoff path 1 winner", code: "U1W", group: null, confederation: "UEFA" },
  { name: "UEFA playoff path 2 winner", code: "U2W", group: null, confederation: "UEFA" },
  { name: "UEFA playoff path 3 winner", code: "U3W", group: null, confederation: "UEFA" },
  { name: "FIFA playoff winner 1", code: "F1W", group: null, confederation: null },
  { name: "FIFA playoff winner 2", code: "F2W", group: null, confederation: null },
];

// Semilla de partidos (primera jornada). Ajusta horas si quieres.
const OFFICIAL_MATCHES_SEED = [
  { phase: "Group Stage", group: "A", status: "Scheduled", matchDate: "2026-06-11T15:00:00-05:00", stadium: "Mexico City", homeName: "Mexico", awayName: "South Africa" },
  { phase: "Group Stage", group: "A", status: "Scheduled", matchDate: "2026-06-11T20:00:00-05:00", stadium: "Zapopan", homeName: "South Korea", awayName: "UEFA playoff path 2 winner" },

  { phase: "Group Stage", group: "B", status: "Scheduled", matchDate: "2026-06-12T15:00:00-05:00", stadium: "Toronto", homeName: "Canada", awayName: "UEFA playoff path 1 winner" },
  { phase: "Group Stage", group: "D", status: "Scheduled", matchDate: "2026-06-12T18:00:00-07:00", stadium: "Inglewood, CA", homeName: "United States", awayName: "Paraguay" },

  { phase: "Group Stage", group: "B", status: "Scheduled", matchDate: "2026-06-13T12:00:00-07:00", stadium: "Santa Clara, CA", homeName: "Qatar", awayName: "Switzerland" },
  { phase: "Group Stage", group: "C", status: "Scheduled", matchDate: "2026-06-13T18:00:00-04:00", stadium: "East Rutherford, NJ", homeName: "Brazil", awayName: "Morocco" },
  { phase: "Group Stage", group: "C", status: "Scheduled", matchDate: "2026-06-13T21:00:00-04:00", stadium: "Foxborough, MA", homeName: "Haiti", awayName: "Scotland" },
  { phase: "Group Stage", group: "D", status: "Scheduled", matchDate: "2026-06-13T21:00:00-07:00", stadium: "Vancouver", homeName: "Australia", awayName: "UEFA playoff path 3 winner" },

  { phase: "Group Stage", group: "E", status: "Scheduled", matchDate: "2026-06-14T12:00:00-05:00", stadium: "Houston", homeName: "Germany", awayName: "Curaçao" },
  { phase: "Group Stage", group: "F", status: "Scheduled", matchDate: "2026-06-14T15:00:00-05:00", stadium: "Arlington, TX", homeName: "Netherlands", awayName: "Japan" },
  { phase: "Group Stage", group: "E", status: "Scheduled", matchDate: "2026-06-14T19:00:00-04:00", stadium: "Philadelphia", homeName: "Ivory Coast", awayName: "Ecuador" },
  { phase: "Group Stage", group: "F", status: "Scheduled", matchDate: "2026-06-14T20:00:00-05:00", stadium: "Guadalupe (Mexico)", homeName: "UEFA playoff path 2 winner", awayName: "Tunisia" },

  { phase: "Group Stage", group: "H", status: "Scheduled", matchDate: "2026-06-15T12:00:00-04:00", stadium: "Atlanta", homeName: "Spain", awayName: "Cape Verde" },
  { phase: "Group Stage", group: "G", status: "Scheduled", matchDate: "2026-06-15T15:00:00-07:00", stadium: "Seattle", homeName: "Belgium", awayName: "Egypt" },
  { phase: "Group Stage", group: "H", status: "Scheduled", matchDate: "2026-06-15T18:00:00-04:00", stadium: "Miami Gardens, FL", homeName: "Saudi Arabia", awayName: "Uruguay" },
  { phase: "Group Stage", group: "G", status: "Scheduled", matchDate: "2026-06-15T21:00:00-07:00", stadium: "Inglewood, CA", homeName: "Iran", awayName: "New Zealand" },

  { phase: "Group Stage", group: "I", status: "Scheduled", matchDate: "2026-06-16T15:00:00-04:00", stadium: "East Rutherford, NJ", homeName: "France", awayName: "Senegal" },
  { phase: "Group Stage", group: "I", status: "Scheduled", matchDate: "2026-06-16T18:00:00-04:00", stadium: "Foxborough, MA", homeName: "FIFA playoff winner 2", awayName: "Norway" },
  { phase: "Group Stage", group: "J", status: "Scheduled", matchDate: "2026-06-16T19:00:00-05:00", stadium: "Kansas City, MO", homeName: "Argentina", awayName: "Algeria" },
  { phase: "Group Stage", group: "J", status: "Scheduled", matchDate: "2026-06-16T21:00:00-07:00", stadium: "Santa Clara, CA", homeName: "Austria", awayName: "Jordan" },

  { phase: "Group Stage", group: "K", status: "Scheduled", matchDate: "2026-06-17T15:00:00-05:00", stadium: "Houston", homeName: "Portugal", awayName: "FIFA playoff winner 1" },
  { phase: "Group Stage", group: "L", status: "Scheduled", matchDate: "2026-06-17T18:00:00-05:00", stadium: "Arlington, TX", homeName: "England", awayName: "Croatia" },
  { phase: "Group Stage", group: "L", status: "Scheduled", matchDate: "2026-06-17T19:00:00-04:00", stadium: "Toronto", homeName: "Ghana", awayName: "Panama" },
  { phase: "Group Stage", group: "K", status: "Scheduled", matchDate: "2026-06-17T20:00:00-05:00", stadium: "Mexico City", homeName: "Uzbekistan", awayName: "Colombia" },
];

function makeMatchKey(m) {
  const dateKey = new Date(m.matchDate).toISOString().slice(0, 16); // yyyy-mm-ddThh:mm
  return `${m.phase}|${m.group || ""}|${m.homeName}|${m.awayName}|${dateKey}`;
}

async function ensureTeamByName(name) {
  // Intenta encontrar por name; si no existe, crea placeholders por code si coincide en PLACEHOLDER_TEAMS.
  const t = PLACEHOLDER_TEAMS.find(x => x.name === name);
  const payload = t
    ? { name: t.name, code: t.code, group: null, confederation: t.confederation ?? null, logo: null, fifaRanking: null }
    : { name, code: (name.slice(0, 3).toUpperCase()), group: null, confederation: null, logo: null, fifaRanking: null };

  // IMPORTANTE: si vas a crear por "code", asegúrate de que no choque.
  // Para equipos reales, ya deberían existir en tu seed de equipos.
  const existing = await Team.findOne({ name });
  if (existing) return existing;

  // Si es placeholder, upsert por code para evitar duplicados
  if (t) {
    return await Team.findOneAndUpdate(
      { code: payload.code },
      { $set: payload },
      { upsert: true, new: true, runValidators: true }
    );
  }

  // Si no es placeholder, asumimos que ya existe en DB (si no existe, lo creamos sin group)
  // Si te preocupa choque de codes, cambia esto para que NO cree equipo real automáticamente.
  try {
    return await Team.create(payload);
  } catch {
    // fallback: buscar por code si ya existe
    return await Team.findOne({ $or: [{ name }, { code: payload.code }] });
  }
}

async function seedInitialMatches() {
  try {
    // 1) Asegurar placeholders
    for (const t of PLACEHOLDER_TEAMS) {
      await Team.findOneAndUpdate(
        { code: t.code },
        { $set: { ...t, logo: null, fifaRanking: null } },
        { upsert: true, new: true, runValidators: true }
      );
    }

    // 2) Upsert de matches por matchKey
    let created = 0;
    for (const m of OFFICIAL_MATCHES_SEED) {
      const home = await Team.findOne({ name: m.homeName });
      const away = await Team.findOne({ name: m.awayName });

      // Si no existen (por ejemplo equipos reales faltantes), intentamos crear/asegurar.
      const homeTeam = home || (await ensureTeamByName(m.homeName));
      const awayTeam = away || (await ensureTeamByName(m.awayName));

      const matchKey = makeMatchKey(m);

      const upserted = await Match.findOneAndUpdate(
        { matchKey },
        {
          $setOnInsert: {
            matchKey,
            homeTeam: homeTeam._id,
            awayTeam: awayTeam._id,
            matchDate: new Date(m.matchDate),
            stadium: m.stadium || null,
            group: m.group || null,
            phase: m.phase || "Group Stage",
            status: m.status || "Scheduled",
          },
        },
        { upsert: true, new: true }
      );

      // Si fue insertado, cuenta. (no hay flag directo; comparamos createdAt/updatedAt es frágil)
      // Mejor: check previo por matchKey
      // Para simplificar: hacemos un find primero.
      // (Si quieres, lo optimizamos luego.)
      const exists = await Match.countDocuments({ matchKey });
      if (exists) created++;
    }

    console.log("✅ Seed partidos: OK (idempotente).");
  } catch (e) {
    console.error("❌ Error seedeando partidos:", e.message);
  }
}
