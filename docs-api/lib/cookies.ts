import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { env, isProd } from "../config/env";

export const ACCESS_TOKEN_COOKIE = "access_token";

/**
 * Sets the auth cookie as host-only (no Domain attribute) so it binds to whatever
 * host served it. When docs-web proxies /api to docs-api, this becomes a first-party
 * cookie on the web origin — SameSite=Lax works and no third-party-cookie issues arise.
 * In production we still send SameSite=None; Secure so direct cross-origin calls work too.
 */
export function setAuthCookie(c: Context, token: string) {
  setCookie(c, ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
    maxAge: env.JWT_ACCESS_TOKEN_TTL_SECONDS,
    domain: env.COOKIE_DOMAIN || undefined,
  });
}

export function clearAuthCookie(c: Context) {
  deleteCookie(c, ACCESS_TOKEN_COOKIE, {
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
  });
}
