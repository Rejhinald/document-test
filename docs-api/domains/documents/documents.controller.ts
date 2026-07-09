import type { AppContext } from "../../middlewares/auth.middleware";
import { createDocumentSchema, updateDocumentSchema } from "./documents.schema";
import {
  createDocument,
  listDocumentsForUser,
  getDocumentForUser,
  updateDocumentForUser,
  deleteDocumentForUser,
} from "./documents.service";
import { serializeDocument } from "./documents.serialize";
import { ok, created, fail } from "../../shared/response/response";
import { formatZodError } from "../../shared/response/zod";
import { ERRORS, SUCCESS } from "../../shared/message/messages";

export async function list(c: AppContext) {
  const user = c.get("user");
  const documents = await listDocumentsForUser(user.id);
  return ok(c, documents, SUCCESS.DOCUMENTS_LISTED);
}

export async function create(c: AppContext) {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, ERRORS.VALIDATION, formatZodError(parsed.error));

  const doc = await createDocument(user.id, parsed.data);
  const access = await getDocumentForUser(doc.id, user.id);
  const payload = access
    ? serializeDocument(access.document, { role: access.role, owner: access.owner })
    : serializeDocument(doc, { role: "owner", owner: { id: user.id, name: user.email, email: user.email } });
  return created(c, payload, SUCCESS.DOCUMENT_CREATED);
}

export async function getOne(c: AppContext) {
  const user = c.get("user");
  const id = c.req.param("id")!;
  const access = await getDocumentForUser(id, user.id);
  if (!access) return fail(c, 404, ERRORS.DOCUMENT_NOT_FOUND);
  return ok(c, serializeDocument(access.document, { role: access.role, owner: access.owner }), SUCCESS.DOCUMENT_RETRIEVED);
}

export async function update(c: AppContext) {
  const user = c.get("user");
  const id = c.req.param("id")!;
  const body = await c.req.json().catch(() => ({}));
  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, ERRORS.VALIDATION, formatZodError(parsed.error));

  const result = await updateDocumentForUser(id, user.id, parsed.data);
  if (result.status === "not_found") return fail(c, 404, ERRORS.DOCUMENT_NOT_FOUND);
  if (result.status === "forbidden") return fail(c, 403, ERRORS.FORBIDDEN);

  // Re-resolve access so the response carries the caller's role + owner.
  const access = await getDocumentForUser(id, user.id);
  if (!access) return fail(c, 404, ERRORS.DOCUMENT_NOT_FOUND);
  return ok(c, serializeDocument(access.document, { role: access.role, owner: access.owner }), SUCCESS.DOCUMENT_UPDATED);
}

export async function remove(c: AppContext) {
  const user = c.get("user");
  const id = c.req.param("id")!;
  const result = await deleteDocumentForUser(id, user.id);
  if (result.status === "not_found") return fail(c, 404, ERRORS.DOCUMENT_NOT_FOUND);
  if (result.status === "forbidden") return fail(c, 403, ERRORS.FORBIDDEN);
  return ok(c, { id }, SUCCESS.DOCUMENT_DELETED);
}
