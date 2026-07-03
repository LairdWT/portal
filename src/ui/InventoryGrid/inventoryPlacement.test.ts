import { describe, expect, it } from 'vitest';

import {
    buildCoverage,
    canPlace,
    type ItemSpan,
    normalizeSpan,
    type PlacedEntry,
    spanCells,
} from './inventoryPlacement';

const ONE: ItemSpan = { widthCells: 1, heightCells: 1 };
const WIDE: ItemSpan = { widthCells: 2, heightCells: 1 };
const TALL: ItemSpan = { widthCells: 1, heightCells: 2 };
const CRATE: ItemSpan = { widthCells: 2, heightCells: 2 };

function entries(
    count: number,
    items: ReadonlyMap<number, ItemSpan>,
): readonly PlacedEntry[] {
    return Array.from(
        { length: count },
        (_: unknown, index: number): PlacedEntry => {
            const span: ItemSpan | undefined = items.get(index);
            return span !== undefined
                ? { occupied: true, span }
                : { occupied: false, span: ONE };
        },
    );
}

describe('normalizeSpan', (): void => {
    it('defaults a missing or partial span to 1x1', (): void => {
        expect(normalizeSpan(undefined)).toEqual(ONE);
        expect(normalizeSpan({})).toEqual(ONE);
        expect(normalizeSpan({ widthCells: 2 })).toEqual({
            widthCells: 2,
            heightCells: 1,
        });
    });

    it('floors fractions and clamps non-finite or sub-1 axes to 1', (): void => {
        expect(normalizeSpan({ widthCells: 2.9, heightCells: 3.1 })).toEqual({
            widthCells: 2,
            heightCells: 3,
        });
        expect(normalizeSpan({ widthCells: 0, heightCells: Number.NaN })).toEqual(
            ONE,
        );
        expect(
            normalizeSpan({
                widthCells: Number.POSITIVE_INFINITY,
                heightCells: -4,
            }),
        ).toEqual(ONE);
    });
});

describe('spanCells', (): void => {
    it('enumerates a rectangular footprint row-major from the anchor', (): void => {
        // 4-column grid: a 2x2 anchored at 1 covers 1,2 / 5,6.
        expect(spanCells(1, CRATE, 4, 12)).toEqual([1, 2, 5, 6]);
        expect(spanCells(0, TALL, 4, 12)).toEqual([0, 4]);
        expect(spanCells(10, WIDE, 4, 12)).toEqual([10, 11]);
    });

    it('rejects footprints that leave the grid', (): void => {
        // Right-edge overflow: 2 wide anchored on the last column.
        expect(spanCells(3, WIDE, 4, 12)).toBeNull();
        // Bottom overflow: 2 tall anchored on the last row.
        expect(spanCells(9, TALL, 4, 12)).toBeNull();
        // Ragged final row: the covered index would pass the last slot.
        expect(spanCells(6, TALL, 4, 10)).toBeNull();
    });

    it('rejects degenerate grids and out-of-range anchors', (): void => {
        expect(spanCells(0, ONE, 0, 12)).toBeNull();
        expect(spanCells(0, ONE, 4, 0)).toBeNull();
        expect(spanCells(-1, ONE, 4, 12)).toBeNull();
        expect(spanCells(12, ONE, 4, 12)).toBeNull();
    });
});

describe('buildCoverage', (): void => {
    it('projects every covered cell onto its anchor', (): void => {
        const coverage: readonly (number | null)[] = buildCoverage(
            entries(12, new Map([[1, CRATE]])),
            4,
        );
        expect(coverage[1]).toBe(1);
        expect(coverage[2]).toBe(1);
        expect(coverage[5]).toBe(1);
        expect(coverage[6]).toBe(1);
        expect(coverage[0]).toBeNull();
        expect(coverage[7]).toBeNull();
    });

    it('degrades an unfittable footprint to its anchor cell only', (): void => {
        // 2 wide anchored on the last column cannot fit; the anchor still
        // reads occupied so the item stays grabbable.
        const coverage: readonly (number | null)[] = buildCoverage(
            entries(12, new Map([[3, WIDE]])),
            4,
        );
        expect(coverage[3]).toBe(3);
        expect(coverage[4]).toBeNull();
    });

    it('keeps the earlier anchor on an authored overlap', (): void => {
        const coverage: readonly (number | null)[] = buildCoverage(
            entries(
                12,
                new Map<number, ItemSpan>([
                    [0, WIDE],
                    [1, ONE],
                ]),
            ),
            4,
        );
        expect(coverage[0]).toBe(0);
        // Cell 1 is claimed by the wide item first; the 1x1 anchored there
        // loses the projection but never crashes it.
        expect(coverage[1]).toBe(0);
    });
});

describe('canPlace', (): void => {
    const COVERAGE: readonly (number | null)[] = buildCoverage(
        entries(
            12,
            new Map<number, ItemSpan>([
                [1, CRATE],
                [8, WIDE],
            ]),
        ),
        4,
    );

    it('accepts a footprint over free cells', (): void => {
        expect(canPlace(10, WIDE, COVERAGE, 4, null)).toBe(true);
    });

    it('rejects a footprint over another item', (): void => {
        expect(canPlace(0, WIDE, COVERAGE, 4, null)).toBe(false);
        expect(canPlace(4, CRATE, COVERAGE, 4, null)).toBe(false);
    });

    it('lets a footprint overlap its own current cells', (): void => {
        // The crate at 1 shifting right by one: covers 2,3,6,7 where 2 and 6
        // belong to itself.
        expect(canPlace(2, CRATE, COVERAGE, 4, 1)).toBe(true);
        expect(canPlace(2, CRATE, COVERAGE, 4, null)).toBe(false);
    });

    it('rejects a footprint that leaves the grid', (): void => {
        expect(canPlace(3, WIDE, COVERAGE, 4, null)).toBe(false);
        expect(canPlace(11, TALL, COVERAGE, 4, null)).toBe(false);
    });
});
