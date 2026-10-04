# Rules for Coding Agents

1. Read the PRD, Design Document and Tech Stack Document first; cite requirement IDs (for example FR-4.2) in commits and in PROGRESS.md.
2. Check the current official docs before installing or using Next.js, Tailwind, Drizzle, Radix, Zod and the icon package; versions and API names change.
3. Never copy the Stitch CDN script, per-page Tailwind config or inline hex colors. Everything resolves to the theme tokens.
4. Build the shared pieces once: band and status map, gauge, module card, finding card, top bar and footer. Reuse them. Never duplicate them.
5. When the PRD is silent or contradictory, stop and ask rather than invent behaviour. Record the answer in docs/PROGRESS.md under Decisions.
6. Run lint, type check and tests before declaring a task done; no skipped tests.
7. **Progress log:** `docs/PROGRESS.md` is the project's memory. At the start of every session, read it first and continue from "Next task". A task is not done until the log is updated and committed with the code. At the end of every task:
   - mark the task Done with the commit hash;
   - list what was built and verified (tests run, screens checked);
   - record every assumption made;
   - record every decision given by the product owner, such as answers to the Open Decisions;
   - list known issues or follow-ups left unresolved;
   - update "Next task" at the top.
   If stopping mid-task, add a Session notes entry saying what is half-done. Never delete Decisions or Assumptions when condensing old notes.

## Standing rules for every task

8. Never leave placeholders such as {commit} in PROGRESS.md. Use real commit hashes.
9. When you read the docs, confirm your grep or sed returned real text. Headings may use ## or ###. If a search returns nothing, read the file instead of working from memory.
10. When you build a check or guard, show that it fails on a bad case and passes on a good one.
11. Push at the end of every task and confirm CI is green on the latest commit. Tell me if it isn't.
12. If you edit or recreate an existing file (such as the sandbox page), confirm nothing from earlier tasks was lost.
13. Record every assumption and every invented string in PROGRESS.md. Never invent microcopy silently.
14. Do not edit anything under docs/ except PROGRESS.md. Source documents are read-only for agents.
15. Do one task per session. When it is done, summarize and stop. Do not start the next task unless told to.