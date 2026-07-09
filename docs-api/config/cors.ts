import { cors } from "hono/cors";
import { env } from "./env";

/**
 * CORS is only exercised when the browser talks to the API cross-origin.
 * In the recommended setup docs-web proxies /api to docs-api (same-origin),
 * so this is a belt-and-suspenders allowance for the configured frontend.
 */
export const corsMiddleware = cors({
  origin: env.FRONTEND_ORIGIN,
  credentials: true,
  allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
});
