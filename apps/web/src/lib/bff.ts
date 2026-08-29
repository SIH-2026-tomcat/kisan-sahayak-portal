import "server-only";
import { SignJWT } from "jose";
import { getSessionUser } from "./auth/server";

const API_URL = process.env.API_URL || process.env.PUBLIC_API_URL || "http://localhost:3001";
const internalSecret = new TextEncoder().encode(process.env.INTERNAL_JWT_SECRET || "dev-internal-secret");

export async function mintInternalToken(user: { id: string; email?: string; name?: string }) {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(internalSecret);
}

/** Proxy an incoming request to the Fastify API, attaching the caller's identity. */
export async function proxyToApi(request: Request, path: string): Promise<Response> {
  const user = await getSessionUser();
  const url = new URL(request.url);
  const target = `${API_URL}/${path}${url.search}`;

  const headers = new Headers();
  const ct = request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  if (user) headers.set("authorization", `Bearer ${await mintInternalToken(user)}`);

  const init: RequestInit = { method: request.method, headers };
  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const res = await fetch(target, init);
  const body = await res.arrayBuffer();
  const outHeaders = new Headers();
  const resCt = res.headers.get("content-type");
  if (resCt) outHeaders.set("content-type", resCt);
  return new Response(body, { status: res.status, headers: outHeaders });
}

/** Server-side data fetch for RSC (public + authed). Returns parsed JSON or throws. */
export async function apiFetch<T = any>(path: string, opts: { authed?: boolean; next?: RequestInit["next"] } = {}): Promise<T> {
  const headers = new Headers();
  if (opts.authed) {
    const user = await getSessionUser();
    if (user) headers.set("authorization", `Bearer ${await mintInternalToken(user)}`);
  }
  const res = await fetch(`${API_URL}/${path}`, { headers, next: opts.next ?? { revalidate: 0 } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `API ${res.status}` }));
    throw Object.assign(new Error(err.message || `API ${res.status}`), { status: res.status, body: err });
  }
  return res.json();
}
