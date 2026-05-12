import { API_BASE, apiFetch, unwrapList } from "./api";

export type Team = {
  _id: string;
  name: string;
  code: string;
  group?: string | null;
  logo?: string | null;
  confederation?: string | null;
};

export type Player = {
  _id: string;
  name: string;
  position?: "GK" | "DF" | "MF" | "FW" | "Unknown";
  number?: number | null;
  club?: string | null;
  age?: number | null;
  photo?: string | null;
  caps?: number | null;
  goals?: number | null;
  team?: Team;
};

export type Match = {
  _id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  matchDate: string;
  stadium?: string | null;
  group?: string | null;
  phase?: string | null;
  status?: string | null;
  matchOrder?: number | null;
};

export type AuthStatus = {
  loggedIn: boolean;
  user: any | null;
  isAdmin?: boolean;
};

export function loginWithGoogle() {
  window.location.href = `${API_BASE}/auth/google`;
}

export async function logoutUser() {
  return apiFetch("/logout", {
    method: "POST",
  });
}

export async function getAuthStatus(): Promise<AuthStatus> {
  return apiFetch<AuthStatus>("/auth/status");
}

export async function getProfile() {
  return apiFetch("/profile-data");
}

export async function getTeams(params?: { group?: string }) {
  const query = params?.group ? `?group=${encodeURIComponent(params.group)}` : "";
  const data = await apiFetch(`/api/teams${query}`);
  return unwrapList<Team>(data, "teams");
}

export async function getMatches(params?: { group?: string; phase?: string; status?: string }) {
  const search = new URLSearchParams();

  if (params?.group) search.set("group", params.group);
  if (params?.phase) search.set("phase", params.phase);
  if (params?.status) search.set("status", params.status);

  const query = search.toString() ? `?${search.toString()}` : "";
  const data = await apiFetch(`/api/matches${query}`);

  return unwrapList<Match>(data, "matches");
}

export async function getPlayers(params?: { teamId?: string; position?: string }) {
  const search = new URLSearchParams();

  if (params?.teamId) search.set("teamId", params.teamId);
  if (params?.position) search.set("position", params.position);

  const query = search.toString() ? `?${search.toString()}` : "";
  const data = await apiFetch(`/api/players${query}`);

  return unwrapList<Player>(data, "players");
}

export async function getStats() {
  return apiFetch("/api/stats");
}

export async function getPointsSystem() {
  return apiFetch("/api/points-system");
}

export async function getLeaderboard(page = 1, limit = 50) {
  return apiFetch(`/api/leaderboard?page=${page}&limit=${limit}`);
}

export async function getMyLeaderboardPosition() {
  return apiFetch("/api/leaderboard/my-position");
}

export async function getPredictionSummary() {
  return apiFetch("/api/predictions/summary");
}

export async function getMyMatchPredictions() {
  return apiFetch("/api/predictions/match");
}

export async function saveMatchPrediction(payload: {
  matchId: string;
  homeGoalsPred: number;
  awayGoalsPred: number;
  winnerPred: "HOME" | "AWAY" | "DRAW";
}) {
  return apiFetch("/api/predictions/match", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteMatchPrediction(matchId: string) {
  return apiFetch(`/api/predictions/match/${matchId}`, {
    method: "DELETE",
  });
}

export async function getMyGroupPredictions() {
  return apiFetch("/api/predictions/group");
}

export async function getMyFormattedGroupPredictions() {
  return apiFetch("/api/predictions/groups/my-predictions");
}

export async function saveGroupPrediction(payload: {
  group: string;
  firstPlaceTeam: string;
  secondPlaceTeam: string;
  thirdPlaceTeam?: string | null;
}) {
  return apiFetch("/api/predictions/group", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function saveGroupPredictionsBulk(predictions: Record<string, {
  first: string;
  second: string;
  third?: string | null;
}>) {
  return apiFetch("/api/predictions/groups/bulk", {
    method: "POST",
    body: JSON.stringify({ predictions }),
  });
}

export async function deleteGroupPrediction(group: string) {
  return apiFetch(`/api/predictions/group/${group}`, {
    method: "DELETE",
  });
}

export async function getTournamentPrediction() {
  return apiFetch("/api/predictions/tournament");
}

export async function saveTournamentPrediction(payload: {
  championTeam?: string | null;
  runnerUpTeam?: string | null;
  topScorerPlayer?: string | null;
  bestPlayer?: string | null;
  bestGoalkeeper?: string | null;
}) {
  return apiFetch("/api/predictions/tournament", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteTournamentPrediction() {
  return apiFetch("/api/predictions/tournament", {
    method: "DELETE",
  });
}

export async function getKnockoutPredictions() {
  return apiFetch("/api/predictions/knockout");
}

export async function saveKnockoutPrediction(payload: {
  stage: string;
  matchOrder: number;
  matchId?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  predictedWinnerTeam: string;
  predictedScoreHome?: number | null;
  predictedScoreAway?: number | null;
}) {
  return apiFetch("/api/predictions/knockout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetKnockoutPredictions() {
  return apiFetch("/api/predictions/knockout", {
    method: "DELETE",
  });
}

export async function getKnockoutResults() {
  return apiFetch("/api/predictions/knockout/results");
}

export function getWinnerPred(homeGoals: number, awayGoals: number): "HOME" | "AWAY" | "DRAW" {
  if (homeGoals > awayGoals) return "HOME";
  if (awayGoals > homeGoals) return "AWAY";
  return "DRAW";
}

export function requireLoginMessage(error: unknown) {
  const message = String((error as any)?.message || error || "");

  if (
    message.includes("No autorizado") ||
    message.includes("401") ||
    message.toLowerCase().includes("inicia sesión")
  ) {
    return "Debes iniciar sesión con Google para guardar tus predicciones.";
  }

  return message || "No se pudo completar la acción.";
}
