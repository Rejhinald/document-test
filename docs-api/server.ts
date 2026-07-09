import { Hono } from "hono";
import { logger } from "hono/logger";
import { ZodError } from "zod";
import { corsMiddleware } from "./config/cors";
import { ok, fail } from "./shared/response/response";
import { formatZodError } from "./shared/response/zod";
import { ERRORS } from "./shared/message/messages";
import type { AuthVariables } from "./middlewares/auth.middleware";
import { v1 } from "./routes/v1/routes";

export const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", logger());
app.use("*", corsMiddleware);

app.get("/", (c) => ok(c, { service: "docs-api", status: "ok" }, "docs-api is running"));
app.get("/health", (c) => ok(c, { status: "ok" }, "healthy"));

app.route("/api/v1", v1);

app.notFound((c) => fail(c, 404, ERRORS.NOT_FOUND));

app.onError((err, c) => {
  if (err instanceof ZodError) {
    return fail(c, 422, ERRORS.VALIDATION, formatZodError(err));
  }
  console.error("Unhandled error:", err);
  return fail(c, 500, ERRORS.INTERNAL);
});

export default app;
