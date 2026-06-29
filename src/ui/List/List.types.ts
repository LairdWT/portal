import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type ESelectionMode } from '../selectionMode';
import { type EUiStatus, type Toned } from '../tone';

/*
 * List / VirtualList - a generic, always-virtualized vertical list that is the
 * React-DOM realization of Helicon's virtual_list. It renders only the rows
 * scrolled into view (plus an overscan band) at a fixed, uniform row height via
 * the shared useVirtualWindow hook, so a 100k-item list mounts a handful of DOM
 * nodes.
 *
 * Interface-forwarding contract: List owns NO item shape and no fetch logic. The
 * consumer supplies the item array, a stable per-item key (getItemKey), and a row
 * render closure (renderItem) that the List forwards every visible (item, state)
 * back to, mirroring Helicon's render_row(ui, index, item) idiom. Selection intent
 * is reported through a controlled callback; the consumer owns the selectedKeys
 * and passes the new set back.
 *
 * Accessibility contract: selectionMode None is a presentational list
 * (role="list" with role="listitem" rows, no selection). Single / Multiple are
 * interactive listboxes (role="listbox" with role="option" rows and
 * aria-selected, Multiple adding aria-multiselectable). The whole listbox is a
 * single tab stop; the active row is a roving cursor exposed through
 * aria-activedescendant (NOT roving real focus), so keyboard navigation composes
 * with virtualization - a not-yet-rendered row is never focused, and the active
 * row is always forced into the DOM so its id resolves.
 *
 * Deliberate web-idiom divergences from Helicon (documented, not silently
 * dropped): no max_rows_per_frame cap (the DOM renders once per scroll and the
 * browser composites scrolling natively; windowing with an overscan band is the
 * DOM equivalent); the default rowHeight honors the 3rem
 * (--portal-touch-target-min) touch floor rather than Helicon's sub-floor 38px;
 * and real ARIA listbox semantics plus keyboard navigation (Helicon selection is
 * pointer-click only).
 */

// Selection model (None / Single / Multi) is the shared ESelectionMode, imported
// from ../selectionMode so List and DataTable use one canonical enum. None =>
// presentational/navigation list (role="list" with role="listitem" rows).
// Single/Multi => role="listbox" with role="option" rows and aria-selected (Multi
// adds aria-multiselectable).

// Per-row presentation state surfaced as the row data-state attribute the CSS
// keys off (never color-only). Selected pairs with aria-selected; Idle is the
// resting row. The active cursor is a separate data-active attribute so cursor
// and selection stay visually separable.
export const EListRowState: {
    readonly Idle: 'idle';
    readonly Selected: 'selected';
} = {
    Idle: 'idle',
    Selected: 'selected',
};
export type EListRowState = (typeof EListRowState)[keyof typeof EListRowState];

// State handed to the row renderer so the consumer can reflect selection/active
// without the List leaking its internals. Readonly; index is the absolute item
// index (matching Helicon's absolute row index).
export type ListRowRenderState = Readonly<{
    index: number;
    selected: boolean;
    active: boolean;
}>;

export type ListProps<Item> = Readonly<{
    items: readonly Item[];
    // Stable identity per item: the React key AND the selection key. Mirrors the
    // need for a stable selection identity in Helicon's caller-owned model so a
    // selected row survives a consumer re-sort or the row recycling that
    // virtualization performs.
    getItemKey: (item: Item, index: number) => string;
    // Interface-forwarding row renderer. The List owns no item shape; it forwards
    // every visible (item, state) to this closure and renders whatever it returns.
    renderItem: (item: Item, state: ListRowRenderState) => ReactNode;
    // Fixed row height in CSS pixels, required by fixed-height windowing
    // (Helicon VirtualListConfig.row_height). Defaults to the 3rem-equivalent
    // (48), so a selectable row also clears the --portal-touch-target-min floor;
    // Helicon's sub-floor defaults are intentionally not carried across.
    rowHeight?: number;
    // Extra rows rendered above/below the viewport window (windowing overscan).
    // Forwarded to useVirtualWindow; replaces Helicon's per-frame row cap.
    overscan?: number;
    selectionMode?: ESelectionMode; // default None
    // Controlled selection (the Portal default; mirrors DataTable). A set of row
    // keys: for Single, at most one key; for Multi, any number; ignored when None.
    // Membership/dedup is the correct model, so a ReadonlySet (not an array)
    // unifies the contract with DataTable.
    selectedKeys?: ReadonlySet<string>;
    onSelectionChange?: (next: ReadonlySet<string>) => void;
    // Optional type-ahead source (plain text per item). When present, printable
    // keys move the active cursor to the next matching row (Select's pattern).
    getTypeAheadText?: (item: Item) => string;
    enabled?: EEnabledState;
    status?: EUiStatus; // default EUiStatus.None
    // Content when items is empty. Defaults to an EmptyState "No rows.".
    emptyContent?: ReactNode;
    // Bounded block size of the scroll viewport (a CSS length / clamp expression,
    // not a literal px). A token-based clamp default applies when omitted.
    maxBlockSize?: string;
    // Optional explicit DOM id applied to the list/listbox root element so an
    // external control can reference it (e.g. a search field's aria-controls).
    // Distinct from the internal id used for row ids.
    id?: string;
}> &
    AccessibleName &
    Toned;
