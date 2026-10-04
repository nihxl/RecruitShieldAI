# RecruitShield AI — Tech Stack Document (Frontend)

Oct 4, 2026 · @kkadder

The app is one Next.js and TypeScript project deployed from GitHub to Vercel. It talks to the analysis engine through a swappable adapter: a deterministic mock in production now, and a Python model service in the same repo that starts alongside the web app for local development once the trained model exists. This document fixes the technology choices; requirements are in the PRD and visuals in the Design Document.

## 1. Decisions taken from the Q&A

| Topic | Your answer | Consequence |
| --- | --- | --- |
| Model in v1 | Mock only | Production runs `ANALYZER=mock`. The remote adapter and the model service folder are built as stubs. |
| Start everything together | Preferred | Monorepo; one command starts the web app and the model service locally (section 6). |
| Accounts | Anonymous for now | A random device cookie owns each check; no sign-in. |
| Stored data | Result plus submitted text for 30 days | Database row per check; a daily job deletes rows older than 30 days. |
| Share Report | Skipped | Not built. |
| Framework and UI layer | Claude's choice | Next.js, hand-built components, accessible primitives from Radix (section 3). |
| PDF | Print stylesheet | The Download PDF button opens the print dialog with a hint to choose Save as PDF. |
| Tests | Claude's choice | Unit tests, end-to-end tests and automated accessibility checks (section 9). |
| Code and deploy | GitHub repo, Vercel auto-deploy | Push to main deploys production; every pull request gets a preview URL. |
| Payment-request rule (OQ-6) | Force High Risk | The score is capped at 39 whenever an upfront-payment flag fires. |
| DEMO\_FULL (OQ-5) | Yes, wanted | Built as an environment switch, off by default on the public site (section 5). |
| Constraints | Free tier only | Confirmed: free tiers only (Vercel Hobby, Neon free); no other constraints were provided. |

## 2. Architecture

One honest limit shapes this: Vercel functions cannot hold a RoBERTa model (the checkpoint is far larger than the function size limit). So the real model will always run as a separate service. Locally it starts with the web app; in production it will be hosted elsewhere and reached by URL. In v1 production there is no model, only the mock.

| Layer | Technology | Runs on |
| --- | --- | --- |
| Web UI and API routes | Next.js (App Router), TypeScript | Vercel |
| Analyzer adapter | TypeScript module with two implementations: mock and remote | Inside the Next.js server |
| Database | Postgres through the Vercel Marketplace (Neon) | Hosted, free tier |
| Model service (later) | Python, FastAPI | Local now; a hosted container later (for example a Hugging Face Space, Render or Modal) |

**Request flow**

1. The browser sends `POST /api/checks` with the job text, optional title and company.
2. The route validates input, applies the rate limit, creates a row with status `processing`, returns its `id`, and starts the analysis after the response is sent.
3. The adapter returns an analysis result that follows the PRD contract. The server applies the payment-flag cap, saves the result and sets status `complete` (or `error`).
4. The browser opens `/results/:id` and polls `GET /api/checks/:id` every second, shows the Analyzing view for at least 3 seconds, and fails over to the error state after 30 seconds. A refresh simply resumes polling.
5. `/checks` lists rows for the device cookie through `GET /api/checks`.

## 3. Stack choices

| Area | Choice | Why |
| --- | --- | --- |
| Framework | Next.js, App Router, latest stable | First-class Vercel support, server routes and pages in one project, best-supported by coding agents. |
| Language | TypeScript in strict mode | Catches contract mismatches between screens and analyzer. |
| Styling | Tailwind CSS, current stable version | The Stitch screens are already written in Tailwind utility classes, so markup ports over. |
| Design tokens | One theme file holding every color, radius, shadow, spacing and font token from the Design Document | Prevents the per-page config the Stitch exports contain. |
| Components | Hand-built from the tokens, with Radix UI primitives for dialog, tooltip and accordion | Radix supplies keyboard and screen-reader behaviour with no styling, so the look stays exactly as designed. A ready-made kit such as shadcn/ui was rejected because its default look would need overriding almost everywhere. |
| Icons | Material Symbols as individual SVG icons from an npm package (for example `@material-symbols/svg-400`, filled and outlined variants) | The screens use Material Symbols; per-icon SVGs avoid loading the whole icon font. Fallback: Google Fonts with an icon\_names list. |
| Fonts | Public Sans via `next/font/google`, weights 400, 600, 700 | Self-hosted at build time, no layout shift. |
| Validation | Zod | One schema validates API input, API output and any response from the model service. |
| Database | Postgres (Neon) | Supports the search, filters and stat counts on My Checks, and later accounts, without a rewrite. |
| ORM and migrations | Drizzle ORM | Light, typed, plain SQL migrations. |
| Retention | Vercel Cron calling a protected `/api/cron/purge` once a day | Deletes rows older than `RETENTION_DAYS` (30). Daily is the most the free plan allows and is enough. |
| Rate limiting | Vercel Firewall rate-limit rule on `/api/checks`, plus a per-device cap in the route (10 checks per hour) | No extra service needed. |
| Background work | Next.js `after()` (or Vercel `waitUntil`) | Lets the POST return an id immediately while analysis finishes. Agent must confirm the current API name in the Next.js docs. |
| Shield shader | Raw WebGL in a client component, loaded with dynamic import and no server rendering, only on the Analyzing view | No 3D library needed for one fragment shader. |
| Gauge and highlights | Custom SVG gauge; highlighted text built from character spans as React text nodes | No chart library; no `dangerouslySetInnerHTML` anywhere. |
| PDF and print | CSS print stylesheet | A server-side PDF generator would be heavy for little gain. |
| Package manager | npm | One tool for the whole team. |
| Lint and format | ESLint and Prettier, with the TypeScript strict flag | Standard. |

## 4. Repository layout

```
recruitshield/
  AGENTS.md                 short rules for coding agents (section 12)
  package.json              root scripts: dev, build, test, lint
  apps/web/                 the Next.js app
    src/app/                routes: /, /results/[id], /results/[id]/language,
                            /report/[id], /checks, /how-it-works, legal pages, api/*
    src/components/ui/      buttons, inputs, chips, accordion, dialog, tooltip
    src/components/         gauge, module card, finding card, highlighted text, shader
    src/lib/analyzer/       types, mock, remote, flag rules, score and band logic
    src/lib/db/             Drizzle schema and queries
    src/styles/theme        the single token source
    tests/                  unit and end-to-end
  services/model/           FastAPI service (stub now)
    app/main.py
    requirements.txt
    README.md
  .github/workflows/ci.yml
```

## 5. Configuration

| Variable | Values | Purpose |
| --- | --- | --- |
| `APP_MODE` | `preview` (default) or `demo_full` | Chooses between text-only results with locked modules, and fully simulated results with Simulated badges. |
| `ANALYZER` | `mock` (default) or `remote` | Selects the adapter. |
| `MODEL_SERVICE_URL` | URL | Used only when `ANALYZER=remote`; locally `http://127.0.0.1:8000`. |
| `DATABASE_URL` | Postgres URL | Provided by the Neon integration. |
| `CRON_SECRET` | random string | Authorises the purge route. |
| `RETENTION_DAYS` | `30` | Purge cutoff. |

Secrets live only in Vercel project settings and a git-ignored `.env.local`; a committed `.env.example` lists names with no values. Only `APP_MODE` is exposed to the browser.

## 6. Analyzer adapter and model service

**Adapter.** Every screen reads only the PRD result contract. An `Analyzer` interface takes the validated input and returns that contract, checked with Zod. Selection is by `ANALYZER`.

**Mock analyzer.** A deterministic function in TypeScript following the PRD mock rules, with three named fixtures (genuine, scam-with-fee, borderline) used by tests and demos. In `demo_full` it also returns simulated document, company and link modules marked `simulated`.

**Flag rules.** A shared lexicon and pattern file detects upfront payment, urgency, premature personal-data requests, unrealistic pay, off-platform contact and vague roles, and produces the character spans for highlights. It runs in both mock and remote modes, because the model itself returns no phrase-level output yet. Flags from this layer have `source = rules` and show severity, not a percentage.

**Score cap.** After either analyzer returns, one function applies the OQ-6 rule: an `upfront_payment` flag sets the trust score to at most 39.

**Model service (stub now, real later).** FastAPI with two endpoints: `GET /health` and `POST /predict` taking `{ text }` and returning `{ fraudProbability, modelVersion, truncated }`. Until a checkpoint is added it answers 503 with a clear message. The remote adapter converts this into the full contract using the flag rules, and trust equals round(100 × (1 − fraudProbability)).

**One command for local development.** Root script `npm run dev` starts both processes with the `concurrently` package, with labelled output: the web app (`apps/web`) and the model service (`uvicorn` in `services/model`). If `ANALYZER=mock` the model process prints that it is idle and the web app works alone, so the command is safe to use from day one.

**When the model is ready.** The ML side fills in `services/model` (loading the RoBERTa checkpoint and head), tests locally with `ANALYZER=remote`, then hosts the service as a container and sets `MODEL_SERVICE_URL` in Vercel. No screen changes.

## 7. Data model and API

**Table `checks`:** `id` (text, the RS- id), `device_id`, `created_at`, `status` (`processing`, `complete`, `error`), `mode`, `job_title`, `company_name`, `job_text`, `result` (JSON), `error_code`. Index on `device_id, created_at`.

**Device cookie:** `rs_device`, a random UUID created on first visit; httpOnly, secure, SameSite Lax, one year. Clearing cookies loses the history, which the privacy page must state. Every query is filtered by this value, and a request for another device's id returns 404.

| Route | Purpose |
| --- | --- |
| `POST /api/checks` | Validate, rate-limit, create, start analysis, return `{ id }` |
| `GET /api/checks/:id` | Return the check (status and result) for this device |
| `GET /api/checks` | List for this device with search, filter and stats counts |
| `DELETE /api/checks/:id` | Delete one check |
| `GET /api/cron/purge` | Delete rows past retention; requires the `CRON_SECRET` bearer header |

## 8. Security and privacy

- Validate every input with Zod: job text 100–5,000 characters, title and company length-limited and trimmed.
- User text is rendered only as React text; highlights come from spans. No raw HTML injection.
- Never log job text, results or cookies; logs carry the check id and status only.
- Security headers set in the Next.js config: a strict Content-Security-Policy, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors none`. The CSP must allow the self-hosted font and nothing external.
- HTTPS only, secrets server-side only, the purge route authenticated, and the 30-day retention stated on the Privacy page.
- Analytics are off in v1. If enabled later, use cookieless page analytics only and send no check content.

## 9. Testing and CI

| Kind | Tool | Covers |
| --- | --- | --- |
| Unit | Vitest | Score-to-band mapping and boundaries (0, 39, 40, 69, 70, 89, 90, 100); the payment cap; flag rules; mock fixtures; contract validation |
| End to end | Playwright | The five PRD scenarios: genuine, scam-with-fee, short text blocked, service error with retry, refresh during analysis; plus history search, filter and delete |
| Accessibility | axe-core inside Playwright | No serious violations on every route in both app modes; keyboard path through submit, detail and report |
| Visual and layout | Playwright screenshots at 360, 768 and 1440px | Band colors, locked and simulated states |
| Performance | Lighthouse in CI on the Verify page | Meets NFR-1 and NFR-2 |

GitHub Actions runs lint, type check, unit and end-to-end tests on every pull request; a failing check blocks the merge. Vercel builds the preview in parallel.

## 10. Deployment on Vercel

- Connect the GitHub repository; the production branch is `main`; every pull request gets a preview deployment.
- Root directory `apps/web`. Pin the Node.js LTS version in `package.json` engines.
- Add the Neon database from the Vercel Marketplace and let it inject `DATABASE_URL`. Use a separate database or branch for previews so test data never reaches production.
- Set `APP_MODE=preview` and `ANALYZER=mock` in Production. Preview deployments may use `demo_full` for panel rehearsals.
- Function region: choose Mumbai (bom1) for Indian users and a database region as close as the provider offers (Mumbai if available, otherwise Singapore); verify the options when creating them.
- Define the daily cron in `vercel.json`.
- Custom domain is optional and out of scope.

## 11. Local development

Requirements: Node.js LTS, Python 3.11 or newer (for the model service only), a Postgres connection string (the Neon free database works locally too). Steps: clone, `npm install`, copy `.env.example` to `.env.local`, run the database migration, then `npm run dev`. Also provide `npm run test`, `npm run test:e2e`, `npm run lint` and `npm run build`.

## 12. Rules for the coding agents

1. Read the PRD, Design Document and this document first; cite requirement IDs (for example FR-4.2) in commits and the To-Do.
2. Check the current official docs before installing or using Next.js, Tailwind, Drizzle, Radix and the icon package; versions and API names change.
3. Never copy the Stitch CDN script, per-page Tailwind config or inline hex colors. Everything resolves to the theme tokens.
4. Build the shared pieces once: band and status map, gauge, module card, finding card, top bar and footer.
5. When the PRD is silent or contradictory, stop and ask rather than invent behaviour; record the answer in the PRD.
6. Run lint, type check and tests before declaring a task done; no skipped tests.
7. Keep an `AGENTS.md` at the repo root with these rules (check Antigravity's current convention for rules files and mirror it there).

## 13. Suggested build order for the To-Do

1. Scaffold the repo, Next.js app, theme tokens, fonts, icons, lint, CI and the empty Vercel deployment.
2. Shared UI: top bar, footer, buttons, inputs, chips, accordion, dialog, tooltip, skeleton and empty or error blocks.
3. Contract, Zod schemas, band logic with tests, flag rules, mock analyzer and fixtures.
4. Database, device cookie, API routes and the purge job.
5. Screens in user-flow order: Verify, Analyzing with the shader, Results, Language Detail, Report with print stylesheet, My Checks, then How it Works and the legal and error pages.
6. Add `demo_full` simulated modules and the Simulated badges.
7. Accessibility pass, responsive pass, end-to-end tests, performance pass.
8. Model service stub, `npm run dev` orchestration, remote adapter and its tests.
9. Production configuration, region, rate-limit rule, final review against the PRD definition of done.

## 14. Assumptions to confirm

- Free tiers are the confirmed constraint (Vercel Hobby, Neon free); the Hobby plan is meant for personal, non-commercial use, which fits a capstone.
- The icon package, `after()` and Marketplace behaviour are verified by the agent against current docs.
- Regions: Mumbai availability for the database is unconfirmed.
