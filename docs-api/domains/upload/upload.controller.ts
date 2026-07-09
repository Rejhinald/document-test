import type { AppContext } from "../../middlewares/auth.middleware";
import { parseUploadToHtml, isSupportedFilename, MAX_UPLOAD_BYTES } from "./upload.service";
import { createDocument, getDocumentForUser } from "../documents/documents.service";
import { serializeDocument } from "../documents/documents.serialize";
import { created, fail } from "../../shared/response/response";
import { ERRORS, SUCCESS } from "../../shared/message/messages";

export async function importFile(c: AppContext) {
  const user = c.get("user");

  let form: Awaited<ReturnType<typeof c.req.parseBody>>;
  try {
    form = await c.req.parseBody();
  } catch {
    return fail(c, 400, ERRORS.NO_FILE);
  }

  const file = form["file"];
  if (!(file instanceof File)) return fail(c, 400, ERRORS.NO_FILE);
  if (file.size === 0) return fail(c, 400, ERRORS.EMPTY_FILE);
  if (file.size > MAX_UPLOAD_BYTES) return fail(c, 413, ERRORS.FILE_TOO_LARGE);
  if (!isSupportedFilename(file.name)) return fail(c, 415, ERRORS.UNSUPPORTED_FILE_TYPE);

  let parsed: { title: string; html: string };
  try {
    parsed = await parseUploadToHtml(file.name, await file.arrayBuffer());
  } catch {
    return fail(c, 422, ERRORS.UNSUPPORTED_FILE_TYPE);
  }

  const doc = await createDocument(user.id, { title: parsed.title, content: parsed.html });
  const access = await getDocumentForUser(doc.id, user.id);
  const payload = access
    ? serializeDocument(access.document, { role: access.role, owner: access.owner })
    : serializeDocument(doc, { role: "owner", owner: { id: user.id, name: user.email, email: user.email } });

  return created(c, payload, SUCCESS.DOCUMENT_IMPORTED);
}
