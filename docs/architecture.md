# Architecture Note

_Ajaia Docs — a collaborative document editor slice._

## What I prioritized and why

With a 4–6 hour box, I optimized for a **coherent vertical slice** that a reviewer can actually use, over breadth. Three areas got the depth:

1. **Editing experience** — a real rich-text editor (TipTap) with a formatting toolbar, autosave, and lossless round-tripping, because "the editing flow should feel usable" is the heart of the prompt.
2. **Sharing & access control** — an owner/viewer/editor model enforced on the server for every read and write, with a UI that clearly separates owned vs shared. This is where correctness matters most, so it's also where the automated test lives.
3. **File import** — turning `.txt` / `.md` / `.docx` into an editable document, chosen (over attachments) because it feeds directly back into the core editing loop.

Everything else was scoped to "correct and simple": one login flow, one persistence layer, one deploy target.

## System shape

Two independent services, mirroring the reference `avorino` architecture:

| Service | Stack | Responsibility |
|---|---|---|
| **docs-api** | Bun + Hono + Drizzle ORM + Zod + PostgreSQL | Auth, documents, sharing, import; source of truth |
| **docs-web** | Next.js 16 (App Router) + React 19 + TanStack Query + Tailwind 4/CVA + TipTap | UI + a thin same-origin API proxy |

```
Browser ──/api/*──► docs-web Route Handler (reverse proxy) ──► docs-api ──► Postgres
        ◄── HTML/JSON ──                    ◄── relays Set-Cookie ──
```

### The one non-obvious decision: a same-origin API proxy

The web app exposes `app/api/[...path]/route.ts`, a runtime reverse-proxy that forwards `/api/*` to `docs-api` and relays responses (including `Set-Cookie`). Consequences:

- The browser only ever talks to **one origin**, so the auth cookie is **first-party** — no `SameSite=None` third-party-cookie fragility, no CORS preflight dance.
- The API URL (`API_PROXY_ORIGIN`) is read at **request time**, not baked at build time. That decouples the frontend build from the backend URL, which matters a lot when deploying two services where each needs the other's URL. You can point the proxy at a new API without rebuilding.

This replaced an earlier `next.config` rewrite (which bakes the destination at build time) precisely to remove that deploy-time coupling.

## Data model

Three tables (Drizzle / Postgres), UUIDv7 primary keys:

- **users** — `id`, `email` (unique), `name`, `passwordHash` (argon2 via `Bun.password`), `createdAt`.
- **documents** — `id`, `ownerId → users`, `title`, `content` (sanitized **HTML** text), timestamps (`updatedAt` auto-bumped).
- **document_shares** — `id`, `documentId → documents`, `userId → users`, `role` (`viewer | editor`), unique on `(documentId, userId)`.

**Access resolution** (`documents.access.ts`) is the security core: given a document and a user, it returns `owner` / `editor` / `viewer` / _no access_. No access and non-existent both surface as **404**, so document existence isn't leaked. Edits require `owner|editor`; delete and share-management require `owner`.

### Why store HTML, not ProseMirror JSON?

TipTap round-trips HTML natively (`getHTML()` / `setContent(html)`), and both `mammoth` (docx) and `marked` (md) emit HTML. Storing HTML made **import trivial and robust** and avoided fragile server-side ProseMirror/DOM shimming. The tradeoff — HTML is less canonical than a structured document model and would be a weaker base for operational-transform collaboration — is acceptable because real-time collab is explicitly out of scope. Every write is passed through a **sanitizer** (`sanitize-html`) with an allowlist matching the editor's own feature set, so imported or edited content can't carry stored XSS.

## Request lifecycle (backend)

Each domain follows `route → controller → service → repository → schema`:

- **route** (Hono) — path + `requireAuth` middleware.
- **controller** — parse with Zod, map service results to HTTP + the shared response envelope.
- **service** — business logic and access checks.
- **repository** — Drizzle queries.

Every response is the avorino envelope: `{ success, message, data, errors[], pagination, metadata }`. A global `onError` turns unhandled `ZodError`s into `422` with field-level errors and everything else into a safe `500`.

## Auth

Login verifies an argon2 hash and issues a JWT (HS256) in an **httpOnly** cookie. `requireAuth` verifies it on every protected route. On the web side, `proxy.ts` (Next 16's renamed middleware) does an **optimistic** cookie-presence check to gate pages, and the API does the authoritative verification. I deliberately **skipped refresh-token rotation** — it's infrastructure a reviewer won't exercise in a short demo, and a single long-lived access token keeps the flow easy to reason about. The token lifetime is configurable.

## Validation & error handling

- **Server-side Zod** on every input; the frontend surfaces field-level errors from the envelope.
- Upload is validated for presence, size (≤ 5 MB), and extension before parsing; parse failures return `422`, unsupported types `415`.
- The frontend `apiFetch` throws a typed `ApiError` (status + field errors); a `401` mid-session drops the user back to login.

## Testing strategy

The highest-value test is the **sharing access-control integration test** (`bun test`), which drives the real Hono app via `app.request` against Postgres and asserts the full matrix (owner/editor edit, viewer 403, stranger 404, owner-only share management, 401 unauthenticated, and import). One test that exercises auth + sharing + persistence together is worth more here than many shallow unit tests. It was also my primary correctness harness while building.

## What I'd build next (with another 2–4 hours)

1. **Refresh tokens + silent refresh** for real session longevity.
2. **Version history** (snapshot on save) — the HTML-content model makes diffing straightforward.
3. **Real-time presence / collaboration** — would motivate migrating content to ProseMirror JSON + a CRDT (Yjs).
4. **Export to PDF / Markdown** — cheap given HTML storage.
5. **Attachments** via object storage (R2/S3) with presigned uploads.
