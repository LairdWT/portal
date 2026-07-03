import {
    type CSSProperties,
    type Dispatch,
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useId,
    useRef,
    useState,
} from 'react';

import {
    type PointerDragBinding,
    type PointerDragState,
    usePointerDrag,
} from '../../react/hooks/usePointerDrag';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { ESelectionState } from '../SelectableTile/SelectableTile.types';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './InventoryGrid.module.css';
import { type InventoryGridProps, type InventorySlot } from './InventoryGrid.types';
import {
    buildCoverage,
    canPlace,
    type ItemSpan,
    normalizeSpan,
    type PlacedEntry,
} from './inventoryPlacement';
import {
    columnFromIndex,
    rowCount,
    rowFromIndex,
    slotIndexAtPoint,
    slotIndexFromKey,
} from './slotMath';

const COLUMNS_PROPERTY: string = '--inventory-columns';
const ROWS_PROPERTY: string = '--inventory-rows';
const DRAG_X_PROPERTY: string = '--inventory-drag-x';
const DRAG_Y_PROPERTY: string = '--inventory-drag-y';

// A live pointer reorder: the grabbed item's ANCHOR index and the cumulative
// ghost offset from the gesture origin.
type DragGhost = Readonly<{
    index: number;
    dx: number;
    dy: number;
}>;

// The InventoryGrid: an APG-grid slot surface in a beveled container frame.
// Every CELL is a real button carrying role=gridcell and the grid keyboard
// (the Calendar precedent): roving tab stop, arrows move focus, Space/Enter
// grabs an occupied slot and drops on the destination, Escape cancels; a
// polite live region narrates. Items may span rectangles of cells
// (widthCells x heightCells): the semantic layer stays 1x1 buttons - a cell
// covered by a span speaks the item name plus its footprint and grabs the
// anchor - while a decorative aria-hidden layer draws each item ONCE at its
// true size on the same grid template. Pointer reorder rides usePointerDrag
// with a transform-only ghost (the item tile) and slotMath hit testing;
// placement is validated through the pure inventoryPlacement math.
export function InventoryGrid({
    label,
    slots,
    columns,
    onMove,
    enabled,
    status,
    tone,
}: InventoryGridProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const resolvedColumns: number = Math.max(1, Math.floor(columns));
    const slotCount: number = slots.length;
    const rows: number = rowCount(slotCount, resolvedColumns);
    const headingId: string = useId();

    // The cell -> anchor projection: which item (anchor index) covers each
    // cell. Recomputed per render from the controlled slots.
    const entries: readonly PlacedEntry[] = slots.map(
        (slot: InventorySlot): PlacedEntry => ({
            occupied: slot.content !== undefined,
            span: normalizeSpan(slot),
        }),
    );
    const coverage: readonly (number | null)[] = buildCoverage(
        entries,
        resolvedColumns,
    );

    const gridRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
        null,
    );
    const cellRefs: RefObject<(HTMLButtonElement | null)[]> = useRef<
        (HTMLButtonElement | null)[]
    >([]);
    const dragSourceRef: RefObject<number | null> = useRef<number | null>(null);

    const [tabStop, setTabStop]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const [grabbed, setGrabbed]: [
        number | null,
        Dispatch<SetStateAction<number | null>>,
    ] = useState<number | null>(null);
    const [ghost, setGhost]: [
        DragGhost | null,
        Dispatch<SetStateAction<DragGhost | null>>,
    ] = useState<DragGhost | null>(null);
    const [dropTarget, setDropTarget]: [
        number | null,
        Dispatch<SetStateAction<number | null>>,
    ] = useState<number | null>(null);
    const [announcement, setAnnouncement]: [
        string,
        Dispatch<SetStateAction<string>>,
    ] = useState<string>('');

    // Derived roving stop: clamped so a shrunk slot set can never orphan it.
    const activeStop: number = Math.min(tabStop, Math.max(0, slotCount - 1));
    const moving: boolean = grabbed !== null || ghost !== null;
    const movingAnchor: number | null = grabbed ?? ghost?.index ?? null;

    function anchorOf(index: number): number | null {
        return coverage[index] ?? null;
    }

    function spanOf(anchor: number): ItemSpan {
        return entries[anchor]?.span ?? { widthCells: 1, heightCells: 1 };
    }

    function slotName(slot: InventorySlot, index: number): string {
        if (slot.label !== undefined) {
            return slot.label;
        }
        if (slot.content !== undefined) {
            return `Slot ${String(index + 1)}`;
        }
        return `Empty slot ${String(index + 1)}`;
    }

    // The spoken name of one CELL: an anchor speaks its item, a covered cell
    // speaks the item plus its footprint, a free cell speaks emptiness.
    function cellName(index: number): string {
        const slot: InventorySlot | undefined = slots[index];
        if (slot === undefined) {
            return `Empty slot ${String(index + 1)}`;
        }
        const anchor: number | null = anchorOf(index);
        if (anchor === null || anchor === index) {
            return slotName(slot, index);
        }
        const anchorSlot: InventorySlot | undefined = slots[anchor];
        if (anchorSlot === undefined) {
            return slotName(slot, index);
        }
        const span: ItemSpan = spanOf(anchor);
        return `${slotName(anchorSlot, anchor)}, part of ${String(span.widthCells)} x ${String(span.heightCells)}`;
    }

    // Whether the grabbed/dragged item may re-anchor at `target`. A plain
    // 1x1 item dropping on a free cell or another 1x1 item keeps the classic
    // reorder contract (the consumer's moveSlot/relocateSlot decides what
    // happens to the occupant - the pre-span behavior the HUD showcase and
    // the e2e suite pin). Everything involving a span validates strictly
    // through canPlace: footprints never overlap another item and never
    // leave the grid.
    function placeable(source: number, target: number): boolean {
        const span: ItemSpan = spanOf(source);
        if (span.widthCells === 1 && span.heightCells === 1) {
            const owner: number | null = coverage[target] ?? null;
            if (owner === null) {
                return true;
            }
            const ownerSpan: ItemSpan = spanOf(owner);
            return ownerSpan.widthCells === 1 && ownerSpan.heightCells === 1;
        }
        return canPlace(target, span, coverage, resolvedColumns, source);
    }

    // The live grid box and direction, measured fresh per hit test.
    function hitTest(x: number, y: number): number | null {
        const grid: HTMLDivElement | null = gridRef.current;
        if (grid === null) {
            return null;
        }
        const rtl: boolean = getComputedStyle(grid).direction === 'rtl';
        return slotIndexAtPoint(
            grid.getBoundingClientRect(),
            x,
            y,
            resolvedColumns,
            slotCount,
            rtl,
        );
    }

    function completeMove(from: number, to: number): void {
        const source: InventorySlot | undefined = slots[from];
        const target: InventorySlot | undefined = slots[to];
        if (source === undefined || target === undefined) {
            return;
        }
        onMove?.(from, to);
        setTabStop(to);
        setAnnouncement(
            `${slotName(source, from)} moved to ${slotName(target, to)}.`,
        );
    }

    const drag: PointerDragBinding<HTMLButtonElement> =
        usePointerDrag<HTMLButtonElement>({
            disabled: isDisabled,
            onDragStart: (state: PointerDragState): void => {
                const cell: number | null = hitTest(state.originX, state.originY);
                const anchor: number | null = cell === null ? null : anchorOf(cell);
                if (anchor === null) {
                    dragSourceRef.current = null;
                    return;
                }
                dragSourceRef.current = anchor;
                setTabStop(anchor);
                setGhost({ index: anchor, dx: 0, dy: 0 });
            },
            onDrag: (state: PointerDragState): void => {
                const source: number | null = dragSourceRef.current;
                if (source === null) {
                    return;
                }
                setGhost({ index: source, dx: state.dx, dy: state.dy });
                const cell: number | null = hitTest(state.x, state.y);
                setDropTarget(
                    cell !== null && placeable(source, cell) ? cell : null,
                );
            },
            onDragEnd: (state: PointerDragState): void => {
                const source: number | null = dragSourceRef.current;
                dragSourceRef.current = null;
                setGhost(null);
                setDropTarget(null);
                if (source === null) {
                    return;
                }
                const target: number | null = hitTest(state.x, state.y);
                if (target === null || target === source) {
                    return;
                }
                if (!placeable(source, target)) {
                    return;
                }
                completeMove(source, target);
            },
        });

    function handleCellKeyDown(
        index: number,
        event: KeyboardEvent<HTMLButtonElement>,
    ): void {
        if (isDisabled) {
            return;
        }
        if (event.key === 'Escape') {
            if (grabbed === null) {
                return;
            }
            event.preventDefault();
            setGrabbed(null);
            setAnnouncement('Move canceled.');
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (grabbed === null) {
                const anchor: number | null = anchorOf(index);
                const anchorSlot: InventorySlot | undefined =
                    anchor === null ? undefined : slots[anchor];
                if (anchor === null || anchorSlot === undefined) {
                    return;
                }
                setGrabbed(anchor);
                setAnnouncement(
                    `${slotName(anchorSlot, anchor)} grabbed. Use the arrow keys to pick a destination, Space to drop, Escape to cancel.`,
                );
                return;
            }
            // Dropping on the anchor itself cancels; a drop elsewhere WITHIN
            // the item's own footprint is a real one-cell shift and validates
            // like any other target (its own cells are ignorable).
            const from: number = grabbed;
            if (from === index) {
                setGrabbed(null);
                setAnnouncement('Move canceled.');
                return;
            }
            if (!placeable(from, index)) {
                const fromSlot: InventorySlot | undefined = slots[from];
                setAnnouncement(
                    `Cannot place ${fromSlot === undefined ? 'the item' : slotName(fromSlot, from)} here.`,
                );
                return;
            }
            setGrabbed(null);
            completeMove(from, index);
            return;
        }
        const next: number | null = slotIndexFromKey(
            index,
            event.key,
            resolvedColumns,
            slotCount,
        );
        if (next === null) {
            return;
        }
        event.preventDefault();
        setTabStop(next);
        cellRefs.current[next]?.focus();
    }

    function cellState(index: number): ESelectionState {
        if (movingAnchor !== null && anchorOf(index) === movingAnchor) {
            return ESelectionState.Selected;
        }
        if (moving) {
            return ESelectionState.Targetable;
        }
        return ESelectionState.Default;
    }

    const rootStyle: CSSProperties = {
        ...toneProperties(tone),
        [COLUMNS_PROPERTY]: String(resolvedColumns),
        [ROWS_PROPERTY]: String(Math.max(1, rows)),
    };
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    // Slots chunked into APG rows (grid requires row children); the rows are
    // display:contents so the outer element lays out as ONE aligned grid.
    const rowChunks: (readonly InventorySlot[])[] = [];
    for (let start: number = 0; start < slotCount; start += resolvedColumns) {
        rowChunks.push(slots.slice(start, start + resolvedColumns));
    }

    function renderCell(slot: InventorySlot, index: number): ReactElement {
        const anchor: number | null = anchorOf(index);
        return (
            <button
                key={slot.id}
                ref={(cell: HTMLButtonElement | null): void => {
                    cellRefs.current[index] = cell;
                }}
                type="button"
                role="gridcell"
                className={styles.cell}
                tabIndex={index === activeStop ? 0 : -1}
                disabled={isDisabled}
                aria-label={cellName(index)}
                aria-selected={grabbed !== null && anchor === grabbed}
                data-state={cellState(index)}
                data-occupied={anchor !== null ? 'true' : 'false'}
                data-drop={dropTarget === index ? 'true' : undefined}
                onPointerDown={anchor !== null ? drag.onPointerDown : undefined}
                onKeyDown={(event: KeyboardEvent<HTMLButtonElement>): void => {
                    handleCellKeyDown(index, event);
                }}
            />
        );
    }

    // The decorative item layer: each item drawn ONCE at its true span on the
    // same grid template (aria-hidden; the cells carry all semantics). The
    // tile keys on id + anchor so a completed move remounts it and plays the
    // settle animation.
    function renderTile(slot: InventorySlot, index: number): ReactElement | null {
        if (slot.content === undefined) {
            return null;
        }
        const span: ItemSpan = spanOf(index);
        const row: number = rowFromIndex(index, resolvedColumns);
        const column: number = columnFromIndex(index, resolvedColumns);
        const activeGhost: DragGhost | null = ghost;
        const dragging: boolean =
            activeGhost !== null && activeGhost.index === index;
        const tileStyle: CSSProperties = {
            gridRow: `${String(row + 1)} / span ${String(span.heightCells)}`,
            gridColumn: `${String(column + 1)} / span ${String(span.widthCells)}`,
            ...(activeGhost !== null && activeGhost.index === index
                ? {
                      [DRAG_X_PROPERTY]: `${String(activeGhost.dx)}px`,
                      [DRAG_Y_PROPERTY]: `${String(activeGhost.dy)}px`,
                  }
                : {}),
        };
        return (
            <div
                key={`${slot.id}:${String(index)}`}
                className={styles.tile}
                style={tileStyle}
                data-state={
                    movingAnchor === index
                        ? ESelectionState.Selected
                        : ESelectionState.Default
                }
                data-dragging={dragging ? 'true' : undefined}
            >
                {slot.content}
            </div>
        );
    }

    return (
        <div
            className={className}
            style={rootStyle}
            data-status={status}
            data-enabled={resolvedEnabled}
        >
            <span id={headingId} className={styles.heading}>
                {label}
            </span>
            <div className={styles.surface}>
                <div
                    ref={gridRef}
                    role="grid"
                    aria-labelledby={headingId}
                    aria-disabled={isDisabled ? true : undefined}
                    className={styles.grid}
                >
                    {rowChunks.map(
                        (
                            rowSlots: readonly InventorySlot[],
                            rowIndex: number,
                        ): ReactElement => (
                            <div
                                key={rowSlots[0]?.id ?? String(rowIndex)}
                                role="row"
                                className={styles.gridRow}
                            >
                                {rowSlots.map(
                                    (
                                        slot: InventorySlot,
                                        offset: number,
                                    ): ReactElement =>
                                        renderCell(
                                            slot,
                                            rowIndex * resolvedColumns + offset,
                                        ),
                                )}
                            </div>
                        ),
                    )}
                </div>
                <div className={styles.itemLayer} aria-hidden="true">
                    {slots.map(
                        (slot: InventorySlot, index: number): ReactElement | null =>
                            renderTile(slot, index),
                    )}
                </div>
            </div>
            <span className={styles.srOnly} aria-live="polite">
                {announcement}
            </span>
        </div>
    );
}
