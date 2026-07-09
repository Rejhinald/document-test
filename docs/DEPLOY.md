# Deploying (Railway + Vercel)

- **docs-api + PostgreSQL → Railway** (Dockerfile + managed Postgres)
- **docs-web → Vercel** (native Next.js, zero-config)

No custom domain is required — both platforms hand out free HTTPS subdomains. Deploy the API first so you have its URL for the web app.

---

## Part A — API + database on Railway

### 1. Create the project + database

1. Push this repo to GitHub (already done: `Rejhinald/document-test`).
2. Railway → **New Project → Deploy from GitHub repo** → select the repo.
3. Add **New → Database → PostgreSQL**. Railway provisions it and exposes `DATABASE_URL`.

### 2. Deploy `docs-api`

1. In the service created from the repo, open **Settings → set Root Directory = `docs-api`** (uses `docs-api/Dockerfile`, declared in `docs-api/railway.json`).
2. **Variables:**

   | Variable | Value |
   |---|---|
   | `ENVIRONMENT` | `production` |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference the Postgres service) |
   | `JWT_SECRET` | random ≥ 16 chars (`openssl rand -hex 32`) |
   | `JWT_ACCESS_TOKEN_TTL_SECONDS` | `604800` |
   | `FRONTEND_ORIGIN` | your Vercel URL (fill in after Part B; optional) |

   > `PORT` is injected by Railway — don't set it.

3. **Settings → Networking → Generate Domain.** Note it, e.g. `https://docs-api-production.up.railway.app`.
4. Deploy. The container migrates then starts (`bun run db/migrate.ts && bun run index.ts`), so tables are created automatically.

---

## Part B — Web app on Vercel

1. Vercel → **Add New → Project** → import the same GitHub repo.
2. **Root Directory: `docs-web`** (Vercel auto-detects Next.js; framework preset = Next.js).
3. **Environment Variables:**

   | Variable | Value |
   |---|---|
   | `API_PROXY_ORIGIN` | the Railway docs-api URL from A.3 (no trailing slash) |

   > Read at **runtime** by the `/api` proxy — no rebuild needed if you change it later.

4. **Deploy.** Vercel gives you `https://<project>.vercel.app` — this is the URL reviewers visit.
5. _(Optional)_ Back on Railway docs-api, set `FRONTEND_ORIGIN` to the Vercel URL. Not required (the browser only talks to Vercel, which proxies server-side), but correct if anything ever calls the API cross-origin.

---

## Part C — Seed the demo accounts

Run the seed once against the production database. With the [Railway CLI](https://docs.railway.app/develop/cli):

```bash
cd docs-api
railway link                     # select the project + docs-api service
railway run bun run seed         # runs locally against the prod DATABASE_URL
```

Alternative: temporarily set the docs-api **Deploy → Custom Start Command** to
`bun run db/migrate.ts && bun run seed && bun run index.ts`, deploy once, then revert.

This creates `alice@example.com`, `bob@example.com`, `carol@example.com` (password `password123`) and the shared demo document.

## Part D — Verify

Open the **Vercel** URL, sign in as `alice@example.com` / `password123`, and confirm documents load and sharing works.

---

## How the two clouds talk (why it's simple)

The browser only ever calls the **Vercel** origin. `docs-web/app/api/[...path]/route.ts` runs as a Vercel serverless function that forwards `/api/*` to `API_PROXY_ORIGIN` (Railway) and relays the response, including `Set-Cookie`. So the auth cookie is **first-party** on the Vercel domain — no CORS between Vercel and Railway, and no cross-site-cookie settings to get wrong. Because the proxy reads `API_PROXY_ORIGIN` at request time, the frontend build isn't coupled to the API URL.

## Troubleshooting

- **401 right after login** — demo accounts weren't seeded; run Part C.
- **Web loads but API calls fail** — `API_PROXY_ORIGIN` is wrong or has a trailing slash; it must be the Railway docs-api URL.
- **docs-api crashes on boot** — check `DATABASE_URL` references the Postgres service and `JWT_SECRET` is ≥ 16 chars.
- **Vercel build fails** — confirm Root Directory is `docs-web`.
