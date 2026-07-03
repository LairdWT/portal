// @ts-check
// Shared plumbing for the visual probes: a zero-dependency static server
// over the storybook-static build plus the story-navigation helper. Probes
// are the repo's visual-verification ritual - the story/axe gate proves
// semantics in a real browser, but only a probe LOOKS at the pixels and
// drives real pointer gestures, which matters doubly here because the
// owner's OS runs with reduced motion on (a probe is the only way anyone
// sees the full-motion paths).

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { URL } from 'node:url';

/** @type {Readonly<Record<string, string>>} */
const MIME = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
};

/**
 * Serve a static Storybook build on 127.0.0.1:port. Fails fast with a
 * remediation hint when the build is missing.
 *
 * @param {string} root Absolute path of the storybook-static directory.
 * @param {number} port Local port (each probe owns its own).
 * @returns {Promise<import('node:http').Server>}
 */
export async function serveStorybook(root, port) {
    if (!existsSync(join(root, 'iframe.html'))) {
        throw new Error(
            `No Storybook build at ${root} - run "pnpm build-storybook" first.`,
        );
    }
    const server = createServer(async (request, response) => {
        try {
            const url = new URL(
                request.url ?? '/',
                `http://127.0.0.1:${String(port)}`,
            );
            const path = url.pathname === '/' ? '/index.html' : url.pathname;
            const body = await readFile(join(root, path));
            response.writeHead(200, {
                'content-type': MIME[extname(path)] ?? 'application/octet-stream',
            });
            response.end(body);
        } catch {
            response.writeHead(404);
            response.end('not found');
        }
    });
    await new Promise((resolvePromise) => {
        server.listen(port, '127.0.0.1', () => {
            resolvePromise(undefined);
        });
    });
    return server;
}

/**
 * Navigate the page to one story's iframe and let it settle.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} port
 * @param {string} storyId Storybook story id (e.g. "ui-gauge--default").
 */
export async function gotoStory(page, port, storyId) {
    await page.goto(`http://127.0.0.1:${String(port)}/iframe.html?id=${storyId}`, {
        waitUntil: 'networkidle',
    });
    await page.waitForTimeout(500);
}

/**
 * Where probe screenshots land: an OS-temp folder, printed by each probe
 * (artifacts are review aids, never repo content).
 *
 * @param {string} probeName
 * @returns {string}
 */
export function artifactDirectory(probeName) {
    return join(tmpdir(), 'portal-probes', probeName);
}
