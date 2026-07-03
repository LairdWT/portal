import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type EUiStatus, type Toned } from '../tone';

// One slot in the inventory grid. A slot is OCCUPIED when it has `content`;
// occupied slots can be grabbed and moved, empty slots are drop targets only.
// `label` names the slot content for assistive tech (empty slots derive
// "Empty slot N").
//
// Multi-cell items: an occupied slot may span a RECTANGLE of cells
// (widthCells x heightCells, default 1x1) anchored at its own cell. The
// covered cells stay real (empty) entries in the array - the grid projects
// them onto the anchor, draws the item once at its true size on a decorative
// layer, and speaks each covered cell as part of the item. Consumers moving
// span items apply moves with the exported `relocateSlot` (swap semantics);
// `moveSlot` (splice) remains correct for 1x1-only grids.
export type InventorySlot = Readonly<{
    id: string;
    label?: string | undefined;
    content?: ReactNode | undefined;
    /**
     * Footprint width in cells (default 1; floored, clamped to >= 1).
     */
    widthCells?: number | undefined;
    /**
     * Footprint height in cells (default 1; floored, clamped to >= 1).
     */
    heightCells?: number | undefined;
}>;

// Props for the InventoryGrid: an APG-grid slot surface with pointer
// drag-reorder and keyboard grab/move (Space or Enter grabs an occupied
// slot, the arrows pick a destination, Space drops, Escape cancels; moves
// are announced through a polite live region).
//
// The grid is CONTROLLED: it owns no slot order and reports every reorder
// through `onMove(fromIndex, toIndex)`; the exported `moveSlot` helper
// applies splice semantics for consumers that mirror the default behavior.
export type InventoryGridProps = Readonly<{
    /**
     * Accessible name for the grid.
     */
    label: string;
    slots: readonly InventorySlot[];
    /**
     * Slots per row. Clamped to at least 1.
     */
    columns: number;
    onMove?: ((fromIndex: number, toIndex: number) => void) | undefined;
    enabled?: EEnabledState | undefined;
    status?: EUiStatus | undefined;
}> &
    Toned;
