# RecruitShield AI Progress Log

**Next task:** Task 5.3: Analyzing view (`/results/:id` while processing)
**Last updated:** 2026-10-04

## Decisions
- Accounts: Anonymous for now
- Stored data: Result plus submitted text for 30 days
- Share Report: Skipped
- Payment-request rule (OQ-6): Force High Risk (score capped at 39)
- DEMO_FULL (OQ-5): Built as environment switch, off by default
- Constraints: Free tier only
- **OD-1 (Decision):** Icons vs strict CSP. Will use npm SVG package only, drop Google Fonts fallback.
- **OD-2 (Open):** Redundant "Recent" filter. Needs product-owner decision.
- **OD-3:** Success color. Pass states use secondary with icon and label.
- **OD-4:** DESIGN.md vs Design Document. Design Document wins (role-based radius, top bar).
- **OD-5 (Decision):** Mock failure hook. Scenario D needs a way to force an error. Built as dev/test-only switch.
- **OD-6 (Decision):** Title and company max length. Set to 120 characters each.
- **OD-7:** CSP and Next.js inline scripts. Verify against current Next.js docs.
- **OD-8 (Decision):** Provenance wording finalized. mock = "Source: Mock analyzer. Example logic, not a trained model."; rules = "Source: Pattern rules (not a trained model)"; model = "Source: Trained model {modelVersion}".
- **Decision:** Flag severities set: payment and PII high; urgency, off-platform contact and unrealistic pay medium; vague role low.
## Assumptions
- Next.js 16.3.8 uses Tailwind v4 setup which no longer requires a `tailwind.config.js` file, so scaffolding `--tailwind` creates the correct v4 setup. We updated the TS §13.1 deps command to use workspaces so Next.js dependencies go to apps/web and other dependencies like concurrently go to root.
- Used npm workspaces directly to manage deps efficiently across the Next.js app and the model service directory.
- Tailwind v4 natively supports mapping design tokens inside the `@theme` block in a regular `.css` file. We implemented `theme.css` with native CSS tokens that generate matching utility classes without extra Next.js configs.

## Known issues / follow-ups
- **Credential Exposure:** The Neon database password was briefly exposed in the repository history (`vercelpreview.txt`). The password was rotated by the product owner on 2026-10-04.
- /sandbox must be removed or gated before production (Task 6.4).

## Task log

| Task | Status | Commit | Notes |
| --- | --- | --- | --- |
| 1.1 Project initialization and monorepo | Done | bcb2ceb | Scaffolded monorepo, web app, configured CI, and installed dependencies |
| 1.2 Design tokens and typography | Done | 6b40f52 | Created theme.css with all design tokens, configured Public Sans font, and added a design check script |
| 1.3 Icons and brand assets | Done | bfab36b | Generated inline Icon component with @material-symbols/svg-400, created favicon/OG images, and added unit tests |
| 1.4 CI/CD and environments | Done | 71c911a | Configured GitHub Actions with Lighthouse CI, pinned Node to 22, and documented Vercel/Neon preview plan |
| 2.1 Navigation and structural shell | Done | 99f2de0 | Built TopBar, Footer, and structural shell with unique document titles. |
| 2.2 Base interactive elements | Done | 7d2dd07 | Built Button, Input, Textarea, Chip, ProgressBar, Modal, and Toast with Radix and Tailwind v4. Added sandbox page and unit tests. |
| 2.3 Accessible primitives (Radix wrappers) | Done | 9bca00b | Built Accordion and Tooltip with Radix UI, added destructive variant to Modal. Added touch support to Tooltip. Updated sandbox and tests. |
| 2.4 Status map, microcopy and Trust gauge | Done | 16f7119 | Built microcopy constants, status band map module, and animated TrustGauge component. Tested and added to sandbox. |
| 2.5 Content cards and data display | Done | 4878ec2c | Built ModuleCard (6 variants, expandable, navigating), FindingCard (rule/model), HighlightedPhrase, InfoBanner, StatCard, DataTable. 66 tests pass. |
| 2.6 Feedback blocks and labels | Done | 8a856472 | Built Skeleton (line/card/circle, motion-safe pulse), EmptyBlock, ErrorBlock (role=alert), SimulatedBadge, ComingSoonChip, ProvenanceBlock (3 source wording variants). 94 tests pass. |
| 3.1 Analysis contract and validation | Done | be9e9a85 | Built AnalysisContract.ts using Zod. Contract covers Complete, Processing, and Error states, and implements cross-field validation rules (bounds, scores, lengths). Aligned UI components. |
| 3.2 Band logic, flag rules and score cap | Done | adf11568 | Built `rules.ts` with flag extraction (UTF-16 spans match exactly, negations skip matches, no confidence for rules) and `applyScoreCap` (idempotent, never raises score). Covered Indian scams. |
| 3.3 Analyzer interface and mock analyzer | Done | 0df235cd | Built `Analyzer` interface and `MockAnalyzer` implementation. Fully deterministic scoring based on text patterns, injectable clock for tests, and dev/test failure hook handling. Validated against Zod contract. |
| 4.1 Database schema and device cookie | Done | 9233945 | Configured Drizzle schema for `checks` table, built `rs_device` cookie utility, generated migration and set up Neon serverless connection. Cookie correctly strictly enforces httpOnly, secure, and SameSite Lax policies. |
| 4.2 API routes | Done | e108f09f | Built API routes for POST, GET list, GET single, DELETE. Mocked db in tests for 429, 404, list and privacy checking. Fixed all lint and test issues. |
| 4.3 Purge job | Done | 0bde6ae8 | Built purge job at /api/cron/purge, returns 401 without secret, defaults to 30 days retention. Moved vercel.json to apps/web/vercel.json. Implemented constant-time comparison. Tests pass. |
| 5.1 Verify screen (/) | Done | 4447e97c | Built Verify screen at `/`. Extracted metadata to server component, built main form in `VerifyClient.tsx`. Form captures job text, optional title/company, validates length, shows error state if short, handles mock submit and redirects to `/results/:id`. Integrated `Accordion` with locked states for non-text inputs in preview. Analysis readiness bar shows in full demo mode only. |
| 5.2 Shield shader component | Done | 67899a49 | Built ShieldShader (WebGL) and ShieldShaderDynamic (SSR-off wrapper). All DD §6 fixes applied. 9/9 tests pass. |
| 5.3 Analyzing view | Pending | | |
| 5.4 Results dashboard, PREVIEW | Pending | | |
| 5.5 DEMO_FULL pass | Pending | | |
| 5.6 Language Detail | Pending | | |
| 5.7 Verification report | Pending | | |
| 5.8 My Checks | Pending | | |
| 5.9 Static, legal and error pages | Pending | | |
| 6.1 Accessibility, responsive and performance pass | Pending | | |
| 6.2 End-to-end and visual tests | Pending | | |
| 6.3 Model service stub and orchestration | Pending | | |
| 6.4 Production configuration | Pending | | |
| 6.5 Final review against DoD | Pending | | |

## Session notes
- Completed Task 5.2: Built `ShieldShader.tsx` (WebGL client component) and `ShieldShaderDynamic.tsx` (next/dynamic SSR-off wrapper). All DD §6 fixes applied: (1) canvas sized from container with DPR capped at 2 via ResizeObserver; (2) mouse uniform and mousemove listener removed; (3) output color clamped, premultipliedAlpha:false context flag; (4) compile and link status checked with console.error on failure; (5) visibility change listener pauses RAF; IntersectionObserver pauses when off-screen; (6) unmount cancels RAF and calls WEBGL_lose_context.loseContext(); (7) static filled shield icon overlay (32px, primary). Fallback: static SVG with CSS pulse (shield-pulse keyframe added to theme.css) shown on WebGL unavailable, compile/link failure, or prefers-reduced-motion (lazy useState initializer detects reduced motion before first render, avoiding setState-in-effect lint rule). Dynamic import with ssr:false in ShieldShaderDynamic keeps shader code absent from all other route bundles. Added sandbox section at /sandbox#shield-shader with WebGL and fallback demos. 9 tests cover: no-WebGL fallback, compile failure, link failure, happy path, reduced-motion fallback, unmount cleanup (cancelAnimationFrame + loseContext), visibility pause/resume, accessible label, no-mouse-uniform. Design check, lint, typecheck and 157 tests all pass.
- Completed Task 4.3: Built purge job at `GET /api/cron/purge`. Returns 401 without correct `CRON_SECRET` bearer header, and uses `RETENTION_DAYS` defaulting to 30. Tests run and verify `db.delete` calls using a mock database. Moved `vercel.json` to `apps/web/vercel.json` and implemented `timingSafeEqual` constant-time comparison for the cron secret.
- **Decision:** Updated flag descriptions in `rules.ts` per PO feedback. Re-verified fee-scam fixture raw score is 15.
- Completed Task 4.1: Built Drizzle schema for `checks` using `@neondatabase/serverless`. Configured UUID device cookie `rs_device` with httpOnly, secure, SameSite Lax, and 1-year duration. Wrote tests for the cookie logic ensuring existing cookies are reused and new ones set proper attributes. Generated Drizzle migration successfully. Created `drizzle.config.ts`. Run the migration with `npx -y dotenv-cli -e .env.local -- npx drizzle-kit push` or `drizzle-kit migrate`. Note: The API must not log the cookie or job text as required.
- Completed Task 3.3: Built `Analyzer` interface and `MockAnalyzer` class (`apps/web/src/lib/analyzer/mock.ts`). The mock is entirely deterministic: it scores text and generates consistent results without `Math.random` or date-based mutations in logic. `provenance.generatedAt` accepts an injectable clock via options for strict testing. Integrated the dev/test forced failure hook (OD-5) which throws a schema-compliant error payload in development but safely ignores the flag in production. Integrated the Task 3.2 rules engine and `applyScoreCap` directly. Fixtures "scam-with-fee" and "genuine" trigger their respective flags and bands correctly. `MockAnalyzer` strictly generates results that pass the complete Zod contract validation.
- Completed Task 3.2: Built `rules.ts` for regex-based flag extraction and score capping. Implemented patterns for Indian scam wording (registration, deposit, kit, laptop, UPI, WA/Telegram only, Aadhaar, PAN, bank). Built negative lookbehind/negation handling (e.g. "no registration fee"). Ensured spans perfectly match `slice(start, end)` using UTF-16 code units (JS native indices). Flags extracted by rules strictly omit `confidence`. Built `applyScoreCap` which is idempotent and strictly enforces the payment-request rule cap of 39 (High Risk band) without ever raising a score. Wrote new microcopy for flag titles and descriptions (recorded as Assumption for PO review). All unit tests pass.
- Completed Task 3.1: Created `AnalysisContract.ts` with Zod. Implemented discriminated union on `status`. Recorded assumptions: (1) API normalizes CRLF to LF and trims `jobText` before validation. (2) `modules` array elements use `findings: { text, verdict }[]` as it wasn't specified in PRD. Cross-field rules built with `.superRefine()` (trustScore matches band, spans within bounds, charCount matches length, confidence only for model). Aligned UI components (`ProvenanceBlock`, `FindingCard`, `HighlightedPhrase`, `ModuleCard`) to use contract types directly. Tests (including bounds, ID generator formats, valid/invalid payloads) are green. Removed Known Issue about local UI prop types.
- **Housekeeping (pre-2.6, commit be78b384):** Confirmed all sandbox sections 2.2–2.4 present (buttons, inputs, chips, progress bar, trust gauge all sizes/bands, accordion, tooltip, modal & toast). StatCard icons: total=`shield` → replaced with `analytics` (added to generate-icons.js, regenerated); high-trust=`verified` ✅; caution=`warning` ✅; in-progress=`progress_activity` ✅. ModuleCard border fix: DD §4 says 4px left border for alert states only — was incorrectly applying to locked and simulated too; fixed to only color alert variants (caution, fail, error). Added Known Issue about Task 2.5 prop types needing Task 3.1 alignment.
- Completed Task 2.6: Built Skeleton (line/card/circle shapes, `motion-safe:animate-[skeleton-pulse]` CSS keyframe added to theme.css, no pulse under prefers-reduced-motion), EmptyBlock (default `emptyHistory` microcopy), ErrorBlock (`role=alert` + `aria-live=assertive`, default `analysisFailed` microcopy), SimulatedBadge (tertiary-outline, science icon, label from statusMap, tooltip from DD §10), ComingSoonChip (outline color, lock icon, label from statusMap, tooltip from DD §10), ProvenanceBlock (disclaimer always rendered per PRD §5, provenance source wording as per new assumption, local time by default, `showUtc` for PDF report). All sandbox demos including narrow-width cases. 94 tests pass, lint clean, typecheck clean, design check clean. Provenance wording assumption recorded in PROGRESS.md and component header for product-owner confirmation.
- Completed Task 2.5: Built six components per DD §4. ModuleCard: 6 variants (pass/caution/fail/locked/simulated/error), expandable mode (real button, aria-expanded/controls, 300ms reveal), navigating mode (Link, chevron-right), locked (aria-disabled, no hover). FindingCard: rule-based shows severity chip only; model-calibrated shows Confidence chip with percentage; quote block uses surface bg and 2px tertiary-container left border. HighlightedPhrase: pure React text nodes, no dangerouslySetInnerHTML; normalises, clamps, merges overlapping/adjacent spans; UTF-16 offset contract documented; Tooltip from Task 2.3 on every highlight. InfoBanner: info and caution variants, tertiary-container 20%/30% fill/border. StatCard: card radius 24, 4px left border by variant. DataTable: label-caps headers, 24px padding, row hover, scrollable container, stacked-card mobile layout below 640px. All sandbox demos (long-word, HTML safety, 360px-wide table, empty state). 66 tests pass, lint clean, typecheck clean, design check clean.
- Completed Task 2.3: Built Accessible primitives (Accordion, Tooltip) with Radix UI. Added `destructive-confirm` variant to Modal. Configured Accordion for locked and added states with smooth chevron rotation. Tooltip handles keyboard focus, hover, and tap natively via custom state and touch handlers. Updated `/sandbox` with all variants and unit tested interactions.
- Completed Task 2.2: Built base interactive elements (Button, Input, Textarea, Chip, ProgressBar, Modal, Toast) conforming to DD §4 requirements. Reused Icon component. Integrated Radix UI for Modal. Implemented character counter with error coloring limit in Textarea. Added `/sandbox` page to showcase all variants and states. Added unit tests for key behaviours. Verified motion-reduce support.

- Completed Task 2.1: Built `TopBar` and `Footer` components. Implemented the layout shell with skip-to-content link, landmarks, and unique document titles using Next.js `metadata.template`. Navigation highlights active items and includes a mobile hamburger sheet. Verified `check-design.sh` fails on `favicon.svg` and `opengraph-image.svg` after updating it to exclude ONLY `Icon.tsx`. Tests and linting pass.

- Completed Task 1.4: Pinned Node.js 22 LTS in `apps/web/package.json`. Added Lighthouse CI to `.github/workflows/ci.yml` targeting the Verify page, enforcing mobile performance >= 85 and accessibility >= 95 via `lighthouserc.json`.
  - **Preview DB Plan**: We will provision a secondary Neon database branch (or separate Neon project on the free tier) exclusively for Vercel Preview deployments. Vercel will inject a distinct `DATABASE_URL` for the `Preview` environment compared to `Production`. This ensures test data from PRs never corrupts the main DB.

- Completed Task 1.3: Updated check-design.sh to exclude SVGs, fixed generate-icons.js script to properly inline the SVGs from @material-symbols/svg-400 with the correct viewBox (0 -960 960 960). Renamed expand_more mapping to keyboard_arrow_down. Generated Icon component with inline SVGs to avoid layout shift. Added unit tests for the Icon component. Created favicon and opengraph share image per design document. Removed default Next.js icons.

- Completed Task 1.2: Added theme.css with all defined design tokens, configured Public Sans via next/font/google, created a sample page to show all tokens, added `check-design.sh` to prevent hardcoded hex values, and verified everything works.

- Completed Task 1.1: scaffolded monorepo, web app, configured CI, installed all dependencies, created root scripts and verified all checks (lint, typecheck, test) pass successfully.
