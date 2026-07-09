import type { NextRequest } from "next/server";

// Runtime reverse-proxy: forwards /api/* to docs-api and relays the response
// (including Set-Cookie) so the auth cookie is first-party on this origin.
// Reads API_PROXY_ORIGIN at request time — no build-time coupling to the API URL.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_ORIGIN = process.env.API_PROXY_ORIGIN ?? "http://localhost:8080";

// Hop-by-hop / encoding headers we must not blindly relay (fetch already decodes the body).
const STRIP_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = `${API_ORIGIN}/api/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");

  const init: RequestInit = { method: req.method, headers, redirect: "manual" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return Response.json(
      {
        success: false,
        message: "The API is unavailable. Please try again.",
        data: null,
        errors: [],
        pagination: null,
        metadata: { timestamp: new Date().toISOString() },
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (STRIP_RESPONSE_HEADERS.has(lower) || lower === "set-cookie") return;
    responseHeaders.set(key, value);
  });
  // Relay each Set-Cookie individually so multiple cookies survive.
  for (const cookie of upstream.headers.getSetCookie?.() ?? []) {
    responseHeaders.append("set-cookie", cookie);
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, { status: upstream.status, headers: responseHeaders });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
};
