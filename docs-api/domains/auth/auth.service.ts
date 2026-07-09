import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../models/users";
import type { User } from "../../models/users";
import { verifyPassword } from "../../lib/password";

export async function findUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
  return user ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

/** Returns the user when the email exists and the password matches, otherwise null. */
export async function authenticate(email: string, password: string): Promise<User | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const matches = await verifyPassword(password, user.passwordHash);
  return matches ? user : null;
}

/** Public projection of a user — never leak the password hash. */
export function publicUser(user: User) {
  return { id: user.id, email: user.email, name: user.name };
}
