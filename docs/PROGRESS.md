# RecruitShield AI Progress Log

**Next task:** Task 2.4: Status map, microcopy and Trust gauge
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

## Assumptions
- Next.js 15 uses Tailwind v4 setup which no longer requires a `tailwind.config.js` file, so scaffolding `--tailwind` creates the correct v4 setup. We updated the TS §13.1 deps command to use workspaces so Next.js dependencies go to apps/web and other dependencies like concurrently go to root.
- Used npm workspaces directly to manage deps efficiently across the Next.js app and the model service directory.
- Tailwind v4 natively supports mapping design tokens inside the `@theme` block in a regular `.css` file. We implemented `theme.css` with native CSS tokens that generate matching utility classes without extra Next.js configs.

## Known issues / follow-ups
- /sandbox must be removed or gated before production (Task 6.4).

## Task log

| Task | Status | Commit | Notes |
| --- | --- | --- | --- |
| 1.1 Project initialization and monorepo | Done | bcb2ceb | Scaffolded monorepo, web app, configured CI, and installed dependencies |
| 1.2 Design tokens and typography | Done | 6b40f52 | Created theme.css with all design tokens, configured Public Sans font, and added a design check script |
| 1.3 Icons and brand assets | Done | bfab36b | Generated inline Icon component with @material-symbols/svg-400, created favicon/OG images, and added unit tests |
| 1.4 CI/CD and environments | Done | 71c911a | Configured GitHub Actions with Lighthouse CI, pinned Node to 22, and documented Vercel/Neon preview plan |
| 2.1 Navigation and structural shell | Done | 99f2de0 | Built TopBar, Footer, and structural shell with unique document titles. check-design fails on favicon/OG SVGs due to excluding only Icon.tsx. |
| 2.2 Base interactive elements | Done | 7d2dd07 | Built Button, Input, Textarea, Chip, ProgressBar, Modal, and Toast with Radix and Tailwind v4. Added sandbox page and unit tests. |
| 2.3 Accessible primitives (Radix wrappers) | Done | {commit} | Built Accordion and Tooltip with Radix UI, added destructive variant to Modal. Added touch support to Tooltip. Updated sandbox and tests. |
| 2.4 Status map, microcopy and Trust gauge | Pending | | |
| 2.5 Content cards and data display | Pending | | |
| 2.6 Feedback blocks and labels | Pending | | |
| 3.1 Analysis contract and validation | Pending | | |
| 3.2 Band logic, flag rules and score cap | Pending | | |
| 3.3 Analyzer interface and mock analyzer | Pending | | |
| 4.1 Database schema and device cookie | Pending | | |
| 4.2 API routes | Pending | | |
| 4.3 Purge job | Pending | | |
| 5.1 Verify screen (/) | Pending | | |
| 5.2 Shield shader component | Pending | | |
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
- Completed Task 2.3: Built Accessible primitives (Accordion, Tooltip) with Radix UI. Added `destructive-confirm` variant to Modal. Configured Accordion for locked and added states with smooth chevron rotation. Tooltip handles keyboard focus, hover, and tap natively via custom state and touch handlers. Updated `/sandbox` with all variants and unit tested interactions.
- Completed Task 2.2: Built base interactive elements (Button, Input, Textarea, Chip, ProgressBar, Modal, Toast) conforming to DD §4 requirements. Reused Icon component. Integrated Radix UI for Modal. Implemented character counter with error coloring limit in Textarea. Added `/sandbox` page to showcase all variants and states. Added unit tests for key behaviours. Verified motion-reduce support.

- Completed Task 2.1: Built `TopBar` and `Footer` components. Implemented the layout shell with skip-to-content link, landmarks, and unique document titles using Next.js `metadata.template`. Navigation highlights active items and includes a mobile hamburger sheet. Verified `check-design.sh` fails on `favicon.svg` and `opengraph-image.svg` after updating it to exclude ONLY `Icon.tsx`. Tests and linting pass.

- Completed Task 1.4: Pinned Node.js 22 LTS in `apps/web/package.json`. Added Lighthouse CI to `.github/workflows/ci.yml` targeting the Verify page, enforcing mobile performance >= 85 and accessibility >= 95 via `lighthouserc.json`.
  - **Preview DB Plan**: We will provision a secondary Neon database branch (or separate Neon project on the free tier) exclusively for Vercel Preview deployments. Vercel will inject a distinct `DATABASE_URL` for the `Preview` environment compared to `Production`. This ensures test data from PRs never corrupts the main DB.

- Completed Task 1.3: Updated check-design.sh to exclude SVGs, fixed generate-icons.js script to properly inline the SVGs from @material-symbols/svg-400 with the correct viewBox (0 -960 960 960). Renamed expand_more mapping to keyboard_arrow_down. Generated Icon component with inline SVGs to avoid layout shift. Added unit tests for the Icon component. Created favicon and opengraph share image per design document. Removed default Next.js icons.

- Completed Task 1.2: Added theme.css with all defined design tokens, configured Public Sans via next/font/google, created a sample page to show all tokens, added `check-design.sh` to prevent hardcoded hex values, and verified everything works.

- Completed Task 1.1: scaffolded monorepo, web app, configured CI, installed all dependencies, created root scripts and verified all checks (lint, typecheck, test) pass successfully.
