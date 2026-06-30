import {
    type CSSProperties,
    type Dispatch,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import {
    OVERSCAN_DEFAULT,
    useVirtualWindow,
    type VirtualWindowState,
} from '../../react/hooks/useVirtualWindow';
import { EEnabledState } from '../../state/state';
import { EOverlayMotion } from '../overlayMotion';
import { ESelectionMode } from '../selectionMode';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './DataTable.module.css';
import {
    type DataTableProps,
    EColumnAlign,
    ESortDirection,
    type TableColumn,
    type TableSort,
} from './DataTable.types';

// Fixed virtualization row height in px. 48 equals --portal-touch-target-min
// (3rem), so a selectable row also clears the pointer touch floor. Surfaced to
// CSS through the --portal-datatable-row-height custom property.
const ROW_HEIGHT_DEFAULT: number = 48;

// Sentinel for the sticky header row in the 2D active-cell cursor; body rows are
// 0..rowCount-1.
const HEADER_ROW: number = -1;

// String-typed custom-property keys (not string literals) so the computed keys
// satisfy CSSProperties, matching the --portal-tone / --portal-slider-fill
// precedent in tone.ts.
const COLUMNS_PROPERTY: string = '--portal-datatable-columns';
const ROW_HEIGHT_PROPERTY: string = '--portal-datatable-row-height';
const BODY_MAX_PROPERTY: string = '--portal-datatable-body-max';

// Shared empty selection so the absent-selection path does not allocate a Set per
// render or per activation.
const EMPTY_SELECTION: ReadonlySet<string> = new Set<string>();

// The pointer / keyboard modifier snapshot a selection activation reads.
type SelectionModifiers = Readonly<{
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
}>;

// The roving 2D cursor. row === HEADER_ROW addresses the header; 0..rowCount-1 a
// body row. col indexes into columns.
type ActiveCell = Readonly<{
    row: number;
    col: number;
}>;

// The cursor the first key press establishes when no cell has been visited yet:
// the header's first column. Keeps post-interaction navigation byte-identical to
// the prior header-seeded cursor.
const HEADER_ORIGIN: ActiveCell = { row: HEADER_ROW, col: 0 };

function defaultRowKey(rowIndex: number): string {
    return String(rowIndex);
}

// next_sort parity: the same column flips direction; a fresh column starts
// Ascending.
function nextSort(
    current: TableSort | null | undefined,
    columnKey: string,
): TableSort {
    const direction: ESortDirection =
        current?.columnKey === columnKey &&
        current.direction === ESortDirection.Ascending
            ? ESortDirection.Descending
            : ESortDirection.Ascending;
    return { columnKey, direction };
}

// aria-sort token for a sortable column: the active direction when this column is
// the sort column, otherwise 'none'. Only ever read for sortable columns.
function resolveAriaSort(
    column: TableColumn,
    sort: TableSort | null | undefined,
): ESortDirection | 'none' {
    if (sort?.columnKey === column.key) {
        return sort.direction;
    }
    return 'none';
}

function cellId(gridId: string, row: number, col: number): string {
    const rowToken: string = row === HEADER_ROW ? 'h' : String(row);
    return `${gridId}-c${rowToken}-${String(col)}`;
}

function toggleSelection(
    current: ReadonlySet<string>,
    key: string,
): ReadonlySet<string> {
    const next: Set<string> = new Set<string>(current);
    if (next.has(key)) {
        next.delete(key);
    } else {
        next.add(key);
    }
    return next;
}

// Contiguous range of row keys between the anchor and focus indices (inclusive),
// mirroring Helicon's select_row_range.
function rangeSelection(
    anchor: number,
    focus: number,
    getRowKey: (rowIndex: number) => string,
): ReadonlySet<string> {
    const start: number = Math.min(anchor, focus);
    const end: number = Math.max(anchor, focus);
    const next: Set<string> = new Set<string>();
    for (let index: number = start; index <= end; index += 1) {
        next.add(getRowKey(index));
    }
    return next;
}

export function DataTable(props: DataTableProps): ReactElement {
    const {
        columns,
        rowCount,
        renderCell,
        getRowKey = defaultRowKey,
        sort = null,
        onSortChange,
        selectionMode = ESelectionMode.None,
        selectedKeys,
        onSelectionChange,
        rowHeight = ROW_HEIGHT_DEFAULT,
        overscan,
        maxBodyBlockSize,
        emptyContent,
        enabled,
        status = EUiStatus.None,
        tone,
    }: DataTableProps = props;
    // AccessibleName is an XOR union (label OR labelledBy), so the active arm is
    // read off the prop bag the same way List does rather than destructured.
    const label: string | undefined = 'label' in props ? props.label : undefined;
    const labelledBy: string | undefined =
        'labelledBy' in props ? props.labelledBy : undefined;

    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const reducedMotion: boolean = useReducedMotion();
    const gridId: string = useId();
    const scrollRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const rangeAnchorRef: RefObject<number | null> = useRef<number | null>(null);

    const virtualWindow: VirtualWindowState = useVirtualWindow({
        rowCount,
        rowHeight,
        scrollRef,
        ...(overscan !== undefined ? { overscan } : {}),
    });

    const [activeCell, setActiveCell]: [
        ActiveCell | null,
        Dispatch<SetStateAction<ActiveCell | null>>,
    ] = useState<ActiveCell | null>(null);

    const hasColumns: boolean = columns.length > 0;
    const lastColumn: number = columns.length - 1;
    const lastRow: number = rowCount - 1;
    const activeColumn: number =
        hasColumns && activeCell !== null
            ? Math.min(Math.max(activeCell.col, 0), lastColumn)
            : 0;
    const motion: EOverlayMotion = reducedMotion
        ? EOverlayMotion.Reduced
        : EOverlayMotion.Full;

    // Keep the active body row scrolled into the visible band. Reading and
    // writing scrollTop fires the hook's scroll path, which recomputes the
    // window; the force-include below covers the one-frame gap meanwhile. No
    // listeners are attached, so the effect needs no cleanup.
    useLayoutEffect((): void => {
        if (activeCell === null) {
            return;
        }
        if (activeCell.row < 0) {
            return;
        }
        const element: HTMLDivElement | null = scrollRef.current;
        if (element === null) {
            return;
        }
        // Body rows are absolutely positioned inside .body, which begins AFTER the
        // sticky header group (min-block-size one row) in normal flow, so a row's
        // true scroll-content top is one header-height past its index offset.
        // Omitting that offset left a down-navigated row one header-height below
        // the fold.
        const headerHeight: number = rowHeight;
        const rowTop: number = headerHeight + activeCell.row * rowHeight;
        const rowBottom: number = rowTop + rowHeight;
        const viewTop: number = element.scrollTop;
        const viewBottom: number = viewTop + element.clientHeight;
        // A row is considered hidden until it clears the sticky header overlay.
        if (rowTop < viewTop + headerHeight) {
            element.scrollTop = rowTop - headerHeight;
            return;
        }
        if (rowBottom > viewBottom) {
            element.scrollTop = rowBottom - element.clientHeight;
        }
    }, [activeCell, rowHeight]);

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    const columnsTemplate: string = columns
        .map(
            (column: TableColumn): string =>
                `minmax(0, ${String(column.weight ?? 1)}fr)`,
        )
        .join(' ');

    const rootStyle: CSSProperties = {
        ...toneProperties(tone),
        [COLUMNS_PROPERTY]: columnsTemplate,
        [ROW_HEIGHT_PROPERTY]: `${String(rowHeight)}px`,
        ...(maxBodyBlockSize !== undefined
            ? { [BODY_MAX_PROPERTY]: maxBodyBlockSize }
            : {}),
    };

    const activeDescendantId: string =
        activeCell !== null ? cellId(gridId, activeCell.row, activeColumn) : '';

    function moveActive(nextRow: number, nextCol: number): void {
        const clampedRow: number = Math.min(
            Math.max(nextRow, HEADER_ROW),
            Math.max(lastRow, HEADER_ROW),
        );
        const clampedCol: number = hasColumns
            ? Math.min(Math.max(nextCol, 0), lastColumn)
            : 0;
        setActiveCell({ row: clampedRow, col: clampedCol });
    }

    function handleSort(columnKey: string): void {
        if (isDisabled) {
            return;
        }
        onSortChange?.(nextSort(sort, columnKey));
    }

    function handleRowActivate(
        rowIndex: number,
        modifiers: SelectionModifiers,
    ): void {
        if (isDisabled) {
            return;
        }
        if (selectionMode === ESelectionMode.None) {
            return;
        }
        const current: ReadonlySet<string> = selectedKeys ?? EMPTY_SELECTION;
        const key: string = getRowKey(rowIndex);
        const anchor: number | null = rangeAnchorRef.current;
        const useRange: boolean =
            selectionMode === ESelectionMode.Multi &&
            modifiers.shiftKey &&
            anchor !== null;

        let next: ReadonlySet<string>;
        if (useRange && anchor !== null) {
            next = rangeSelection(anchor, rowIndex, getRowKey);
        } else if (
            selectionMode === ESelectionMode.Multi &&
            (modifiers.ctrlKey || modifiers.metaKey)
        ) {
            next = toggleSelection(current, key);
            rangeAnchorRef.current = rowIndex;
        } else {
            next = new Set<string>([key]);
            rangeAnchorRef.current = rowIndex;
        }

        onSelectionChange?.(next);
        setActiveCell(
            (prev: ActiveCell | null): ActiveCell => ({
                row: rowIndex,
                col: prev?.col ?? activeColumn,
            }),
        );
    }

    // A directly-assigned (named) pointer handler rather than an inline arrow: it
    // reads the row index from the row's data attribute and delegates to
    // handleRowActivate. Routing the selection-anchor ref access through a named
    // event handler (the same shape as the grid's onKeyDown) keeps that ref access
    // out of a render-created closure.
    function handleBodyPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
        if (event.button !== 0) {
            return;
        }
        const rowAttribute: string | undefined =
            event.currentTarget.dataset.rowIndex;
        if (rowAttribute === undefined) {
            return;
        }
        handleRowActivate(Number(rowAttribute), {
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
        });
        // Keep DOM focus on the grid container so the aria-activedescendant
        // single-tab-stop contract holds after a pointer selection (a click can
        // otherwise land real focus on a tabindex=-1 cell).
        scrollRef.current?.focus();
    }

    function activateActiveCell(event: ReactKeyboardEvent<HTMLDivElement>): void {
        const current: ActiveCell = activeCell ?? HEADER_ORIGIN;
        if (current.row === HEADER_ROW) {
            const column: TableColumn | undefined = columns[activeColumn];
            if (column?.sortable === true) {
                handleSort(column.key);
            }
            return;
        }
        if (selectionMode === ESelectionMode.None) {
            return;
        }
        handleRowActivate(current.row, {
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
        });
    }

    function handleGridKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
        if (isDisabled) {
            return;
        }
        // The first key press with no visited cell establishes the cursor at the
        // header origin, exactly the seed the prior header-seeded state used.
        const current: ActiveCell = activeCell ?? HEADER_ORIGIN;
        // Page by the VISIBLE row count, not the rendered window: endIndex -
        // startIndex includes the overscan band (up to 2 * overscan extra rows),
        // so subtracting it back yields a one-viewport jump instead of an
        // overscan-inflated overshoot.
        const visibleRows: number =
            virtualWindow.endIndex -
            virtualWindow.startIndex -
            2 * (overscan ?? OVERSCAN_DEFAULT);
        const pageStep: number = Math.max(1, visibleRows - 1);
        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                moveActive(current.row + 1, current.col);
                return;
            }
            case 'ArrowUp': {
                event.preventDefault();
                moveActive(current.row - 1, current.col);
                return;
            }
            case 'ArrowRight': {
                event.preventDefault();
                moveActive(current.row, current.col + 1);
                return;
            }
            case 'ArrowLeft': {
                event.preventDefault();
                moveActive(current.row, current.col - 1);
                return;
            }
            case 'Home': {
                event.preventDefault();
                if (event.ctrlKey) {
                    moveActive(HEADER_ROW, 0);
                    return;
                }
                moveActive(current.row, 0);
                return;
            }
            case 'End': {
                event.preventDefault();
                if (event.ctrlKey) {
                    moveActive(lastRow, lastColumn);
                    return;
                }
                moveActive(current.row, lastColumn);
                return;
            }
            case 'PageDown': {
                event.preventDefault();
                moveActive(current.row + pageStep, current.col);
                return;
            }
            case 'PageUp': {
                event.preventDefault();
                moveActive(current.row - pageStep, current.col);
                return;
            }
            case 'Enter': {
                event.preventDefault();
                activateActiveCell(event);
                return;
            }
            case ' ': {
                event.preventDefault();
                activateActiveCell(event);
                return;
            }
            default:
                return;
        }
    }

    function renderBodyRow(rowIndex: number): ReactElement {
        const rowKey: string = getRowKey(rowIndex);
        const isSelected: boolean =
            selectionMode !== ESelectionMode.None &&
            (selectedKeys?.has(rowKey) ?? false);
        const rowStyle: CSSProperties = {
            insetBlockStart: `${String(rowIndex * rowHeight)}px`,
        };
        return (
            <div
                key={rowKey}
                role="row"
                className={styles.row}
                style={rowStyle}
                aria-rowindex={rowIndex + 2}
                data-parity={String(rowIndex % 2)}
                data-selected={isSelected ? 'true' : undefined}
                data-enabled={resolvedEnabled}
                data-row-index={rowIndex}
                {...(selectionMode === ESelectionMode.None
                    ? {}
                    : { 'aria-selected': isSelected })}
                onPointerDown={handleBodyPointerDown}
            >
                {columns.map(
                    (column: TableColumn, columnIndex: number): ReactElement => {
                        const align: EColumnAlign =
                            column.align ?? EColumnAlign.Start;
                        const isActive: boolean =
                            activeCell !== null &&
                            activeCell.row === rowIndex &&
                            activeColumn === columnIndex;
                        return (
                            <div
                                key={column.key}
                                role={columnIndex === 0 ? 'rowheader' : 'gridcell'}
                                id={cellId(gridId, rowIndex, columnIndex)}
                                className={styles.cell}
                                aria-colindex={columnIndex + 1}
                                data-align={align}
                                data-active={isActive ? 'true' : undefined}
                                tabIndex={-1}
                            >
                                {renderCell({
                                    rowIndex,
                                    rowKey,
                                    columnKey: column.key,
                                    columnIndex,
                                })}
                            </div>
                        );
                    },
                )}
            </div>
        );
    }

    const windowRows: ReactElement[] = [];
    for (
        let rowIndex: number = virtualWindow.startIndex;
        rowIndex < virtualWindow.endIndex;
        rowIndex += 1
    ) {
        windowRows.push(renderBodyRow(rowIndex));
    }
    // Guarantee the active body row's element exists for aria-activedescendant
    // even when it has scrolled out of the rendered window.
    const activeOutsideWindow: boolean =
        activeCell !== null &&
        activeCell.row >= 0 &&
        (activeCell.row < virtualWindow.startIndex ||
            activeCell.row >= virtualWindow.endIndex);

    return (
        <div
            ref={scrollRef}
            role="grid"
            className={className}
            style={rootStyle}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
            aria-rowcount={rowCount + 1}
            aria-colcount={columns.length}
            aria-disabled={isDisabled ? true : undefined}
            aria-multiselectable={
                selectionMode === ESelectionMode.Multi ? true : undefined
            }
            {...(hasColumns && activeCell !== null
                ? { 'aria-activedescendant': activeDescendantId }
                : {})}
            tabIndex={isDisabled ? -1 : 0}
            data-status={status}
            data-enabled={resolvedEnabled}
            data-motion={motion}
            onKeyDown={handleGridKeyDown}
        >
            <div role="rowgroup" className={styles.headerGroup}>
                <div role="row" className={styles.headerRow} aria-rowindex={1}>
                    {columns.map(
                        (
                            column: TableColumn,
                            columnIndex: number,
                        ): ReactElement => {
                            const align: EColumnAlign =
                                column.align ?? EColumnAlign.Start;
                            const isActive: boolean =
                                activeCell !== null &&
                                activeCell.row === HEADER_ROW &&
                                activeColumn === columnIndex;
                            const ariaSort: ESortDirection | 'none' =
                                resolveAriaSort(column, sort);
                            return (
                                <div
                                    key={column.key}
                                    role="columnheader"
                                    id={cellId(gridId, HEADER_ROW, columnIndex)}
                                    className={styles.columnheader}
                                    aria-colindex={columnIndex + 1}
                                    data-align={align}
                                    data-active={isActive ? 'true' : undefined}
                                    tabIndex={-1}
                                    {...(column.sortable === true
                                        ? { 'aria-sort': ariaSort }
                                        : {})}
                                >
                                    {column.sortable === true ? (
                                        <button
                                            type="button"
                                            className={styles.sortButton}
                                            data-align={align}
                                            disabled={isDisabled}
                                            tabIndex={-1}
                                            onClick={(): void => {
                                                handleSort(column.key);
                                            }}
                                        >
                                            <span className={styles.headerLabel}>
                                                {column.header}
                                            </span>
                                            <span
                                                className={styles.sortCaret}
                                                aria-hidden="true"
                                            />
                                        </button>
                                    ) : (
                                        <span className={styles.headerLabel}>
                                            {column.header}
                                        </span>
                                    )}
                                </div>
                            );
                        },
                    )}
                </div>
            </div>
            {rowCount === 0 ? (
                <div role="rowgroup" className={styles.body}>
                    <div role="row" className={styles.emptyRow}>
                        <div
                            role="gridcell"
                            className={styles.emptyCell}
                            aria-colindex={1}
                            aria-colspan={hasColumns ? columns.length : 1}
                        >
                            {emptyContent ?? (
                                <span className={styles.emptyText}>No data</span>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    role="rowgroup"
                    className={styles.body}
                    style={{ blockSize: `${String(virtualWindow.totalSize)}px` }}
                >
                    {windowRows}
                    {activeOutsideWindow && activeCell !== null
                        ? renderBodyRow(activeCell.row)
                        : null}
                </div>
            )}
        </div>
    );
}
