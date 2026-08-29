import { getSessionUser } from "@/lib/auth/server";
import { mintInternalToken } from "@/lib/bff";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || process.env.PUBLIC_API_URL || "http://localhost:3001";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const upstream = await fetch(`${API_URL}/events`, {
    headers: { authorization: `Bearer ${await mintInternalToken(user)}` },
    signal: request.signal,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
