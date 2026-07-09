import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { documentShares } from "../../models/document-shares";
import { users } from "../../models/users";
import { findUserByEmail } from "../auth/auth.service";
import type { ShareRole } from "../../models/_enums/roles";
import type { DocumentShare } from "../../models/document-shares";

export type ShareRecipient = { userId: string; name: string; email: string; role: ShareRole; createdAt: Date };

/** Everyone a document is shared with (excludes the owner). */
export function listShares(documentId: string): Promise<ShareRecipient[]> {
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: documentShares.role,
      createdAt: documentShares.createdAt,
    })
    .from(documentShares)
    .innerJoin(users, eq(documentShares.userId, users.id))
    .where(eq(documentShares.documentId, documentId))
    .orderBy(users.name);
}

export type ShareResult =
  | { status: "ok"; share: DocumentShare; recipient: { id: string; name: string; email: string } }
  | { status: "email_not_found" }
  | { status: "self" };

/** Grants (or updates) access for the user identified by email. Owner-with-self is rejected upstream via ownerId. */
export async function shareDocument(
  documentId: string,
  ownerId: string,
  email: string,
  role: ShareRole,
): Promise<ShareResult> {
  const recipient = await findUserByEmail(email);
  if (!recipient) return { status: "email_not_found" };
  if (recipient.id === ownerId) return { status: "self" };

  const [share] = await db
    .insert(documentShares)
    .values({ documentId, userId: recipient.id, role })
    .onConflictDoUpdate({
      target: [documentShares.documentId, documentShares.userId],
      set: { role },
    })
    .returning();

  if (!share) throw new Error("Failed to upsert share");
  return {
    status: "ok",
    share,
    recipient: { id: recipient.id, name: recipient.name, email: recipient.email },
  };
}

export async function updateShareRole(
  documentId: string,
  userId: string,
  role: ShareRole,
): Promise<DocumentShare | null> {
  const [share] = await db
    .update(documentShares)
    .set({ role })
    .where(and(eq(documentShares.documentId, documentId), eq(documentShares.userId, userId)))
    .returning();
  return share ?? null;
}

export async function revokeShare(documentId: string, userId: string): Promise<boolean> {
  const rows = await db
    .delete(documentShares)
    .where(and(eq(documentShares.documentId, documentId), eq(documentShares.userId, userId)))
    .returning();
  return rows.length > 0;
}
