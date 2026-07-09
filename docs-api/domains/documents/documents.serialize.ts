import type { Document } from "../../models/documents";
import { canEdit } from "./documents.access";
import type { AccessRole, DocumentOwner } from "./documents.access";

/** Full document payload including the caller's effective permissions. */
export function serializeDocument(
  doc: Document,
  meta: { role: AccessRole; owner: DocumentOwner },
) {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    ownerId: doc.ownerId,
    owner: meta.owner,
    role: meta.role,
    canEdit: canEdit(meta.role),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
