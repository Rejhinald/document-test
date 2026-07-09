import {
  insertDocument,
  listOwnedDocuments,
  listSharedDocuments,
  updateDocumentById,
  deleteDocumentById,
} from "./documents.repository";
import { resolveAccess, canEdit, canManage } from "./documents.access";
import type { AccessResult } from "./documents.access";
import { sanitizeDocumentHtml } from "../../lib/sanitize";
import type { Document } from "../../models/documents";
import type { CreateDocumentInput, UpdateDocumentInput } from "./documents.schema";

const DEFAULT_TITLE = "Untitled document";

export type MutationResult =
  | { status: "ok"; document: Document }
  | { status: "not_found" }
  | { status: "forbidden" };

export async function createDocument(ownerId: string, input: CreateDocumentInput): Promise<Document> {
  return insertDocument({
    ownerId,
    title: input.title ?? DEFAULT_TITLE,
    content: input.content ? sanitizeDocumentHtml(input.content) : "",
  });
}

export async function listDocumentsForUser(userId: string) {
  const [owned, shared] = await Promise.all([
    listOwnedDocuments(userId),
    listSharedDocuments(userId),
  ]);
  return { owned, shared };
}

export function getDocumentForUser(documentId: string, userId: string): Promise<AccessResult | null> {
  return resolveAccess(documentId, userId);
}

export async function updateDocumentForUser(
  documentId: string,
  userId: string,
  input: UpdateDocumentInput,
): Promise<MutationResult> {
  const access = await resolveAccess(documentId, userId);
  if (!access) return { status: "not_found" };
  if (!canEdit(access.role)) return { status: "forbidden" };

  const patch: Partial<Pick<Document, "title" | "content">> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) patch.content = sanitizeDocumentHtml(input.content);

  const document = await updateDocumentById(documentId, patch);
  if (!document) return { status: "not_found" };
  return { status: "ok", document };
}

export async function deleteDocumentForUser(documentId: string, userId: string): Promise<MutationResult> {
  const access = await resolveAccess(documentId, userId);
  if (!access) return { status: "not_found" };
  if (!canManage(access.role)) return { status: "forbidden" };

  await deleteDocumentById(documentId);
  return { status: "ok", document: access.document };
}
