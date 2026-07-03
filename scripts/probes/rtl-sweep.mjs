// @ts-check
// The RTL audit probe: flips the document to dir="rtl" and drives the
// direction-sensitive interactive surfaces with real pointer gestures.
// Zero-arg: `pnpm probe:rtl` after `pnpm build-storybook`. What it proves:
//   - DataTable column resize mirrors its drag axis (a visually-left drag
//     GROWS the column under RTL);
//   - InventoryGrid pointer drag hit-tests against the mirrored columns;
//   - DockLayout edge zones mirror (the visual-left band is inline-END);
//   - Compass stays chirality-fixed (bearings still increase to the visual
//     right - the instrument does not mirror, by contract).
// Exits non-zero on any failed check; screenshots land in an OS-temp folder
// printed at the end.

import console from 'node:console';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

import { artifactDirectory, gotoStory, serveStorybook } from './probeServer.mjs';

const PORT = 6142;
const scriptDir = dirname(fileURLToPath(import.meta.url));
const storybookRoot = resolve(scriptDir, '..', '..', 'storybook-static');
const outDir = artifactDirectory('rtl-sweep');
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
const page = await browser.newPage({ viewport: { width: 900, height: 720 } });

/**
 * Load a story and flip the document to RTL before interacting.
 *
 * @param {string} storyId
 */
async function gotoRtlStory(storyId) {
    await gotoStory(page, PORT, storyId);
    // A string expression: the callback form would reference the browser's
    // `document` in a node-linted file.
    await page.evaluate('document.documentElement.dir = "rtl"');
    await page.waitForTimeout(300);
}

// ---- DataTable column resize mirrors ----
await gotoRtlStory('ui-datatable--resizable-frozen-columns');
const separator = page.getByRole('separator', { name: 'Resize Name column' });
const before = Number(await separator.getAttribute('aria-valuenow'));
const separatorBox = await separator.boundingBox();
if (separatorBox === null) {
    throw new Error('missing separator box');
}
await page.mouse.move(
    separatorBox.x + separatorBox.width / 2,
    separatorBox.y + separatorBox.height / 2,
);
await page.mouse.down();
await page.mouse.move(
    separatorBox.x + separatorBox.width / 2 - 60,
    separatorBox.y + separatorBox.height / 2,
    { steps: 6 },
);
await page.mouse.up();
const after = Number(await separator.getAttribute('aria-valuenow'));
check(
    after === before + 60,
    `DataTable resize mirrors under RTL (${String(before)} -> ${String(after)})`,
);
await page.screenshot({ path: join(outDir, 'datatable-rtl.png') });

// ---- InventoryGrid pointer drag hit-tests mirrored columns ----
await gotoRtlStory('ui-inventorygrid--default');
const source = page.getByRole('gridcell', { name: 'Plasma cell' });
const target = page.getByRole('gridcell', { name: 'Empty slot 6' });
const sourceBox = await source.boundingBox();
const targetBox = await target.boundingBox();
if (sourceBox === null || targetBox === null) {
    throw new Error('missing cell boxes');
}
await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
);
await page.mouse.down();
await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 8 },
);
await page.mouse.up();
await page.waitForTimeout(200);
// The drop landed where the pointer visually was: the plasma cell now sits
// at index 5 - the visually-targeted sixth slot - proving the hit test
// mirrored the columns instead of landing on the LTR mirror image.
const cellNames = await page
    .getByRole('gridcell')
    .evaluateAll((cells) =>
        cells.map((cell) => cell.getAttribute('aria-label') ?? ''),
    );
check(
    cellNames[5] === 'Plasma cell',
    `InventoryGrid RTL drag lands on the visually-targeted slot (order: ${cellNames.join(', ')})`,
);
await page.screenshot({ path: join(outDir, 'inventory-rtl.png') });

// ---- DockLayout edge zones mirror ----
await gotoRtlStory('ui-docklayout--default');
const grip = page.getByRole('button', { name: 'Move Console' });
const dockRegion = page.locator('[aria-label="Workspace dock"]');
const gripBox = await grip.boundingBox();
const dockBox = await dockRegion.boundingBox();
if (gripBox === null || dockBox === null) {
    throw new Error('missing dock boxes');
}
await page.mouse.move(
    gripBox.x + gripBox.width / 2,
    gripBox.y + gripBox.height / 2,
);
await page.mouse.down();
// Drop in the VISUAL-LEFT band: inline-END under RTL, so the console group
// must land LAST in the tree (it would land first in LTR).
await page.mouse.move(
    dockBox.x + dockBox.width * 0.05,
    dockBox.y + dockBox.height / 2,
    { steps: 10 },
);
await page.mouse.up();
await page.waitForTimeout(300);
const groupOrder = await page
    .locator('[data-dock-group]')
    .evaluateAll((groups) =>
        groups.map((group) => group.getAttribute('data-dock-group') ?? ''),
    );
check(
    groupOrder[groupOrder.length - 1] === 'console',
    `DockLayout visual-left drop docks inline-end under RTL (order: ${groupOrder.join(', ')})`,
);
await page.screenshot({ path: join(outDir, 'dock-rtl.png') });

// ---- Compass stays chirality-fixed ----
await gotoRtlStory('ui-compass--default');
const neBox = await page.getByText('NE', { exact: true }).boundingBox();
const eBox = await page.getByText('E', { exact: true }).boundingBox();
if (neBox === null || eBox === null) {
    throw new Error('missing cardinal boxes');
}
check(
    neBox.x < eBox.x,
    'Compass bearings still increase to the visual right under RTL',
);
await page.screenshot({ path: join(outDir, 'compass-rtl.png') });

await browser.close();
server.close();

console.log(`artifacts: ${outDir}`);
if (failures.length > 0) {
    console.error(`${String(failures.length)} probe check(s) FAILED`);
    process.exit(1);
}
console.log('RTL sweep PASSED');
