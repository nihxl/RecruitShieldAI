# RecruitShield AI — Product Requirements Document (Frontend)

Oct 4, 2026 · @kkadder

RecruitShield AI is a web app where a job seeker pastes a job post (later also an offer letter, recruiter email and link) and gets a 0–100 Trust Score with plain-language reasons. This PRD defines the Semester 1 build: a complete, deployable frontend in which text analysis is the only live module and everything not yet backed by a trained model is either locked or clearly labelled as simulated.

## 1. How to use this document

This is the source of truth for the Antigravity agent that writes the To-Do list and for the agents that implement it. Visual rules live in the Design Document; stack choices live in the Tech Stack Document (written after a Q&A). Requirement IDs (FR-x, NFR-x, OQ-x) are meant to be cited in the To-Do. Where this PRD and a Stitch HTML file disagree, this PRD wins; the Stitch files are visual references, not code to ship.

## 2. Context and constraints

- **Product:** multi-modal recruitment-fraud detection for the Indian job market (capstone, Group 11). Five planned modules: language analysis (NLP), document check (OCR), company verification, link/QR safety, and a trust-score fusion layer with explainability.
- **Model status:** the NLP model (RoBERTa-based) is not finished or deployed. As currently trained it outputs a single fraud probability for a text; it does not yet produce phrase highlights, named scam patterns or per-pattern confidence, which the Language Detail screen displays. The frontend must therefore be built against a stable contract (section 9) that a mock, a rule engine or the real model can all satisfy.
- **Screens:** seven Google Stitch screens, one WebGL shader, and DESIGN.md are provided (section 6).
- **Delivery:** built in Antigravity, deployed on Vercel.
- **Review audience:** a capstone panel plus real job seekers trying the link, so the product must be honest about what is real.

## 3. Goals and non-goals

**Goals**

1. G1 — A job seeker can paste a posting and see a Trust Score, a verdict and reasons in under 10 seconds of waiting.
2. G2 — Every screen from Stitch exists, is responsive from 360px, and follows the Design Document.
3. G3 — Swapping the mock analyzer for the real model requires changing one adapter, not any screen.
4. G4 — No user can mistake simulated output for a real analysis.
5. G5 — The app is demo-ready for the panel at a public Vercel URL.

**Non-goals (Semester 1)**

- Real OCR, company/WHOIS verification, URL/QR scanning (Semester 2).
- Mobile apps, browser extension, multilingual UI, real-time scam monitoring, recruiter or placement-cell dashboards, payments, admin console.

## 4. Users

| Persona | Need | Implication |
| --- | --- | --- |
| Job seeker (final-year student or fresher, mostly on a phone) | Quick yes/no confidence on a WhatsApp, Telegram or portal job post before sharing documents or money | Mobile-first, minimal typing, plain English, fast |
| Placement-cell officer (secondary) | Screen company offers sent to many students | History and shareable report matter; no separate UI in v1 |

## 5. What is real and what is simulated

Short answer to the open question: yes, parts of the frontend must be dummy, and the design below keeps that safe. Two build modes are controlled by one configuration switch.

- **PREVIEW (default for the public deployment):** only text analysis runs. Document, company and link checks are shown as locked with a Coming Soon badge, matching results\_preview\_text\_only.html. No file uploads are accepted.
- **DEMO\_FULL (for panel demos and screenshots):** all four modules return simulated results and every simulated card carries a visible Simulated badge.

| Capability | v1 source | Rule |
| --- | --- | --- |
| Trust Score from text | Real model endpoint if available, otherwise the mock analyzer | Same contract either way; provenance field says which |
| Highlighted phrases and named flags | Deterministic rule/keyword layer (not the model) | Labelled as pattern matches, not model confidence |
| Document, company, link modules | Locked in PREVIEW; simulated in DEMO\_FULL | Never shown as real results |
| Fusion of module scores | Text-only score in PREVIEW; simulated weighting in DEMO\_FULL | Fusion logic is Semester 2 |
| Analyzing progress animation | Driven by the real request state, with a minimum display time of about 3 seconds so it does not flash | Copy must not promise a fixed duration |
| History | Really stored (mechanism decided in the Tech Stack discussion) | Persisted records include provenance |
| PDF / print report | Real, generated from the stored result | Includes provenance and disclaimer |

**Mock analyzer rules.** It must be deterministic and work on any pasted text, so a live demo never fails: upfront-payment, equipment-fee or wire/transfer wording yields a score below 20 with a payment flag; urgency wording ('urgent start', 'within 24 hours', 'apply immediately') and early requests for bank or ID details add flags and lower the score; clean, specific postings score 75–95; very short or vague text lands in the caution band. Three named fixtures must ship for tests and demos: genuine, scam-with-fee, borderline.

**Honesty rule.** Any value not produced by a trained model or a real service is labelled in the UI (badge or footnote), and the report PDF repeats the label. Pattern flags show a High/Medium/Low severity chip; a percentage Confidence is shown only when the source is a calibrated model output.

## 6. Screens and routes

Routes are proposed; the stack document may adjust syntax but not the URL structure. The results URL must survive a refresh at every stage, including while analysis is running.

| # | Screen | Route | Stitch file | Required changes |
| --- | --- | --- | --- | --- |
| 1 | Verify (submission) | `/` | enhanced\_verification\_submission\_dark\_mode.html | Replace off-system brand-\* colors with tokens; lock non-text sections in PREVIEW; add optional title and company fields |
| 2 | Analyzing | `/results/:id` while status is processing | analyzing\_\_\_.html + shader.html | Embed the shader; make steps reflect real state; remove the fixed 15-second claim |
| 3 | Results, PREVIEW | `/results/:id` | results\_preview\_text\_only.html | Language card navigates to screen 5 |
| 4 | Results, DEMO\_FULL | `/results/:id` | verification\_results\_high\_contrast.html | Replace hard-coded light-theme hex values with tokens; add Simulated badges |
| 5 | Language Detail | `/results/:id/language` | language\_analysis\_detail.html | Show Trust Score (not Risk 88); tap and keyboard tooltips |
| 6 | Verification Report | `/report/:id` | detailed\_verification\_report\_high\_contrast.html | Print stylesheet; Back goes to My Checks |
| 7 | My Checks (history) | `/checks` | my\_checks\_history\_high\_contrast.html | Add posting column, empty state, delete action |

**Not designed yet (must still exist):** How it Works (`/how-it-works`, the nav item has no screen), Sign In / auth screens if accounts are chosen (OQ-1), Privacy Policy / Terms / Security / Support / Resources (simple placeholder pages), 404, and a global error page. These are built from existing components following the Design Document; flag to the designer for review.

## 7. Functional requirements

**FR-1 Submit a check (Verify screen)**

- FR-1.1 Four accordion sections: Job post text, Offer letter, Recruiter email, Link or QR code. In PREVIEW only Job post text is enabled; the others are disabled with a Coming Soon badge and accept no input or files.
- FR-1.2 Job text: required in PREVIEW; minimum 100 characters, maximum 5,000, live counter as in the design; paste handles line breaks. Below the minimum, Check Now stays disabled with a helper message.
- FR-1.3 Optional Job title and Company name inputs inside the first section (proposed addition). Used in report headers and, in Semester 2, company verification. If blank the UI shows 'Untitled posting' and 'Company not provided'; never guess them.
- FR-1.4 The Analysis Readiness progress bar counts live modules only: hidden in PREVIEW, '2 of 4 checks added' in DEMO\_FULL.
- FR-1.5 Near Check Now: one-line notice that text is analysed to produce the score, with a Privacy link, and a warning not to paste passwords, OTPs or bank details.
- FR-1.6 Note that the model works best on English text; do not block other languages.
- FR-1.7 Submitting creates a check, navigates to `/results/:id` and shows the Analyzing view.

**FR-2 Analyzing view**

- FR-2.1 Shield shader inside the 120px circle (see Design Document), with a static SVG shield fallback for no WebGL and for reduced-motion.
- FR-2.2 Checklist rows: Language Analysis (active, then complete). Document Check, Company Verification and Link Safety show as Coming Soon in PREVIEW (not spinning); in DEMO\_FULL they run in sequence.
- FR-2.3 Cancel link that returns to Verify with the text preserved.
- FR-2.4 If analysis exceeds 30 seconds or fails, show an error state with Retry and an option to keep the text. Never leave an endless spinner.

**FR-3 Results dashboard**

- FR-3.1 Header shows 'Analysis Results' and 'Job posting for \<title> at \<company>' using submitted values.
- FR-3.2 Circular gauge animates to the Trust Score; band label, color, icon and one-sentence summary come from the single score-to-band function (section 8).
- FR-3.3 PREVIEW shows the info banner that only text is analysed; locked module cards are not interactive.
- FR-3.4 The Language Analysis card shows a chevron-right icon and navigates to `/results/:id/language` on click, tap or Enter. In DEMO\_FULL the other cards expand inline as in the design.
- FR-3.5 Actions: Download Full Report (opens/downloads the report) and Check Another (returns to Verify with a cleared form).

**FR-4 Language Detail**

- FR-4.1 Reading pane shows the submitted text with flagged phrases highlighted; the right column shows the Trust Score block and the Detailed Findings list (title, severity or confidence, explanation, quoted evidence).
- FR-4.2 Tooltips on highlighted phrases open on hover, keyboard focus and tap.
- FR-4.3 Hovering or focusing a finding highlights its phrase and vice versa (proposed enhancement, low priority).
- FR-4.4 Zero-flag state: a positive 'No fraud patterns detected' panel instead of an empty list.
- FR-4.5 User text is rendered as text, never as HTML; highlights are built from character spans.
- FR-4.6 Export Report goes to screen 6.

**FR-5 Verification report**

- FR-5.1 Header with ID, generated timestamp (local time zone and UTC), Trust Score recap, submitted-content summary, overall verdict paragraph, four module breakdowns, provenance and disclaimer.
- FR-5.2 Print uses a light, ink-friendly stylesheet; Download PDF produces the same content.
- FR-5.3 Share Report is not built in v1 (OQ-4); the button is omitted.
- FR-5.4 In PREVIEW, non-text modules read 'Not run — coming soon', never a fabricated pass.

**FR-6 My Checks**

- FR-6.1 Stat cards: Total Checks, High Trust, Cautions, In progress; table columns: Date, Posting (title and company, proposed addition), Source Type, Trust Score chip, Action. Source Type shows 'Multiple' when more than one input was used.
- FR-6.2 Search by title, company or ID; filters All Types, Recent (last 30 days) and High Risk (band High Risk).
- FR-6.3 View Report opens screen 5 or 6 for that record. Delete a check with confirmation (proposed; privacy).
- FR-6.4 Empty state with a Check New Opportunity button; pagination or infinite scroll beyond 20 rows.

**FR-7 Navigation and chrome**

- FR-7.1 One shared top bar: Verify, How it Works, My Checks (the designs call it Reports; use My Checks everywhere), and no auth button in v1 (anonymous use, OQ-1). Active item is highlighted; a hamburger menu appears below 768px on every screen.
- FR-7.2 One shared footer; the copyright year is computed, not hard-coded.
- FR-7.3 Task-focused screens (Language Detail) may use the compact back header as designed.

**FR-8 Errors, empty and loading states.** Every screen needs a loading skeleton or spinner, an error state with a retry action, and an empty state where lists can be empty. Validation errors appear inline next to the field.

## 8. Trust Score definition

- Scale 0–100 on every screen. **Higher always means safer.** Language Detail currently shows 'Risk Assessment 88 / Critical Risk'; it must show Trust Score 12 / High Risk instead. No screen may display a risk score.
- v1 computation: trust = round(100 × (1 − fraud probability)), clamped to 0–100, from the text classifier only. Fusion with other modules is Semester 2. Override (OQ-6): if the rule layer detects an upfront-payment request, the score is capped at 39 (High Risk) whatever the model says, and the flag explains why.
- The model was trained on a corpus with about 6% fraud, so probabilities are not calibrated to real-world base rates. The UI calls the output a risk estimate, never a verdict, and the ML team owns threshold tuning.

| Band | Score | Label | Color role | Icon |
| --- | --- | --- | --- | --- |
| 1 | 90–100 | Highly Genuine | secondary | verified |
| 2 | 70–89 | Likely Genuine | secondary | check\_circle |
| 3 | 40–69 | Caution Advised | tertiary | warning |
| 4 | 0–39 | High Risk | error | gpp\_maybe |

These bands match every example in the Stitch screens (94, 88, 72, 42, 12) and are provisional. Band, color, icon, label and summary text live in one shared module that every screen imports. Color is never the only signal: each band always shows its icon and label.

## 9. Analysis result contract

The mock, the rule engine and the real model must all return this shape. Screens read only this contract.

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Format `RS-` + 4 digits + `-` + 3 alphanumerics, e.g. RS-9482-11A, shown identically on every screen |
| createdAt | ISO timestamp |  |
| mode | `preview` or `demo_full` |  |
| status | `processing`, `complete`, `error` | Drives the Analyzing view |
| input | object | jobText, jobTitle?, companyName?, charCount, truncated (true if the model saw only the first 512 tokens) |
| trustScore | integer 0–100 |  |
| band | enum | One of the four bands in section 8 |
| summary | string | One-sentence verdict |
| modules\[\] | array | Each: key (`language`, `document`, `company`, `link`), status (`complete`, `locked`, `simulated`, `error`), verdict (`pass`, `caution`, `fail`, null), headline, findings\[\] |
| languageDetail.flags\[\] | array | Each: id, type, title, severity (`high`, `medium`, `low`), confidence (0–1, optional), description, quote, span {start, end} in jobText |
| provenance | object | source (`model`, `rules`, `mock`), modelVersion, generatedAt |
| disclaimer | string | Shown on results and report |

Starter flag types, to be aligned with the ML team: upfront\_payment (fees, deposits, equipment, wiring), artificial\_urgency, premature\_pii, unrealistic\_compensation, off\_platform\_contact (WhatsApp or Telegram only), vague\_role. Phrase-level evidence from the real model (token attribution or SHAP) is a later upgrade behind the same contract.

## 10. Non-functional requirements

- **NFR-1 Performance:** mobile Lighthouse performance 85 or higher; Largest Contentful Paint under 2.5 s on a mid-range Android over 4G; the shader must not block first paint.
- **NFR-2 Accessibility:** WCAG 2.2 AA; Lighthouse accessibility 95 or higher; full keyboard use; visible focus; gauge exposed to screen readers with its value and label; animations respect prefers-reduced-motion.
- **NFR-3 Responsive:** supported from 360px to 1440px; no horizontal page scroll; tables scroll inside their container.
- **NFR-4 Browsers:** latest two versions of Chrome, Edge, Firefox and Safari, plus iOS Safari 16 and later.
- **NFR-5 Privacy and security:** HTTPS only; no secrets in client code; the analysis endpoint is rate-limited; job text is never written to logs or analytics; stored text has a defined retention (OQ-2); user content is escaped everywhere.
- **NFR-6 Language:** English UI and English-text analysis in v1.
- **NFR-7 Maintainability:** one design-token source, shared components, no per-page duplicated configuration.

## 11. Known issues the build must resolve

1. Trust Score direction differs on Language Detail (section 8).
2. The shield shader is not embedded in the Analyzing screen (the 64px container is empty).
3. The Language Analysis card does not navigate to the detail view.
4. The Verify screen uses brand-dark, brand-teal and brand-mint, which are not in DESIGN.md.
5. Results and Report screens hard-code light-theme hex values (#d8faff, #006b5f) on a dark theme; the mint-on-dark ring is nearly invisible.
6. Auth labels are inconsistent (Sign In, Log In, Get Started) and the nav item Reports should be My Checks.
7. Report says 'Back to Dashboard' but no dashboard exists.
8. Footers say 2024 and sample dates say 2023; IDs use two formats.
9. Tooltips are hover-only, and the analyzing copy promises 15 seconds.
10. Prototypes load Tailwind from a CDN with a config copied into every page; none of this may ship.

## 12. Definition of done for Semester 1

- All seven screens plus the not-designed pages in section 6 are built, linked and responsive.
- Scenario A (genuine fixture) ends in a Likely or Highly Genuine band; B (scam-with-fee) ends in High Risk with at least the payment, urgency and PII flags; C (text under 100 characters) is blocked with a clear message; D (analysis service unavailable) shows the error state with Retry; E (page refresh during analysis) resumes correctly.
- Provenance and disclaimer are visible wherever a score appears.
- Switching from mock to the real model needs only the analyzer adapter plus configuration.
- Deployed to a public Vercel URL, with PREVIEW as the default mode.

## 13. Open questions

| ID | Question | Where it is resolved |
| --- | --- | --- |
| OQ-1 | Resolved: anonymous use with per-device history, no accounts in v1; the auth button is left out of the top bar. | Tech Stack Q&A |
| OQ-2 | Resolved: store the result and the submitted text for 30 days, then delete. | Tech Stack Q&A |
| OQ-3 | Resolved for v1: mock analyzer only; the real model comes later (see the Tech Stack Document). | Tech Stack Q&A |
| OQ-4 | Resolved: skipped in v1; Share Report is not built. | Tech Stack Q&A |
| OQ-5 | Resolved: yes, DEMO\_FULL is built as an environment switch; the public deployment defaults to PREVIEW. | Product owner |
| OQ-6 | Resolved: yes, an upfront-payment flag caps the Trust Score at 39 (High Risk). | ML team + product owner |
| OQ-7 | Confirm band thresholds after model calibration. | ML team |
| OQ-8 | Should the designer add a green success token? Today pass states use the secondary steel-teal. | Designer |

## 14. Out of scope until Semester 2

OCR document check, WHOIS and typosquat company verification, URL/QR analysis with threat-intelligence APIs, the fusion layer with SHAP explanations, multilingual support, browser extension, mobile apps, and recruiter or institution dashboards.
