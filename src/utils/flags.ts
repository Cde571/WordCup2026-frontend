// src/utils/flags.ts

// Mapa de códigos FIFA (3 letras) -> ISO2 que usa Flagpedia
const fifaToIso2: Record<string, string> = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BRA: "br",
  CMR: "cm",
  CAN: "ca",
  CPV: "cv",
  COL: "co",
  CRO: "hr",
  CUW: "cw",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  FRA: "fr",
  GER: "de",
  HAI: "ht",
  IRN: "ir",
  CIV: "ci",
  JPN: "jp",
  JOR: "jo",
  MLI: "ml",
  MEX: "mx",
  MAR: "ma",
  NED: "nl",
  NZL: "nz",
  NGA: "ng",
  NOR: "no",
  PAN: "pa",
  PAR: "py",
  POR: "pt",
  QAT: "qa",
  KSA: "sa",
  SCO: "gb-sct",
  SEN: "sn",
  KOR: "kr",
  ESP: "es",
  SUI: "ch",
  USA: "us",
  URU: "uy",
  UZB: "uz",
};

export function getFlagUrlFromFifaCode(fifaCode: string | undefined | null) {
  if (!fifaCode) return null;

  const iso2 = fifaToIso2[fifaCode.toUpperCase()];
  if (!iso2) return null;

  // Tamaños disponibles en flagpedia: w20, w40, w80, w160, w320, w640…
  return `https://flagpedia.net/data/flags/w40/${iso2}.png`;
}
