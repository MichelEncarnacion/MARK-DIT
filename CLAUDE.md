# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MARK-DIT is a Node.js + React dashboard for the DIT (Dirección de Innovación Tecnológica) of
Red SPES. It aggregates tech/AI news, free AI courses (prioritizing official Anthropic/Claude
content), and edtech news, summarizes each item with a self-hosted DeepSeek R1 LLM using the
"MARK-DIT" persona, and serves the result from a JSON cache. See `README.md` for the full
source list, deployment notes (target platform: Lienzo), and known risks (cron persistence on
Lienzo, RSS feeds not reachable/verifiable from network-restricted sandboxes).

## Commands

This repo has two `package.json` files: the root (server) and `client/` (Vite/React frontend).

```bash
npm install                # root deps
npm run build              # npm install + vite build inside client/ -> client/dist
npm run refresh            # one-off: fetch all sources, summarize via DeepSeek, write data/feed.json
npm start                  # node server.js (serves API + client/dist)
npm run dev                # node --watch server.js (backend only, no live client rebuild)
npm run dev:client         # vite dev server for client/, proxies /api to :3000 (run alongside `npm start`)
```

Client-only commands (run from `client/`, or via `npm --prefix client run <script>`):

```bash
npm run lint                # oxlint
npm run build / dev / preview
```

There is no automated test suite in this repo. To sanity-check backend changes, run
`npm run refresh` and inspect `data/feed.json` / console output (source failures are logged and
non-fatal), then `npm start` and hit `GET /api/feed` and `POST /api/refresh`.

Required env vars (see `.env.example`): `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`,
`DEEPSEEK_MODEL`, `PORT`, `REFRESH_TOKEN` (bearer token required by `POST /api/refresh`),
`CRON_TIMEZONE`. Never hardcode these — they're read from `process.env` only, on the backend.

## Architecture

**Cache-first serving.** `server.js` never calls a source or the LLM on a request path — it only
reads `data/feed.json` via `lib/cache.js` (`GET /api/feed`). The file is regenerated exclusively
by two triggers: the `node-cron` job (7:00 AM, `CRON_TIMEZONE`) and `POST /api/refresh` (guarded
by `REFRESH_TOKEN`, rejects with 401/503, and no-ops with 409 if a refresh is already running).
`lib/cache.js` writes atomically (tmp file + rename) so a concurrent `GET /api/feed` never reads
a half-written file.

**Refresh pipeline (`lib/refresh.js`).** For each of the three source modules in `sources/`
(`news.js`, `courses.js`, `edtech.js`), it calls the module's fetch function, trims to
`MAX_ITEMS_PER_CATEGORY`, then runs each raw item through `lib/deepseek.js` to get a persona'd
summary. If DeepSeek fails for one item, that item falls back to a truncated raw excerpt instead
of dropping the item or aborting the run. The final `{ updatedAt, categories, sourceErrors }`
object is what gets persisted and served as-is (the frontend consumes this shape directly).

**Per-source error isolation.** Every source module returns `{ items, errors }` (never throws).
`lib/sourceUtils.js#gather()` is the shared helper: it takes a list of `{ label, run }` tasks,
runs them with `Promise.allSettled`, and turns rejections into logged + collected error strings
rather than propagating exceptions. `lib/rss.js#fetchFeed()` is the one place that actually throws
on a bad feed — everything upstream of it decides how to absorb that. When adding a new feed to a
category, add an entry to that category's `FEEDS` array (or an equivalent `run` task for non-RSS
sources like the GitHub-API-based Anthropic courses lookup in `sources/courses.js`) — no other
wiring is required for failures in it to be isolated.

**DeepSeek client (`lib/deepseek.js`).** Talks to an OpenAI-compatible `/chat/completions`
endpoint. The MARK-DIT system prompt (persona, tone, language) lives here as `SYSTEM_PROMPT` —
it's injected on every summarization call, not per-source. DeepSeek R1 responses can contain
`<think>...</think>` reasoning blocks; `stripThinkBlocks()` strips these before the text is ever
returned to a caller, so no caller downstream needs to know about them.

**Frontend (`client/`).** Plain Vite + React, no router, no state library. `App.jsx` fetches
`/api/feed` once on mount and passes `categories.{news,courses,edtech}` down to three `<Section>`
instances; each renders a grid of `<Card>`. Theme (light/dark) is local state + `data-theme`
attribute on `<html>`, persisted to `localStorage`, with CSS variables doing the actual
light/dark swap in `index.css` (no CSS-in-JS). Text-to-speech ("leer en voz alta") is entirely
client-side via the browser's native `SpeechSynthesis` API, wired through
`context/SpeechContext.jsx` (a single provider tracks one global `speakingId` so starting a new
utterance — a card or a whole section read via `Section`'s "Leer sección" button — cancels
whatever was playing). There is no TTS backend and no per-item audio generation; if
`speechSynthesis` is unsupported or has zero voices, the speak buttons degrade to a no-op.

In dev, `vite.config.js` proxies `/api/*` to `http://localhost:3000`, so run `npm start` and
`npm run dev:client` together rather than relying on the Vite server alone for anything that
hits the API.
