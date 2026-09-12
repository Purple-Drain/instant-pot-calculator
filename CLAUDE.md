# CLAUDE.md

Context for working on this repo. Read this before making changes; it captures the project's
conventions and the standing roadmap so work doesn't have to be re-derived each session.

## What this is

A single-page Instant Pot cooking calculator: pick a category and item, enter dry weight,
optionally adjust soak time, get water/pressure-time/release-method plus a generated method
(recipe steps). Static page, no backend, no accounts.

**Live:** https://purple-drain.github.io/instant-pot-calculator/

## Stack & conventions

- **`index.html` and nothing else.** No build step, no bundler, no package.json. Tailwind is
  loaded via CDN script tag; all logic is vanilla JS in one `<script>` block at the bottom.
- Deployed by GitHub Pages from `main` at `/`, so anything pushed to `main` goes live immediately.
- Keep it this way unless a roadmap item below genuinely requires more (see the multi-ingredient
  item; even that should stay a data-model change, not a framework migration, unless the scope
  balloons well past what's listed here).
- Prefer plain functions and a single `render()` redraw over introducing any component/state
  library. `localStorage` is fine for anything that needs to persist (see Favorites below).

## Architecture (as of the Method/collapsible-sections PR)

- `categories` object: `categories[categoryId].items[itemId]` → one entry per food, with
  `label`, `icon`, `ratio` (mL water per gram dry, unsoaked), `time` (High-Pressure minutes,
  unsoaked), `release`, `soakMinutes` (point where soak benefit caps), `defaultSoakMinutes`
  (what the soak input starts at; usually equals `soakMinutes`, but can be lower when soaking
  is optional, e.g. Jasmine defaults to 0), `soak: {ratio, time} | null`, `note`, optional
  `warning` (persistent safety banner text, e.g. kidney beans' toxin warning or congee's foaming
  warning), optional `toxinBoil` (drives the "boil hard to neutralize toxins" Method step,
  deliberately separate from `warning`, since `warning` now also covers non-toxin safety notes
  like congee foaming and a shared `warning` trigger would print a false toxin-boil step),
  optional `methodIntro`/`methodOutro` (extra Method steps), optional `skipRinse`, optional
  `liquidOptions` (see the congee bullet below), optional `ingredientLabel` (overrides `label`
  in the generated "Rinse the dry ___"/"Add the ___" Method steps, needed whenever `label` names
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
  input, category/item click, stepper/reset click, etc.). No framework, just re-render on write.
  Two guards inside it: the weight and soak inputs are only rewritten when they are not the
  `document.activeElement` (otherwise "1." becomes "1.00" mid-keystroke in oz/cup mode; a `blur`
  handler normalises the value afterwards), and `saveState()` persists category/item/weight/units
  to `localStorage` (`ipcalc-state-v1`, restored by `loadState()` before the first render).
- Method wording hooks: `item.ingredientLabel` (see above), optional `rinseStep` on an item or
  its category (pulses say "pick over for stones", quinoa says "fine-mesh sieve"), and optional
  `defaultOutro` on a category used when an item has no `methodOutro` ("fluff with a fork" is
  only right for grains). `generateMethodSteps` takes the category and the current water unit so
  the "Add ___ with N mL" step matches the Results display.
- Results card extras: `estimateTotalMinutes()` (pressurise + cook + `RELEASE_MINUTES`) and a
  liquid warning when water is under `MIN_LIQUID_ML` (250) or water + dry weight passes
  `HALF_FULL_ML` (2800). Advisory only; nothing is clamped. Soak hours are clamped to
  0..`MAX_SOAK_HOURS` on input and a note appears when they exceed the item's `soakMinutes` cap.
- No ratio item uses `'Quick Release'` any more: quinoa, oats, lentils and congee all foam.
- `activeRelease(item, hours)`: release can also depend on soak state, not just ratio/time.
  `item.soak.release` (currently only White Basmati's `'5 Min NPR'`) overrides `item.release`
  once any soak hours are set. Pre-soaked grains clump under a full 10 min NPR because they need
  less residual steam than unsoaked ones; this was a real bug report, not a hypothetical. Discrete
  switch (not interpolated with `soakFraction()` like ratio/time), since release methods aren't a
  continuum. `estimateTotalMinutes()` and the generated Method's release step both resolve through
  this, not `item.release` directly.
- `item.methodPreCook` (optional, string or array): extra Method steps inserted right before "Add the ___ to
  the Instant Pot", for prep that happens after soaking/rinsing but before the pot goes on (White
  Basmati's anti-clump oil-coating step is the first user). Same shape as `methodIntro`/
  `methodOutro`, different insertion point.
- `item.soakStep` (optional string) replaces the generic "soak in cold water" Method step, and
  `item.parCook = {step, minutes}` adds a head-start step (inserted before `methodPreCook`) plus
  its minutes in the total-time estimate whenever soak hours are under the `soakMinutes` cap, via
  `parCookActive()`. Mujaddara is the only user: its lentils need a 1 hr just-boiled soak or a
  1 min par-cook so they finish in the same 6 min as the rice. Values were source-checked in #26
  (1.42 to 1.58 mL/g combined dry weight across six recipes); the old 2.5 mL/g, no-soak default
  made the rice mushy. The par-cook covers a partial soak too, not only 0 h, since a short soak
  alone leaves the lentils underdone at 6 min.
- `methodIntro`/`methodOutro` accept a single string or an array of strings; `generateMethodSteps`
  spreads either form the same way. White Basmati's `methodOutro` is the first array use, since
  the actual anti-clump fix (identified after #22 shipped) needed two separate steps: fluff
  properly, then leave it uncovered a minute rather than sealing the lid back down while it's
  still steaming, which traps condensation that drips back and reglues the grains more than
  release timing does.
- Unit conversion happens only at the display/input boundary: `weight` (grams) and `water` (mL)
  stay canonical everywhere else. `weightUnit`/`waterUnit` state plus `gramsToDisplay`/
  `displayToGrams`/`mlToDisplay`/`formatWeight`/`formatWater` convert on the way in/out. Cup
  conversion for dry weight needs a per-item `gramsPerCup` density figure (water doesn't, since
  it's converted by pure mass↔volume math). Switching category/item while in "cup" mode
  re-converts through the new item's own `gramsPerCup`, which is expected, since cups aren't canonical.
- Non-ratio items (produce prep guides) use `item.prepGuide = {cleaning, destarch, methods}`
  instead of `ratio`/`time`/`release`/`soak`; `isPrepItem()` checks for `prepGuide` presence.
  `render()` branches early into `renderPrepGuide()`, hiding the Weight/Soak/Results/Method
  blocks (each wrapped in an id'd `block-*` div: `block-weight`/`block-soak`/`block-results`/
  `block-method`/`block-prepguide`) and showing Cleaning/Destarch lists plus an Overview/per-dish
  method tab selector (`selectedMethodId`, reset to `null` alongside `soakHours` on every
  category/item switch). Prep items never reach `calculateWater`/`activeRatio`/`activeTime`/
  `generateMethodSteps`; those stay untouched and still assume exactly one ratio/time/release.
- `congee` category (Plain Congee, Beef Mince Congee) is an ordinary ratio-based category, with no
  new architecture needed for the higher `ratio` (~8 mL/g, ~6:1 water:rice by volume vs ~1.1–1.25
  for steamed rice) or the new `'Full NPR'` entry in `RELEASE_INSTRUCTIONS` (congee foams under
  pressure, so quick-releasing needs its own explicit release string). It does introduce one
  reusable pattern: `item.liquidOptions = {choices: [{id, label}, ...], recommended: id}`, an
  optional field checked via presence like `warning`/`methodIntro`, that renders a small
  selector (currently Water/Stock/Half & Half on Beef Mince Congee) inside the Results card. It
  only ever changes displayed text (the Results "Add ___" label and the liquid word in the
  generated Method step) and never touches `calculateWater`/`activeRatio`/`activeTime`. The
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

- [ ] **Search/filter across categories & items**: [#4](https://github.com/Purple-Drain/instant-pot-calculator/issues/4).
      Substring match against item labels across the whole `categories` tree, jump straight to
      a result the same way clicking an item does.
- [ ] **Favorites/starring**: [#5](https://github.com/Purple-Drain/instant-pot-calculator/issues/5).
      Star items, persist in `localStorage`, surface them somewhere fast (e.g. a Favorites
      pseudo-category).
- [x] **Unit conversion (g/oz/cups, mL/cups/fl oz)**: [#6](https://github.com/Purple-Drain/instant-pot-calculator/issues/6).
      Shipped: weight toggle (g/oz/cup) and water toggle (mL/cup/fl oz), converting only at the
      display/input boundary. See the `gramsPerCup` note in Architecture above.
- [ ] **Generalize combo dishes beyond Mujaddara**: [#7](https://github.com/Purple-Drain/instant-pot-calculator/issues/7).
      Mujaddara is currently a hand-blended single item. Needs an actual multi-component schema
      (`components: [{ref, share}, ...]`) before more combo dishes can be added without more
      one-off special-casing. Most architecturally involved item here, worth a design pass
      before diving in.
- [ ] **Produce prep guide (potatoes, sweet potatoes, apples)**: [#9](https://github.com/Purple-Drain/instant-pot-calculator/issues/9).
      A `produce` category for items that aren't dry-ingredient pressure-cook ratios: cleaning/
      destarch prep plus dish-based cooking steps (`prepGuide: {cleaning, destarch, methods}`),
      rendered via a sibling `renderPrepGuide()` path with Results/Soak/Method swapped out rather
      than forced through the ratio/time schema.
- [x] **Congee category + reusable liquid-type-selector pattern**: no tracked issue; net-new
      scope agreed directly with the user, not part of #4/#5/#7/#9. Shipped the `congee` category
      (Plain Congee, Beef Mince Congee) and the `item.liquidOptions` field/selector pattern
      described in Architecture above, available to any future item that wants a Water/Stock/etc.
      choice.

When one of these ships: check its box here, close/leave-closed the linked issue, and fold
anything noteworthy about the final approach into the Architecture section above so the next
session doesn't have to rediscover it.

## Heading style

No generic label headings: "The Problem", "The Solution", "The Overview", "Key
Takeaways", "Conclusion". A heading says what its section says, in two to four specific
words ("Why the sync failed", "Worktree setup"). Headings are earned: none in a response
under about 500 words, at most three above it. Structural headings in templates (handoff
notes, decision records) are exempt. Ported from Purple-Drain/claude-tools#376 so cloud
sessions that only see this repo follow it too.

## Writing style

No em dashes or en dashes used as punctuation. Use a period, comma, semicolon (to join two
related independent clauses), parenthesis, or a plain connector ("and"/"but"/"so") instead,
whichever reads most naturally. Applies to every response and every file Claude writes,
Claude Code included, not just committed docs.

Avoid other stock AI-writing tells:
- Overused words: delve, underscore, pivotal, robust, seamless, realm, harness, unlock,
  tapestry, leverage, align, synergy, navigate, landscape, testament.
- Filler openers: "In today's fast-paced/rapidly evolving world...", "It's worth noting
  that...", "Great question!", "Certainly!", "Absolutely!", "I hope this helps!".
- The false-contrast pattern "It's not just X, it's Y" / "This isn't about X, it's about Y".
- Hollow intensifiers used as filler: "truly", "genuinely".
- Forced rule-of-three lists or heavy bolding used as a substitute for deciding what actually
  matters.

Write the way a careful native English writer would: plain, direct, no throat-clearing.

## Thread title convention

Begin and end every response with exactly this line, nothing before and nothing after:

`status emoji | dd.mm.yy | context emoji(s) | anchor: work`

(Slot template, not literal syntax: no square brackets in the actual line; the `|`
above is the literal separator, with a space on each side.)

Status: 🟢 done · 🟡 in progress · 🔴 blocked · 🔵 informational. Dates are day-first
(`04.08.26`). Anchor is the standing project/repo, then the current task in a few words.
Change the title only when the topic materially shifts. Add ⏳ to the context emoji if
this turn leaves anything armed to run without the user (a scheduled wakeup, background
agent, or cron); leave it off otherwise.

Composition → `title` skill. Full checklist and repair → `title-fix` skill. Both live in
this repo's `.claude/skills/`. No local hook enforces this in cloud or background
sessions, so hold yourself to the checklist directly rather than waiting to be told.
