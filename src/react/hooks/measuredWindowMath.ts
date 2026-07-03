// Pure offset math for variable-height row windowing. React-free and DOM-free
// (the gaugeMath / slotMath split) so the prefix-sum, binary-search, and
// scroll-anchoring arithmetic stays unit-testable in isolation. Offsets are a
// prefix-sum array of length rowCount + 1: offsets[i] is the top edge of row i
// and offsets[rowCount] is the total scrollable size. Rows without a
// measurement fall back to the estimated height, so the array is always fully
// defined and monotonically non-decreasing.

// A windowed slice over the offset table: the same shape VirtualWindowState
// exposes, derived from measured offsets instead of a uniform row height.
export type MeasuredWindowSlice = Readonly<{
    // First rendered row index (inclusive), overscan applied, clamped to >= 0.
    startIndex: number;
    // One past the last rendered row index (exclusive), clamped to <= rowCount.
    endIndex: number;
    // Top edge, in px, of the rendered block inside the sizer
    // (offsets[startIndex]).
    offsetStart: number;
    // Full scrollable height in px (offsets[rowCount]); drives the spacer.
    totalSize: number;
}>;

// Shared frozen degenerate slice so callers get a stable reference for the
// empty case (the useVirtualWindow EMPTY_WINDOW counterpart).
export const EMPTY_SLICE: MeasuredWindowSlice = {
    startIndex: 0,
    endIndex: 0,
    offsetStart: 0,
    totalSize: 0,
};

// Builds the offsets prefix sum for `rowCount` rows: measured heights where
// present (non-positive or non-finite measurements are ignored - jsdom and
// display:none report zero), the estimate everywhere else. Degenerate input
// (no rows, or a non-positive estimate) yields the single-entry table [0].
export function buildRowOffsets(
    rowCount: number,
    estimatedRowHeight: number,
    measuredHeights: readonly (number | undefined)[],
): readonly number[] {
    if (rowCount <= 0) {
        return [0];
    }
    if (!Number.isFinite(estimatedRowHeight) || estimatedRowHeight <= 0) {
        return [0];
    }
    const offsets: number[] = new Array<number>(rowCount + 1);
    offsets[0] = 0;
    let total: number = 0;
    for (let index: number = 0; index < rowCount; index += 1) {
        const measured: number | undefined = measuredHeights[index];
        const height: number =
            measured !== undefined && Number.isFinite(measured) && measured > 0
                ? measured
                : estimatedRowHeight;
        total += height;
        offsets[index + 1] = total;
    }
    return offsets;
}

// The row containing vertical position `y`: the greatest index whose top edge
// is at or above y, clamped into [0, rowCount - 1]. A degenerate table (or a
// y before the first row) resolves to row 0.
export function rowIndexAtOffset(offsets: readonly number[], y: number): number {
    const rowCount: number = offsets.length - 1;
    if (rowCount <= 0) {
        return 0;
    }
    if (!Number.isFinite(y) || y <= 0) {
        return 0;
    }
    // Binary search: greatest i in [0, rowCount - 1] with offsets[i] <= y.
    let low: number = 0;
    let high: number = rowCount - 1;
    while (low < high) {
        const mid: number = Math.ceil((low + high) / 2);
        const top: number | undefined = offsets[mid];
        if (top !== undefined && top <= y) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }
    return low;
}

// Count of rows whose top edge is strictly above `y` - the exclusive end of
// the visible range for a band ending at y. A row starting exactly at the
// band edge is not visible, so the comparison is strict (this is the measured
// counterpart of useVirtualWindow's ceil-of-the-band-edge rule: a partially
// exposed bottom row stays in, a row that begins at the edge stays out).
export function rowCountAbove(offsets: readonly number[], y: number): number {
    const rowCount: number = offsets.length - 1;
    if (rowCount <= 0) {
        return 0;
    }
    if (!Number.isFinite(y) || y <= 0) {
        return 0;
    }
    // Binary search: greatest i in [0, rowCount - 1] with offsets[i] < y.
    let low: number = 0;
    let high: number = rowCount - 1;
    while (low < high) {
        const mid: number = Math.ceil((low + high) / 2);
        const top: number | undefined = offsets[mid];
        if (top !== undefined && top < y) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }
    const lowTop: number | undefined = offsets[low];
    return lowTop !== undefined && lowTop < y ? low + 1 : 0;
}

// The rendered slice for a viewport band [scrollTop, scrollTop +
// viewportHeight) over the offset table, with `overscan` extra rows on each
// side. Non-finite band inputs read as 0 (the first-paint window), and a
// zero-height viewport yields the bare overscan band - the same jsdom
// behavior useVirtualWindow documents.
export function measuredWindowSlice(
    offsets: readonly number[],
    scrollTop: number,
    viewportHeight: number,
    overscan: number,
): MeasuredWindowSlice {
    const rowCount: number = offsets.length - 1;
    if (rowCount <= 0) {
        return EMPTY_SLICE;
    }
    const bandStart: number =
        Number.isFinite(scrollTop) && scrollTop > 0 ? scrollTop : 0;
    const bandHeight: number =
        Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : 0;
    const over: number = Math.max(0, overscan);
    const firstVisible: number = rowIndexAtOffset(offsets, bandStart);
    const endVisible: number = rowCountAbove(offsets, bandStart + bandHeight);
    const startIndex: number = Math.max(0, firstVisible - over);
    const endIndex: number = Math.min(
        rowCount,
        Math.max(endVisible, startIndex) + over,
    );
    return {
        startIndex,
        endIndex,
        offsetStart: offsets[startIndex] ?? 0,
        totalSize: offsets[rowCount] ?? 0,
    };
}

// The scrollTop correction that keeps the anchor row (the row currently under
// the top of the viewport) stationary when pending measurements replace the
// heights of rows ABOVE it: the sum of (new - previous) for every pending
// index below anchorIndex, where a previously unmeasured row contributes the
// estimate as its previous height. Rows at or below the anchor never move
// content above the viewport, so they contribute nothing.
export function anchorScrollDelta(
    pendingHeights: ReadonlyMap<number, number>,
    currentHeights: readonly (number | undefined)[],
    estimatedRowHeight: number,
    anchorIndex: number,
): number {
    let delta: number = 0;
    for (const [index, nextHeight] of pendingHeights) {
        if (index >= anchorIndex) {
            continue;
        }
        if (!Number.isFinite(nextHeight) || nextHeight <= 0) {
            continue;
        }
        const current: number | undefined = currentHeights[index];
        const previous: number =
            current !== undefined && Number.isFinite(current) && current > 0
                ? current
                : estimatedRowHeight;
        delta += nextHeight - previous;
    }
    return delta;
}
