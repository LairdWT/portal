import {
    type CSSProperties,
    type Dispatch,
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
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
import { slotIndexAtPoint, slotIndexFromKey } from './slotMath';

const COLUMNS_PROPERTY: string = '--inventory-columns';
const DRAG_X_PROPERTY: string = '--inventory-drag-x';
const DRAG_Y_PROPERTY: string = '--inventory-drag-y';

// A live pointer reorder: the grabbed slot index and the cumulative ghost
// offset from the gesture origin.
type DragGhost = Readonly<{
    index: number;
    dx: number;
    dy: number;
}>;

// The InventoryGrid: an APG-grid slot surface. Every slot is a real button
// carrying role=gridcell and the grid keyboard (the Calendar precedent):
// roving tab stop, arrows move focus, Space/Enter grabs an occupied slot and
// drops on the destination, Escape cancels; a polite live region narrates.
// Pointer reorder rides usePointerDrag with a transform-only ghost and
// slotMath hit testing; slot chrome reuses the SelectableTile state language
// (selected = grabbed, targetable = valid destination).
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

    function slotName(slot: InventorySlot, index: number): string {
        if (slot.label !== undefined) {
            return slot.label;
        }
        if (slot.content !== undefined) {
            return `Slot ${String(index + 1)}`;
        }
        return `Empty slot ${String(index + 1)}`;
    }

    function isOccupied(index: number): boolean {
        return slots[index]?.content !== undefined;
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
                const index: number | null = hitTest(state.originX, state.originY);
                if (index === null || !isOccupied(index)) {
                    dragSourceRef.current = null;
                    return;
                }
                dragSourceRef.current = index;
                setTabStop(index);
                setGhost({ index, dx: 0, dy: 0 });
            },
            onDrag: (state: PointerDragState): void => {
                const source: number | null = dragSourceRef.current;
                if (source === null) {
                    return;
                }
                setGhost({ index: source, dx: state.dx, dy: state.dy });
                setDropTarget(hitTest(state.x, state.y));
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
                const slot: InventorySlot | undefined = slots[index];
                if (slot?.content === undefined) {
                    return;
                }
                setGrabbed(index);
                setAnnouncement(
                    `${slotName(slot, index)} grabbed. Use the arrow keys to pick a destination, Space to drop, Escape to cancel.`,
                );
                return;
            }
            const from: number = grabbed;
            setGrabbed(null);
            if (from === index) {
                setAnnouncement('Move canceled.');
                return;
            }
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
        if (grabbed === index || ghost?.index === index) {
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
    };
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    // Slots chunked into APG rows (grid requires row children); each row is
    // its own equal-track grid, so the columns align across rows.
    const rowChunks: (readonly InventorySlot[])[] = [];
    for (let start: number = 0; start < slotCount; start += resolvedColumns) {
        rowChunks.push(slots.slice(start, start + resolvedColumns));
    }

    function renderCell(slot: InventorySlot, index: number): ReactElement {
        const occupied: boolean = slot.content !== undefined;
        const dragging: boolean = ghost !== null && ghost.index === index;
        const cellStyle: CSSProperties | undefined =
            ghost !== null && ghost.index === index
                ? {
                      [DRAG_X_PROPERTY]: `${String(ghost.dx)}px`,
                      [DRAG_Y_PROPERTY]: `${String(ghost.dy)}px`,
                  }
                : undefined;
        return (
            <button
                key={slot.id}
                ref={(cell: HTMLButtonElement | null): void => {
                    cellRefs.current[index] = cell;
                }}
                type="button"
                role="gridcell"
                className={styles.cell}
                style={cellStyle}
                tabIndex={index === activeStop ? 0 : -1}
                disabled={isDisabled}
                aria-label={slotName(slot, index)}
                aria-selected={grabbed === index}
                data-state={cellState(index)}
                data-occupied={occupied ? 'true' : 'false'}
                data-dragging={dragging ? 'true' : undefined}
                data-drop={dropTarget === index ? 'true' : undefined}
                onPointerDown={occupied ? drag.onPointerDown : undefined}
                onKeyDown={(event: KeyboardEvent<HTMLButtonElement>): void => {
                    handleCellKeyDown(index, event);
                }}
            >
                {slot.content}
            </button>
        );
    }

    return (
        <div
            className={className}
            style={rootStyle}
            data-status={status}
            data-enabled={resolvedEnabled}
        >
            <div
                ref={gridRef}
                role="grid"
                aria-label={label}
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
            <span className={styles.srOnly} aria-live="polite">
                {announcement}
            </span>
        </div>
    );
}
