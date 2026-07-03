// Pure slot-grid geometry for InventoryGrid (and any future slot surface).
// React-free and DOM-free: index/row/column conversions, pointer-point to
// slot-index hit testing, keyboard grid stepping, and the reorder primitive.
// Pointer math works in PHYSICAL coordinates (an RTL grid mirrors columns, so
// the caller passes `rtl` from the live computed direction); keyboard
// stepping is LOGICAL (ArrowRight is always +1 index, the Calendar grid
// convention).

// A minimal rectangle in client coordinates (a DOMRect satisfies it).
export type SlotBounds = Readonly<{
    left: number;
    top: number;
    width: number;
    height: number;
}>;

export function rowFromIndex(index: number, columns: number): number {
    if (columns <= 0) {
        return 0;
    }
    return Math.floor(index / columns);
}

export function columnFromIndex(index: number, columns: number): number {
    if (columns <= 0) {
        return 0;
    }
    return index % columns;
}

export function rowCount(slotCount: number, columns: number): number {
    if (columns <= 0 || slotCount <= 0) {
        return 0;
    }
    return Math.ceil(slotCount / columns);
}

// The slot index under a client point, or null when the point falls outside
// the grid box or past the last slot. Cells are assumed uniform (CSS grid
// with equal fractions); `rtl` mirrors the column axis.
export function slotIndexAtPoint(
    bounds: SlotBounds,
    x: number,
    y: number,
    columns: number,
    slotCount: number,
    rtl: boolean,
): number | null {
    if (columns <= 0 || slotCount <= 0) {
        return null;
    }
    if (bounds.width <= 0 || bounds.height <= 0) {
        return null;
    }
    const relativeX: number = (x - bounds.left) / bounds.width;
    const relativeY: number = (y - bounds.top) / bounds.height;
    if (relativeX < 0 || relativeX >= 1 || relativeY < 0 || relativeY >= 1) {
        return null;
    }
    const physicalColumn: number = Math.floor(relativeX * columns);
    const column: number = rtl ? columns - 1 - physicalColumn : physicalColumn;
    const rows: number = rowCount(slotCount, columns);
    const row: number = Math.floor(relativeY * rows);
    const index: number = row * columns + column;
    if (index >= slotCount) {
        return null;
    }
    return index;
}

// The next slot index for a keyboard step, or null when the key is not a
// grid movement or the step would leave the grid. Right/Left stay within the
// row (no wrap); Up/Down stay within the column; Home/End jump within the
// row (End clamps to the last slot on a ragged final row).
export function slotIndexFromKey(
    index: number,
    key: string,
    columns: number,
    slotCount: number,
): number | null {
    if (columns <= 0 || slotCount <= 0) {
        return null;
    }
    if (index < 0 || index >= slotCount) {
        return null;
    }
    const row: number = rowFromIndex(index, columns);
    switch (key) {
        case 'ArrowRight': {
            const next: number = index + 1;
            if (next >= slotCount || rowFromIndex(next, columns) !== row) {
                return null;
            }
            return next;
        }
        case 'ArrowLeft': {
            const next: number = index - 1;
            if (next < 0 || rowFromIndex(next, columns) !== row) {
                return null;
            }
            return next;
        }
        case 'ArrowDown': {
            const next: number = index + columns;
            if (next >= slotCount) {
                return null;
            }
            return next;
        }
        case 'ArrowUp': {
            const next: number = index - columns;
            if (next < 0) {
                return null;
            }
            return next;
        }
        case 'Home':
            return row * columns;
        case 'End':
            return Math.min(row * columns + columns - 1, slotCount - 1);
        default:
            return null;
    }
}

// Relocation: SWAP the entries at `from` and `to` (the array the consumer
// writes back through onMove for grids with multi-cell items - splice
// semantics shift every later cell and would tear span anchors off their
// footprints). Out-of-range input or a no-op move returns the input array
// unchanged.
export function relocateSlot<ItemType>(
    items: readonly ItemType[],
    from: number,
    to: number,
): readonly ItemType[] {
    if (from === to) {
        return items;
    }
    if (from < 0 || from >= items.length) {
        return items;
    }
    if (to < 0 || to >= items.length) {
        return items;
    }
    const fromItem: ItemType | undefined = items[from];
    const toItem: ItemType | undefined = items[to];
    if (fromItem === undefined || toItem === undefined) {
        return items;
    }
    const next: ItemType[] = [...items];
    next[from] = toItem;
    next[to] = fromItem;
    return next;
}

// Reorder: remove the item at `from` and reinsert it at `to` (splice
// semantics, the array the consumer writes back through onMove). Out-of-range
// input or a no-op move returns the input array unchanged.
export function moveSlot<ItemType>(
    items: readonly ItemType[],
    from: number,
    to: number,
): readonly ItemType[] {
    if (from === to) {
        return items;
    }
    if (from < 0 || from >= items.length) {
        return items;
    }
    if (to < 0 || to >= items.length) {
        return items;
    }
    const next: ItemType[] = [...items];
    const [moved]: ItemType[] = next.splice(from, 1);
    if (moved === undefined) {
        return items;
    }
    next.splice(to, 0, moved);
    return next;
}
