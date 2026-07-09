import type { Context, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { verifyAccessToken } from "../lib/jwt";
import { ACCESS_TOKEN_COOKIE } from "../lib/cookies";
import { fail } from "../shared/response/response";
import { ERRORS } from "../shared/message/messages";

export type AuthUser = { id: string; email: string };

/** Hono context variables set by requireAuth. */
export type AuthVariables = { user: AuthUser };

/** Convenience alias for controllers/handlers that run behind requireAuth. */
export type AppContext = Context<{ Variables: AuthVariables }>;

/** Rejects the request with 401 unless a valid access-token cookie is present. */
export const requireAuth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const token = getCookie(c, ACCESS_TOKEN_COOKIE);
  if (!token) return fail(c, 401, ERRORS.UNAUTHENTICATED);

  try {
    const payload = await verifyAccessToken(token);
    c.set("user", { id: payload.sub, email: payload.email });
  } catch {
    return fail(c, 401, ERRORS.UNAUTHENTICATED);
  }

  await next();
};
