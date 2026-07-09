import { describe, test, expect, beforeAll } from "bun:test";
import { sql } from "drizzle-orm";
import app from "../server";
import { db } from "../db";
import { users } from "../models/users";
import { documents } from "../models/documents";
import { documentShares } from "../models/document-shares";
import { hashPassword } from "../lib/password";

/**
 * Integration test for the sharing / access-control model — the core of the product.
 * Runs against the same Postgres the app uses (docker compose dev DB) and resets it
 * in beforeAll, so run `bun run seed` afterwards to restore demo data.
 */

const PASSWORD = "test-password";
const BASE = "/api/v1";

let docId: string;

/** Logs in and returns the `access_token=...` cookie pair for subsequent requests. */
async function login(email: string): Promise<string> {
  const res = await app.request(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  expect(res.status).toBe(200);
  const setCookie = res.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();
  return setCookie!.split(";")[0]!;
}

function authed(cookie: string, init: RequestInit = {}): RequestInit {
  return { ...init, headers: { ...(init.headers ?? {}), Cookie: cookie } };
}

function jsonBody(cookie: string, method: string, body: unknown): RequestInit {
  return authed(cookie, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  await db.execute(sql`TRUNCATE TABLE document_shares, documents, users RESTART IDENTITY CASCADE`);
  const passwordHash = await hashPassword(PASSWORD);

  const [owner, editor, viewer, stranger] = await db
    .insert(users)
    .values([
      { email: "owner@test.com", name: "Owner", passwordHash },
      { email: "editor@test.com", name: "Editor", passwordHash },
      { email: "viewer@test.com", name: "Viewer", passwordHash },
      { email: "stranger@test.com", name: "Stranger", passwordHash },
    ])
    .returning();

  const [doc] = await db
    .insert(documents)
    .values({ ownerId: owner!.id, title: "Shared Doc", content: "<p>hello</p>" })
    .returning();
  docId = doc!.id;

  await db.insert(documentShares).values([
    { documentId: docId, userId: editor!.id, role: "editor" },
    { documentId: docId, userId: viewer!.id, role: "viewer" },
  ]);
});

describe("document sharing access control", () => {
  test("owner can edit the document", async () => {
    const cookie = await login("owner@test.com");
    const res = await app.request(`${BASE}/documents/${docId}`, jsonBody(cookie, "PATCH", { content: "<p>owner edit</p>" }));
    expect(res.status).toBe(200);
  });

  test("editor can edit the document", async () => {
    const cookie = await login("editor@test.com");
    const res = await app.request(`${BASE}/documents/${docId}`, jsonBody(cookie, "PATCH", { content: "<p>editor edit</p>" }));
    expect(res.status).toBe(200);
  });

  test("viewer can read but cannot edit", async () => {
    const cookie = await login("viewer@test.com");
    const read = await app.request(`${BASE}/documents/${docId}`, authed(cookie));
    expect(read.status).toBe(200);

    const edit = await app.request(`${BASE}/documents/${docId}`, jsonBody(cookie, "PATCH", { content: "<p>nope</p>" }));
    expect(edit.status).toBe(403);
  });

  test("a stranger cannot see the document (404, existence not leaked)", async () => {
    const cookie = await login("stranger@test.com");
    const res = await app.request(`${BASE}/documents/${docId}`, authed(cookie));
    expect(res.status).toBe(404);
  });

  test("only the owner can manage shares (editor is forbidden)", async () => {
    const cookie = await login("editor@test.com");
    const res = await app.request(
      `${BASE}/documents/${docId}/shares`,
      jsonBody(cookie, "POST", { email: "stranger@test.com", role: "viewer" }),
    );
    expect(res.status).toBe(403);
  });

  test("unauthenticated requests are rejected with 401", async () => {
    const res = await app.request(`${BASE}/documents/${docId}`);
    expect(res.status).toBe(401);
  });

  test("owner can grant access, and the new viewer can then read", async () => {
    const ownerCookie = await login("owner@test.com");
    const share = await app.request(
      `${BASE}/documents/${docId}/shares`,
      jsonBody(ownerCookie, "POST", { email: "stranger@test.com", role: "viewer" }),
    );
    expect(share.status).toBe(201);

    const strangerCookie = await login("stranger@test.com");
    const read = await app.request(`${BASE}/documents/${docId}`, authed(strangerCookie));
    expect(read.status).toBe(200);
  });

  test("importing a .txt file creates a new editable document", async () => {
    const cookie = await login("owner@test.com");
    const form = new FormData();
    form.append("file", new File(["Hello world\n\nSecond paragraph"], "notes.txt", { type: "text/plain" }));
    const res = await app.request(`${BASE}/documents/import`, authed(cookie, { method: "POST", body: form }));
    expect(res.status).toBe(201);

    const json = (await res.json()) as { data: { title: string; content: string } };
    expect(json.data.title).toBe("notes");
    expect(json.data.content).toContain("<p>");
  });
});
