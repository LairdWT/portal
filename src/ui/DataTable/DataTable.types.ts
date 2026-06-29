import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type ESelectionMode } from '../selectionMode';
import { type EUiStatus, type Toned } from '../tone';

/*
 * DataTable - a sortable, selectable, always-virtualized data grid.
 *
 * Interface-forwarding contract: DataTable owns NO data. The consumer supplies a
 * column specification, a row count, and a per-cell render closure; the table
 * forwards every visible (row, column) back to that closure (mirroring Helicon's
 * data_table cell(ui, row, column) idiom). Sort intent and selection intent are
 * reported through controlled callbacks; the consumer owns the backing collection
 * and applies the sort/selection itself, then passes the new `sort` /
 * `selectedKeys` back. This keeps one component covering both Helicon's
 * `data_table` and `virtual_table` modules.
 *
 * Accessibility contract: role="grid" with columnheader / rowheader / gridcell
 * children grouped under rowgroups; aria-rowcount/aria-rowindex and
 * aria-colcount/aria-colindex communicate the true position of every cell even
 * though only a window of rows is mounted; aria-sort marks the active sort
 * column; selection carries aria-selected (plus aria-multiselectable in Multi),
 * never color alone. The whole grid is a single tab stop and the active cell is a
 * roving 2D cursor exposed through aria-activedescendant, so keyboard navigation
 * composes with virtualization (a not-yet-rendered row is never focused).
 *
 * Always-on row virtualization: the body always renders only the rows scrolled
 * into view (plus overscan) at a fixed, uniform row height, via the shared
 * useVirtualWindow hook. Small tables render their whole (tiny) window with no
 * behavior difference.
 *
 * Documented v1 deferrals (each present in Helicon's TableInteractionState, none
 * required by the parity ledger; recorded here, not silently dropped): frozen
 * columns / sticky first column; column reorder, resize, and hide; horizontal
 * (column) virtualization; multi-column sort; inline cell editing; and row
 * grouping / tree rows (TreeView's concern).
 */

// Cell text alignment within a column. Values feed the data-align attribute and
// map to the CSS justification / text-align rule.
export const EColumnAlign: {
    readonly Start: 'start';
    readonly Center: 'center';
    readonly End: 'end';
} = {
    Start: 'start',
    Center: 'center',
    End: 'end',
};
export type EColumnAlign = (typeof EColumnAlign)[keyof typeof EColumnAlign];

// Sort direction for the single active sort column. The values double as the
// aria-sort token on the active columnheader ('ascending' | 'descending'); a
// sortable-but-inactive column reports aria-sort='none' and a non-sortable
// column omits aria-sort entirely.
export const ESortDirection: {
    readonly Ascending: 'ascending';
    readonly Descending: 'descending';
} = {
    Ascending: 'ascending',
    Descending: 'descending',
};
export type ESortDirection = (typeof ESortDirection)[keyof typeof ESortDirection];

// Row selection model (None / Single / Multi) is the shared ESelectionMode,
// imported from ../selectionMode so List and DataTable use one canonical enum.

// One column. `key` is the opaque consumer identity used for sort addressing, the
// cell-context column key, and the React key. `header` is arbitrary renderable
// content. `weight` is the relative grid track size (default 1; a weight-2 column
// is twice a weight-1 column), mapped to minmax(0, weight fr). `sortable` makes
// the header a sort button. `align` sets cell justification.
export type TableColumn = Readonly<{
    key: string;
    header: ReactNode;
    weight?: number;
    sortable?: boolean;
    align?: EColumnAlign;
}>;

// The active sort: which column key and which direction. A null `sort` prop means
// the table is unsorted.
export type TableSort = Readonly<{
    columnKey: string;
    direction: ESortDirection;
}>;

// Forwarded to renderCell for each visible cell. Zero-based indices plus the
// resolved keys, mirroring Helicon's cell(ui, row, column) closure.
export type TableCellContext = Readonly<{
    rowIndex: number;
    rowKey: string;
    columnKey: string;
    columnIndex: number;
}>;

export type DataTableProps = Readonly<{
    columns: readonly TableColumn[];
    rowCount: number;
    /**
     * The interface-forwarding core: the table forwards every visible
     * (row, column) to this closure and renders whatever it returns.
     */
    renderCell: (context: TableCellContext) => ReactNode;
    /**
     * Stable row key by index (default String(rowIndex)). Selection is keyed on
     * this so it survives a consumer re-sort or the row recycling that
     * virtualization performs.
     */
    getRowKey?: (rowIndex: number) => string;
    /**
     * Controlled sort. The consumer re-sorts its data on onSortChange and passes
     * the new sort back.
     */
    sort?: TableSort | null;
    onSortChange?: (next: TableSort) => void;
    /**
     * Controlled selection (a set of row keys). selectionMode defaults to None.
     */
    selectionMode?: ESelectionMode;
    selectedKeys?: ReadonlySet<string>;
    onSelectionChange?: (next: ReadonlySet<string>) => void;
    /**
     * Fixed virtualization row height in px (default 48, matching the 3rem touch
     * target so a selectable row clears the touch floor). Must be uniform.
     */
    rowHeight?: number;
    /**
     * Extra rows rendered above and below the visible band; forwarded to
     * useVirtualWindow.
     */
    overscan?: number;
    /**
     * Maximum visible body height before the body scrolls. A raw CSS length /
     * clamp expression; a token default applies when omitted.
     */
    maxBodyBlockSize?: string;
    /**
     * Empty-state content shown when rowCount === 0.
     */
    emptyContent?: ReactNode;
    enabled?: EEnabledState;
    status?: EUiStatus;
}> &
    // Accessible name for the grid (required; an unnamed grid trips axe). The
    // shared XOR union so the grid can be named inline (`label` -> aria-label) or
    // point at a visible caption (`labelledBy` -> aria-labelledby), matching List.
    AccessibleName &
    Toned;
