# Instant Pot Rice Calculator

Dry rice weight in, water / pressure time / release method out. Single static page, no build step.

**Live:** https://purple-drain.github.io/instant-pot-calculator/

## Ratios

Water is always `weight × 1.2`, rounded to the nearest 10 mL. Release is always 10 min natural pressure release.

| Rice | High pressure | Modifier |
| --- | --- | --- |
| White Basmati | 4 min | 3 min if sat wet 2+ hrs / want firmer grains |
| Jasmine | 3 min | — |
| Brown Basmati | 15 min | 12 min if soaked 2+ hrs |
| Standard Brown | 22 min | — |

## Stack

`index.html` and nothing else. Tailwind via CDN, vanilla JS. Served by GitHub Pages from `main` at `/`.
