// Method regression check (dev-only, not part of the page).
//
//   cd tools && npm install && npx playwright install chromium && npm run method
//
// Walks every ratio item's generated Method, then probes: --pot (per-size liquid
// warnings and persistence, #28), --plain (no seasoning in plain mode, water only,
// persistence, and plain off restores every Method exactly, #29), --muj (Mujaddara
// par-cook at 1, 0 and 0.5 h soak, #27). Optional first argument: path to an
// index.html (defaults to the repo's). CHROME_PATH overrides the browser.
// State is driven through clicks and inputs, never page variables (#30).
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const args = process.argv.slice(2);
  const file = args.find(a => !a.startsWith('--')) || path.resolve(__dirname, '..', 'index.html');
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/tailwind/i.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + file);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(400);
  let bad = 0, count = 0;
  const fail = (...a) => { bad++; console.log('FAIL', ...a); };

  const openMethod = async () => {
    // Produce items hide the Method block entirely, so land on a ratio item first.
    await page.click('#category-grid button[data-id="rice"]');
    await page.click('#item-grid button[data-id="white-basmati"]');
    if (await page.$eval('#section-method', el => el.offsetParent === null)) await page.click('.section-toggle[data-section="method"]');
  };
  const warn = () => page.$eval('#liquid-warning', el => el.classList.contains('hidden') ? '' : el.textContent);
  if (flags.has('--pot')) {
    const w0 = await warn();
    console.log('default screen warning:', JSON.stringify(w0));
    if (w0) fail('default screen shows a liquid warning');
    for (const p of ['3qt', '6qt', '8qt']) {
      await page.click(`#pot-size-toggle button[data-unit="${p}"]`);
      console.log(`${p} @ default:`, JSON.stringify(await warn()));
    }
    await page.click('#pot-size-toggle button[data-unit="3qt"]');
    await page.fill('#weight', '800');
    await page.dispatchEvent('#weight', 'input');
    const w3 = await warn();
    console.log('3qt @ 800 g:', JSON.stringify(w3));
    if (!/half-full line of the 3 qt/.test(w3)) fail('3 qt big batch did not warn');
    await page.click('#pot-size-toggle button[data-unit="6qt"]');
    const w6 = await warn();
    console.log('6qt @ 800 g:', JSON.stringify(w6));
    if (w6) fail('6 qt warned at 800 g');
    await page.click('#pot-size-toggle button[data-unit="8qt"]');
    await page.reload();
    await page.waitForTimeout(300);
    const persisted = await page.$eval('#pot-size-toggle button[data-unit="8qt"]', b => b.className.includes('bg-blue-600'));
    console.log('8qt persisted after reload:', persisted);
    if (!persisted) fail('pot size not persisted');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(300);
  }

  const cats = await page.$$eval('#category-grid button', bs => bs.map(b => b.dataset.id));
  for (const c of cats) {
    await page.click(`#category-grid button[data-id="${c}"]`);
    for (const it of await page.$$eval('#item-grid button', bs => bs.map(b => b.dataset.id))) {
      await page.click(`#item-grid button[data-id="${it}"]`);
      if (await page.$eval('#block-prepguide', el => !el.classList.contains('hidden'))) continue;
      count++;
      const steps = await page.$$eval('#method-list li', ls => ls.map(l => l.textContent));
      const short = steps.filter(s => s.length < 15);
      if (short.length) fail('short step', c, it, short);
      if (steps.some(s => /undefined|NaN|\[object/.test(s))) fail('bad text', c, it);
      if (steps.some(s => /par-cook/i.test(s)) && it !== 'mujaddara') fail('par-cook leak', c, it);
    }
  }

  if (flags.has('--plain')) {
    const FORBIDDEN = /\b(oil|ghee|salt|stock|onions?|garlic|soy|sesame|pepper|ginger|lemon|cumin|milk|sweetener)\b/i;
    const walk = async () => {
      const out = {};
      for (const c of cats) {
        await page.click(`#category-grid button[data-id="${c}"]`);
        for (const it of await page.$$eval('#item-grid button', bs => bs.map(b => b.dataset.id))) {
          await page.click(`#item-grid button[data-id="${it}"]`);
          if (await page.$eval('#block-prepguide', el => !el.classList.contains('hidden'))) continue;
          out[`${c}/${it}`] = {
            steps: await page.$$eval('#method-list li', ls => ls.map(l => l.textContent)),
            waterLabel: await page.$eval('#water-label', el => el.textContent),
            liquidHidden: await page.$eval('#liquid-select', el => el.classList.contains('hidden')),
          };
        }
      }
      return out;
    };
    const before = await walk();
    await openMethod();
    await page.click('#plain-toggle');
    const plainRun = await walk();
    for (const [k, v] of Object.entries(plainRun)) {
      const hit = v.steps.filter(s => FORBIDDEN.test(s));
      if (hit.length) fail('plain mode seasoning', k, hit);
      if (!v.liquidHidden || v.waterLabel !== 'Add Water') fail('plain mode liquid', k, v.waterLabel);
      if (v.steps.some(s => s.length < 15)) fail('plain short step', k);
    }
    console.log('plain beef-mince:', JSON.stringify(plainRun['congee/beef-mince'].steps.slice(0, 2)));
    await page.reload();
    await page.waitForTimeout(300);
    await openMethod();
    const persisted = await page.$eval('#plain-toggle', b => b.getAttribute('aria-pressed'));
    console.log('plain persisted after reload:', persisted);
    if (persisted !== 'true') fail('plain mode not persisted');
    await page.click('#plain-toggle');
    const after = await walk();
    for (const k of Object.keys(before)) {
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) fail('plain off differs from before', k);
    }
  }

  if (flags.has('--muj')) {
    await page.click('#category-grid button[data-id="combo"]');
    await page.click('#item-grid button[data-id="mujaddara"]');
    for (const h of ['1', '0', '0.5']) {
      await page.fill('#soak-hours', h);
      await page.dispatchEvent('#soak-hours', 'input');
      const steps = await page.$$eval('#method-list li', ls => ls.map(l => l.textContent));
      console.log(`mujaddara soak ${h}: ${steps.length} steps; par-cook=${steps.some(s => /Par-cook/.test(s))}`);
    }
  }
  console.log(`\nratio items checked: ${count} | problems: ${bad} | page errors: ${JSON.stringify(errors)}`);
  await browser.close();
  process.exit(bad || errors.length ? 1 : 0);
})();
