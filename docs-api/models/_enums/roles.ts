import { pgEnum } from "drizzle-orm/pg-core";

/** Access level a document can be shared at. Owners always have full control. */
export const shareRoleEnum = pgEnum("share_role", ["viewer", "editor"]);

export type ShareRole = (typeof shareRoleEnum.enumValues)[number];
