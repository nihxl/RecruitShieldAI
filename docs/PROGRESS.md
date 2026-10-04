# RecruitShield AI Progress Log

**Next task:** Task 1.2: Design tokens and typography
**Last updated:** 2026-10-04

## Decisions
- Accounts: Anonymous for now
- Stored data: Result plus submitted text for 30 days
- Share Report: Skipped
- Payment-request rule (OQ-6): Force High Risk (score capped at 39)
- DEMO_FULL (OQ-5): Built as environment switch, off by default
- Constraints: Free tier only
- **OQ-1:** Icons vs strict CSP. Recommendation: use npm SVG package only, drop Google Fonts fallback.
- **OQ-2:** Redundant "Recent" filter. Needs product-owner decision.
- **OQ-3:** Success color. Pass states use secondary with icon and label.
- **OQ-4:** DESIGN.md vs Design Document. Design Document wins (role-based radius, top bar).
- **OQ-5:** Mock failure hook. Scenario D needs a way to force an error. Proposed as dev/test-only switch.
- **OQ-6:** Title and company max length. Proposed 120 characters each.
- **OQ-7:** CSP and Next.js inline scripts. Verify against current Next.js docs.

## Assumptions
- Next.js 15 uses Tailwind v4 setup which no longer requires a `tailwind.config.js` file, so scaffolding `--tailwind` creates the correct v4 setup. We updated the TS §13.1 deps command to use workspaces so Next.js dependencies go to apps/web and other dependencies like concurrently go to root.
- Used npm workspaces directly to manage deps efficiently across the Next.js app and the model service directory.

## Known issues / follow-ups
- (Will log known issues here)

## Task log

| Task | Status | Commit | Notes |
| --- | --- | --- | --- |
| 1.1 Project initialization and monorepo | Done | bcb2ceb | Scaffolded monorepo, web app, configured CI, and installed dependencies |
| 1.2 Design tokens and typography | Pending | | |
| 1.3 Icons and brand assets | Pending | | |
| 1.4 CI/CD and environments | Pending | | |
| 2.1 Navigation and structural shell | Pending | | |
| 2.2 Base interactive elements | Pending | | |
| 2.3 Accessible primitives (Radix wrappers) | Pending | | |
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
- Completed Task 1.1: scaffolded monorepo, web app, configured CI, installed all dependencies, created root scripts and verified all checks (lint, typecheck, test) pass successfully.
