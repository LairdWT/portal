import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Bevel / HUD visual-language token + utility coverage.
 *
 * The foundation pass extracts the controllers' machined-console aesthetic into
 * shared tokens (tokens.css) and shared CSS-module utilities
 * (surfaces.module.css) that every component adopts by reference, so no
 * component re-invents a bevel or metal value. These guards pin the new token
 * values, prove the bevel sizes alias the existing radius scale (no new magic
 * numbers), and prove the shared utility classes exist. Source bytes are read
 * directly: jsdom applies no CSS cascade, so the values are asserted at the
 * source rather than through getComputedStyle, with no extra dependency.
 */

const themeDirectory: string = path.dirname(fileURLToPath(import.meta.url));
const tokensCssPath: string = path.join(themeDirectory, 'tokens.css');
const surfacesCssPath: string = path.join(themeDirectory, 'surfaces.module.css');

type TokenDeclaration = {
    readonly token: string;
    readonly value: string;
};

// The exact authored value of every bevel / HUD token. The bevel sizes alias
// the radius scale and the HUD parameters alias existing surface/border/tone
// tokens, so nothing new is invented and the reference look is unchanged.
const EXPECTED_TOKENS: readonly TokenDeclaration[] = [
    { token: '--portal-corner-shape', value: 'bevel' },
    { token: '--portal-bevel-1', value: 'var(--portal-radius-sm)' },
    { token: '--portal-bevel-2', value: 'var(--portal-radius-md)' },
    { token: '--portal-bevel-3', value: 'var(--portal-radius-lg)' },
    { token: '--portal-hud-fill', value: 'var(--portal-color-surface-0)' },
    {
        token: '--portal-hud-edge-width',
        value: 'var(--portal-border-thickness-thin)',
    },
    { token: '--portal-hud-glow', value: 'var(--portal-tone-glow)' },
    { token: '--portal-weight-label-bold', value: '900' },
    { token: '--portal-weight-label-strong', value: '700' },
];

// The shared utility classes any component composes by reference.
const SHARED_UTILITIES: readonly string[] = [
    'beveled',
    'metalTrim',
    'metalEdge',
    'metalFace',
    'wideLabel',
    'pressScale',
];

function readSource(absolutePath: string): string {
    const contents: string = readFileSync(absolutePath, 'utf8');
    if (contents.length === 0) {
        throw new Error(`Source file ${absolutePath} was empty or unreadable.`);
    }
    return contents;
}

function parseCustomProperties(css: string): ReadonlyMap<string, string> {
    const declarations: Map<string, string> = new Map<string, string>();
    const pattern: RegExp = /(--portal-[a-z0-9-]+):\s*([^;]+);/g;
    for (const match of css.matchAll(pattern)) {
        const name: string | undefined = match[1];
        const value: string | undefined = match[2];
        if (name === undefined || value === undefined) {
            continue;
        }
        if (!declarations.has(name)) {
            declarations.set(name, value.trim());
        }
    }
    return declarations;
}

describe('bevel / HUD tokens', (): void => {
    it('declares every shared bevel and HUD token at its authored value', (): void => {
        const declared: ReadonlyMap<string, string> = parseCustomProperties(
            readSource(tokensCssPath),
        );
        for (const entry of EXPECTED_TOKENS) {
            expect(
                declared.get(entry.token),
                `${entry.token} must be declared as ${entry.value}`,
            ).toBe(entry.value);
        }
    });

    it('aliases the bevel sizes to the radius scale (no new magic numbers)', (): void => {
        const declared: ReadonlyMap<string, string> = parseCustomProperties(
            readSource(tokensCssPath),
        );
        // Each bevel size must reference a radius token, not a raw length, so the
        // beveled cut tracks the reference BevelButton/ActionButton corner sizes.
        for (const token of [
            '--portal-bevel-1',
            '--portal-bevel-2',
            '--portal-bevel-3',
        ]) {
            expect(declared.get(token)).toMatch(/^var\(--portal-radius-[a-z]+\)$/);
        }
    });
});

describe('shared surface utilities', (): void => {
    it('exposes every machined-HUD utility class for composition', (): void => {
        const surfaces: string = readSource(surfacesCssPath);
        for (const utility of SHARED_UTILITIES) {
            expect(
                surfaces.includes(`.${utility}`),
                `surfaces.module.css must define .${utility}`,
            ).toBe(true);
        }
    });

    it('drives the metal trim sheen from the shared duration token', (): void => {
        const surfaces: string = readSource(surfacesCssPath);
        expect(surfaces).toContain('var(--portal-duration-metal-sheen)');
        // The sheen must stay reduced-motion gated.
        expect(surfaces).toContain('prefers-reduced-motion: no-preference');
    });
});
