# AI Workflow Note

This project was built in an AI-native workflow. This note describes which tools were used, where they materially helped, what AI output I changed or rejected, and how I verified correctness — because the point is judgment, not volume.

## Tools used

- **Claude Code (Claude Opus)** as the primary agent — for planning, scaffolding both services, writing code, and driving verification.
- **Playwright (via MCP)** — to drive a real browser through the full flow and capture the screenshots in `docs/screenshots/`.
- **Context7 / bundled framework docs** — to check current APIs instead of trusting training data (this mattered; see below).
- **TipTap, Drizzle, Hono, mammoth, marked, sanitize-html** — libraries chosen deliberately, not generated from scratch.

## Where AI materially sped things up

- **Boilerplate with a consistent shape.** The response envelope, Drizzle models + relations, the `route → controller → service → repository → schema` layering, and the per-domain API client modules are repetitive and error-prone by hand. Generating them from an agreed convention was a large, reliable time save.
- **Editor wiring.** Getting TipTap v3 working under Next SSR (the `immediatelyRender: false` requirement, `useEditorState` for reactive toolbar state, autosave debouncing) is fiddly; AI got a working baseline quickly.
- **The deployment-robust proxy.** Reasoning through first-party vs third-party cookies and landing on a runtime `/api/[...path]` reverse-proxy (relaying `Set-Cookie`, stripping hop-by-hop headers) was a good AI-assisted design pass.
- **The integration test.** A thorough access-control matrix test was scaffolded fast and doubled as the main correctness harness.

## What I changed or rejected

Judgment calls where I overrode the first or obvious answer:

- **Content storage: JSON → HTML.** The initial plan stored TipTap/ProseMirror JSON. I changed it to sanitized **HTML** because it makes `.docx`/`.md` import trivial (both libraries emit HTML) and avoids fragile server-side ProseMirror/DOM shimming. Documented the tradeoff.
- **Proxy: `next.config` rewrite → runtime Route Handler.** The rewrite bakes the API URL at build time, which couples the frontend build to the backend URL — bad for a two-service deploy. I replaced it with a runtime handler that reads `API_PROXY_ORIGIN` per request.
- **Auth: dropped refresh-token rotation.** The reference stack has it; I cut it deliberately as infra a demo won't exercise, and said so.
- **Framework drift caught, not trusted.** Next.js 16 renamed Middleware to **`proxy.ts`** and made route `params` async. I read the bundled Next docs to confirm this instead of writing the Next-14/15 patterns from memory — which would have failed. Similarly, `hono/jwt`'s `verify` now **requires** the algorithm argument; the typecheck caught the stale 2-arg call and I fixed it.
- **A bad test interaction.** While driving the browser, a Playwright `.fill()` on the editor replaced rich content with plain text. I recognized the artifact (rather than treating it as a bug), confirmed autosave still fired, and re-seeded — instead of "fixing" a non-bug.

## How I verified correctness, UX, and reliability

Evidence at each layer, not assertions:

1. **Types** — `tsc --noEmit` clean on both services; caught the Hono `verify` signature change and param-typing issues.
2. **Schema** — `drizzle-kit generate` + a real migration applied to Postgres.
3. **Behavior** — `bun test`: **8 passing** integration assertions across the full access-control matrix and import.
4. **Runtime plumbing** — `curl` through the web proxy confirmed login forwards to the API and relays the httpOnly `Set-Cookie` as first-party.
5. **UX** — a real **Playwright browser walkthrough**: login as all three roles, owned vs shared, formatting round-trip, autosave "Saved", share dialog, `.md` import producing rich content, and viewer read-only enforcement (no toolbar / no Save / no Share). Screenshots captured as proof in `docs/screenshots/`.
6. **Production build** — `next build` with standalone output succeeded, validating the exact artifact Railway will run.

## Honest assessment

AI removed the mechanical cost of a two-service, typed, tested full-stack slice, which let the time go into judgment: the storage-format choice, the cookie/proxy design, the scope cuts, and verifying behavior in a real browser rather than assuming the happy path. The places AI would have gone wrong on its own — stale framework APIs, build-time coupling in deploy, over-scoping — are exactly the places a human check earned its keep.
