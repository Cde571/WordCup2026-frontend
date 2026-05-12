import type { APIRoute } from "astro";

export const prerender = false;

function backendBase() {
  return (
    import.meta.env.BACKEND_URL ||
    import.meta.env.PUBLIC_API_BASE_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
}

async function proxy({ request }: Parameters<APIRoute>[0]) {
  const target = `${backendBase()}/logout`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  const response = await fetch(target, {
    method: request.method,
    headers,
    redirect: "manual",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export const GET = proxy;
export const POST = proxy;
export const OPTIONS = proxy;
