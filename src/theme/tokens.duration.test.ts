import { type Dirent, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { PORTAL_TOKENS } from './tokens';

/**
 * Duration design-token coverage (backlog item D1).
 *
 * This is the Moirai precondition for the duration family split: before D1
 * there was no automated assertion of any animation duration, so every token
 * move was eye-only. These guards pin the two intent-named families to their
 * exact authored values, fence each consumer to its assigned family (the check
 * that catches a UI component sitting on a per-frame token, the original CTA
 * foot-gun), keep the TS mirror in lock-step with the CSS, and prove the legacy
 * value-named names are fully removed.
 *
 * The test reads source bytes directly (no CSS-module import): jsdom applies no
 * CSS cascade, so getComputedStyle cannot measure milliseconds here, and a
 * byte-level read needs no rendering and no extra dependency.
 */

const themeDirectory: string = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot: string = path.resolve(themeDirectory, '..');
const tokensCssPath: string = path.join(themeDirectory, 'tokens.css');
const tokensTsPath: string = path.join(themeDirectory, 'tokens.ts');

type DurationFamily = 'frame' | 'ui';

type DurationDeclaration = {
    readonly token: string;
    readonly value: string;
};

// The exact, authored value of every --portal-duration-* custom property.
//
// frame-* are real per-frame budgets for tactile game-input feedback
// (7ms ~= 144 fps, 16ms ~= 60 fps, 33ms ~= 30 fps); ui-* are conventional
// affordance timings for the generic UI layer; metal-sheen is the separate
// brushed-trim loop and belongs to neither family.
const EXPECTED_DURATIONS: readonly DurationDeclaration[] = [
    { token: 'frame-fast', value: '7ms' },
    { token: 'frame-base', value: '16ms' },
    { token: 'frame-slow', value: '33ms' },
    { token: 'ui-fast', value: '120ms' },
    { token: 'ui-base', value: '200ms' },
    { token: 'ui-slow', value: '320ms' },
    { token: 'metal-sheen', value: '7s' },
];

// The six family tokens that the TS mirror must reference one-for-one
// (metal-sheen is intentionally not mirrored).
const FAMILY_TOKENS: readonly string[] = [
    'frame-fast',
    'frame-base',
    'frame-slow',
    'ui-fast',
    'ui-base',
    'ui-slow',
];

// The two directory trees that hold every duration consumer. Deriving the
// consumer set from the tree (rather than a hand-maintained allowlist) is what
// auto-fences each new component: anything added under these roots is checked
// the moment it lands, with no list to forget to update.
const componentsRoot: string = path.join(sourceRoot, 'components');
const uiRoot: string = path.join(sourceRoot, 'ui');

// The single directory-to-intent exception: Toggle lives in src/components but
// is a role="switch" UI affordance, so by intent it belongs to the ui-* family,
// not the per-frame family of its sibling game-input controllers.
const TOGGLE_PATH_PREFIX: string = 'components/Toggle/';

// Classifies a consumer to the family it must reference, purely from its path:
// src/components => frame and src/ui => ui, with the lone Toggle exception.
function familyForConsumer(relativePath: string): DurationFamily {
    if (relativePath.startsWith(TOGGLE_PATH_PREFIX)) {
        return 'ui';
    }
    if (relativePath.startsWith('components/')) {
        return 'frame';
    }
    return 'ui';
}

// The value-named names removed by D1. No source file may reference them again.
const LEGACY_DURATION_PATTERN: RegExp =
    /--portal-duration-(?:fast|base|slow|ms64|ms128)\b/;

function readSource(absolutePath: string): string {
    const contents: string = readFileSync(absolutePath, 'utf8');
    if (contents.length === 0) {
        throw new Error(`Source file ${absolutePath} was empty or unreadable.`);
    }
    return contents;
}

function parseDurationDeclarations(css: string): ReadonlyMap<string, string> {
    const declarations: Map<string, string> = new Map<string, string>();
    const pattern: RegExp =
        /--portal-duration-(?<name>[a-z0-9-]+):\s*(?<value>[^;]+);/g;
    for (const match of css.matchAll(pattern)) {
        const name: string | undefined = match.groups?.name;
        const value: string | undefined = match.groups?.value;
        if (name === undefined || value === undefined) {
            continue;
        }
        declarations.set(name, value.trim());
    }
    return declarations;
}

function parseDurationVarReferences(source: string): ReadonlySet<string> {
    const names: Set<string> = new Set<string>();
    const pattern: RegExp = /var\(--portal-duration-(?<name>[a-z0-9-]+)\)/g;
    for (const match of source.matchAll(pattern)) {
        const name: string | undefined = match.groups?.name;
        if (name === undefined) {
            continue;
        }
        names.add(name);
    }
    return names;
}

function collectSourceFiles(directory: string): readonly string[] {
    const entries: readonly Dirent[] = readdirSync(directory, {
        withFileTypes: true,
    });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath: string = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectSourceFiles(fullPath));
            continue;
        }
        if (/\.(?:css|ts|tsx)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

describe('duration token values (tactile-feel anchor)', (): void => {
    it('declares exactly the two intent families at their authored values', (): void => {
        const expected: Map<string, string> = new Map<string, string>(
            EXPECTED_DURATIONS.map(
                (entry: DurationDeclaration): readonly [string, string] => [
                    entry.token,
                    entry.value,
                ],
            ),
        );

        // toEqual on the parsed map both pins every value (including the
        // 8ms -> 7ms frame-fast controller refinement) and proves no extra or
        // legacy duration token survives in tokens.css.
        expect(parseDurationDeclarations(readSource(tokensCssPath))).toEqual(
            expected,
        );
    });
});

describe('duration family references (cross-contamination guard)', (): void => {
    it('fences every duration consumer to its directory-derived family', (): void => {
        const consumers: readonly string[] = [
            ...collectSourceFiles(componentsRoot),
            ...collectSourceFiles(uiRoot),
        ];

        for (const absolutePath of consumers) {
            const relativePath: string = path
                .relative(sourceRoot, absolutePath)
                .split(path.sep)
                .join('/');
            const content: string = readSource(absolutePath);
            const referencesFrame: boolean = content.includes(
                'var(--portal-duration-frame-',
            );
            const referencesUi: boolean = content.includes(
                'var(--portal-duration-ui-',
            );

            // A file that consumes no frame/ui duration is not a family consumer:
            // ControlSurface references only metal-sheen, and most components
            // reference no duration at all, so there is nothing to fence.
            if (!referencesFrame && !referencesUi) {
                continue;
            }

            const family: DurationFamily = familyForConsumer(relativePath);
            switch (family) {
                case 'frame':
                    expect(
                        referencesFrame,
                        `${relativePath} must reference a frame-* duration`,
                    ).toBe(true);
                    expect(
                        referencesUi,
                        `${relativePath} must not reference a ui-* duration`,
                    ).toBe(false);
                    break;
                case 'ui':
                    expect(
                        referencesUi,
                        `${relativePath} must reference a ui-* duration`,
                    ).toBe(true);
                    expect(
                        referencesFrame,
                        `${relativePath} must not reference a frame-* duration`,
                    ).toBe(false);
                    break;
            }

            expect(
                LEGACY_DURATION_PATTERN.test(content),
                `${relativePath} must not reference a legacy duration token`,
            ).toBe(false);
        }
    });
});

describe('duration TS mirror (mirror-sync guard)', (): void => {
    it('mirrors exactly the six family tokens declared in tokens.css', (): void => {
        const mirrorReferences: ReadonlySet<string> = parseDurationVarReferences(
            readSource(tokensTsPath),
        );

        expect(mirrorReferences).toEqual(new Set<string>(FAMILY_TOKENS));
    });

    it('maps every family leaf to its exact var() reference', (): void => {
        // A flattened set of token names cannot catch a frame<->ui mapping swap
        // that preserves the name set (frame.fast pointing at the ui-fast var, or
        // a flattened/wrong nesting), so assert the exact per-leaf mapping on the
        // real exported object, which also pins the nested frame/ui shape.
        expect(PORTAL_TOKENS.duration.frame.fast).toBe(
            'var(--portal-duration-frame-fast)',
        );
        expect(PORTAL_TOKENS.duration.frame.base).toBe(
            'var(--portal-duration-frame-base)',
        );
        expect(PORTAL_TOKENS.duration.frame.slow).toBe(
            'var(--portal-duration-frame-slow)',
        );
        expect(PORTAL_TOKENS.duration.ui.fast).toBe(
            'var(--portal-duration-ui-fast)',
        );
        expect(PORTAL_TOKENS.duration.ui.base).toBe(
            'var(--portal-duration-ui-base)',
        );
        expect(PORTAL_TOKENS.duration.ui.slow).toBe(
            'var(--portal-duration-ui-slow)',
        );
    });
});

describe('legacy duration removal (completeness guard)', (): void => {
    it('leaves no source file referencing a removed legacy duration token', (): void => {
        const thisFile: string = fileURLToPath(import.meta.url);

        for (const file of collectSourceFiles(sourceRoot)) {
            if (file === thisFile) {
                continue;
            }
            const content: string = readSource(file);
            expect(
                LEGACY_DURATION_PATTERN.test(content),
                `${file} references a removed legacy duration token`,
            ).toBe(false);
        }
    });
});
