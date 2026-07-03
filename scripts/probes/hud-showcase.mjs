// @ts-check
// The flagship integration probe: drives the Patterns/Game HUD showcase in
// real Chromium and asserts the cross-component wiring (dial -> gauge,
// hotbar cast -> cooldown + odometer + floating text + log, cargo dialog ->
// inventory move -> log). Zero-arg: `pnpm probe:hud` after
// `pnpm build-storybook`. Exits non-zero on any failed check; screenshots
// land in an OS-temp folder printed at the end.

import console from 'node:console';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

import { artifactDirectory, gotoStory, serveStorybook } from './probeServer.mjs';

const PORT = 6141;
const scriptDir = dirname(fileURLToPath(import.meta.url));
const storybookRoot = resolve(scriptDir, '..', '..', 'storybook-static');
const outDir = artifactDirectory('hud-showcase');
mkdirSync(outDir, { recursive: true });

/** @type {string[]} */
const failures = [];

/**
 * @param {boolean} ok
 * @param {string} name
 */
function check(ok, name) {
    console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
    if (!ok) {
        failures.push(name);
    }
}

const server = await serveStorybook(storybookRoot, PORT);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 940 } });

await gotoStory(page, PORT, 'patterns-game-hud--showcase');

// Instruments render.
check(
    await page.getByRole('meter', { name: 'Reactor output' }).isVisible(),
    'reactor gauge renders',
);
check(
    await page.getByRole('img', { name: /Tactical: \d+ markers/ }).isVisible(),
    'minimap renders',
);
check(
    await page.getByRole('img', { name: /Bearing: heading/ }).isVisible(),
    'compass renders',
);

// Dial drives the gauge.
await page.getByRole('slider', { name: 'Reactor throttle' }).focus();
await page.keyboard.press('PageUp');
check(
    (await page
        .getByRole('meter', { name: 'Reactor output' })
        .getAttribute('aria-valuenow')) === '72',
    'dial drives the reactor gauge',
);

// A cast arms the cooldown, scores, spawns a hit, and logs.
await page.getByRole('button', { name: 'Barrage' }).click();
await page.waitForTimeout(250);
check(
    await page.getByRole('timer', { name: 'Barrage cooldown' }).isVisible(),
    'cast arms the cooldown chip',
);
check(
    await page.getByRole('img', { name: 'Score: 1275' }).isVisible(),
    'cast scores the odometer',
);
check(await page.getByText('+25').isVisible(), 'cast spawns floating text');
check(
    await page.getByText('Barrage engaged.').first().isVisible(),
    'cast appends a log entry',
);
await page.screenshot({ path: join(outDir, 'hud-after-cast.png') });

// The cargo dialog opens and a keyboard move logs.
await page.getByRole('button', { name: 'Open cargo hold' }).click();
await page.getByRole('grid', { name: 'Cargo hold' }).waitFor({ state: 'visible' });
await page.waitForTimeout(600);
await page.getByRole('gridcell', { name: 'Plasma cell' }).focus();
await page.keyboard.press(' ');
await page.keyboard.press('ArrowRight');
await page.keyboard.press(' ');
check(
    await page.getByText('Cargo moved to bay 2.').first().isVisible(),
    'cargo move logs',
);
await page.screenshot({ path: join(outDir, 'hud-cargo.png') });

await browser.close();
server.close();

console.log(`artifacts: ${outDir}`);
if (failures.length > 0) {
    console.error(`${String(failures.length)} probe check(s) FAILED`);
    process.exit(1);
}
console.log('HUD showcase probe PASSED');
