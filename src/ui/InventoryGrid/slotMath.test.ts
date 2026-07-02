import { describe, expect, it } from 'vitest';

import {
    columnFromIndex,
    moveSlot,
    rowCount,
    rowFromIndex,
    type SlotBounds,
    slotIndexAtPoint,
    slotIndexFromKey,
} from './slotMath';

const BOUNDS: SlotBounds = { left: 0, top: 0, width: 400, height: 300 };

describe('index conversions', (): void => {
    it('maps indices onto rows and columns', (): void => {
        expect(rowFromIndex(0, 4)).toBe(0);
        expect(rowFromIndex(5, 4)).toBe(1);
        expect(columnFromIndex(5, 4)).toBe(1);
        expect(columnFromIndex(3, 4)).toBe(3);
    });

    it('counts ragged rows', (): void => {
        expect(rowCount(12, 4)).toBe(3);
        expect(rowCount(13, 4)).toBe(4);
        expect(rowCount(0, 4)).toBe(0);
    });

    it('guards degenerate columns', (): void => {
        expect(rowFromIndex(5, 0)).toBe(0);
        expect(columnFromIndex(5, 0)).toBe(0);
        expect(rowCount(5, 0)).toBe(0);
    });
});

describe('slotIndexAtPoint', (): void => {
    it('hits the slot under a point (LTR)', (): void => {
        // 4 columns x 3 rows over 400x300: cells are 100x100.
        expect(slotIndexAtPoint(BOUNDS, 50, 50, 4, 12, false)).toBe(0);
        expect(slotIndexAtPoint(BOUNDS, 350, 50, 4, 12, false)).toBe(3);
        expect(slotIndexAtPoint(BOUNDS, 150, 250, 4, 12, false)).toBe(9);
    });

    it('mirrors the column axis under RTL', (): void => {
        expect(slotIndexAtPoint(BOUNDS, 50, 50, 4, 12, true)).toBe(3);
        expect(slotIndexAtPoint(BOUNDS, 350, 50, 4, 12, true)).toBe(0);
    });

    it('returns null outside the box or past the last slot', (): void => {
        expect(slotIndexAtPoint(BOUNDS, -10, 50, 4, 12, false)).toBeNull();
        expect(slotIndexAtPoint(BOUNDS, 50, 400, 4, 12, false)).toBeNull();
        // A ragged 10-slot grid: the point lands in the empty tail of row 3.
        expect(slotIndexAtPoint(BOUNDS, 350, 250, 4, 10, false)).toBeNull();
    });

    it('guards degenerate geometry', (): void => {
        const flat: SlotBounds = { left: 0, top: 0, width: 0, height: 300 };
        expect(slotIndexAtPoint(flat, 0, 50, 4, 12, false)).toBeNull();
        expect(slotIndexAtPoint(BOUNDS, 50, 50, 0, 12, false)).toBeNull();
        expect(slotIndexAtPoint(BOUNDS, 50, 50, 4, 0, false)).toBeNull();
    });
});

describe('slotIndexFromKey', (): void => {
    it('steps within the row without wrapping', (): void => {
        expect(slotIndexFromKey(0, 'ArrowRight', 4, 12)).toBe(1);
        expect(slotIndexFromKey(3, 'ArrowRight', 4, 12)).toBeNull();
        expect(slotIndexFromKey(4, 'ArrowLeft', 4, 12)).toBeNull();
        expect(slotIndexFromKey(5, 'ArrowLeft', 4, 12)).toBe(4);
    });

    it('steps within the column', (): void => {
        expect(slotIndexFromKey(1, 'ArrowDown', 4, 12)).toBe(5);
        expect(slotIndexFromKey(9, 'ArrowDown', 4, 12)).toBeNull();
        expect(slotIndexFromKey(5, 'ArrowUp', 4, 12)).toBe(1);
        expect(slotIndexFromKey(1, 'ArrowUp', 4, 12)).toBeNull();
    });

    it('jumps within the row, clamping the ragged tail', (): void => {
        expect(slotIndexFromKey(5, 'Home', 4, 12)).toBe(4);
        expect(slotIndexFromKey(5, 'End', 4, 12)).toBe(7);
        // 10 slots: row 3 ends at index 9, not 11.
        expect(slotIndexFromKey(8, 'End', 4, 10)).toBe(9);
    });

    it('ignores non-movement keys and out-of-range indices', (): void => {
        expect(slotIndexFromKey(0, 'a', 4, 12)).toBeNull();
        expect(slotIndexFromKey(-1, 'ArrowRight', 4, 12)).toBeNull();
        expect(slotIndexFromKey(12, 'ArrowRight', 4, 12)).toBeNull();
    });
});

describe('moveSlot', (): void => {
    it('moves an item with splice semantics', (): void => {
        expect(moveSlot(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
        expect(moveSlot(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    });

    it('returns the input unchanged for no-op or out-of-range moves', (): void => {
        const items: readonly string[] = ['a', 'b'];
        expect(moveSlot(items, 1, 1)).toBe(items);
        expect(moveSlot(items, -1, 0)).toBe(items);
        expect(moveSlot(items, 0, 5)).toBe(items);
    });
});
