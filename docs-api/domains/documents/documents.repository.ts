import { desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { documents } from "../../models/documents";
import { documentShares } from "../../models/document-shares";
import { users } from "../../models/users";
import type { Document, NewDocument } from "../../models/documents";

export async function insertDocument(values: NewDocument): Promise<Document> {
  const [doc] = await db.insert(documents).values(values).returning();
  if (!doc) throw new Error("Failed to insert document");
  return doc;
}

/** Documents owned by the user (summary projection for the dashboard). */
export function listOwnedDocuments(userId: string) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(eq(documents.ownerId, userId))
    .orderBy(desc(documents.updatedAt));
}

/** Documents shared with the user, including the grantee's role and the owner. */
export function listSharedDocuments(userId: string) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      role: documentShares.role,
      owner: { id: users.id, name: users.name, email: users.email },
    })
    .from(documentShares)
    .innerJoin(documents, eq(documentShares.documentId, documents.id))
    .innerJoin(users, eq(documents.ownerId, users.id))
    .where(eq(documentShares.userId, userId))
    .orderBy(desc(documents.updatedAt));
}

export async function updateDocumentById(
  id: string,
  patch: Partial<Pick<Document, "title" | "content">>,
): Promise<Document | null> {
  const [updated] = await db.update(documents).set(patch).where(eq(documents.id, id)).returning();
  return updated ?? null;
}

export async function deleteDocumentById(id: string): Promise<void> {
  await db.delete(documents).where(eq(documents.id, id));
}
