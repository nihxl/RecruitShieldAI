# Rules for Coding Agents

1. Read the PRD, Design Document and Tech Stack Document first; cite requirement IDs (for example FR-4.2) in commits and the To-Do.
2. Check the current official docs before installing or using Next.js, Tailwind, Drizzle, Radix and the icon package; versions and API names change.
3. Never copy the Stitch CDN script, per-page Tailwind config or inline hex colors. Everything resolves to the theme tokens.
4. Build the shared pieces once: band and status map, gauge, module card, finding card, top bar and footer.
5. When the PRD is silent or contradictory, stop and ask rather than invent behaviour; record the answer in the PRD.
6. Run lint, type check and tests before declaring a task done; no skipped tests.
7. **Progress log:** `docs/PROGRESS.md` is the project's memory. At the start of every session, read it first and continue from "Next task". A task is not done until the log is updated and committed with the code. At the end of every task:
   - mark the task Done with the commit hash;
   - list what was built and verified (tests run, screens checked);
   - record every assumption made;
   - record every decision given by the product owner, such as answers to the Open Decisions;
   - list known issues or follow-ups left unresolved;
   - update "Next task" at the top.
   If stopping mid-task, add a Session notes entry saying what is half-done. Never delete Decisions or Assumptions when condensing old notes.
