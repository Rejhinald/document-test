# Walkthrough Video

**URL:** _paste your unlisted Loom / YouTube link here_

Target length: **3.5–4.5 min**. Live app: **https://document-test-gamma.vercel.app** · accounts below (password `password123`).

## Before you hit record (2-min setup)

- Open **two browser windows**: **Window A = normal** (you'll be Alice), **Window B = incognito** (you'll be Carol). Put them side by side or alt-tab.
- Have `samples/sample-notes.md` handy for the import step.
- Log both windows out first (or start fresh) so you can show the login.
- Accounts: `alice@example.com` (owner) · `bob@example.com` (editor) · `carol@example.com` (viewer) — the login page has quick-switch buttons.
- Speak to the **decisions and tradeoffs**, not just the clicks — that's what's being scored.

---

## The script (DO = on screen · SAY = narration)

### 0:00 – 0:25 — Intro
- **DO:** Show the login page (Window A).
- **SAY:** "This is Ajaia Docs — a lightweight collaborative document editor, a focused slice of Google Docs. It's a two-service app: a Bun + Hono + Postgres API on Railway, and a Next.js frontend on Vercel. I intentionally went deep on three things — the editing experience, sharing with real access control, and file import — rather than spreading thin. Let me walk through it."

### 0:25 – 0:45 — Sign in
- **DO:** Click the **"Alice · owner"** quick-switch chip → **Sign in**. Land on the dashboard.
- **SAY:** "Auth is a real login — seeded accounts, hashed passwords, a JWT in an httpOnly cookie. These quick-switch buttons are just to make the demo fast. Here's Alice's workspace — a sidebar with her documents, and a clean split between what she owns and what's shared with her."

### 0:45 – 1:35 — Create, edit, autosave, reopen
- **DO:** Click **New document**. Type a title. Type a sentence, then use the toolbar: **bold**, *italic*, underline, an **H1/H2**, a **bulleted list**, a **numbered list**.
- **DO:** Pause on the **"Saving… / Saved"** indicator.
- **DO:** **Reload the page** — show the content came back exactly.
- **SAY:** "Creating a doc drops me straight into the editor — this is TipTap. Full rich-text: bold, italic, underline, strikethrough, headings, bulleted and numbered lists, quotes. Notice it **autosaves** as I type — there's also a Save button and Cmd-S. And when I reload… everything's preserved, because it's persisted in Postgres. The title is editable inline — that's rename."

### 1:35 – 2:10 — File import
- **DO:** Click **Import** → choose `samples/sample-notes.md`.
- **DO:** Show the resulting document — headings, bold, lists, a blockquote, inline code.
- **SAY:** "For file handling, I import `.txt`, `.md`, and `.docx` and turn them into new editable documents — types are stated in the UI and capped at 5MB. Here's a Markdown file… and it comes in as fully-formatted, editable rich text. Docx goes through mammoth, Markdown through marked, and everything's sanitized server-side so imported HTML can't carry anything malicious."

### 2:10 – 3:00 — Sharing + access control (the important part)
- **DO:** Open the **"Welcome to Ajaia Docs"** doc → click **Share**.
- **DO:** Show Bob = **Editor**, Carol = **Viewer**. Optionally add/change a role.
- **DO:** Switch to **Window B (incognito)** → sign in as **Carol** → open the shared doc.
- **DO:** Point out: **read-only** — no toolbar, no Save, a "viewer access" note; and it's under **Shared with me**.
- **SAY:** "Sharing is by email, with two roles — Viewer or Editor. This is enforced on the server for every single request, not just hidden in the UI. Watch: as Carol, a viewer, the same document opens **read-only** — no toolbar, no save. If she tried to edit via the API directly she'd get a 403. A user with no access gets a 404 — we don't even leak that the document exists. And only the owner can share or delete."

### 3:00 – 3:30 — Architecture & a key decision
- **DO:** (Optional) show the browser Network tab hitting `/api/...` on the Vercel domain, or just talk over the app.
- **SAY:** "One decision I'm happy with: the frontend proxies its API calls through its own origin to the Railway backend. That keeps the auth cookie first-party across two different clouds — no CORS, no cross-site-cookie problems — and the API URL is read at runtime, so the frontend build isn't coupled to the backend. I also store content as sanitized HTML instead of a custom document model, which made import and future export trivial."

### 3:30 – 4:05 — What I deprioritized + AI workflow
- **DO:** Back on the dashboard, or a slide/README.
- **SAY:** "Deliberate scope cuts, given the timebox: real-time collaboration, comments, version history, refresh-token rotation, and file attachments — all cut, not half-built, so the core stayed solid. On AI: I used Claude Code as a pair-programmer for the scaffolding and boilerplate, which is where it saved the most time. But I overrode it on judgment calls — the HTML storage format, the runtime proxy for deploy, dropping refresh tokens — and I caught framework drift like Next 16 renaming middleware to 'proxy'. I verified everything with a typed build, an integration test covering the whole access-control matrix, and a real browser walkthrough — not just assuming the happy path."

### 4:05 – 4:15 — Close
- **SAY:** "That's Ajaia Docs — deployed, tested, and focused. Thanks for watching."

---

## Checklist — make sure the video hits all five required points
- [ ] Main user flow (create → edit → save → reopen)
- [ ] What works end to end (editing, import, sharing, persistence — live)
- [ ] What you intentionally deprioritized (+ why)
- [ ] Key implementation decisions (proxy / first-party cookie, HTML storage, server-side access control)
- [ ] How AI supported the workflow (sped up, overrode, verified)
