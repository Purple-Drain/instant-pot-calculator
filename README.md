# Instant Pot Calculator

Dry weight in, water / pressure time / release method out, for rice, oats, quinoa, lentils,
dried beans, and a couple of Middle Eastern combo dishes. Single static page, no build step.

**Live:** https://purple-drain.github.io/instant-pot-calculator/

## How it works

1. Pick a category (Rice, Oats, Quinoa, Lentils, Beans, Combo Dishes), then the specific item.
2. Enter the dry weight in grams.
3. If soaking helps for that item, a **Soak Time (hours)** field appears, pre-filled with the
   recommended soak (0 if soaking isn't useful for that item). Water and pressure-cook time
   scale linearly from "unsoaked" toward "fully soaked" as you increase the hours, and **cap out**
   at the recommended soak time — soaking longer than recommended doesn't model any extra
   benefit.

Water is always rounded to the nearest 10 mL.

## Ratios & times

| Category | Item | Unsoaked ratio¹ / time | Recommended soak | Soaked ratio¹ / time | Release |
| --- | --- | --- | --- | --- | --- |
| Rice | White Basmati | 1.20 / 4 min | 30 min | 1.05 / 3 min | 10 Min NPR |
| Rice | Jasmine | 1.10 / 3 min | 30 min (optional) | 1.00 / 2 min | 10 Min NPR |
| Rice | Brown Basmati | 1.25 / 15 min | 2 hrs | 1.10 / 12 min | 10 Min NPR |
| Rice | Standard Brown | 1.25 / 22 min | 2 hrs | 1.10 / 18 min | 10 Min NPR |
| Oats | Steel-Cut | 4.0 / 4 min | 8 hrs | 3.0 / 1 min | 10 Min NPR |
| Oats | Rolled (Old-Fashioned) | 3.0 / 1 min | not needed | — | Quick Release |
| Quinoa | Quinoa | 1.4 / 1 min | 20 min | 1.3 / 1 min | Quick Release |
| Lentils | Red (Split) | 2.2 / 2 min | not needed | — | Quick Release |
| Lentils | Brown/Green | 2.2 / 9 min | 1 hr | 2.0 / 6 min | 10 Min NPR |
| Beans | Chickpeas | 3.6 / 38 min | 8 hrs | 2.6 / 13 min | 15 Min NPR |
| Beans | Kidney (Red) | 3.5 / 35 min | 8 hrs | 2.5 / 12 min | 15 Min NPR |
| Beans | Cannellini | 3.5 / 35 min | 8 hrs | 2.5 / 12 min | 15 Min NPR |
| Beans | Black Beans | 3.3 / 22 min | 8 hrs | 2.4 / 10 min | 15 Min NPR |
| Beans | Pinto Beans | 3.3 / 25 min | 8 hrs | 2.4 / 11 min | 15 Min NPR |
| Beans | Ful Medames (Fava) | 3.8 / 45 min | 10 hrs | 2.8 / 20 min | 15 Min NPR |
| Combo | Mujaddara (Lentils+Rice)² | 2.5 / 10 min | 0 (optional 1 hr) | 2.3 / 8 min | 10 Min NPR |

¹ Ratio = mL water per gram of dry weight.
² Weight entered is the **combined** lentils + rice weight, split 1:1 by weight.

Figures are community-typical Instant Pot numbers meant for a quick kitchen calculator, not a
certified reference.

**⚠️ Kidney beans & cannellini:** dried kidney-family beans contain a natural toxin destroyed
only by a full rolling boil. After soaking, boil hard (uncovered) for 10 minutes before pressure
cooking — the app surfaces this warning whenever either item is selected.

## Stack

`index.html` and nothing else. Tailwind via CDN, vanilla JS. Served by GitHub Pages from `main` at `/`.
