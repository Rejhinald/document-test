# docs-web

The frontend for Ajaia Docs — **Next.js 16 (App Router) + React 19 + TanStack Query + Tailwind 4 / CVA + TipTap**.

## Setup

```bash
cp .env.example .env.local        # API_PROXY_ORIGIN -> http://localhost:8080
bun install
bun run dev                       # http://localhost:3000
```

Requires **docs-api** running (see `../docs-api`).

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Dev server |
| `bun run build` | Production build (`next build`) |
| `bun run start` | Serve the production build |
| `bun run lint` | ESLint |

## Environment

| Variable | Description |
|---|---|
| `API_PROXY_ORIGIN` | Origin the `/api/*` proxy forwards to (the docs-api URL). Read at **runtime**. |

## How it talks to the API

The browser only calls this app's own origin. `app/api/[...path]/route.ts` is a runtime reverse-proxy that forwards `/api/*` to `API_PROXY_ORIGIN` and relays the response (including `Set-Cookie`). That keeps the auth cookie **first-party** (no CORS, no third-party-cookie issues) and decouples this build from the API URL.

`proxy.ts` (Next 16's renamed middleware) does an optimistic auth-cookie check to gate app pages; the API is the authoritative check.

## Layout

```
app/
  login/                 sign-in page
  (app)/                 authed shell (sidebar) + gate
    page.tsx             home (greeting, actions, recent)
    documents/[id]/      editor route
  api/[...path]/route.ts /api reverse-proxy to docs-api
components/
  app-sidebar.tsx        shadcn-style sidebar (nav + actions + user)
  editor/                TipTap editor surface + toolbar
  share-dialog.tsx       share by email + roles
  ui/                    button, input, badge, dialog, spinner (CVA)
lib/
  api/                   apiFetch client + per-domain modules + types
hooks/                   useDocumentActions (create/import)
proxy.ts                 route protection
```
