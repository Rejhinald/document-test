# Walkthrough Video

**URL:** _paste your unlisted Loom / YouTube link here_

---

## Suggested 3–5 minute outline

1. **Intro (20s)** — what it is: a focused collaborative doc editor; two-service stack (Bun+Hono+Postgres API, Next.js web).
2. **Sign in (20s)** — log in as Alice; note seeded accounts + first-party cookie auth.
3. **Create & edit (60s)** — new document; use the toolbar (bold/italic/underline/headings/lists); show autosave "Saved"; reload to prove persistence.
4. **Import (40s)** — import `samples/sample-notes.md`; show Markdown became rich, editable content.
5. **Sharing (60s)** — open the Share dialog; show Bob (editor) and Carol (viewer); in a second window sign in as Carol → read-only (no toolbar/Save); as Bob → can edit.
6. **What I deprioritized (30s)** — real-time collab, comments, version history, refresh tokens — and why (depth over breadth in the timebox).
7. **AI + implementation notes (30s)** — the storage-format and proxy design decisions; how correctness was verified (integration test + browser walkthrough).
