# Submission — Ajaia Docs

## What's included

| Item | Location |
|---|---|
| Source — API | [`docs-api/`](docs-api/) |
| Source — Web | [`docs-web/`](docs-web/) |
| README + local setup | [`README.md`](README.md) |
| Architecture note | [`docs/architecture.md`](docs/architecture.md) |
| AI workflow note | [`docs/ai-workflow.md`](docs/ai-workflow.md) |
| Deployment guide (Railway) | [`docs/DEPLOY.md`](docs/DEPLOY.md) |
| Automated test | [`docs-api/tests/sharing.integration.test.ts`](docs-api/tests/sharing.integration.test.ts) |
| Screenshots | [`docs/screenshots/`](docs/screenshots/) |
| Sample import files | [`samples/`](samples/) |
| This manifest | `SUBMISSION.md` |

**To be added after deployment / recording:**
- Live product URL — _paste here after following [docs/DEPLOY.md](docs/DEPLOY.md)_
- Walkthrough video URL — _see `VIDEO.md` (add the link there)_

## Test accounts (for reviewers)

Password for all: **`password123`**

| Email | Demo role |
|---|---|
| `alice@example.com` | Owner of 2 docs; shared "Welcome to Ajaia Docs" with Bob & Carol |
| `bob@example.com` | **Editor** on "Welcome to Ajaia Docs" |
| `carol@example.com` | **Viewer** on "Welcome to Ajaia Docs" |

Sign in as Alice to create/share; sign in as Bob (edit) or Carol (read-only) to see the other side of sharing.

## What's working (end-to-end, verified in a browser)

- ✅ Create, rename (inline title), edit, **autosave**, reopen documents
- ✅ Rich text: bold, italic, underline, strikethrough, H1–H3, bulleted & numbered lists, blockquote
- ✅ Import `.txt` / `.md` / `.docx` → new editable document (types stated in UI + enforced server-side, ≤ 5 MB)
- ✅ Sharing by email with **Viewer / Editor** roles; change role; revoke
- ✅ Owned vs **Shared with me** clearly separated (sidebar + home)
- ✅ Access control enforced server-side: viewer read-only (403 on edit), non-shared user 404, owner-only delete & share management, 401 unauthenticated
- ✅ Real auth (seeded accounts, JWT httpOnly cookie); persistence in Postgres
- ✅ Validation + typed error handling; loading/empty states; responsive sidebar
- ✅ 1 meaningful automated test (full access-control matrix + import) — `bun test`, 8 passing
- ✅ Production build validated (Next standalone + Dockerfiles for both services)

## What's incomplete / intentionally deprioritized

None of the **core** requirements are partial. The following were consciously left out (rationale in [docs/architecture.md](docs/architecture.md)):

- ❌ Real-time collaboration / presence
- ❌ Comments / suggestion mode
- ❌ Version history
- ❌ Export to PDF / Markdown
- ❌ Refresh-token rotation (single long-lived access token instead)
- ❌ Blob attachments (import feeds the editor instead)

The **live URL** and **video link** are pending the deploy/recording steps and are the only outstanding items.

## What I'd do next (another 2–4 hours)

1. Refresh tokens + silent refresh for real session longevity.
2. Version history (snapshot on save) — cheap given HTML content storage.
3. Export to Markdown/PDF.
4. Then, as a larger effort: real-time collab (migrate content to ProseMirror JSON + Yjs CRDT).

## Run locally in 6 commands

```bash
# API + DB
cd docs-api && cp .env.example .env && docker compose -f docker-compose.dev.yml up -d && bun install && bun run db:migrate && bun run seed && bun run dev
# Web (new terminal)
cd docs-web && cp .env.example .env.local && bun install && bun run dev   # http://localhost:3000
```
