# docs-api

The backend for Ajaia Docs — **Bun + Hono + Drizzle ORM + PostgreSQL**, with Zod validation and a shared response envelope. Domain-driven (`route → controller → service → repository → schema`).

## Setup

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d   # Postgres on localhost:5433
bun install
bun run db:migrate                               # apply migrations
bun run seed                                     # demo users + docs
bun run dev                                      # http://localhost:8080
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Watch-mode server |
| `bun run start` | Run server |
| `bun run db:generate` | Generate a migration from schema changes |
| `bun run db:migrate` | Apply migrations |
| `bun run db:studio` | Drizzle Studio |
| `bun run seed` | Seed demo data (**truncates** first) |
| `bun test` | Integration tests (needs the dev DB up; resets data — re-seed after) |
| `bun run typecheck` | `tsc --noEmit` |

## Environment

See [`.env.example`](.env.example). Key vars: `DATABASE_URL`, `JWT_SECRET` (≥ 16 chars), `JWT_ACCESS_TOKEN_TTL_SECONDS`, `ENVIRONMENT`, `PORT` (auto-set by Railway).

## API

All responses use the envelope `{ success, message, data, errors[], pagination, metadata }`. Base path `/api/v1`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/auth/login` | — | Sets `access_token` httpOnly cookie |
| `POST` | `/auth/logout` | — | Clears cookie |
| `GET` | `/auth/me` | ✓ | Current user |
| `GET` | `/documents` | ✓ | `{ owned[], shared[] }` |
| `POST` | `/documents` | ✓ | Create |
| `POST` | `/documents/import` | ✓ | multipart `file`: `.txt/.md/.docx` → new doc |
| `GET` | `/documents/:id` | ✓ | Owner/editor/viewer; else 404 |
| `PATCH` | `/documents/:id` | ✓ | Title/content; owner or editor |
| `DELETE` | `/documents/:id` | ✓ | Owner only |
| `GET` | `/documents/:id/shares` | ✓ | Owner only |
| `POST` | `/documents/:id/shares` | ✓ | `{ email, role }`; owner only |
| `PATCH` | `/documents/:id/shares/:userId` | ✓ | Change role; owner only |
| `DELETE` | `/documents/:id/shares/:userId` | ✓ | Revoke; owner only |

## Layout

```
config/         env (Zod) + CORS
db/             Drizzle client + migrations + migrate script
models/         tables (users, documents, document_shares) + enums
middlewares/    requireAuth
shared/         response envelope + message constants
lib/            password (argon2), jwt, cookies, sanitize
domains/        auth · documents · shares · upload  (route/controller/service/…)
routes/v1/      router wiring
scripts/        seed
tests/          sharing integration test
```
