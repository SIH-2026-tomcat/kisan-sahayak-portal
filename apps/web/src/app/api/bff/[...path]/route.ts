import { proxyToApi } from "@/lib/bff";

export const dynamic = "force-dynamic";

async function handler(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxyToApi(request, path.join("/"));
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
