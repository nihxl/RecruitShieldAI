# RecruitShield AI Frontend — Phased To-Do List

This document outlines the phased build order based on Tech Stack Section 13. Each task is scoped for a single coding session and includes requirement IDs and acceptance criteria.

## How to use this list (read before every task)

**Reference key.** `PRD §n`, `FR-x`, `NFR-x`, `OQ-x` are from the Product Requirements Document. `TS §n` is the Tech Stack Document. `DD §n` and `D-1` to `D-7` are the **Design Document** (not DESIGN.md).

**Source hierarchy.**
- Behaviour and scope: the PRD wins.
- Visuals: Design Document, then DESIGN.md, then the Stitch HTML.
- The Stitch HTML is a visual reference only. Never copy its CDN script, per-page Tailwind config or hex values.

**Rules for every task** (from TS §12):
1. Read the PRD, Design Document and Tech Stack Document first. Cite requirement IDs in commits.
2. Check current official docs before installing or using Next.js, Tailwind, Drizzle, Radix and the icon package.
3. No hex values, arbitrary pixel sizes or CDN links in components. Everything resolves to theme tokens.
4. Build shared pieces once. Do not duplicate them per page.
5. If the PRD is silent or contradictory, stop and ask. Record the answer in the PRD.
6. Run lint, type check and tests before marking a task done. No skipped tests.
7. **Progress log:** `docs/PROGRESS.md` is the project's memory. At the start of every session, read it first and continue from "Next task". A task is not done until the log is updated and committed with the code. At the end of every task:
   - mark the task Done with the commit hash;
   - list what was built and verified (tests run, screens checked);
   - record every assumption made;
   - record every decision given by the product owner, such as answers to the Open Decisions;
   - list known issues or follow-ups left unresolved;
   - update "Next task" at the top.
   If stopping mid-task, add a Session notes entry saying what is half-done. Never delete Decisions or Assumptions when condensing old notes.

**Cross-cutting rules** (apply to every screen task, so they are not repeated in each):
- **Honesty:** wherever a Trust Score appears, show the disclaimer and the provenance. Any simulated or unavailable value is labelled (PRD §5).
- **Higher means safer:** no screen shows a risk score.
- **Status:** never use color alone. Every status shows its icon and its label.
- **States (FR-8):** every screen has a loading skeleton, an error state with Retry, and an empty state where lists can be empty. Validation errors are inline.
- **Reduced motion (NFR-2):** respect `prefers-reduced-motion` for the gauge arc, row stagger, ping ring and shader.
- **Text safety (NFR-5):** user text is rendered only as React text. No `dangerouslySetInnerHTML`.
- **Logging:** never log job text, results or cookies. Logs carry the check id and status only.
- **Page titles and microcopy:** every route has a unique document title (DD §9). All UI strings come from the microcopy table (DD §10), kept in one constants file.

---

## Phase 1: Setup & Scaffolding (TS §13.1)

### Task 1.1: Project initialization and monorepo
- **Requirements:** NFR-4, NFR-7, TS §3, TS §4, TS §5, TS §10, TS §11, TS §12.7
- **Description:**
  - Scaffold the monorepo exactly as TS §4: `apps/web` (Next.js App Router, TypeScript strict), `services/model` (empty folder with README), root `package.json`, `.github/workflows`.
  - Install Tailwind (current stable), Zod, Drizzle ORM, Radix UI primitives (dialog, tooltip, accordion, popover), `@material-symbols/svg-400`, ESLint, Prettier, Vitest, Playwright, axe-core and `concurrently`.
  - Add root scripts `dev`, `build`, `test`, `test:e2e`, `lint` and `typecheck`.
  - Pin the Node LTS version in `engines`.
  - Add a committed `.env.example` listing `APP_MODE`, `ANALYZER`, `MODEL_SERVICE_URL`, `DATABASE_URL`, `CRON_SECRET` and `RETENTION_DAYS` with no values. Only `APP_MODE` may reach the browser. Git-ignore `.env.local`.
  - Write `AGENTS.md` at the repo root containing the rules above, **including rule 7 (progress log)**. Check Antigravity's current rules-file convention and mirror it.
  - Create `docs/PROGRESS.md` with these sections: **Next task** and **Last updated** at the top; **Decisions** (from the product owner); **Assumptions**; **Known issues / follow-ups**; a **Task log** table (Task, Status, Commit, Notes) with one row per task from 1.1 to 6.5; and **Session notes** (newest first, 2–3 lines each). Set Next task to 1.1.
  - Copy the Open Decisions from the end of this document into the Decisions section as pending items.
- **Acceptance Criteria:**
  - `npm run dev`, `build`, `lint`, `typecheck` and `test` all pass on a fresh clone.
  - The folder structure matches TS §4.
  - `AGENTS.md`, `.env.example` and `docs/PROGRESS.md` exist.
  - `AGENTS.md` contains the progress log rule.
  - No secret is committed.

### Task 1.2: Design tokens and typography
- **Requirements:** NFR-7, PRD §11.4, PRD §11.5, TS §3, **DD §1 (D-1 to D-7), DD §3**
- **Description:**
  - Create one theme file as the only token source, built from **DD §3**. Where DESIGN.md differs, the Design Document wins.
  - Colors: the roles in DD §3.1. Forbidden: `brand-dark`, `brand-teal`, `brand-mint`, `#d8faff` and `#006b5f`.
  - Radius **by role** (D-1): control 8px, item 12px, card 24px, pill full. Do not use the Tailwind `lg`/`xl` mapping from the Stitch config or DESIGN.md.
  - Shadows: Level 1 `0 4px 24px rgba(0,0,0,0.20)` and Level 2 `0 8px 32px rgba(0,0,0,0.32)`.
  - Spacing: xs 4, base 8, sm 12, md 24, lg 48, xl 80, gutter 24, margins 16 and 40, container 1280.
  - Typography tokens per DD §3.3, including the mobile step-downs (h1 32, h2 28, h3 20).
  - Focus ring: 2px primary outline with 2px offset.
  - Configure Public Sans (400, 600, 700, display swap) via `next/font/google`.
  - Dark theme only (D-2). Add a placeholder print-color token set.
  - Add a lint or grep check script that fails on hex values or arbitrary `px` utilities outside the theme file.
- **Acceptance Criteria:**
  - The check script passes.
  - No CDN links exist.
  - A sample page shows every token.
  - Font loading causes no layout shift.
  - The 8px rhythm is enforced.

### Task 1.3: Icons and brand assets
- **Requirements:** TS §3 (Icons), TS §8 (CSP), DD §11, D-7
- **Description:**
  - Build one `Icon` component that wraps the `@material-symbols/svg-400` SVGs with a reserved 24px box, and filled and outlined variants. Filled is for status and brand icons. Outlined is for navigation.
  - Include only the icons used: `shield_person`, `shield`, `verified`, `check_circle`, `warning`, `gpp_maybe`, `lock`, `science`, `error`, `info`, `expand_more`, `chevron_right`, `arrow_back`, `add_circle`, `security`, `progress_activity`, `search`, `download`, `print`, `menu`, `close`, `delete`, `more_vert`, `chat` or `mail` for source types.
  - Create the favicon (filled shield on surface, primary color) and the wordmark share image.
  - **Do not use the Google Fonts icon fallback.** See Open Decision 1.
- **Acceptance Criteria:**
  - No icon requests leave the origin.
  - No layout shift from icons.
  - The logo is `shield_person` (filled, primary) plus the wordmark in h3 bold (D-7).

### Task 1.4: CI/CD and environments
- **Requirements:** TS §9, TS §10
- **Description:**
  - GitHub Actions runs lint, **type check**, Vitest and Playwright (with axe) on every pull request.
  - Add a Lighthouse CI job on the Verify page. Thresholds: mobile performance 85 or higher, accessibility 95 or higher (NFR-1, NFR-2).
  - Require these checks for merging to `main`.
  - Connect the empty Vercel project: root directory `apps/web`, production branch `main`, PR previews.
  - Document the plan for a separate Neon database or branch for previews.
- **Acceptance Criteria:**
  - A failing test, type error or lint error blocks the merge.
  - The Vercel preview builds.
  - The Lighthouse job runs.

---

## Phase 2: Shared UI Components (TS §13.2)

### Task 2.1: Navigation and structural shell
- **Requirements:** FR-7.1, FR-7.2, FR-7.3, NFR-3, OQ-1, DD §4 (Top bar, Footer), DD §8, DD §9, D-3, D-7
- **Description:**
  - **Top bar:** logo (D-7); links Verify, How it Works, My Checks (never "Reports"); **no auth button**. Active link is primary text with a 2px primary underline. Height 80px, with a **64px compact variant** (back arrow, title and ID slot) for Language Detail. Surface at 80% with a 12px backdrop blur and a 1px `outline-variant` bottom border at 30%.
  - **Mobile:** below 768px, a hamburger opens a full-width sheet with focus management.
  - **Footer:** `surface-container-lowest`, wordmark, tagline "Protecting job seekers through transparency and AI", links Resources, Privacy Policy, Security, Terms of Service, Support. The year is computed.
  - **Page chrome:** skip-to-content link, `nav`/`main`/`footer` landmarks, and a helper that sets a unique document title per route.
  - **Touch targets:** at least 44px.
- **Acceptance Criteria:**
  - Active routes are highlighted.
  - The layout collapses below 768px.
  - No horizontal scroll at 360px.
  - Keyboard users reach everything.
  - The footer year is not hard-coded.

### Task 2.2: Base interactive elements
- **Requirements:** FR-8, NFR-2, DD §4 (Button, Input, Chips, Progress, Toast), D-5, D-6
- **Description:**
  - **Buttons:** primary (`primary` fill, `on-primary` text per D-5), secondary (transparent, 1px primary border), text, destructive (error text and border), loading (spinner replaces the icon, label stays). Minimum height 48px, 8px radius, disabled at 40% opacity.
  - **Inputs and textareas:** fill `surface-container-highest`, **1px `outline` border (D-6)**, `label-caps` label, and an error state with an icon and a body-sm message tied by `aria-describedby`. The textarea has a live N/5000 counter that turns error color at the limit.
  - **Chips:** status (role color at 15% fill, 40% border), filter (selected uses `primary-container`), neutral.
  - **Progress bar** (6px, 500ms width transition).
  - **Toast:** bottom centre, 4 seconds, polite live region.
- **Acceptance Criteria:**
  - Buttons have a 0.98 press scale over 150ms.
  - Inputs show the 4px primary glow at 15% on focus.
  - Disabled, loading and error states all render.
  - Reduced motion is respected.

### Task 2.3: Accessible primitives (Radix wrappers)
- **Requirements:** FR-4.2, FR-8, NFR-2, DD §4 (Accordion, Modal), DD §9
- **Description:**
  - **Accordion:** real buttons with `aria-expanded` and `aria-controls`. Locked variant: 60% opacity, lock icon, Coming Soon chip, `aria-disabled=true`, no chevron, not focusable as a button. Added variant: a check badge in `secondary`.
  - **Dialog:** card radius, Level 2 shadow, 60% scrim, focus trap, Escape closes, focus returns to the trigger. Include a destructive-confirm variant.
  - **Tooltip:** `tertiary-container` fill with `on-tertiary-container` text, at least 14px, `role=tooltip` with `aria-describedby`, an arrow, kept inside the viewport, dismissible with Escape. It must open on **hover, keyboard focus and tap**. Radix Tooltip typically does not open on touch, so use a Popover-based pattern or a custom trigger for touch devices.
- **Acceptance Criteria:**
  - All elements are keyboard navigable.
  - The tooltip opens by hover, focus and tap, and closes with Escape.
  - Modal focus is trapped and restored.
  - Locked accordion sections are not focusable as buttons.

### Task 2.4: Status map, microcopy and Trust gauge
- **Requirements:** PRD §8, FR-3.2, NFR-2, DD §3.2, DD §4 (Trust gauge), DD §9, DD §10
- **Description:**
  - **Status map module (one shared module):** for the four bands plus Locked, Simulated and Error, it holds the color role, icon, chip text and summary text. The summaries come verbatim from DD §10. Export the **disclaimer** text from here too.
  - **Trust gauge:** one SVG with sizes sm (64px), md (192px) and lg (256px). Spec: viewBox 100, r 40, stroke 8, round caps, rotated -90deg, track `surface-container-high`, dash = score × 2.512 then 251.2, arc color from the band. It animates over 1s ease-out from 0, with no animation under reduced motion. The centre shows the score and "SCORE", with the band chip on lg only.
  - **Accessibility:** `role=meter` with `aria-valuemin`/`aria-valuemax`/`aria-valuenow` and a label like "Trust score 72 out of 100, Likely Genuine". The arc is decorative.
- **Acceptance Criteria:**
  - Screen readers announce value and label.
  - All four bands render the right color, icon and label.
  - Color is never the only signal.
  - No other file defines band colors, labels or summaries.

### Task 2.5: Content cards and data display
- **Requirements:** FR-3.3, FR-3.4, FR-4.1, FR-4.5, FR-6.1, FR-8, DD §4 (Module card, Finding card, Highlighted phrase, Info banner, Stat card, Data table), TS §12.4
- **Description:**
  - **Module card:** variants pass, caution, fail, locked, simulated and error. Item radius 12, 4px status left border for alert states, 32px icon well. Expandable variant (real button with `aria-expanded`, 300ms reveal) and navigating variant (chevron-right, whole card is a link). The locked variant is not interactive.
  - **Finding card:** icon, title, severity chip (High, Medium, Low) or Confidence chip, description, and a quote block (2px `tertiary-container` left border, italic).
  - **Highlighted phrase:** builds from `{start, end}` character spans into React nodes. Focusable, `tertiary-container` at 15% fill that rises to 30% on hover or focus, with a dotted underline, using the Task 2.3 tooltip.
  - **Info banner** (`tertiary-container` at 20%).
  - **Stat card** (4px left border: `secondary` for High Trust, `tertiary` for Cautions, `outline` for In progress).
  - **Data table:** `label-caps` headers, 24px cells, hover at 40%, dividers at 20%. Below 640px each row becomes a stacked card.
- **Acceptance Criteria:**
  - Spans render correctly, including adjacent and overlapping edge cases, with no HTML injection.
  - Table scrolls inside its container with no horizontal page scroll.
  - Confidence is shown only when the source is a calibrated model output. Rule-based flags show severity only.

### Task 2.6: Feedback blocks and labels
- **Requirements:** FR-8, PRD §5 (Honesty rule), DD §3.2, DD §4 (Skeleton, Empty, Error), DD §10
- **Description:**
  - **Skeleton:** `surface-container-high` blocks with a slow opacity pulse.
  - **Empty and Error blocks:** 48px icon well, h3 title, body-sm text, one primary action.
  - **Simulated badge:** `science` icon, `tertiary` outline, with the tooltip "Example result for demonstration. Not based on a real check."
  - **Coming Soon chip:** with the tooltip "This check is under development and will arrive in a later release."
  - **Disclaimer and provenance footer block:** reusable, takes a result's `disclaimer` and `provenance`.
- **Acceptance Criteria:**
  - Every block is reusable by every screen task.
  - Labels use the exact microcopy.
  - The tooltips are keyboard accessible.

---

## Phase 3: Core Logic & Adapters (TS §13.3)

### Task 3.1: Analysis contract and validation
- **Requirements:** PRD §9, PRD §8, TS §8, TS §3 (Validation), NFR-5
- **Description:**
  - Write Zod schemas for the **entire** PRD §9 contract:
    - `id` in the format `RS-` + 4 digits + `-` + 3 alphanumerics, with a generator (one format everywhere).
    - `createdAt`, `mode`, `status`.
    - `input` (`jobText`, `jobTitle?`, `companyName?`, `charCount`, `truncated`).
    - `trustScore` (integer 0–100), `band`, `summary`.
    - `modules[]` (`key`, `status`, `verdict`, `headline`, `findings[]`).
    - `languageDetail.flags[]` (`id`, `type`, `title`, `severity`, optional `confidence` 0–1, `description`, `quote`, `span`).
    - `provenance` (`source`, `modelVersion`, `generatedAt`) and `disclaimer`.
  - Also write the API input schema (`jobText` 100–5000 characters; trimmed, length-limited title and company, proposed max 120 each), the API output schema, and the model-service response schema (`fraudProbability`, `modelVersion`, `truncated`).
- **Acceptance Criteria:**
  - Valid and invalid payload unit tests pass for every schema.
  - IDs match the format.
  - Contract types are exported and used by every screen.

### Task 3.2: Band logic, flag rules and score cap
- **Requirements:** PRD §8, PRD §9, OQ-6, TS §6 (Flag rules, Score cap), TS §9
- **Description:**
  - **Score to band:** 90–100, 70–89, 40–69, 0–39. Live in the Task 2.4 module or are imported by it.
  - **Flag rules:** shared lexicon and pattern file for the six types: `upfront_payment`, `artificial_urgency`, `premature_pii`, `unrealistic_compensation`, `off_platform_contact`, `vague_role`. Each flag has severity and `source = rules`, and produces character spans for highlights. It runs in both mock and remote modes.
  - **Score cap:** one function applied after any analyzer. An `upfront_payment` flag sets the trust score to at most 39, and the flag explains why.
- **Acceptance Criteria:**
  - Vitest covers the boundaries (0, 39, 40, 69, 70, 89, 90, 100).
  - Vitest covers the cap, each flag type, and span accuracy.
  - Flags never carry a percentage.

### Task 3.3: Analyzer interface and mock analyzer
- **Requirements:** PRD §5 (Mock analyzer rules), PRD §9, PRD §12, TS §6, G3
- **Description:**
  - **Analyzer interface** takes validated input and returns the Zod-checked contract. Selection is by `ANALYZER` (`mock` default, `remote` stub that throws "not configured" until Task 6.3).
  - **Mock analyzer** is deterministic and works on any text:
    - Payment, equipment-fee or wire wording gives a score below 20 with a payment flag.
    - Urgency wording and early bank or ID requests add flags and lower the score.
    - Clean, specific postings score 75–95.
    - Very short or vague text lands in the caution band.
  - Output sets `provenance.source = mock`, the band summary and the disclaimer.
  - **Fixtures:** `genuine`, `scam-with-fee`, `borderline`. The scam fixture must produce the payment, urgency and PII flags (Scenario B).
  - **When `APP_MODE=demo_full`**, also return simulated document, company and link modules with status `simulated`.
  - **Failure hook for Scenario D (proposed, confirm with product owner):** a dev and test-only switch that forces an analyzer error. It must be unreachable in production.
- **Acceptance Criteria:**
  - Same input gives the same output.
  - All fixtures validate against the contract.
  - The Scenario A and B outcomes hold.
  - Simulated modules appear only in `demo_full`.

---

## Phase 4: Database & API (TS §13.4)

### Task 4.1: Database schema and device cookie
- **Requirements:** TS §7, NFR-5, OQ-1, OQ-2
- **Description:**
  - **Drizzle schema** for `checks`: `id` (text, the RS- id), `device_id`, `created_at`, `status`, `mode`, `job_title`, `company_name`, `job_text`, `result` (JSON), `error_code`. Add an index on `(device_id, created_at)`.
  - **Cookie** `rs_device`: random UUID, httpOnly, secure, **SameSite Lax**, one year. Create it on first visit.
  - Run migrations on the Neon free instance. Use a separate database or branch for previews.
- **Acceptance Criteria:**
  - The migration runs locally and on Neon.
  - The cookie has all required attributes.
  - No code path logs the cookie or job text.

### Task 4.2: API routes
- **Requirements:** TS §7, TS §3 (Background work, Rate limiting), NFR-5, FR-6.2, FR-6.4
- **Description:**
  - **`POST /api/checks`:** validate with Zod, rate-limit (10 checks per hour per device), create a `processing` row, return `{ id }`, then run analysis with `after()` (confirm the current API name in the Next.js docs). The server applies the score cap, saves the result and sets `complete` or `error` with an `error_code`.
  - **`GET /api/checks/:id`:** status and result for this device. Another device's id returns 404.
  - **`GET /api/checks`:** list for this device with **search** (title, company or ID), **filters** (All Types, Recent, High Risk), **stats counts** (Total, High Trust, Cautions, In progress) and pagination beyond 20 rows.
  - **`DELETE /api/checks/:id`.**
  - Validate responses with Zod. Never log job text, results or cookies.
- **Acceptance Criteria:**
  - Every query filters by `device_id`.
  - The rate limit triggers on the 11th submission.
  - Search, filters, stats and pagination return correct counts.
  - Integration tests cover the status transitions.

### Task 4.3: Purge job
- **Requirements:** TS §7, OQ-2
- **Description:** `GET /api/cron/purge` protected by a `CRON_SECRET` bearer header. It deletes rows older than `RETENTION_DAYS` (30). Declare the daily schedule in `vercel.json`.
- **Acceptance Criteria:**
  - Returns 401 without the secret.
  - A test with seeded old and new rows deletes only the old ones.

---

## Phase 5: Screens Implementation (TS §13.5 and §13.6)

Every task below also follows the cross-cutting rules at the top (honesty, states, reduced motion, titles, microcopy).

### Task 5.1: Verify screen (`/`)
- **Requirements:** FR-1.1 to FR-1.7, PRD §11.4, DD §5.1, DD §10, D-5, D-6
- **Description:**
  - **Hero band** on `surface-container-lowest`. Title and lead sentence from the microcopy table. Subtle primary radial glow at about 10%.
  - **Form card** overlaps the hero by about 80px, max width 672px.
  - **Accordion:** Job post text (open by default), Offer letter, Recruiter email, Link or QR. In PREVIEW the last three are locked and accept no input or files.
  - **Job post section:** optional Job title and Company name fields side by side (stacked on mobile), then the textarea (128px growing to 320px) with the live counter and the helper line. Show "Untitled posting" and "Company not provided" when blank. Never guess them.
  - **Notices near Check Now:** privacy and no-passwords notice with a Privacy link, and a note that the model works best on English text without blocking other languages.
  - **Check Now:** full-width primary with a filled `security` icon. Disabled below 100 characters with the helper message "Add at least 100 characters so we can analyse the posting."
  - **Analysis Readiness bar:** `demo_full` only, counting live modules (for example "2 of 4 checks added"). Hidden in PREVIEW.
  - **Submit:** creates the check and navigates to `/results/:id`. On error, focus moves to the first error.
- **Acceptance Criteria:**
  - Scenario C (under 100 characters) is blocked with the exact message.
  - No `brand-*` colors.
  - The page is usable at 360px.
  - Submission creates a record and redirects.

### Task 5.2: Shield shader component
- **Requirements:** FR-2.1, PRD §11.2, NFR-1, NFR-2, DD §6, TS §3 (Shield shader)
- **Description:** Port `shader.html` as a client component, dynamic-imported with SSR off, and loaded **only** on the Analyzing view. Apply every DD §6 fix:
  - Canvas sized from its container (96px inner square in the 120px well), with devicePixelRatio capped at 2.
  - Remove the mouse uniform and the `mousemove` listener.
  - Clamp the output color, and use premultiplied alpha handling so edges are not washed out.
  - Check shader compile and link status and log failures.
  - Pause when the tab is hidden or the element is off screen.
  - On unmount, cancel the animation frame and release the GL context.
  - Overlay a static filled `shield` icon (primary, 32px).
  - **Fallback:** a static SVG shield with a CSS pulse for any failure, no WebGL, or reduced motion. Under reduced motion, render one frame or the static SVG with no loop.
- **Acceptance Criteria:**
  - The shader code is absent from every other route's bundle.
  - Fallback verified with WebGL disabled and with reduced motion on.
  - First paint is not blocked.

### Task 5.3: Analyzing view (`/results/:id` while processing)
- **Requirements:** FR-2.1 to FR-2.4, PRD §11.2, PRD §11.9, PRD §12 (Scenarios D and E), DD §5.2, TS §2 (Request flow)
- **Description:**
  - **Card** (max 480px, 48px padding) over the 600px blurred primary glow. The Task 5.2 shader sits in the 120px well with a slow ping ring.
  - **Title and copy:** "Analyzing posting" and "This usually takes a few seconds." Do not promise a fixed duration.
  - **Checklist:** Language Analysis runs, then completes. Document Check, Company Verification and Link Safety show Coming Soon (not spinning) in PREVIEW. Rows fade up with the stagger. The list is an `aria-live=polite` region announcing step changes.
  - **Polling:** `GET /api/checks/:id` every second. Show the view for at least 3 seconds. Fail over to the error block after 30 seconds.
  - **Cancel:** text button that returns to Verify with the text preserved (FR-2.3).
  - **Error block:** "We couldn't complete the analysis. Your text is still here. Try again." with Retry and a keep-text option.
  - **Refresh** at any stage resumes correctly.
- **Acceptance Criteria:**
  - Scenario D (service unavailable) shows the error state with Retry.
  - Scenario E (refresh during analysis) resumes.
  - No endless spinner.
  - No "15 seconds" copy anywhere.
  - The same URL renders Analyzing or Results depending on `status`.

### Task 5.4: Results dashboard, PREVIEW (`/results/:id`)
- **Requirements:** FR-3.1 to FR-3.5, PRD §5, PRD §11.3, DD §5.3, DD §10
- **Description:**
  - **Header:** "Analysis Results" and "Job posting for <title> at <company>" from submitted values.
  - **Layout:** desktop 4/8 split. Left card has the md gauge, band label and "Based on preliminary text analysis". Right column has the info banner, then the module cards in order: Language Analysis (complete, navigating, chevron-right, opens `/results/:id/language` on click, tap or Enter), then Document Check, Company Verification and Link Safety (locked, not interactive). Below 1024px everything stacks, gauge first.
  - **Summary and labels:** one-sentence summary from the status map, plus the disclaimer and provenance block.
  - **Actions:** Download Full Report (opens `/report/:id`) and Check Another (returns to Verify with a cleared form).
- **Acceptance Criteria:**
  - Band color, icon, label and summary come only from the status map.
  - Provenance and disclaimer are visible.
  - Locked cards show Coming Soon.
  - Language card navigates by keyboard.

### Task 5.5: DEMO_FULL pass (all affected screens)
- **Requirements:** OQ-5, PRD §5, FR-1.4, FR-2.2, FR-3.4, DD §5.3 (DEMO_FULL), DD §4, TS §13.6
- **Description:**
  - **Results layout in `demo_full`:** centred single column, max 800px, lg gauge, summary paragraph, four expandable module cards each with a Simulated chip, then Download Full Report (secondary) and Check Another (primary).
  - **Verify:** show the Analysis Readiness bar.
  - **Analyzing:** the four rows run in sequence.
  - **Report:** simulated modules are labelled Simulated, and the label also appears in print.
  - `APP_MODE=demo_full` is read from one place. `preview` is the default.
- **Acceptance Criteria:**
  - No simulated value appears without a Simulated label, on screen or in print.
  - PREVIEW is unchanged by this task.
  - Other modules expand inline only in `demo_full`.

### Task 5.6: Language Detail (`/results/:id/language`)
- **Requirements:** FR-4.1 to FR-4.6, PRD §8, PRD §11.1, PRD §11.9, DD §5.4, DD §9
- **Description:**
  - **Compact 64px header:** back arrow (returns to the results page, not browser history), title "Why we flagged this", and the analysis ID aligned right.
  - **Context header:** status chip, posting title (h2), company line, and an Export Report button (secondary, goes to `/report/:id`).
  - **Desktop 8/4 grid:**
    - Left: reading pane "Original Listing Text" with a flag-count line, body-lg text and 24px paragraph spacing. Highlights are built from spans as React nodes.
    - Right: sticky sidebar with the Trust Score block (sm gauge, band label, one-line reason), then Detailed Findings cards.
  - **Below 1024px:** the sidebar moves above the reading pane.
  - **Tooltips:** hover, focus **and tap**, dismiss with Escape.
  - **Zero-flag state:** a `secondary` panel, "No fraud patterns detected in this text."
  - **Optional (FR-4.3, low priority):** hovering or focusing a finding highlights its phrase and vice versa.
  - Show provenance, the disclaimer, and the pattern-match label (flags are pattern matches, not model confidence).
- **Acceptance Criteria:**
  - A 12 trust score displays as "Trust Score 12, High Risk", never "Risk 88".
  - Tooltips are reachable without hover.
  - Long unbroken strings do not overflow.
  - User text is never rendered as HTML.

### Task 5.7: Verification report (`/report/:id`)
- **Requirements:** FR-5.1 to FR-5.4, PRD §11.7, OQ-4, DD §5.5, TS §3 (PDF and print)
- **Description:**
  - **Navigation:** "Back to My Checks" link.
  - **Sheet:** `surface-container-lowest`, card radius, max 1024px, a faint 300px shield watermark at 5%.
  - **Sheet order:**
    - Title and meta line (ID, generated time in **local time zone and UTC**).
    - sm gauge with band label.
    - Submitted Content Summary (3-column grid that stacks on mobile).
    - Overall Verdict card (4px `tertiary` left border).
    - Detailed Breakdown, a 2×2 grid of module panels with three findings each. In PREVIEW the non-text modules read "Not run — coming soon", never a pass.
    - Provenance line, disclaimer, and action bar (Print and Download PDF).
  - **Download PDF:** opens the print dialog with a hint to choose Save as PDF.
  - **Print stylesheet:** white background, near-black text, tokens remapped to print colors, borders instead of shadows, top bar, footer and action bar hidden, no page breaks inside module panels, URL footer with the report ID.
  - **No Share button.**
- **Acceptance Criteria:**
  - Print preview is legible in black and white.
  - Provenance and disclaimer appear in print.
  - There is no "Back to Dashboard".
  - Share is absent.

### Task 5.8: My Checks (`/checks`)
- **Requirements:** FR-6.1 to FR-6.4, PRD §11.8, DD §4 (Stat card, Data table, Modal), DD §5.6
- **Description:**
  - **Header:** h1 "My Checks", a lead sentence, and the "Check New Opportunity" button (full width on mobile).
  - **Stat cards:** Total Checks, High Trust, Cautions, In progress (four columns, 2×2 on tablet, one column on mobile), fed by the `GET /api/checks` stats.
  - **Table card:** toolbar with search (title, company or ID, max 384px) and filter chips (All Types, Recent, High Risk) that scroll horizontally on mobile.
  - **Table:** columns Date, Posting (title and company), Source Type ("Multiple" if more than one input), Trust Score chip ("94 · Highly Genuine"), Action ("View Report"). Below 640px, rows become stacked cards.
  - **Row actions** include Delete, with a confirm modal: "Delete this check? This removes the report and cannot be undone." A toast confirms.
  - **Empty state:** shield icon, "No checks yet. Check your first opportunity." and a primary button.
  - **Pagination or infinite scroll** beyond 20 rows.
  - See Open Decision 2 about the Recent filter.
- **Acceptance Criteria:**
  - Search, filters and stats work end to end.
  - Delete removes the row and restores focus.
  - The empty state appears when no checks exist.
  - All four bands render in the chip.
  - No horizontal page scroll at 360px.

### Task 5.9: Static, legal and error pages
- **Requirements:** FR-8, FR-7.2, PRD §6 (Not designed yet), DD §5.7, NFR-5
- **Description:**
  - **How it Works** (`/how-it-works`): a 4-step vertical timeline in cards (Paste, Analyze, Review reasons, Decide), with a note that three more checks are coming.
  - **Privacy Policy** (`/privacy`): must state the 30-day retention and that clearing cookies loses history, in addition to the no-passwords note.
  - **Terms of Service, Security, Support, Resources:** simple placeholder pages in a single card with a readable 720px column. Every footer link must resolve.
  - **404 and global error boundary:** a centred error block, using the shared Error block.
  - A request for another device's check id shows the 404 page.
  - Flag all of these to the designer for review.
- **Acceptance Criteria:**
  - No footer or nav link leads to a dead page.
  - Pages are responsive from 360px.
  - Each has a unique title and one h1.

---

## Phase 6: Final Integration and QA (TS §13.7 to §13.9)

### Task 6.1: Accessibility, responsive and performance pass
- **Requirements:** NFR-1, NFR-2, NFR-3, NFR-4, DD §8, DD §9, DD §12
- **Description:**
  - Run axe-core on every route in both app modes, and fix all serious violations.
  - Do a keyboard-only run: submit a check, open the detail view, expand a finding, open the report, delete a record.
  - Test reduced-motion and no-WebGL runs of the Analyzing view.
  - Test at 360, 390, 768, 1024 and 1440px. Targets are 44px and nothing scrolls sideways.
  - Confirm skip link, landmarks, titles, focus return from modals, and error-focus on submit.
  - Run Lighthouse (mobile) on Verify.
  - Smoke-test the latest two versions of Chrome, Edge, Firefox and Safari, plus iOS Safari 16 or later.
- **Acceptance Criteria:**
  - WCAG 2.2 AA, Lighthouse accessibility 95 or higher, performance 85 or higher.
  - LCP under 2.5s on a mid-range Android over 4G (mobile throttling).
  - The shader does not block first paint.

### Task 6.2: End-to-end and visual tests
- **Requirements:** TS §9, PRD §12, DD §12
- **Description:**
  - **Playwright specs:** Scenario A (genuine, Likely or Highly Genuine), B (scam-with-fee, High Risk with payment, urgency and PII flags), C (under 100 characters blocked), D (service error with Retry, using the failure hook), E (refresh during analysis).
  - **History specs:** search, filter and delete.
  - **Visual:** screenshots at 360, 768 and 1440px for all four bands on Results, Language Detail, Report and My Checks, plus locked and simulated states.
  - **Print:** a print-preview check on the report.
- **Acceptance Criteria:**
  - All specs pass in CI.
  - Trust Score reads higher-is-safer on every screen.
  - No test is skipped.

### Task 6.3: Model service stub and orchestration
- **Requirements:** TS §6, TS §11, G3
- **Description:**
  - **FastAPI service** in `services/model` with `GET /health` and `POST /predict` (takes `{ text }`, returns `{ fraudProbability, modelVersion, truncated }`). Until a checkpoint exists, it answers 503 with a clear message.
  - **Orchestration:** `npm run dev` starts the web app and the model service with `concurrently` and labelled output. If `ANALYZER=mock`, the model process prints that it is idle and the web app works alone.
  - **Remote adapter:** calls `/predict`, validates with Zod, applies the flag rules, and computes trust as `round(100 × (1 − fraudProbability))`, clamped to 0–100. The score cap still applies.
  - **Tests:** unit tests for the remote adapter, including the 503 path.
- **Acceptance Criteria:**
  - `npm run dev` starts both processes.
  - The remote adapter is covered by tests.
  - Switching to the real model needs only the adapter and configuration, with no screen changes.

### Task 6.4: Production configuration
- **Requirements:** TS §8, TS §10, NFR-5
- **Description:**
  - `vercel.json` with the daily purge cron.
  - Function region Mumbai (`bom1`), and database region Mumbai if available, otherwise Singapore (verify when creating).
  - **Security headers** in the Next.js config: strict CSP (self-hosted font and nothing external; confirm nonce or hash handling for Next.js inline scripts), `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors none`.
  - Configure the Vercel Firewall rate-limit rule on `/api/checks`.
  - Production env: `APP_MODE=preview`, `ANALYZER=mock`. Previews may use `demo_full`.
  - Separate preview database or branch.
  - Analytics stay off.
- **Acceptance Criteria:**
  - Deployed to a public Vercel URL with `APP_MODE=preview`.
  - Headers verified on the live response.
  - The cron runs and the rate-limit rule is active.

### Task 6.5: Final review against the Definition of Done
- **Requirements:** PRD §11, PRD §12, DD §12, TS §13.9
- **Description:** Walk PRD §12 and the DD §12 checklist item by item on the live deployment. Confirm all ten known issues in PRD §11 are resolved. Search the code for hex values and arbitrary pixel sizes. Record any open decisions in the PRD and in `docs/PROGRESS.md`, and check that every task in the Task log is marked Done.
- **Acceptance Criteria:**
  - All seven screens and the not-designed pages are built, linked and responsive.
  - Scenarios A to E pass.
  - Provenance and disclaimer are visible wherever a score appears.
  - PREVIEW is the default mode.

---

## Open Decisions

1. **Icons vs strict CSP (TS §3 vs §8; DD §11).** The Design Document suggests Google Fonts `icon_names`, but the Tech Stack's CSP allows nothing external. **Recommendation:** use the npm SVG package only, drop the Google Fonts fallback, and update DD §11 to match. Task 1.3 assumes this.
2. **Redundant "Recent" filter (FR-6.2 vs 30-day retention).** Nearly every stored row is under 30 days old, so the filter does almost nothing. **Needs a product-owner decision:** keep it, or replace it (for example "Last 7 days"). Task 5.8 builds the PRD version until decided.
3. **Success color (OQ-8).** Not a build blocker. DD D-4 already decides that pass states use `secondary` with an icon and a label. Leave OQ-8 open for the designer.
4. **DESIGN.md vs Design Document.** The Design Document wins in all cases: role-based radius (D-1) over the DESIGN.md scale, and a top bar (D-3) instead of the 240px sidebar.
5. **Mock failure hook (Task 3.3).** Scenario D needs a way to force an error. Proposed as a dev and test-only switch. Confirm before building.
6. **Title and company max length (Task 3.1).** The PRD says "length-limited" without a number. 120 characters each is proposed.
7. **CSP and Next.js inline scripts (Task 6.4).** A strict CSP generally needs nonces or hashes. The agent must verify against current Next.js docs.
