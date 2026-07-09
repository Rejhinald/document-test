# Submission — Ajaia Docs

A lightweight collaborative document editor (a focused slice of Google Docs). Built for the Ajaia AI-Native Full Stack take-home, optimized for **depth in a few areas** (editing UX, sharing/access control, file import) over shallow breadth.

## Live product

| | URL |
|---|---|
| **Web app (test here)** | **https://document-test-gamma.vercel.app** |
| API | https://hearty-acceptance-production-24fc.up.railway.app |
| Source (GitHub) | https://github.com/Rejhinald/document-test |

**Deployment path:** web on **Vercel**, API + PostgreSQL on **Railway**. No paid dependencies or services required to review.

## Test accounts

Password for all: **`password123`**

| Email | Demo role |
|---|---|
| `alice@example.com` | Owner of 2 docs; shared "Welcome to Ajaia Docs" with Bob & Carol |
| `bob@example.com` | **Editor** on "Welcome to Ajaia Docs" |
| `carol@example.com` | **Viewer** on "Welcome to Ajaia Docs" |

### Review in ~2 minutes
1. Sign in as **Alice** (quick-switch buttons on the login page) → see **My Documents**.
2. Open a doc → edit with the toolbar (bold/italic/underline/headings/lists) → watch it **autosave**; reload to confirm it persisted.
3. Click **Share** → see Bob (editor) and Carol (viewer); add/change/revoke.
4. Open a second browser (or incognito), sign in as **Carol** → the shared doc is **read-only** (no toolbar/Save).
5. Back as Alice, **Import** a file (`samples/sample-notes.md`) → it becomes a new editable document.

---

## Requirements coverage

| Requirement | Status | Where / how |
|---|---|---|
| Create a document | ✅ | Sidebar "New document" / home tile |
| Rename a document | ✅ | Inline editable title in the editor (autosaves) |
| Edit content in browser | ✅ | TipTap rich-text editor |
| Save & reopen | ✅ | Debounced autosave + explicit Save + Cmd/Ctrl+S; persisted in Postgres |
| Bold / Italic / Underline | ✅ | Toolbar (+ strikethrough) |
| Headings / size variation | ✅ | H1 / H2 / H3 |
| Bulleted / numbered lists | ✅ | Both, + blockquote |
| File upload (product-relevant) | ✅ | Import `.txt` / `.md` / `.docx` → new editable document |
| Supported types stated in UI + README | ✅ | Shown on sidebar/home + README (`.txt/.md/.docx`, ≤ 5 MB) |
| Document owner | ✅ | `documents.ownerId` |
| Grant another user access | ✅ | Share by email as **Viewer** or **Editor** |
| Owned vs shared distinction | ✅ | Sidebar + home split "My Documents" / "Shared with me" (+ role badges) |
| Persistence (survives refresh) | ✅ | PostgreSQL (Railway) |
| Formatting preserved | ✅ | Content stored as sanitized HTML, round-trips losslessly |
| Shared access demonstrable | ✅ | Seeded Bob/Carol shares; enforced server-side |
| Clear setup/run instructions | ✅ | [README.md](README.md) (one-command `bun run setup`) |
| Working deployment | ✅ | Live on Vercel + Railway (above) |
| Validation + error handling | ✅ | Server-side Zod on every input; typed error envelope + UI feedback |
| ≥ 1 meaningful automated test | ✅ | Sharing access-control integration test (8 assertions) — `docs-api/tests/` |
| Architecture note | ✅ | [docs/architecture.md](docs/architecture.md) |
| AI workflow note | ✅ | [docs/ai-workflow.md](docs/ai-workflow.md) |
| SUBMISSION.md | ✅ | This file |
| Screenshots | ✅ | [docs/screenshots/](docs/screenshots/) |

---

## What is working

Everything in the core spec, verified **live in production** (not just locally):

- **Documents** — create, inline-rename, edit, autosave (debounced + manual + Cmd/Ctrl+S), reopen. Rich text: bold, italic, underline, strikethrough, H1–H3, bulleted & numbered lists, blockquote. Formatting round-trips losslessly on reload.
- **File import** — upload `.txt`, `.md`, or `.docx` (≤ 5 MB) and it becomes a new editable document. `.docx` via `mammoth`, `.md` via `marked`, `.txt` wrapped as paragraphs; all sanitized server-side. Supported types are shown in the UI and README.
- **Sharing & access control** — an owner shares by email as **Viewer** (read-only) or **Editor** (can edit); can change role or revoke. Enforced on **every** request server-side: viewers get 403 on edit, non-shared users get 404 (existence isn't leaked), only the owner can delete or manage shares. UI cleanly separates **My Documents** from **Shared with me** with role badges.
- **Auth & persistence** — real login (seeded accounts, argon2-hashed passwords, JWT in an httpOnly cookie); documents, shares, and formatting persist in PostgreSQL and survive refresh across accounts.
- **Engineering quality** — server-side Zod validation with typed error envelopes and UI feedback; loading/empty/skeleton states; a meaningful integration test (full access-control matrix + import, 8 passing); clean domain-driven backend and a componentized frontend; a shadcn-style sidebar; responsive layout.
- **Deployment** — two-cloud split (Vercel web + Railway API/DB) with a runtime same-origin `/api` proxy that keeps the auth cookie first-party across both clouds (no CORS, no cross-site-cookie issues). Verified: login, cookie round-trip, and document fetch all succeed through the live Vercel URL.

## What is incomplete

- **No core requirement is partial** — the entire required feature set is complete and working live.
- The only outstanding submission artifact is the **walkthrough video** (script/outline ready in [VIDEO.md](VIDEO.md); link to be added).

**Intentionally deprioritized** (deliberate scope cuts, rationale in [docs/architecture.md](docs/architecture.md)) — these are *not* attempts left half-built; they were consciously excluded to keep depth in the core:

- Real-time collaboration / presence
- Comments / suggestion mode
- Version history
- Export to PDF / Markdown
- Refresh-token rotation (a single long-lived access token instead)
- Blob attachments (import feeds the editor instead)

Minor known trade-offs: content is stored as sanitized **HTML** rather than a structured document model (great for import/export, weaker base for future OT/CRDT collab); the seed script **truncates** before seeding (so `bun test`, which reuses the dev DB, resets data — re-run `bun run seed` after).

## What I would build next (another 2–4 hours)

1. **Refresh tokens + silent refresh** for real session longevity.
2. **Version history** — snapshot on save; straightforward given HTML content storage.
3. **Export to Markdown / PDF** — cheap from stored HTML.
4. **Real-time collaboration** (larger) — migrate content to ProseMirror JSON + a Yjs CRDT for presence and concurrent editing.

---

## Deliverables manifest

| Item | Location |
|---|---|
| Source — API (Bun + Hono + Drizzle + Postgres) | [`docs-api/`](docs-api/) |
| Source — Web (Next.js + TipTap) | [`docs-web/`](docs-web/) |
| README + local setup | [`README.md`](README.md) |
| Architecture note | [`docs/architecture.md`](docs/architecture.md) |
| AI workflow note | [`docs/ai-workflow.md`](docs/ai-workflow.md) |
| Deployment guide | [`docs/DEPLOY.md`](docs/DEPLOY.md) |
| Automated test | [`docs-api/tests/sharing.integration.test.ts`](docs-api/tests/sharing.integration.test.ts) |
| Screenshots | [`docs/screenshots/`](docs/screenshots/) |
| Sample import files | [`samples/`](samples/) |
| Walkthrough video URL | [`VIDEO.md`](VIDEO.md) _(link pending)_ |
| This manifest | `SUBMISSION.md` |

## Run locally (monorepo)

**Prerequisites:** Bun ≥ 1.2, Docker (for Postgres).

```bash
bun install          # root tooling
bun run setup        # install both services, start Postgres, migrate, seed
bun run dev          # docs-api :8080 + docs-web :3000 together
```

Then open **http://localhost:3000** and sign in with a seeded account. Full details + manual steps in [README.md](README.md).

## Architecture in one paragraph

Two independent services mirroring the reference stack: a **Bun + Hono + Drizzle + PostgreSQL** API (domain-driven `route → controller → service → repository → schema`, Zod validation, a uniform response envelope, JWT-cookie auth) and a **Next.js 16 + React 19 + TanStack Query + Tailwind/CVA + TipTap** web app. The web app proxies `/api/*` to the API at runtime, so the browser only ever talks to one origin and the auth cookie is first-party — which is what makes a Vercel-frontend / Railway-backend split work cleanly with no CORS. Full write-up and trade-offs in [docs/architecture.md](docs/architecture.md).
