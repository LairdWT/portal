import { type Dirent, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Bevel-compliance guard (owner dev-build review, 1.12.0 pass).
 *
 * The machined corner is delivered in two halves: a --portal-bevel-N
 * border-radius (the rounded fallback) plus corner-shape from the shared
 * .beveled utility. A rule that declares the bevel radius WITHOUT composing
 * .beveled (or declaring corner-shape itself) silently renders ROUND in every
 * browser - the root cause of most violations in the owner's visual review
 * (Cooldown, Lightbox zoom keys, Hotbar keybind chips, Odometer, ...). jsdom
 * applies no CSS cascade, so like the duration guard this reads source bytes:
 * every *.module.css rule block that sets a bevel radius must either declare
 * corner-shape, compose a beveled class, or belong to a class that composes
 * one in its base rule (attribute/pseudo-class variants inherit the class).
 *
 * Pseudo-element boxes (::before/::after) are their own boxes and never
 * inherit the host's corner-shape, so those blocks must declare corner-shape
 * directly.
 *
 * The companion story guard bans inline borderRadius in stories outright:
 * inline styles cannot carry corner-shape through the React style prop
 * reliably, so ad-hoc story chrome fakes a bevel as a round corner. Stories
 * draw boxes with components or a story-support class instead.
 */

const themeDirectory: string = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot: string = path.resolve(themeDirectory, '..');

// Theme utility classes that carry corner-shape themselves; composing any of
// them makes the consuming class beveled.
const BEVELED_THEME_CLASSES: readonly string[] = [
    'beveled',
    'compactControl',
    'toggleChip',
];

type RuleBlock = {
    readonly selector: string;
    readonly body: string;
};

function collectModuleCssFiles(directory: string): readonly string[] {
    const entries: readonly Dirent[] = readdirSync(directory, {
        withFileTypes: true,
    });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath: string = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectModuleCssFiles(fullPath));
            continue;
        }
        if (entry.name.endsWith('.module.css')) {
            files.push(fullPath);
        }
    }
    return files;
}

function collectStoryFiles(directory: string): readonly string[] {
    const entries: readonly Dirent[] = readdirSync(directory, {
        withFileTypes: true,
    });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath: string = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectStoryFiles(fullPath));
            continue;
        }
        if (entry.name.endsWith('.stories.tsx')) {
            files.push(fullPath);
        }
    }
    return files;
}

function stripComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

// Extracts every innermost rule block. The selector capture cannot cross a
// brace, so rules nested inside @media/@keyframes surface with their own
// selector while the at-rule wrapper (and its closing brace) never forms a
// block of its own.
function parseLeafBlocks(css: string): readonly RuleBlock[] {
    const blocks: RuleBlock[] = [];
    const pattern: RegExp = /(?<selector>[^{}]+)\{(?<body>[^{}]*)\}/g;
    for (const match of stripComments(css).matchAll(pattern)) {
        const selector: string | undefined = match.groups?.selector;
        const body: string | undefined = match.groups?.body;
        if (selector === undefined || body === undefined) {
            continue;
        }
        blocks.push({ selector: selector.trim(), body });
    }
    return blocks;
}

function classNamesIn(selectorFragment: string): readonly string[] {
    const names: string[] = [];
    for (const match of selectorFragment.matchAll(/\.(?<name>[A-Za-z0-9_-]+)/g)) {
        const name: string | undefined = match.groups?.name;
        if (name !== undefined) {
            names.push(name);
        }
    }
    return names;
}

// The subject of a selector: the final compound, whose element the block
// actually styles. `.root .header:hover` -> `.header:hover`.
function subjectOf(singleSelector: string): string {
    const compounds: readonly string[] = singleSelector
        .split(/[\s>+~]+/)
        .filter((part: string): boolean => part.length > 0);
    return compounds[compounds.length - 1] ?? singleSelector;
}

function bodyDeclaresCornerShape(body: string): boolean {
    return body.includes('corner-shape:');
}

function bodyComposedClasses(body: string): readonly string[] {
    const composed: string[] = [];
    for (const match of body.matchAll(/composes:(?<list>[^;]+);/g)) {
        const list: string | undefined = match.groups?.list;
        if (list === undefined) {
            continue;
        }
        // `composes: a b from '...'` - names precede the optional `from`.
        const names: string = list.split(/\bfrom\b/)[0] ?? '';
        for (const name of names.split(/\s+/)) {
            if (name.length > 0) {
                composed.push(name);
            }
        }
    }
    return composed;
}

// Resolves the set of class names in one file that end up beveled: directly
// (corner-shape / composes a beveled theme class) or transitively through
// local composition. The fixpoint loop settles local chains of any depth.
function beveledClassesOf(blocks: readonly RuleBlock[]): ReadonlySet<string> {
    const beveled: Set<string> = new Set<string>();
    let changed: boolean = true;
    while (changed) {
        changed = false;
        for (const block of blocks) {
            if (block.selector.startsWith('@')) {
                continue;
            }
            const composed: readonly string[] = bodyComposedClasses(block.body);
            const isBeveled: boolean =
                bodyDeclaresCornerShape(block.body) ||
                composed.some(
                    (name: string): boolean =>
                        BEVELED_THEME_CLASSES.includes(name) || beveled.has(name),
                );
            if (!isBeveled) {
                continue;
            }
            for (const name of classNamesIn(block.selector)) {
                if (!beveled.has(name)) {
                    beveled.add(name);
                    changed = true;
                }
            }
        }
    }
    return beveled;
}

const BEVEL_RADIUS_PATTERN: RegExp = /border-radius:[^;]*var\(--portal-bevel-/;

describe('bevel-radius compliance (machined-corner guard)', (): void => {
    it('pairs every --portal-bevel-N border-radius with a corner-shape source', (): void => {
        const violations: string[] = [];

        for (const file of collectModuleCssFiles(sourceRoot)) {
            const relativePath: string = path
                .relative(sourceRoot, file)
                .split(path.sep)
                .join('/');
            const blocks: readonly RuleBlock[] = parseLeafBlocks(
                readFileSync(file, 'utf8'),
            );
            const beveled: ReadonlySet<string> = beveledClassesOf(blocks);

            for (const block of blocks) {
                if (!BEVEL_RADIUS_PATTERN.test(block.body)) {
                    continue;
                }
                if (bodyDeclaresCornerShape(block.body)) {
                    continue;
                }
                const composed: readonly string[] = bodyComposedClasses(block.body);
                if (
                    composed.some(
                        (name: string): boolean =>
                            BEVELED_THEME_CLASSES.includes(name) ||
                            beveled.has(name),
                    )
                ) {
                    continue;
                }

                for (const single of block.selector.split(',')) {
                    const subject: string = subjectOf(single.trim());
                    // A pseudo-element is its own box: the host's corner-shape
                    // never reaches it, so the block itself must declare it.
                    if (/::(?:before|after)/.test(subject)) {
                        violations.push(
                            `${relativePath} :: ${single.trim()} (pseudo-element needs its own corner-shape)`,
                        );
                        continue;
                    }
                    const subjectClasses: readonly string[] = classNamesIn(subject);
                    const covered: boolean = subjectClasses.some(
                        (name: string): boolean => beveled.has(name),
                    );
                    if (!covered) {
                        violations.push(`${relativePath} :: ${single.trim()}`);
                    }
                }
            }
        }

        expect(violations).toEqual([]);
    });
});

describe('story chrome compliance (no inline fake bevels)', (): void => {
    it('keeps inline borderRadius out of stories - box chrome comes from components or story-support classes', (): void => {
        const offenders: string[] = [];

        for (const file of collectStoryFiles(sourceRoot)) {
            const content: string = readFileSync(file, 'utf8');
            if (content.includes('borderRadius')) {
                offenders.push(
                    path.relative(sourceRoot, file).split(path.sep).join('/'),
                );
            }
        }

        expect(offenders).toEqual([]);
    });
});
