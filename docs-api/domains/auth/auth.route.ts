import { Hono } from "hono";
import type { AuthVariables } from "../../middlewares/auth.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import * as controller from "./auth.controller";

export const authRouter = new Hono<{ Variables: AuthVariables }>();

authRouter.post("/login", controller.login);
authRouter.post("/logout", controller.logout);
authRouter.get("/me", requireAuth, controller.me);
