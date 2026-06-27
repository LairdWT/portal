import { describe, expect, it } from 'vitest';

import { collapseAll, expandAll, setExpanded, toggleExpanded } from './expansion';

describe('expansion helpers', (): void => {
    describe('toggleExpanded', (): void => {
        it('adds an absent id', (): void => {
            const result: ReadonlySet<string> = toggleExpanded(new Set(['a']), 'b');
            expect([...result].sort()).toEqual(['a', 'b']);
        });

        it('removes a present id', (): void => {
            const result: ReadonlySet<string> = toggleExpanded(
                new Set(['a', 'b']),
                'b',
            );
            expect([...result]).toEqual(['a']);
        });

        it('never mutates the input set', (): void => {
            const input: ReadonlySet<string> = new Set(['a']);
            toggleExpanded(input, 'a');
            expect([...input]).toEqual(['a']);
        });
    });

    describe('setExpanded', (): void => {
        it('adds an id when expanding an absent id', (): void => {
            const result: ReadonlySet<string> = setExpanded(new Set(), 'a', true);
            expect([...result]).toEqual(['a']);
        });

        it('removes an id when collapsing a present id', (): void => {
            const result: ReadonlySet<string> = setExpanded(
                new Set(['a', 'b']),
                'a',
                false,
            );
            expect([...result]).toEqual(['b']);
        });

        it('returns the same reference when expanding an already-present id', (): void => {
            const input: ReadonlySet<string> = new Set(['a']);
            expect(setExpanded(input, 'a', true)).toBe(input);
        });

        it('returns the same reference when collapsing an already-absent id', (): void => {
            const input: ReadonlySet<string> = new Set(['a']);
            expect(setExpanded(input, 'b', false)).toBe(input);
        });
    });

    describe('expandAll', (): void => {
        it('builds a set from the id list', (): void => {
            const result: ReadonlySet<string> = expandAll(['a', 'b', 'c']);
            expect([...result].sort()).toEqual(['a', 'b', 'c']);
        });

        it('dedupes repeated ids', (): void => {
            const result: ReadonlySet<string> = expandAll(['a', 'a', 'b']);
            expect(result.size).toBe(2);
        });
    });

    describe('collapseAll', (): void => {
        it('yields an empty set', (): void => {
            expect(collapseAll().size).toBe(0);
        });
    });
});
