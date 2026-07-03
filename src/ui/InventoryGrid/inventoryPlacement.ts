// Pure multi-cell placement math for InventoryGrid item spans. React-free and
// DOM-free (the slotMath split): span normalization, footprint enumeration,
// the cell->anchor coverage projection, and placement validation. Items
// occupy RECTANGULAR spans of grid cells anchored at their top-left cell
// index; every non-anchor covered cell stays a real (empty) slot entry in the
// consumer's array - the coverage map is how the grid knows a cell belongs to
// an item.

import { columnFromIndex, rowCount, rowFromIndex } from './slotMath';

// A normalized rectangular footprint in whole cells.
export type ItemSpan = Readonly<{
    widthCells: number;
    heightCells: number;
}>;

// The optional span fields as they appear on a slot (both default to 1).
export type SpanInput = Readonly<{
    widthCells?: number | undefined;
    heightCells?: number | undefined;
}>;

// One projected entry: whether the slot anchors an item, and its footprint.
export type PlacedEntry = Readonly<{
    occupied: boolean;
    span: ItemSpan;
}>;

const SINGLE_CELL: number = 1;

function normalizeAxis(value: number | undefined): number {
    if (value === undefined || !Number.isFinite(value)) {
        return SINGLE_CELL;
    }
    return Math.max(SINGLE_CELL, Math.floor(value));
}

// The slot's footprint with both axes floored to whole cells and clamped to
// at least 1x1 (a non-finite or missing axis reads as 1).
export function normalizeSpan(span: SpanInput | undefined): ItemSpan {
    return {
        widthCells: normalizeAxis(span?.widthCells),
        heightCells: normalizeAxis(span?.heightCells),
    };
}

// The covered cell indices for an anchor + span, top-left to bottom-right,
// or null when the footprint leaves the grid: a right-edge column overflow,
// a bottom row overflow, or any covered index past the last slot (a ragged
// final row cannot host a footprint that needs its missing cells).
export function spanCells(
    anchorIndex: number,
    span: ItemSpan,
    columns: number,
    slotCount: number,
): readonly number[] | null {
    if (columns <= 0 || slotCount <= 0) {
        return null;
    }
    if (anchorIndex < 0 || anchorIndex >= slotCount) {
        return null;
    }
    const anchorColumn: number = columnFromIndex(anchorIndex, columns);
    if (anchorColumn + span.widthCells > columns) {
        return null;
    }
    const anchorRow: number = rowFromIndex(anchorIndex, columns);
    if (anchorRow + span.heightCells > rowCount(slotCount, columns)) {
        return null;
    }
    const cells: number[] = [];
    for (let row: number = 0; row < span.heightCells; row += 1) {
        for (let column: number = 0; column < span.widthCells; column += 1) {
            const index: number = anchorIndex + row * columns + column;
            if (index >= slotCount) {
                return null;
            }
            cells.push(index);
        }
    }
    return cells;
}

// The cell -> anchor projection for the whole slot set: coverage[cell] is the
// anchor index of the item covering that cell, or null for a free cell. An
// occupied entry whose footprint does not fit (bad authoring) degrades to its
// anchor cell only, and on an (invalid) overlap the earlier anchor wins - the
// projection never throws on inconsistent input.
export function buildCoverage(
    entries: readonly PlacedEntry[],
    columns: number,
): readonly (number | null)[] {
    const coverage: (number | null)[] = entries.map((): null => null);
    entries.forEach((entry: PlacedEntry, anchorIndex: number): void => {
        if (!entry.occupied) {
            return;
        }
        const cells: readonly number[] | null = spanCells(
            anchorIndex,
            entry.span,
            columns,
            entries.length,
        );
        const covered: readonly number[] = cells ?? [anchorIndex];
        for (const cell of covered) {
            if (coverage[cell] === null) {
                coverage[cell] = anchorIndex;
            }
        }
    });
    return coverage;
}

// Whether an item with `span` can anchor at `anchorIndex`: the footprint must
// fit the grid and every covered cell must be free or covered by the moving
// item itself (`ignoreAnchor` - pass the item's current anchor so a footprint
// may overlap its own old position).
export function canPlace(
    anchorIndex: number,
    span: ItemSpan,
    coverage: readonly (number | null)[],
    columns: number,
    ignoreAnchor: number | null,
): boolean {
    const cells: readonly number[] | null = spanCells(
        anchorIndex,
        span,
        columns,
        coverage.length,
    );
    if (cells === null) {
        return false;
    }
    return cells.every((cell: number): boolean => {
        const owner: number | null = coverage[cell] ?? null;
        return owner === null || owner === ignoreAnchor;
    });
}
