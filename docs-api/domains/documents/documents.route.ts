import { Hono } from "hono";
import type { AuthVariables } from "../../middlewares/auth.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import * as documents from "./documents.controller";
import * as shares from "../shares/shares.controller";
import * as upload from "../upload/upload.controller";

export const documentsRouter = new Hono<{ Variables: AuthVariables }>();

// Every document route requires authentication.
documentsRouter.use("*", requireAuth);

// Static route registered before the "/:id" collection routes.
documentsRouter.post("/import", upload.importFile);

// Collection.
documentsRouter.get("/", documents.list);
documentsRouter.post("/", documents.create);

// Sharing (owner-only; enforced in the controller).
documentsRouter.get("/:id/shares", shares.list);
documentsRouter.post("/:id/shares", shares.create);
documentsRouter.patch("/:id/shares/:userId", shares.update);
documentsRouter.delete("/:id/shares/:userId", shares.remove);

// Single document.
documentsRouter.get("/:id", documents.getOne);
documentsRouter.patch("/:id", documents.update);
documentsRouter.delete("/:id", documents.remove);
