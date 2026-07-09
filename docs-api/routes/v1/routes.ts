import { Hono } from "hono";
import type { AuthVariables } from "../../middlewares/auth.middleware";
import { authRouter } from "../../domains/auth/auth.route";
import { documentsRouter } from "../../domains/documents/documents.route";

/** v1 API router — all domain routers are mounted here. */
export const v1 = new Hono<{ Variables: AuthVariables }>();

v1.route("/auth", authRouter);
v1.route("/documents", documentsRouter);
