# CLAUDE.md

Context for working on this repo. Read this before making changes — it captures the project's
conventions and the standing roadmap so work doesn't have to be re-derived each session.

## What this is

A single-page Instant Pot cooking calculator: pick a category and item, enter dry weight,
optionally adjust soak time, get water/pressure-time/release-method plus a generated method
(recipe steps). Static page, no backend, no accounts.

**Live:** https://purple-drain.github.io/instant-pot-calculator/

## Stack & conventions

- **`index.html` and nothing else.** No build step, no bundler, no package.json. Tailwind is
  loaded via CDN script tag; all logic is vanilla JS in one `<script>` block at the bottom.
- Deployed by GitHub Pages from `main` at `/` — anything pushed to `main` goes live immediately.
- Keep it this way unless a roadmap item below genuinely requires more (see the multi-ingredient
  item — even that should stay a data-model change, not a framework migration, unless the scope
  balloons well past what's listed here).
- Prefer plain functions and a single `render()` redraw over introducing any component/state
  library. `localStorage` is fine for anything that needs to persist (see Favorites below).

## Architecture (as of the Method/collapsible-sections PR)

- `categories` object: `categories[categoryId].items[itemId]` → one entry per food, with
  `label`, `icon`, `ratio` (mL water per gram dry, unsoaked), `time` (High-Pressure minutes,
  unsoaked), `release`, `soakMinutes` (point where soak benefit caps), `defaultSoakMinutes`
  (what the soak input starts at — usually equals `soakMinutes`, but can be lower when soaking
  is optional, e.g. Mujaddara defaults to 0), `soak: {ratio, time} | null`, `note`, optional
  `warning` (persistent safety text, e.g. kidney beans), optional `methodIntro`/`methodOutro`
  (extra Method steps), optional `skipRinse`.
- Soak interpolation: `soakFraction()` → 0..1 clamped at the recommended cap; `activeRatio()`/
  `activeTime()` linearly interpolate between unsoaked and `soak` values using that fraction.
- UI: a category selector, then an item grid, a weight input, a soak-hours input (stepper +/-,
  typed value, reset-to-recommended button), a Results card (water/time/release), and a
  generated Method section (numbered steps built from the current item + live water/time).
- Every major block (Category, Weight, Type, Soak, Results, Method) is independently collapsible
  via `.section-toggle` buttons and a `sectionExpanded` state object; Method defaults collapsed,
  the rest default expanded.
- `render()` is the single redraw function, called after every state mutation (weight/soak
  input, category/item click, stepper/reset click, etc.) — no framework, just re-render on write.

## Roadmap / TODO

Tracked as GitHub issues (linked below) so they show up in normal issue triage; this list is
just the at-a-glance summary. Update both the issue and this list if scope changes.

- [ ] **Search/filter across categories & items** — [#4](https://github.com/Purple-Drain/instant-pot-calculator/issues/4).
      Substring match against item labels across the whole `categories` tree, jump straight to
      a result the same way clicking an item does.
- [ ] **Favorites/starring** — [#5](https://github.com/Purple-Drain/instant-pot-calculator/issues/5).
      Star items, persist in `localStorage`, surface them somewhere fast (e.g. a Favorites
      pseudo-category).
- [ ] **Unit conversion (g/oz/cups, mL/cups/fl oz)** — [#6](https://github.com/Purple-Drain/instant-pot-calculator/issues/6).
      Convert only at the display/input boundary; keep internal math in grams/mL. Cups need a
      per-item density figure — the trickiest part.
- [ ] **Generalize combo dishes beyond Mujaddara** — [#7](https://github.com/Purple-Drain/instant-pot-calculator/issues/7).
      Mujaddara is currently a hand-blended single item. Needs an actual multi-component schema
      (`components: [{ref, share}, ...]`) before more combo dishes can be added without more
      one-off special-casing. Most architecturally involved item here — worth a design pass
      before diving in.

When one of these ships: check its box here, close/leave-closed the linked issue, and fold
anything noteworthy about the final approach into the Architecture section above so the next
session doesn't have to rediscover it.
