// Visual check: screenshot every item at phone and desktop widths and flag
// layout or script problems. Tooling only; nothing here is part of the page.
//
//   cd tools && npm install && npx playwright install chromium && npm run visual
//
// Set CHROME_PATH to use an already-installed Chromium instead.
// Screenshots land in tools/screenshots/<width>/ (gitignored).
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const OUT = path.resolve(__dirname, 'screenshots');
const WIDTHS = [390, 1280];

// State is driven through the UI (clicks and inputs), never by assigning the
// page's variables, so wrapping the page script later can't make this pass
// without testing anything.
(async () => {
    const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
    let failures = 0;
    let shots = 0;

    for (const width of WIDTHS) {
        const dir = path.join(OUT, String(width));
        fs.mkdirSync(dir, { recursive: true });
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        await page.goto(PAGE);
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');
        if (!(await page.evaluate(() => typeof window.tailwind !== 'undefined'))) {
            console.log(`WARN ${width}px: Tailwind CDN did not load, so screenshots are unstyled`);
        }

        const check = async (label) => {
            const problems = [];
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            if (overflow > 0) problems.push(`horizontal overflow ${overflow}px`);
            const shortSteps = await page.$$eval('#method-list li', (ls) => ls
                .filter((l) => l.offsetParent !== null)
                .map((l) => l.textContent)
                .filter((t) => t.length < 15));
            if (shortSteps.length) problems.push(`short Method steps: ${JSON.stringify(shortSteps)}`);
            if (errors.length) problems.push(`errors: ${errors.splice(0).join(' | ')}`);
            await page.screenshot({ path: path.join(dir, `${label}.png`), fullPage: true });
            shots++;
            if (problems.length) failures++;
            console.log(`${problems.length ? 'FAIL' : 'ok  '} ${width}px ${label}${problems.length ? ': ' + problems.join('; ') : ''}`);
        };

        const cats = await page.$$eval('#category-grid button', (bs) => bs.map((b) => b.dataset.id));
        for (const cat of cats) {
            await page.click(`#category-grid button[data-id="${cat}"]`);
            const items = await page.$$eval('#item-grid button', (bs) => bs.map((b) => b.dataset.id));
            for (const item of items) {
                await page.click(`#item-grid button[data-id="${item}"]`);
                const prep = await page.$eval('#block-prepguide', (el) => !el.classList.contains('hidden'));
                if (prep) {
                    const tabs = await page.$$('#prep-method-tabs button');
                    for (let i = 0; i < tabs.length; i++) {
                        await page.click(`#prep-method-tabs button >> nth=${i}`);
                        await check(`${cat}-${item}-tab${i}`);
                    }
                    if (!tabs.length) await check(`${cat}-${item}`);
                    continue;
                }
                if (await page.$eval('#section-method', (el) => el.offsetParent === null)) {
                    await page.click('.section-toggle[data-section="method"]');
                }
                await check(`${cat}-${item}`);
            }
        }
        await context.close();
    }

    await browser.close();
    console.log(`\n${shots} screenshots in ${OUT}, ${failures} with problems`);
    process.exit(failures ? 1 : 0);
})();
