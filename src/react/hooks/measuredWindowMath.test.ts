import { describe, expect, it } from 'vitest';

import {
    anchorScrollDelta,
    buildRowOffsets,
    EMPTY_SLICE,
    type MeasuredWindowSlice,
    measuredWindowSlice,
    rowCountAbove,
    rowIndexAtOffset,
} from './measuredWindowMath';

// Convenience: a uniform offsets table mirroring what useVirtualWindow would
// compute, so the measured math can be checked against the uniform hook's
// documented windows.
function uniformOffsets(rowCount: number, rowHeight: number): readonly number[] {
    return buildRowOffsets(rowCount, rowHeight, []);
}

describe('buildRowOffsets', (): void => {
    it('returns the single-entry table for an empty list', (): void => {
        expect(buildRowOffsets(0, 24, [])).toEqual([0]);
        expect(buildRowOffsets(-3, 24, [])).toEqual([0]);
    });

    it('returns the single-entry table for a non-positive estimate', (): void => {
        expect(buildRowOffsets(10, 0, [])).toEqual([0]);
        expect(buildRowOffsets(10, -24, [])).toEqual([0]);
        expect(buildRowOffsets(10, Number.NaN, [])).toEqual([0]);
    });

    it('builds a uniform prefix sum from the estimate alone', (): void => {
        expect(buildRowOffsets(5, 24, [])).toEqual([0, 24, 48, 72, 96, 120]);
    });

    it('splices measured heights into the prefix sum', (): void => {
        const heights: (number | undefined)[] = [];
        heights[1] = 40;
        heights[3] = 10;
        expect(buildRowOffsets(5, 24, heights)).toEqual([0, 24, 64, 88, 98, 122]);
    });

    it('ignores non-positive and non-finite measurements', (): void => {
        const heights: (number | undefined)[] = [0, -5, Number.NaN, 40];
        expect(buildRowOffsets(4, 24, heights)).toEqual([0, 24, 48, 72, 112]);
    });

    it('ignores measurements beyond the row count', (): void => {
        const heights: (number | undefined)[] = [40, 40, 40, 40, 40];
        expect(buildRowOffsets(2, 24, heights)).toEqual([0, 40, 80]);
    });
});

describe('rowIndexAtOffset', (): void => {
    const offsets: readonly number[] = uniformOffsets(3, 24); // [0,24,48,72]

    it('resolves the degenerate table to row 0', (): void => {
        expect(rowIndexAtOffset([0], 100)).toBe(0);
    });

    it('resolves positions at or before the first row to row 0', (): void => {
        expect(rowIndexAtOffset(offsets, 0)).toBe(0);
        expect(rowIndexAtOffset(offsets, -10)).toBe(0);
        expect(rowIndexAtOffset(offsets, Number.NaN)).toBe(0);
    });

    it('resolves a position inside a row to that row', (): void => {
        expect(rowIndexAtOffset(offsets, 23)).toBe(0);
        expect(rowIndexAtOffset(offsets, 25)).toBe(1);
        expect(rowIndexAtOffset(offsets, 71)).toBe(2);
    });

    it('resolves an exact row-top boundary to the row that starts there', (): void => {
        expect(rowIndexAtOffset(offsets, 24)).toBe(1);
        expect(rowIndexAtOffset(offsets, 48)).toBe(2);
    });

    it('clamps positions past the end to the last row', (): void => {
        expect(rowIndexAtOffset(offsets, 72)).toBe(2);
        expect(rowIndexAtOffset(offsets, 10_000)).toBe(2);
    });

    it('handles variable-height boundaries', (): void => {
        const heights: (number | undefined)[] = [100, 10];
        const varied: readonly number[] = buildRowOffsets(3, 24, heights); // [0,100,110,134]
        expect(rowIndexAtOffset(varied, 99)).toBe(0);
        expect(rowIndexAtOffset(varied, 100)).toBe(1);
        expect(rowIndexAtOffset(varied, 109)).toBe(1);
        expect(rowIndexAtOffset(varied, 110)).toBe(2);
    });
});

describe('rowCountAbove', (): void => {
    const offsets: readonly number[] = uniformOffsets(3, 24); // [0,24,48,72]

    it('returns 0 for the degenerate table and non-positive bands', (): void => {
        expect(rowCountAbove([0], 100)).toBe(0);
        expect(rowCountAbove(offsets, 0)).toBe(0);
        expect(rowCountAbove(offsets, -5)).toBe(0);
        expect(rowCountAbove(offsets, Number.NaN)).toBe(0);
    });

    it('keeps a partially exposed row and excludes a row starting at the edge', (): void => {
        // Band ends exactly at row 1's top: only row 0 is above it.
        expect(rowCountAbove(offsets, 24)).toBe(1);
        // One px past the boundary exposes row 1.
        expect(rowCountAbove(offsets, 25)).toBe(2);
    });

    it('counts every row for a band past the total size', (): void => {
        expect(rowCountAbove(offsets, 72)).toBe(3);
        expect(rowCountAbove(offsets, 10_000)).toBe(3);
    });
});

describe('measuredWindowSlice', (): void => {
    it('returns the shared empty slice for a degenerate table', (): void => {
        expect(measuredWindowSlice([0], 0, 480, 4)).toBe(EMPTY_SLICE);
    });

    it('yields the bare overscan band for a zero-height viewport', (): void => {
        // The jsdom first-paint case: clientHeight 0 means nothing is
        // visible, so only the overscan band renders (matches the uniform
        // hook's documented jsdom window).
        const slice: MeasuredWindowSlice = measuredWindowSlice(
            uniformOffsets(100, 24),
            0,
            0,
            4,
        );
        expect(slice.startIndex).toBe(0);
        expect(slice.endIndex).toBe(4);
        expect(slice.offsetStart).toBe(0);
        expect(slice.totalSize).toBe(2400);
    });

    it('matches the uniform hook window at an aligned scroll offset', (): void => {
        // useVirtualWindow's own test: 1000 rows x 48px, viewport 480,
        // scrollTop 4800 -> rows [96, 114) with offset 96 * 48.
        const slice: MeasuredWindowSlice = measuredWindowSlice(
            uniformOffsets(1000, 48),
            4800,
            480,
            4,
        );
        expect(slice.startIndex).toBe(96);
        expect(slice.endIndex).toBe(114);
        expect(slice.offsetStart).toBe(96 * 48);
        expect(slice.totalSize).toBe(48_000);
    });

    it('keeps the partially scrolled bottom row at a fractional offset', (): void => {
        // The uniform hook's fractional-scroll regression: scrollTop 24 +
        // viewport 480 exposes 504px, so row 10 (480..528) stays in.
        const slice: MeasuredWindowSlice = measuredWindowSlice(
            uniformOffsets(1000, 48),
            24,
            480,
            0,
        );
        expect(slice.startIndex).toBe(0);
        expect(slice.endIndex).toBe(11);
    });

    it('windows variable heights by their measured boundaries', (): void => {
        // Rows: 100, 10, then 24-estimates -> offsets [0,100,110,134,158,...].
        const heights: (number | undefined)[] = [100, 10];
        const offsets: readonly number[] = buildRowOffsets(6, 24, heights);
        const slice: MeasuredWindowSlice = measuredWindowSlice(offsets, 105, 40, 0);
        // 105 sits inside row 1 (100..110); the band ends at 145 inside row
        // 3 (134..158), so rows [1, 4) render.
        expect(slice.startIndex).toBe(1);
        expect(slice.endIndex).toBe(4);
        expect(slice.offsetStart).toBe(100);
        expect(slice.totalSize).toBe(100 + 10 + 24 * 4);
    });

    it('clamps a scroll position past the end to the tail rows', (): void => {
        const slice: MeasuredWindowSlice = measuredWindowSlice(
            uniformOffsets(20, 48),
            20 * 48,
            480,
            4,
        );
        expect(slice.startIndex).toBeGreaterThanOrEqual(0);
        expect(slice.endIndex).toBe(20);
    });

    it('treats negative and non-finite band inputs as zero', (): void => {
        const offsets: readonly number[] = uniformOffsets(100, 24);
        const negative: MeasuredWindowSlice = measuredWindowSlice(
            offsets,
            -50,
            480,
            0,
        );
        expect(negative.startIndex).toBe(0);
        expect(negative.endIndex).toBe(20);
        const nan: MeasuredWindowSlice = measuredWindowSlice(
            offsets,
            Number.NaN,
            Number.NaN,
            0,
        );
        expect(nan.startIndex).toBe(0);
        expect(nan.endIndex).toBe(0);
    });

    it('treats a negative overscan as zero', (): void => {
        const slice: MeasuredWindowSlice = measuredWindowSlice(
            uniformOffsets(100, 24),
            0,
            240,
            -4,
        );
        expect(slice.startIndex).toBe(0);
        expect(slice.endIndex).toBe(10);
    });
});

describe('anchorScrollDelta', (): void => {
    it('sums deltas only for pending rows above the anchor', (): void => {
        const pending: Map<number, number> = new Map<number, number>([
            [0, 40],
            [1, 40],
            [5, 40],
        ]);
        // Rows 0 and 1 are above anchor 3 and previously unmeasured, so each
        // contributes 40 - 24; row 5 is below the anchor and contributes 0.
        expect(anchorScrollDelta(pending, [], 24, 3)).toBe(32);
    });

    it('uses the stored measurement as the previous height when present', (): void => {
        const pending: Map<number, number> = new Map<number, number>([[0, 40]]);
        const heights: (number | undefined)[] = [32];
        expect(anchorScrollDelta(pending, heights, 24, 2)).toBe(8);
    });

    it('ignores rows at the anchor itself', (): void => {
        const pending: Map<number, number> = new Map<number, number>([[2, 99]]);
        expect(anchorScrollDelta(pending, [], 24, 2)).toBe(0);
    });

    it('ignores non-positive and non-finite pending heights', (): void => {
        const pending: Map<number, number> = new Map<number, number>([
            [0, 0],
            [1, -10],
            [2, Number.NaN],
        ]);
        expect(anchorScrollDelta(pending, [], 24, 5)).toBe(0);
    });

    it('sums shrink and growth into one net correction', (): void => {
        const pending: Map<number, number> = new Map<number, number>([
            [0, 12],
            [1, 36],
        ]);
        // 12 - 24 = -12 and 36 - 24 = +12 cancel.
        expect(anchorScrollDelta(pending, [], 24, 4)).toBe(0);
    });
});
