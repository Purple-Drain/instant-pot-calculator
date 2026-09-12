# Handoffs

Newest first. Each entry says what shipped, what is open, and what to check first.

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
Four questions were sent for source-checking at 13:46 AEST, with a skeptic re-check per answer. They had not returned by the 14:00 stop, so nothing below is verified yet and no recipe value was changed.

- T1: kidney beans. Is 45 min unsoaked / 12 min soaked (3.5 and 2.5 mL/g) right?
- T2: brown basmati and standard brown rice. Is 1.25 / 1.10 mL/g under-watered?
- T7: jasmine. Should soaked jasmine get the same shorter release as soaked White Basmati?
- T3: Mujaddara. Is one 10 min co-cook right, or should the lentils par-cook before the rice goes in?

To pick these up, resume the run in the same Claude Code session (cached agents replay free):

```
Workflow({scriptPath: "~/.claude/projects/-root-repos-instant-pot-calculator/7a73fc01-11fa-4e26-8d90-f873fc5ad1dc/workflows/scripts/recipe-accuracy-research-wf_5fabebf1-f47.js", resumeFromRunId: "wf_5fabebf1-f47"})
```

From a fresh session, rerun the four questions instead; the script file above holds the exact prompts. Apply a change only after the skeptic pass agrees, then run the headless Method check before merging, since `main` deploys live.

### Still open
- Pot size setting: the under-250 mL and half-full warnings assume a 6 qt pot. Add a 3/6/8 qt toggle feeding a threshold lookup, persisted in `saveState()`.
- Visual check script: Tailwind never loaded in the sandbox runs, so styling has not been screenshot-checked. A Playwright script that screenshots every item would close that gap (tooling only; `index.html` stays the single deployed file).
- Plain mode: an option that drops oil, salt, stock and onion/garlic steps from the generated Method, for people cooking bland or pet-safe batches. Today you skip those steps by hand.
- #16: congee should carry its own grain sub-choice and volume cap rather than reuse the steamed-rice rows.
