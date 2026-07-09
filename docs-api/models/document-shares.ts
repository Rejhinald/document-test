import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { users } from "./users";
import { documents } from "./documents";
import { shareRoleEnum } from "./_enums/roles";

export const documentShares = pgTable(
  "document_shares",
  {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: shareRoleEnum("role").notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("document_shares_document_user_unique").on(table.documentId, table.userId)],
);

export const documentSharesRelations = relations(documentShares, ({ one }) => ({
  document: one(documents, {
    fields: [documentShares.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [documentShares.userId],
    references: [users.id],
  }),
}));

export type DocumentShare = typeof documentShares.$inferSelect;
export type NewDocumentShare = typeof documentShares.$inferInsert;
