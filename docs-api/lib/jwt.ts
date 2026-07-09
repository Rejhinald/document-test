import { sign, verify } from "hono/jwt";
import { env } from "../config/env";

export type JwtPayload = {
  sub: string; // user id
  email: string;
  exp: number;
};

export async function signAccessToken(user: { id: string; email: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + env.JWT_ACCESS_TOKEN_TTL_SECONDS;
  return sign({ sub: user.id, email: user.email, exp }, env.JWT_SECRET, "HS256");
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const payload = await verify(token, env.JWT_SECRET, "HS256");
  return payload as unknown as JwtPayload;
}
