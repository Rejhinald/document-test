# Deploying to Railway

Both services deploy from their `Dockerfile`s in a single Railway project alongside a managed Postgres. This repo has one Git root with two service subdirectories (`docs-api`, `docs-web`), so each Railway service sets its **Root Directory** accordingly.

Total: **3 services** — Postgres, docs-api, docs-web.

---

## 1. Create the project + database

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo** (select this repo).
3. Add a database: **New → Database → PostgreSQL**. Railway provisions it and exposes `DATABASE_URL`.

## 2. Deploy `docs-api`

1. **New → GitHub Repo** (same repo) → in the service **Settings**, set **Root Directory** to `docs-api`. Railway will use `docs-api/Dockerfile` (declared in `docs-api/railway.json`).
2. Under **Variables**, add:

   | Variable | Value |
   |---|---|
   | `ENVIRONMENT` | `production` |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference the Postgres service) |
   | `JWT_SECRET` | a random string ≥ 16 chars (e.g. `openssl rand -hex 32`) |
   | `JWT_ACCESS_TOKEN_TTL_SECONDS` | `604800` |
   | `COOKIE_DOMAIN` | _(leave empty)_ |

   > `PORT` is injected by Railway automatically — don't set it.

3. Under **Settings → Networking**, click **Generate Domain**. Note the URL, e.g. `https://docs-api-production.up.railway.app`.
4. Deploy. The container runs migrations then starts (`bun run db/migrate.ts && bun run index.ts`), so tables are created automatically.

## 3. Deploy `docs-web`

1. **New → GitHub Repo** (same repo) → set **Root Directory** to `docs-web` (uses `docs-web/Dockerfile`).
2. Under **Variables**, add:

   | Variable | Value |
   |---|---|
   | `API_PROXY_ORIGIN` | the docs-api public URL from step 2.3 (no trailing slash) |

   > `PORT` is injected automatically; `HOSTNAME` is set in the Dockerfile.

3. **Generate Domain** for docs-web. This is the URL reviewers will visit.
4. _(Optional, cosmetic)_ Back on **docs-api**, set `FRONTEND_ORIGIN` to the docs-web URL. Not required — the browser only talks to docs-web, which proxies server-side — but it's correct if anything ever calls the API directly.
5. Deploy.

## 4. Seed the demo accounts

Run the seed once against the production database. From your machine with the [Railway CLI](https://docs.railway.app/develop/cli):

```bash
cd docs-api
railway link                        # select this project + the docs-api service
railway run bun run seed            # runs locally against the prod DATABASE_URL
```

Alternatively, temporarily set the docs-api **Deploy → Custom Start Command** to `bun run db/migrate.ts && bun run seed && bun run index.ts`, deploy once, then revert it.

This creates `alice@example.com`, `bob@example.com`, `carol@example.com` (password `password123`) and the shared demo document.

## 5. Verify

Open the **docs-web** URL, sign in as `alice@example.com` / `password123`, and confirm documents load and sharing works.

---

## How the pieces talk (why this is simple)

The browser only ever calls the **docs-web** origin. `docs-web` proxies `/api/*` to `docs-api` server-side (`app/api/[...path]/route.ts`) and relays the auth cookie, so it's **first-party** — no CORS config and no cross-site cookie settings to get wrong. Because the proxy reads `API_PROXY_ORIGIN` at runtime, you can change the API URL without rebuilding the frontend.

## Troubleshooting

- **401 right after login** — the demo accounts weren't seeded; run step 4.
- **Web loads but API calls fail** — `API_PROXY_ORIGIN` is wrong or has a trailing slash; it must be the docs-api public URL.
- **docs-api crash on boot** — check `DATABASE_URL` references the Postgres service and `JWT_SECRET` is ≥ 16 chars.
