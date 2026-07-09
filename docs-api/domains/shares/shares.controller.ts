import type { AppContext } from "../../middlewares/auth.middleware";
import { createShareSchema, updateShareSchema } from "./shares.schema";
import { listShares, shareDocument, updateShareRole, revokeShare } from "./shares.service";
import { resolveAccess, canManage } from "../documents/documents.access";
import { ok, created, fail } from "../../shared/response/response";
import { formatZodError } from "../../shared/response/zod";
import { ERRORS, SUCCESS } from "../../shared/message/messages";

/** Returns a failure Response if the user isn't the owner, otherwise null. */
async function ownerGuard(c: AppContext, documentId: string, userId: string): Promise<Response | null> {
  const access = await resolveAccess(documentId, userId);
  if (!access) return fail(c, 404, ERRORS.DOCUMENT_NOT_FOUND);
  if (!canManage(access.role)) return fail(c, 403, ERRORS.FORBIDDEN);
  return null;
}

export async function list(c: AppContext) {
  const user = c.get("user");
  const documentId = c.req.param("id")!;
  const guard = await ownerGuard(c, documentId, user.id);
  if (guard) return guard;

  const shares = await listShares(documentId);
  return ok(c, { shares }, SUCCESS.SHARES_LISTED);
}

export async function create(c: AppContext) {
  const user = c.get("user");
  const documentId = c.req.param("id")!;
  const guard = await ownerGuard(c, documentId, user.id);
  if (guard) return guard;

  const body = await c.req.json().catch(() => ({}));
  const parsed = createShareSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, ERRORS.VALIDATION, formatZodError(parsed.error));

  const result = await shareDocument(documentId, user.id, parsed.data.email, parsed.data.role);
  if (result.status === "email_not_found") return fail(c, 404, ERRORS.EMAIL_NOT_FOUND);
  if (result.status === "self") return fail(c, 400, ERRORS.CANNOT_SHARE_WITH_SELF);

  return created(
    c,
    {
      userId: result.recipient.id,
      name: result.recipient.name,
      email: result.recipient.email,
      role: result.share.role,
    },
    SUCCESS.SHARE_CREATED,
  );
}

export async function update(c: AppContext) {
  const user = c.get("user");
  const documentId = c.req.param("id")!;
  const granteeId = c.req.param("userId")!;
  const guard = await ownerGuard(c, documentId, user.id);
  if (guard) return guard;

  const body = await c.req.json().catch(() => ({}));
  const parsed = updateShareSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, ERRORS.VALIDATION, formatZodError(parsed.error));

  const updated = await updateShareRole(documentId, granteeId, parsed.data.role);
  if (!updated) return fail(c, 404, ERRORS.NOT_FOUND);
  return ok(c, { userId: granteeId, role: updated.role }, SUCCESS.SHARE_UPDATED);
}

export async function remove(c: AppContext) {
  const user = c.get("user");
  const documentId = c.req.param("id")!;
  const granteeId = c.req.param("userId")!;
  const guard = await ownerGuard(c, documentId, user.id);
  if (guard) return guard;

  const revoked = await revokeShare(documentId, granteeId);
  if (!revoked) return fail(c, 404, ERRORS.NOT_FOUND);
  return ok(c, { userId: granteeId }, SUCCESS.SHARE_REVOKED);
}
