# Handoffs

Newest first. Each entry says what shipped, what is open, and what to check first.

## 12.09.26 (afternoon): Mujaddara fix, open items specced

### Shipped
- #20: thread-title convention plus the `title` and `title-fix` skills, after review fixes (no em dashes, pipe-separated examples). #19 is done.
- #27: Mujaddara now uses 1.5 mL/g and 6 min with a 10 min natural release. The soak defaults to 1 hr of just the lentils in just-boiled water (`soakStep`). Any soak under 1 hr adds a 1 min par-cook step and 20 min to the total time (`parCook`, `parCookActive()`). Verified headless at soak 0, 0.5, 1 and 8 h.
- This PR: em dashes removed from the older CLAUDE.md text. The en dashes in `index.html` are number ranges ("20–30 min"), which the writing rule allows, so they stay.

### Still open
- Jasmine ratio: owner decision. Keep 1.1 mL/g, or raise towards the sources' ~1.28 (see #26). Leave `soak.ratio` alone either way, since no source covers soaked jasmine.
- #28 pot size, #29 plain mode and #30 visual check: each is written up as a well-defined issue ready to pick up.
- #16: congee grain sub-choice and volume cap.

### Check first
- A partial Mujaddara soak (e.g. 30 min) prints both the soak step and the par-cook step. That is deliberate: a short soak alone leaves the lentils underdone at 6 min.

## 12.09.26: recipe review follow-ups

### Shipped
- #21: full review pass (foaming releases, lentil water, pot-limit warnings, persistence, copy button).
- #22: soaked White Basmati uses a 5 min natural release plus an oil-coating step (`soak.release`, `activeRelease()`, `methodPreCook`).
- #23: White Basmati closing steps say fluff with a fork, then leave it uncovered; re-covering while it steams was the main clumping cause. `methodIntro`/`methodPreCook`/`methodOutro` all accept a string or array via `asSteps()`.
- #25: CLAUDE.md doc line for `methodPreCook`, plus this note.

### Check first
- Squash merges mean a branch's commits never become ancestors of `main`. After a PR merges, start the next change on a fresh branch from `origin/main`; a commit pushed to the old branch after merge is stranded (that is how the #25 doc line got left behind).
- Resuming a cloud-created session on a local clone: run `git fetch origin` first, or the branch checkout fails and leaves you on `main`.

### Recipe accuracy research (source-checked, not yet applied)
Results are logged in #26 with sources. No app values were changed this session.

1. Kidney beans: keep (confirmed). 45 min unsoaked and 12 min soaked sit inside tested recipes' ranges.
2. Brown rice: keep 1.25 / 1.10 mL/g. A proposal to raise it to 1.5 was refuted by the skeptic pass: two weighed, tested recipes use exactly 1.25.
3. Jasmine: keep the release; review the drier-than-sources ratio. Add a 5 min soaked release only if soaked jasmine is seen clumping.
4. Mujaddara: wrong (confirmed). Every source soaks or par-cooks the lentils and uses about 1.4 to 1.65 mL/g, against the app's 2.5. Change the defaults (lentil soak on, about 1.5 mL/g and 6 min soaked, par-cook step when unsoaked).

All eight research and skeptic agents finished before the stop; the full verdicts are on #26. The jasmine check also found the app's 1.1 mL/g is about 15% drier than every source, and the Mujaddara check lists what the implementation needs (per-item soak wording, a par-cook step only when unsoaked). Apply a change only after a skeptic agrees, then run the headless Method check before merging, since `main` deploys live.

### Still open
Also tracked as bullets in #26.
- Pot size setting: the under-250 mL and half-full warnings assume a 6 qt pot. Add a 3/6/8 qt toggle feeding a threshold lookup, persisted in `saveState()`.
- Visual check script: Tailwind never loaded in the sandbox runs, so styling has not been screenshot-checked. A Playwright script that screenshots every item would close that gap (tooling only; `index.html` stays the single deployed file).
- Plain mode: an option that drops oil, salt, stock and onion/garlic steps from the generated Method, for people cooking bland or pet-safe batches. Today you skip those steps by hand.
- #16: congee should carry its own grain sub-choice and volume cap rather than reuse the steamed-rice rows.
