import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { documents } from "../../models/documents";
import { documentShares } from "../../models/document-shares";
import { users } from "../../models/users";
import type { Document } from "../../models/documents";
import type { ShareRole } from "../../models/_enums/roles";

/** owner has full control; editor can read+write; viewer can read only. */
export type AccessRole = "owner" | ShareRole;

export type DocumentOwner = { id: string; name: string; email: string };

export type AccessResult = {
  document: Document;
  owner: DocumentOwner;
  role: AccessRole;
};

/**
 * Resolves the requesting user's access to a document.
 * Returns null when the document doesn't exist OR the user has no access —
 * callers should surface both as 404 so document existence isn't leaked.
 */
export async function resolveAccess(documentId: string, userId: string): Promise<AccessResult | null> {
  const [row] = await db
    .select({
      document: documents,
      owner: { id: users.id, name: users.name, email: users.email },
    })
    .from(documents)
    .innerJoin(users, eq(documents.ownerId, users.id))
    .where(eq(documents.id, documentId));

  if (!row) return null;

  if (row.document.ownerId === userId) {
    return { document: row.document, owner: row.owner, role: "owner" };
  }

  const [share] = await db
    .select()
    .from(documentShares)
    .where(and(eq(documentShares.documentId, documentId), eq(documentShares.userId, userId)));

  if (!share) return null;
  return { document: row.document, owner: row.owner, role: share.role };
}

export function canEdit(role: AccessRole): boolean {
  return role === "owner" || role === "editor";
}

export function canManage(role: AccessRole): boolean {
  return role === "owner";
}
