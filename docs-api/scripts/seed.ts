import { sql } from "drizzle-orm";
import { db } from "../db";
import { users } from "../models/users";
import { documents } from "../models/documents";
import { documentShares } from "../models/document-shares";
import { hashPassword } from "../lib/password";
import { sanitizeDocumentHtml } from "../lib/sanitize";

const PASSWORD = "password123";

const SEED_USERS = [
  { email: "alice@example.com", name: "Alice Owner" },
  { email: "bob@example.com", name: "Bob Editor" },
  { email: "carol@example.com", name: "Carol Viewer" },
];

const WELCOME_HTML = `
  <h1>Welcome to Ajaia Docs</h1>
  <p>This is a <strong>collaborative document editor</strong>. You can format text with
  <em>italics</em>, <u>underline</u>, and lists:</p>
  <ul><li>Create and rename documents</li><li>Import .txt, .md, or .docx files</li><li>Share with teammates</li></ul>
  <p>Try editing this document — changes save automatically.</p>
`;

const ROADMAP_HTML = `
  <h2>Product Roadmap</h2>
  <h3>This quarter</h3>
  <ol><li>Ship the editor</li><li>Add sharing with roles</li><li>Import from files</li></ol>
  <blockquote>Depth over breadth.</blockquote>
`;

async function main() {
  console.log("Seeding database…");

  await db.execute(sql`TRUNCATE TABLE document_shares, documents, users RESTART IDENTITY CASCADE`);

  // All demo users share one password; argon2 salts are embedded per-hash so reuse is safe here.
  const passwordHash = await hashPassword(PASSWORD);
  const insertedUsers = await db
    .insert(users)
    .values(SEED_USERS.map((u) => ({ email: u.email.toLowerCase(), name: u.name, passwordHash })))
    .returning();

  const byEmail = new Map(insertedUsers.map((u) => [u.email, u]));
  const alice = byEmail.get("alice@example.com");
  const bob = byEmail.get("bob@example.com");
  const carol = byEmail.get("carol@example.com");
  if (!alice || !bob || !carol) throw new Error("Seed users missing after insert");

  const insertedDocs = await db
    .insert(documents)
    .values([
      { ownerId: alice.id, title: "Welcome to Ajaia Docs", content: sanitizeDocumentHtml(WELCOME_HTML) },
      { ownerId: alice.id, title: "Product Roadmap", content: sanitizeDocumentHtml(ROADMAP_HTML) },
    ])
    .returning();

  const welcome = insertedDocs[0];
  if (!welcome) throw new Error("Seed documents missing after insert");

  // Alice shares the welcome doc: Bob can edit, Carol can only view.
  await db.insert(documentShares).values([
    { documentId: welcome.id, userId: bob.id, role: "editor" },
    { documentId: welcome.id, userId: carol.id, role: "viewer" },
  ]);

  console.log("\n✅ Seed complete. Demo accounts (password for all: %s):", PASSWORD);
  console.log("   • alice@example.com  — owns 2 docs, shared 'Welcome' with Bob & Carol");
  console.log("   • bob@example.com    — editor on 'Welcome to Ajaia Docs'");
  console.log("   • carol@example.com  — viewer on 'Welcome to Ajaia Docs'\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
