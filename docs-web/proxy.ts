import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed Middleware -> Proxy. This is an optimistic auth gate:
// it only checks for the presence of the access-token cookie and redirects to
// /login when it's missing. The API still verifies the token on every request.
const ACCESS_TOKEN_COOKIE = "access_token";

export function proxy(request: NextRequest) {
  const hasToken = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  if (!hasToken) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except the API proxy, Next internals, favicon, and /login.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
