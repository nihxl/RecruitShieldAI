# RecruitShield AI — Design Document (Frontend)

Oct 4, 2026 · @kkadder

This document turns DESIGN.md and the seven Google Stitch screens into build rules: tokens, components, per-screen specs, motion, accessibility and microcopy. The look is a calm, dark, Public Sans interface that signals security without alarm. Where DESIGN.md and a Stitch HTML file disagree, the decisions in section 1 apply; behaviour and scope come from the PRD.

## 1. Source hierarchy and design decisions

Priority order: this document, then DESIGN.md, then the Stitch HTML. The HTML is a visual reference only; its CDN Tailwind script, per-page config and inline hex values must not be copied.

| ID | Decision | Why |
| --- | --- | --- |
| D-1 | Radius is set by role, not by the Tailwind scale: controls 8px (buttons, inputs, tags), items 12px (finding cards, module rows, tooltips), cards 24px (main containers), pills full (badges, filter chips, status chips). | DESIGN.md says 8px controls and 24px containers, but the Stitch config maps rounded-lg and rounded-xl to 8px and 12px, so the two sources conflict. Role-based tokens remove the ambiguity. |
| D-2 | Dark theme only. The `light dark` class on two screens is ignored. A separate print stylesheet renders the report on white. | DESIGN.md defines only a dark palette. |
| D-3 | Top navigation bar on every page. The 240px sidebar in DESIGN.md is not used. | Every Stitch screen uses a top bar. |
| D-4 | Status colors: pass uses secondary, caution uses tertiary, danger uses error. Every status always pairs color with an icon and a text label. | The palette has no green or amber, and secondary and tertiary have almost identical luminance (contrast 1.0), so color alone cannot separate them. See OQ-8 in the PRD. |
| D-5 | Primary button is `primary` fill with `on-primary` text (7.76:1). `primary-container` fill is for low-emphasis selected states only. | White on primary-container is 4.50:1, the AA minimum, and the screens use both buttons inconsistently. |
| D-6 | Input and control borders use `outline`, not `outline-variant`. | outline-variant on the surface is 1.98:1, below the 3:1 needed for UI component boundaries. outline is 5.85:1. |
| D-7 | One logo treatment: the Material Symbols `shield_person` icon (filled, primary) plus the wordmark 'RecruitShield AI' in h3 bold. | The screens use security, shield\_person or nothing. |

## 2. Brand and tone

- Pillars from DESIGN.md: Security, Transparency, Reassurance. Optimise for low anxiety: generous space, one idea per card, no flashing or red walls.
- Voice: plain, calm, specific. Say 'risk estimate', 'matches patterns seen in scam postings', 'we could not verify'. Avoid absolutes such as 'this is a scam' and avoid exclamation marks.
- High Risk results are serious but never panicked: error color on a small icon, chip and gauge only, with the neutral dark surface behind.
- Anything simulated or not yet available is stated plainly (section 10).

## 3. Design tokens

There is one token source. Names follow DESIGN.md and the Stitch config so the Stitch markup maps over directly. Define them once in the theme configuration; no page may declare its own.

### 3.1 Color roles in use

| Role | Hex | Used for |
| --- | --- | --- |
| surface / background | #0f1415 | Page background |
| surface-container-lowest | #0a0f10 | Footer, report sheet, table card |
| surface-container-low | #171c1d | Primary cards, form card, reading pane |
| surface-container | #1b2021 | Module rows, finding cards, stat cards |
| surface-container-high | #262b2c | Hover state, gauge track, active row |
| surface-container-highest | #313637 | Textarea fill, neutral badges, progress track |
| on-surface | #dfe3e4 | Primary text |
| on-surface-variant | #c0c8ca | Secondary text (10.9:1 on the page) |
| outline | #8a9294 | Control borders, placeholder, disabled text |
| outline-variant | #40484a | Dividers and decorative borders only |
| primary | #9ecfda | Brand, primary buttons, links, focus ring |
| on-primary | #00363e | Text on primary |
| primary-container / on-primary-container | #4e7e88 / #ffffff | Selected pill, hover fills |
| secondary | #b2cbd0 | Pass and genuine states |
| tertiary | #abc9ee | Caution states, info banner |
| tertiary-container | #5b799a | Tooltip fill, highlighted-phrase tint (15%) |
| error / error-container / on-error-container | #ffb4ab / #93000a / #ffdad6 | High Risk states |

All other roles in DESIGN.md remain available in the theme but should not be needed. Forbidden: hex values in components, the Stitch brand-dark, brand-teal and brand-mint colors, and the light-theme values #d8faff and #006b5f (the latter is 2.89:1 on the page).

### 3.2 Status map

| State | Color role | Icon (Material Symbols) | Chip text |
| --- | --- | --- | --- |
| Highly Genuine (90–100) | secondary | verified | Highly Genuine |
| Likely Genuine (70–89) | secondary | check\_circle | Likely Genuine |
| Caution Advised (40–69) | tertiary | warning | Caution Advised |
| High Risk (0–39) | error | gpp\_maybe | High Risk |
| Locked / not run | outline | lock | Coming Soon |
| Simulated | tertiary outline | science | Simulated |
| Error | error | error | Something went wrong |

Chip fill is the role color at 15% opacity over the card, a 1px border at 40%, and text in the role color. Filled icons are used for status; outlined icons for navigation.

### 3.3 Typography (Public Sans 400, 600, 700)

| Token | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| h1-desktop | 48/1.2, -0.02em | 700 | Hero title (Verify), My Checks title |
| h1-mobile | 32/1.2 | 700 | Same, below 768px |
| h2-desktop | 36/1.3 | 600 | Page titles; 28px below 768px (proposed step-down) |
| h3-desktop | 24/1.4 | 600 | Card and section titles; 20px below 768px |
| body-lg | 18/1.6 | 400 | Lead paragraphs, reading pane |
| body-md | 16/1.6 | 400 | Default body |
| body-sm | 14/1.5 | 400 | Meta text, helper text, findings |
| label-caps | 12/1.0, 0.05em, uppercase | 600 | Table headers, field labels, metadata |
| button | 16/1.0 | 600 | Buttons and nav links |

The gauge number is 48px bold (large gauge uses 64px). No text smaller than 12px. Load only weights 400, 600, 700 with display swap.

### 3.4 Spacing, layout, radius, elevation

- 8px rhythm. Tokens: xs 4, base 8, sm 12, md 24, lg 48, xl 80, gutter 24, margin-mobile 16, margin-desktop 40, container-max 1280.
- Radius tokens: control 8, item 12, card 24, pill 9999 (D-1).
- Level 0 is the page surface. Level 1 cards: `0 4px 24px rgba(0,0,0,0.20)`. Level 2 hover and modals: `0 8px 32px rgba(0,0,0,0.32)`. The teal-tinted shadows in the history and report screens are invisible on dark and are replaced by these.
- Top bar: surface at 80% opacity with a 12px backdrop blur and a 1px outline-variant bottom border at 30%.
- Focus ring on every interactive element: 2px primary outline, 2px offset. Input focus adds the 4px primary glow at 15% opacity from DESIGN.md.

## 4. Components

| Component | Variants and states | Spec |
| --- | --- | --- |
| Top bar | desktop, mobile (menu), active item | Height 80px (64px on Language Detail's compact header). Wordmark left; links Verify, How it Works, My Checks; no auth action in v1 (anonymous use). Active link: primary text with a 2px primary underline. Below 768px: hamburger opening a full-width sheet. |
| Footer | single | Surface-container-lowest, wordmark, tagline 'Protecting job seekers through transparency and AI', links Resources, Privacy Policy, Security, Terms of Service, Support. Year computed. |
| Button | primary, secondary, text, destructive; default, hover, active, disabled, loading | 8px radius, 48px minimum height, 16px 600 text. Primary: D-5. Secondary: transparent, 1px primary border, primary text. Text: primary text, no border. Destructive: error text with error border. Disabled: 40% opacity and no shadow. Loading: spinner replaces icon and the label stays. Press scale 0.98. |
| Text input and textarea | default, focus, error, disabled | Fill surface-container-highest, 1px outline border, 8px radius, 16px text, label-caps label above. Error: error border and a body-sm message with an error icon. Textarea shows a live N/5000 counter bottom right, which turns error color at the limit. |
| Accordion section | collapsed, expanded, locked, added | 24px padding. 40px circular icon well (surface-container; primary icon when active). Title body-md 600, subtitle body-sm. Chevron rotates 180° over 200ms. 'Added' shows a small mint-free check badge in secondary. Locked: 60% opacity, lock icon, Coming Soon chip, no chevron, not focusable as a button. |
| Trust gauge | sm (64px), md (192px), lg (256px) | One SVG, viewBox 100, r 40, stroke 8, round caps, rotated -90deg. Track surface-container-high. Arc color from the band. Dash array = score × 2.512 then 251.2. Animates 1s ease-out from 0 on mount. Centre: score number, label-caps 'SCORE' and, on lg only, the band chip. |
| Module card | pass, caution, fail, locked, simulated, error; expandable or navigating | Item radius 12, surface-container, 4px left border in status color for alert states, status icon in a 32px pill well, title h3 (20px), one-line summary body-sm. Expandable: chevron-down, content animates over 300ms and the header is a real button with aria-expanded. Navigating: chevron-right, whole card is a link. Locked: lock icon, outline colors, no hover. |
| Finding card | high, medium, low | Item radius 12, surface-container. Row: icon, title (body-md 600), severity chip or Confidence chip. Then description (body-sm), then a quote block: background surface, 2px left border tertiary-container, italic body-sm. |
| Highlighted phrase | default, hover or focus, active | `mark`-style span: tertiary-container at 15% fill, dotted 1px tertiary-container underline. Hover, focus and tap raise fill to 30% and show a tooltip (tertiary-container fill, on-tertiary-container text, 4.52:1) above the phrase with an arrow. Tooltip stays inside the viewport and is dismissible with Escape. |
| Info banner | info, caution | tertiary-container at 20% fill, 1px border at 30%, info icon, body-sm text in tertiary-fixed-dim. |
| Stat card | total, high trust, caution, in progress | Card 24 radius, 24px padding, round icon well, label-caps label, h2 number. Left border 4px: secondary for High Trust, tertiary for Cautions, outline for In progress. |
| Data table | desktop; mobile card list | label-caps headers on surface-container-highest at 50%, 24px cell padding, row hover surface-container at 40%, dividers outline-variant at 20%. Below 640px each row becomes a stacked card with the same fields. |
| Chips and badges | status, filter, neutral | Pill, label-caps or body-sm 600. Filter chip selected: primary-container fill and on-primary-container text; unselected: surface with outline border. Neutral: surface-container-highest with on-surface-variant text. |
| Progress bar | determinate | 6px high pill, track surface-container-highest, fill primary, width transition 500ms. |
| Modal and toast | confirm delete, snackbar | Modal: card radius, level 2 shadow, scrim black at 60%, focus trapped, Escape closes. Toast: bottom centre, surface-container-high, 4 seconds, polite live region. |
| Skeleton and empty or error blocks | loading, empty, error | Skeleton: surface-container-high blocks with a slow opacity pulse. Empty and error blocks: centred icon in a 48px well, h3 title, body-sm text, one primary action. |

## 5. Screen specifications

Grid: 12 columns on desktop (1024px and above) with 24px gutters, 4 columns on mobile with 16px margins. Page container max 1280px; page margins 40px desktop, 16px mobile.

### 5.1 Verify (`/`)

- Hero band: title 'Know before you apply' (h1), one lead sentence, subtle radial primary glow at about 10% opacity. Use surface-container-lowest as the band background, not the Stitch brand-dark.
- Form card overlaps the hero by about 80px; max width 672px, card radius, level 1 shadow. Sticky header inside the card shows 'Analysis Readiness' and the progress bar (DEMO\_FULL only).
- Accordion order: Job post text, Offer letter, Recruiter email, Link or QR code. First section opens by default. In PREVIEW sections 2–4 are locked.
- Job post section: optional Job title and Company name fields side by side (stacked on mobile), then the textarea (min height 128px, grows to 320px), then the counter and the helper line with the privacy and no-passwords notice.
- Check Now: full-width primary button with filled security icon, in a footer strip of the card. Disabled until FR-1.2 is satisfied; when loading it shows the spinner.

### 5.2 Analyzing (`/results/:id` while processing)

- Centred card, max width 480px, card radius, 48px padding, over a 600px primary glow blurred 100px at 5%.
- Top: 120px circular well (surface-container, 1px outline-variant at 30%) containing the shield shader (section 6) and a slow ping ring.
- Title 'Analyzing posting' (h2), line 'This usually takes a few seconds.'
- Checklist rows: 12px padding, 8px gap. Complete: check\_circle in a primary 10% pill. Active: spinning progress\_activity, row on surface-container-high with a primary 20% border. Pending or locked: outline dot, 60% opacity, with Coming Soon chip in PREVIEW. Rows fade up with a stagger of 0.1s.
- Footer: text button 'Cancel'. After 30 seconds swap the card contents for the error block with Retry.
- The checklist is an `aria-live=polite` region announcing step changes.

### 5.3 Results (`/results/:id`)

- PREVIEW (reference: results\_preview\_text\_only.html): header 'Analysis Results' and the posting line. Desktop is a 4/8 split: left card with the md gauge, band label and caption 'Based on preliminary text analysis'; right column with the info banner, module cards and the action buttons right-aligned. Below 1024px everything stacks, gauge first.
- Module order: Language Analysis (complete, navigating, chevron-right), then Document Check, Company Verification, Link Safety (locked).
- DEMO\_FULL (reference: verification\_results\_high\_contrast.html): centred single column, max width 800px, lg gauge, summary paragraph, four expandable module cards with Simulated chips, then Download Full Report (secondary) and Check Another (primary).
- Gauge color, label and summary text come only from the status map.

### 5.4 Language Detail (`/results/:id/language`)

- Compact header (64px) with back arrow, title 'Why we flagged this', and the analysis ID aligned right. Back returns to the results page, not browser history.
- Context header: status chip (for example High Risk), posting title (h2), company and location line, Export Report button (secondary).
- Desktop 8/4 grid. Left: reading pane card (card radius) titled 'Original Listing Text' with a flag-count line, body-lg text, 24px paragraph spacing, a faint primary glow in the corner. Right: sticky sidebar with a Trust Score block (sm gauge, band label, one-line reason) followed by 'Detailed Findings' finding cards.
- Below 1024px the sidebar moves above the reading pane; tooltips become tap-to-open.
- Zero-flag state replaces the findings list with a secondary-colored panel: 'No fraud patterns detected in this text.'

### 5.5 Verification Report (`/report/:id`)

- 'Back to My Checks' link, then a sheet (surface-container-lowest, card radius, max width 1024px, 48 to 80px padding) with a faint 300px shield watermark at 5% in the corner.
- Sheet order: title and meta line (ID, generated time), sm gauge with band label, divider, Submitted Content Summary (3-column grid, stacks on mobile), Overall Verdict card (4px tertiary left border, info icon), Detailed Breakdown (2×2 grid of module panels with three bullet findings each, status icons per bullet), provenance line, disclaimer, action bar (Print, Download PDF).
- Print stylesheet: white background, near-black text, tokens remapped to print colors, borders instead of shadows, top bar, footer and action bar hidden, page breaks avoided inside module panels, URL footer with the report ID.

### 5.6 My Checks (`/checks`)

- Header: h1 'My Checks', lead sentence, primary button 'Check New Opportunity' with add\_circle icon (full width on mobile).
- Stat row: four cards on desktop, 2×2 on tablet, single column on mobile.
- Table card: toolbar (search field max 384px; All Types, Recent and High Risk filter chips that scroll horizontally on mobile), then the table with columns Date, Posting, Source Type, Trust Score chip, Action ('View Report' text button).
- Trust Score chip format: '94 · Highly Genuine' using the status map. Row actions menu includes Delete with a confirm modal. Empty state: shield icon, 'No checks yet', primary button.

### 5.7 Pages without Stitch screens

How it Works: a 4-step vertical timeline (Paste, Analyze, Review reasons, Decide) in cards, with a note that three more checks are coming. Legal and support pages: a single card with a readable 720px column. 404 and global error: centred error block. Sign In, if built: a 420px card with two inputs and a primary button. All follow section 4 and need designer review.

## 6. Shield shader integration

Source: shader.html (full-screen WebGL canvas with a pulsing glow, primary color 0.62, 0.81, 0.85). The Analyzing screen has an empty 64px box where it belongs.

- Container: the 120px circular well, `overflow: hidden`, canvas filling a 96px inner square. Add a static `shield` Material Symbol (filled, primary, 32px) centred above the canvas so the shield identity reads even though the shader draws a pulsing glow.
- Size the canvas from its container, not the window, and cap devicePixelRatio at 2. Remove the mouse uniform and the window mousemove listener; they are unused.
- Fix the output: `glow` can exceed 1, so clamp the colour; use `getContext('webgl', { alpha: true, premultipliedAlpha: false })` or output premultiplied values so the edges do not look washed out on the dark well.
- Check shader compile and link status and log failures. On any failure, or when WebGL is missing, show the static SVG shield with a CSS pulse instead.
- Respect reduced motion: render one frame (or the static SVG) with no loop.
- Pause the animation loop when the tab is hidden or the element is off screen. On unmount cancel the animation frame and release the GL context.
- Do not load the shader code on any route except the Analyzing view.

## 7. Motion

| Element | Motion | Duration and easing |
| --- | --- | --- |
| Trust gauge arc | Draws from 0 to value on first render | 1000ms ease-out |
| Analyzing rows | Fade up 10px, staggered 0.1s, 0.3s, 0.5s, 0.7s | 600ms ease-out |
| Accordion and expandable cards | Height reveal, chevron rotate | 200–300ms ease-out |
| Hover and focus colors | Background and color change | 200ms |
| Buttons | Press scale 0.98 | 150ms |
| Page transitions | None beyond fade in | 150ms |

Under prefers-reduced-motion: no arc draw, no stagger, no ping ring; keep state changes as instant or 100ms fades. Looping animation is limited to the spinner and the shader.

## 8. Responsive behaviour

- Breakpoints: 640 (sm), 768 (md), 1024 (lg). Test at 360, 390, 768, 1024, 1440.
- Below md: hamburger nav, h1-mobile, h2 28px, h3 20px, 16px margins, buttons full width when they are the only action in a row.
- Wide content (table, code, long words) scrolls or wraps inside its container; there is never a horizontal page scroll. Long unbroken strings in the reading pane use word-break.
- Touch targets are at least 44px square, including icon buttons and chips.

## 9. Accessibility

Measured contrast on the real token pairs: on-surface 14.4:1, on-surface-variant 10.9:1 on the page and 8.4:1 on surface-container-high, primary 10.9:1, secondary 9.7:1, tertiary 9.7:1, error 9.7:1, outline 5.85:1, on-primary on primary 7.76:1. Text on tertiary-container is 4.52:1, so tooltip text stays at 14px or larger and never gets smaller.

- Status is never color-only (D-4): icon plus text label in every chip, card and gauge.
- Trust gauge: `role=meter` with min 0, max 100, now = score and a label such as 'Trust score 72 out of 100, Likely Genuine'. The arc is decorative.
- Highlighted phrases are focusable (`tabindex=0`), tooltips use `role=tooltip` with `aria-describedby`, and the same information appears in the findings list, so nothing depends on hover.
- Accordions and expandable cards use real buttons with `aria-expanded` and `aria-controls`. Locked sections use `aria-disabled=true` and expose the Coming Soon text.
- One h1 per page, logical heading order, a skip-to-content link, landmarks for nav, main and footer, and a unique document title per route (for example 'Analysis Results — RecruitShield AI').
- Form fields have programmatic labels, errors are tied with `aria-describedby`, and focus moves to the first error on submit.
- Modals trap focus and return it to the trigger on close.

## 10. Microcopy

| Where | Text |
| --- | --- |
| Verify hero | Know before you apply. Paste a job post and get a risk estimate in seconds. |
| Text-only helper | Text analysis is available now. Document, company and link checks are coming soon. |
| Privacy line near Check Now | We analyse your text to produce this score. Don't paste passwords, OTPs or bank details. Privacy Policy |
| Coming Soon tooltip | This check is under development and will arrive in a later release. |
| Simulated badge tooltip | Example result for demonstration. Not based on a real check. |
| Highly Genuine summary | This posting looks very consistent with genuine job listings. |
| Likely Genuine summary | No common fraud patterns found, though this is an estimate. Verify the company independently before sharing documents. |
| Caution Advised summary | Some signals need a closer look. Confirm the recruiter and company before you share personal details or pay anything. |
| High Risk summary | This posting matches patterns commonly seen in scams. Do not pay fees or share bank or ID details. |
| Disclaimer | RecruitShield AI gives a risk estimate, not a guarantee. Always verify an employer through official channels. |
| Short input error | Add at least 100 characters so we can analyse the posting. |
| Analysis failed | We couldn't complete the analysis. Your text is still here. Try again. |
| Zero flags | No fraud patterns detected in this text. |
| Empty history | No checks yet. Check your first opportunity. |
| Delete confirm | Delete this check? This removes the report and cannot be undone. |

## 11. Assets and icons

- Icons: Material Symbols Outlined only. Request only the icons used (Google Fonts supports an icon\_names list) so the font stays small. Fill is 1 for status and brand icons, 0 for navigation.
- Fonts: Public Sans 400, 600, 700 with display swap. Material Symbols must not cause layout shift; reserve a 24px box for icons.
- Favicon and share image: the filled shield on surface with primary color; wordmark only for the share image.
- Images: none required. Illustrations, if added, must be simple line style in the primary and secondary colors.

## 12. Design QA checklist

1. Every color, radius, shadow and font size resolves to a token (search the code for hex values and arbitrary pixel sizes).
2. All four score bands are screenshot-tested on results, language detail, report and history.
3. Trust Score reads higher-is-safer on every screen.
4. Keyboard-only run: submit a check, open the detail view, expand a finding, open the report, delete a record.
5. Reduced-motion and no-WebGL runs of the Analyzing screen.
6. 360px width: nothing clips, nothing scrolls sideways, targets are 44px.
7. Print preview of the report is legible in black and white.
8. Locked and Simulated states are visible wherever the PRD requires them.
