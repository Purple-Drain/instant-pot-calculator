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
  `warning` (persistent safety banner text, e.g. kidney beans' toxin warning or congee's foaming
  warning), optional `toxinBoil` (drives the "boil hard to neutralize toxins" Method step —
  deliberately separate from `warning`, since `warning` now also covers non-toxin safety notes
  like congee foaming and a shared `warning` trigger would print a false toxin-boil step),
  optional `methodIntro`/`methodOutro` (extra Method steps), optional `skipRinse`, optional
  `liquidOptions` (see the congee bullet below), optional `ingredientLabel` (overrides `label`
  in the generated "Rinse the dry ___"/"Add the ___" Method steps — needed whenever `label` names
  a finished dish rather than the raw dry ingredient, e.g. congee items use `ingredientLabel:
  'Rice'` so Method text says "rice", not "plain congee").
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
- Unit conversion happens only at the display/input boundary: `weight` (grams) and `water` (mL)
  stay canonical everywhere else. `weightUnit`/`waterUnit` state plus `gramsToDisplay`/
  `displayToGrams`/`mlToDisplay`/`formatWeight`/`formatWater` convert on the way in/out. Cup
  conversion for dry weight needs a per-item `gramsPerCup` density figure (water doesn't, since
  it's converted by pure mass↔volume math). Switching category/item while in "cup" mode
  re-converts through the new item's own `gramsPerCup` — expected, since cups aren't canonical.
- Non-ratio items (produce prep guides) use `item.prepGuide = {cleaning, destarch, methods}`
  instead of `ratio`/`time`/`release`/`soak` — `isPrepItem()` checks for `prepGuide` presence.
  `render()` branches early into `renderPrepGuide()`, hiding the Weight/Soak/Results/Method
  blocks (each wrapped in an id'd `block-*` div: `block-weight`/`block-soak`/`block-results`/
  `block-method`/`block-prepguide`) and showing Cleaning/Destarch lists plus an Overview/per-dish
  method tab selector (`selectedMethodId`, reset to `null` alongside `soakHours` on every
  category/item switch). Prep items never reach `calculateWater`/`activeRatio`/`activeTime`/
  `generateMethodSteps` — those stay untouched and still assume exactly one ratio/time/release.
- `congee` category (Plain Congee, Beef Mince Congee) is an ordinary ratio-based category — no
  new architecture needed for the higher `ratio` (~8 mL/g, ~6:1 water:rice by volume vs ~1.1–1.25
  for steamed rice) or the new `'Full NPR'` entry in `RELEASE_INSTRUCTIONS` (congee foams under
  pressure, so quick-releasing needs its own explicit release string). It does introduce one
  reusable pattern: `item.liquidOptions = {choices: [{id, label}, ...], recommended: id}`, an
  optional field checked via presence like `warning`/`methodIntro`, that renders a small
  selector (currently Water/Stock/Half & Half on Beef Mince Congee) inside the Results card. It
  only ever changes displayed text — the Results "Add ___" label and the liquid word in the
  generated Method step — and never touches `calculateWater`/`activeRatio`/`activeTime`. The
  selection lives in `selectedLiquidId` state, declared next to `selectedMethodId` and resolved
  via `selectedLiquidChoice(item, id)` (falls back to `recommended` if the id doesn't match);
  reset to `item.liquidOptions.recommended` (or `null` if absent) on every category/item switch,
  same lifecycle as `soakHours`/`selectedMethodId`. Because choices are per-item rather than a
  fixed global list (unlike the weight/water unit toggles, built once via `buildUnitToggle`),
  the toggle buttons are rebuilt every `render()` call, the same way the prep-guide's method tabs
  already are.

## Roadmap / TODO

Tracked as GitHub issues (linked below) so they show up in normal issue triage; this list is
just the at-a-glance summary. Update both the issue and this list if scope changes.

- [ ] **Search/filter across categories & items** — [#4](https://github.com/Purple-Drain/instant-pot-calculator/issues/4).
      Substring match against item labels across the whole `categories` tree, jump straight to
      a result the same way clicking an item does.
- [ ] **Favorites/starring** — [#5](https://github.com/Purple-Drain/instant-pot-calculator/issues/5).
      Star items, persist in `localStorage`, surface them somewhere fast (e.g. a Favorites
      pseudo-category).
- [x] **Unit conversion (g/oz/cups, mL/cups/fl oz)** — [#6](https://github.com/Purple-Drain/instant-pot-calculator/issues/6).
      Shipped: weight toggle (g/oz/cup) and water toggle (mL/cup/fl oz), converting only at the
      display/input boundary. See the `gramsPerCup` note in Architecture above.
- [ ] **Generalize combo dishes beyond Mujaddara** — [#7](https://github.com/Purple-Drain/instant-pot-calculator/issues/7).
      Mujaddara is currently a hand-blended single item. Needs an actual multi-component schema
      (`components: [{ref, share}, ...]`) before more combo dishes can be added without more
      one-off special-casing. Most architecturally involved item here — worth a design pass
      before diving in.
- [ ] **Produce prep guide (potatoes, sweet potatoes, apples)** — [#9](https://github.com/Purple-Drain/instant-pot-calculator/issues/9).
      A `produce` category for items that aren't dry-ingredient pressure-cook ratios — cleaning/
      destarch prep plus dish-based cooking steps (`prepGuide: {cleaning, destarch, methods}`),
      rendered via a sibling `renderPrepGuide()` path with Results/Soak/Method swapped out rather
      than forced through the ratio/time schema.
- [x] **Congee category + reusable liquid-type-selector pattern** — no tracked issue; net-new
      scope agreed directly with the user, not part of #4/#5/#7/#9. Shipped the `congee` category
      (Plain Congee, Beef Mince Congee) and the `item.liquidOptions` field/selector pattern
      described in Architecture above, available to any future item that wants a Water/Stock/etc.
      choice.

When one of these ships: check its box here, close/leave-closed the linked issue, and fold
anything noteworthy about the final approach into the Architecture section above so the next
session doesn't have to rediscover it.
