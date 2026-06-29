import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type EUiStatus, type Toned } from '../tone';
import { type ListRowRenderState } from './List.types';

/*
 * SearchableList - the master-detail variant of List, the React-DOM realization
 * of Helicon's searchable_split. It is composition, not a second engine: a
 * SearchBox filter buffer over the virtualized List plus an optional detail
 * column. It reuses List for the catalog column and SearchBox for the filter
 * rather than re-implementing either.
 *
 * Interface-forwarding contract: like List, it owns no item shape. The consumer
 * supplies the item array, a stable per-item key (getItemKey), a row render
 * closure (renderItem), and the filter-text accessor (getFilterText) the
 * case-insensitive contains predicate runs against - mirroring Helicon's
 * searchable_split row_label. The filter buffer is caller-owned (query /
 * onQueryChange, mirroring Helicon's filter: &mut String), as is the single-select
 * identity that drives the detail column (selectedKey / onSelectedKeyChange).
 *
 * SearchableList is single-select by construction (the detail shows exactly one
 * item), so it does not expose a selectionMode; it drives the inner List with
 * ESelectionMode.Single and maps selectedKey to/from a one-element selection.
 *
 * Empty-state split (parity with Helicon's EMPTY_ROWS_LABEL vs
 * EMPTY_MATCHES_LABEL): when items is empty the list shows emptyContent ("No
 * rows."); when items exist but none match the query it shows noMatchesContent
 * ("No matches.").
 */

export type SearchableListProps<Item> = Readonly<{
    items: readonly Item[];
    getItemKey: (item: Item, index: number) => string;
    renderItem: (item: Item, state: ListRowRenderState) => ReactNode;
    /**
     * The string filtered against, case-insensitive contains. Mirrors Helicon
     * searchable_split row_label.
     */
    getFilterText: (item: Item) => string;
    /**
     * Controlled filter buffer (Helicon's caller-owned filter: &mut String).
     */
    query: string;
    onQueryChange: (query: string) => void;
    /**
     * Single-select identity that drives the detail column.
     */
    selectedKey?: string | null;
    onSelectedKeyChange?: (key: string | null) => void;
    /**
     * Optional detail column (master-detail). Omit for a plain filtered list. The
     * selected item (or null when nothing is selected) is forwarded here.
     */
    renderDetail?: (item: Item | null) => ReactNode;
    rowHeight?: number;
    overscan?: number;
    searchLabel: string; // SearchBox accessible label
    searchPlaceholder?: string; // Helicon SEARCH_FILTER_HINT analog
    listLabel?: string; // optional explicit name for the listbox
    emptyContent?: ReactNode; // no items at all
    noMatchesContent?: ReactNode; // items exist but none match the query
    enabled?: EEnabledState;
    status?: EUiStatus;
}> &
    Toned;
