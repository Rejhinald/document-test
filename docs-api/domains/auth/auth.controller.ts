import type { AppContext } from "../../middlewares/auth.middleware";
import { loginSchema } from "./auth.schema";
import { authenticate, findUserById, publicUser } from "./auth.service";
import { signAccessToken } from "../../lib/jwt";
import { setAuthCookie, clearAuthCookie } from "../../lib/cookies";
import { ok, fail } from "../../shared/response/response";
import { formatZodError } from "../../shared/response/zod";
import { ERRORS, SUCCESS } from "../../shared/message/messages";

export async function login(c: AppContext) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, ERRORS.VALIDATION, formatZodError(parsed.error));

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return fail(c, 401, ERRORS.INVALID_CREDENTIALS);

  const token = await signAccessToken({ id: user.id, email: user.email });
  setAuthCookie(c, token);
  return ok(c, publicUser(user), SUCCESS.LOGGED_IN);
}

export async function logout(c: AppContext) {
  clearAuthCookie(c);
  return ok(c, null, SUCCESS.LOGGED_OUT);
}

export async function me(c: AppContext) {
  const authUser = c.get("user");
  const user = await findUserById(authUser.id);
  if (!user) return fail(c, 401, ERRORS.UNAUTHENTICATED);
  return ok(c, publicUser(user), SUCCESS.ME);
}
