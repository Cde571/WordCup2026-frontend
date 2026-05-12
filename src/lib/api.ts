export const API_BASE =
  (
    import.meta.env.PUBLIC_API_BASE_URL ||
    import.meta.env.PUBLIC_BACKEND_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");

export function apiUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), {
    credentials: "include",
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    const body = isJson
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    const message =
      body?.message ||
      body?.error ||
      body ||
      `Error HTTP ${response.status}`;

    throw new Error(String(message));
  }

  if (!isJson) return undefined as T;

  return response.json() as Promise<T>;
}

export function unwrapList<T = any>(data: any, key: string): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

export function initials(name?: string | null) {
  return (
    String(name || "WC")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "WC"
  );
}

export function safeText(value: unknown, fallback = "Sin dato") {
  const text = String(value ?? "").trim();
  return text.length ? text : fallback;
}

export function positionLabel(position?: string | null) {
  const value = String(position || "").toUpperCase();

  if (value === "GK") return "Portero";
  if (value === "DF") return "Defensa";
  if (value === "MF") return "Mediocampo";
  if (value === "FW") return "Delantero";
  if (value === "POR") return "Portero";
  if (value === "DEF") return "Defensa";
  if (value === "MED") return "Mediocampo";
  if (value === "DEL") return "Delantero";

  return "Jugador";
}
