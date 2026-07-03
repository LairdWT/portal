import {
    type CSSProperties,
    type Dispatch,
    type KeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useRef,
    useState,
} from 'react';

import {
    type DigitalPressBinding,
    useDigitalPress,
} from '../../react/hooks/useDigitalPress';
import {
    type PointerDragBinding,
    type PointerDragState,
    usePointerDrag,
} from '../../react/hooks/usePointerDrag';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { slotIndexAtPoint } from '../../ui/InventoryGrid/slotMath';
import styles from './Hotbar.module.css';
import { type HotbarProps, type HotbarSlot } from './Hotbar.types';

const DRAG_X_PROPERTY: string = '--hotbar-drag-x';
const DRAG_Y_PROPERTY: string = '--hotbar-drag-y';

// Movement below this stays a press (activation); past it the gesture is a
// reorder drag and the trailing click is swallowed (DockLayout's grip
// threshold).
const DRAG_THRESHOLD_PX: number = 8;

// A live pointer reorder: the grabbed slot index and the cumulative ghost
// offset from the gesture origin (InventoryGrid's ghost model).
type DragGhost = Readonly<{
    index: number;
    dx: number;
    dy: number;
}>;

type HotbarKeyProps = Readonly<{
    slot: HotbarSlot;
    index: number;
    active: boolean;
    enabled: EEnabledState;
    reorderable: boolean;
    ghost: DragGhost | null;
    dropTarget: boolean;
    onActivate: ((id: string) => void) | undefined;
    onSignal: HotbarProps['onSignal'];
    onDragPointerDown:
        | ((event: ReactPointerEvent<HTMLButtonElement>) => void)
        | undefined;
    onReorderKeyDown:
        | ((index: number, event: KeyboardEvent<HTMLButtonElement>) => void)
        | undefined;
}>;

// One hotbar key. A child component so each slot owns its useDigitalPress
// instance (press visuals + per-slot descriptor signals). Activation rides
// onClick - it fires exactly once for a pointer click AND for keyboard
// Enter/Space, which the pointer-only press hook cannot cover. When the bar
// is reorderable the same pointerdown also arms the shared drag engine; the
// press signals still emit (a drag IS a press), only the activation is
// swallowed after a real drag.
function HotbarKey({
    slot,
    index,
    active,
    enabled,
    reorderable,
    ghost,
    dropTarget,
    onActivate,
    onSignal,
    onDragPointerDown,
    onReorderKeyDown,
}: HotbarKeyProps): ReactElement {
    const {
        pressState,
        onPointerDown,
        onPointerUp,
        onPointerCancel,
    }: DigitalPressBinding = useDigitalPress({
        enabled,
        onSignal,
        descriptor: slot.descriptor,
    });

    const dragging: boolean = ghost !== null && ghost.index === index;
    const ghostStyle: CSSProperties | undefined =
        ghost !== null && ghost.index === index
            ? {
                  [DRAG_X_PROPERTY]: `${String(ghost.dx)}px`,
                  [DRAG_Y_PROPERTY]: `${String(ghost.dy)}px`,
              }
            : undefined;

    const shortcutList: string = [
        slot.keybind,
        reorderable ? 'Control+ArrowLeft Control+ArrowRight' : undefined,
    ]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <button
            type="button"
            className={styles.key}
            style={ghostStyle}
            disabled={enabled === EEnabledState.Disabled}
            aria-label={slot.label}
            aria-pressed={active}
            aria-keyshortcuts={shortcutList.length > 0 ? shortcutList : undefined}
            data-active={active ? 'true' : 'false'}
            data-pressed={pressState}
            data-dragging={dragging ? 'true' : undefined}
            data-drop={dropTarget ? 'true' : undefined}
            onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>): void => {
                onPointerDown(event);
                onDragPointerDown?.(event);
            }}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onClick={(): void => {
                onActivate?.(slot.id);
            }}
            onKeyDown={
                onReorderKeyDown !== undefined
                    ? (event: KeyboardEvent<HTMLButtonElement>): void => {
                          onReorderKeyDown(index, event);
                      }
                    : undefined
            }
        >
            <span className={styles.face} aria-hidden="true">
                {slot.content}
            </span>
            {slot.keybind !== undefined ? (
                <kbd className={styles.keybind} aria-hidden="true">
                    {slot.keybind}
                </kbd>
            ) : null}
        </button>
    );
}

// The Hotbar: a single-row action bar of digital-press keys with keybind
// chips and one active (selected) slot. With `onMove` the bar also reorders:
// pointer drags past the threshold ghost the key (transform only) and drop
// on the slotMath hit target; Ctrl+ArrowLeft/Right move the focused slot
// with a polite announcement. Without `onMove`, layout only - slot order is
// the consumer's.
export function Hotbar({
    label,
    slots,
    activeId,
    onActivate,
    onSignal,
    onMove,
    enabled,
}: HotbarProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const reorderable: boolean = onMove !== undefined && !isDisabled;
    const slotCount: number = slots.length;

    const barRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
        null,
    );
    const dragSourceRef: RefObject<number | null> = useRef<number | null>(null);
    // True once the active gesture traveled past the threshold; the trailing
    // click (activation) is swallowed exactly once.
    const movedRef: RefObject<boolean> = useRef<boolean>(false);

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

    // The live bar box and direction, measured fresh per hit test (the
    // InventoryGrid recipe; a hotbar is a one-row grid of slotCount columns).
    function hitTest(x: number, y: number): number | null {
        const bar: HTMLDivElement | null = barRef.current;
        if (bar === null) {
            return null;
        }
        const rtl: boolean = getComputedStyle(bar).direction === 'rtl';
        return slotIndexAtPoint(
            bar.getBoundingClientRect(),
            x,
            y,
            slotCount,
            slotCount,
            rtl,
        );
    }

    function completeMove(from: number, to: number): void {
        const source: HotbarSlot | undefined = slots[from];
        const target: HotbarSlot | undefined = slots[to];
        if (source === undefined || target === undefined) {
            return;
        }
        onMove?.(from, to);
        setAnnouncement(
            `${source.label} moved to slot ${String(to + 1)} of ${String(slotCount)}.`,
        );
    }

    const drag: PointerDragBinding<HTMLButtonElement> =
        usePointerDrag<HTMLButtonElement>({
            disabled: !reorderable,
            onDragStart: (state: PointerDragState): void => {
                movedRef.current = false;
                dragSourceRef.current = hitTest(state.originX, state.originY);
            },
            onDrag: (state: PointerDragState): void => {
                const source: number | null = dragSourceRef.current;
                if (source === null) {
                    return;
                }
                if (!movedRef.current) {
                    if (
                        Math.abs(state.dx) < DRAG_THRESHOLD_PX &&
                        Math.abs(state.dy) < DRAG_THRESHOLD_PX
                    ) {
                        return;
                    }
                    movedRef.current = true;
                }
                setGhost({ index: source, dx: state.dx, dy: state.dy });
                setDropTarget(hitTest(state.x, state.y));
            },
            onDragEnd: (state: PointerDragState): void => {
                const source: number | null = dragSourceRef.current;
                dragSourceRef.current = null;
                setGhost(null);
                setDropTarget(null);
                if (source === null || !movedRef.current) {
                    return;
                }
                const target: number | null = hitTest(state.x, state.y);
                if (target === null || target === source) {
                    return;
                }
                completeMove(source, target);
            },
        });

    // A real drag swallows the click that follows its pointerup; a clean
    // press (below the threshold) activates as always.
    function handleActivate(id: string): void {
        if (movedRef.current) {
            movedRef.current = false;
            return;
        }
        onActivate?.(id);
    }

    function handleReorderKeyDown(
        index: number,
        event: KeyboardEvent<HTMLButtonElement>,
    ): void {
        if (!event.ctrlKey) {
            return;
        }
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return;
        }
        const target: number = event.key === 'ArrowRight' ? index + 1 : index - 1;
        if (target < 0 || target >= slotCount) {
            return;
        }
        event.preventDefault();
        completeMove(index, target);
    }

    return (
        <div
            ref={barRef}
            role="group"
            aria-label={label}
            className={styles.bar}
            data-enabled={resolvedEnabled}
        >
            {slots.map(
                (slot: HotbarSlot, index: number): ReactElement => (
                    <HotbarKey
                        key={slot.id}
                        slot={slot}
                        index={index}
                        active={slot.id === activeId}
                        enabled={resolvedEnabled}
                        reorderable={reorderable}
                        ghost={ghost}
                        dropTarget={dropTarget === index && ghost !== null}
                        onActivate={handleActivate}
                        onSignal={onSignal}
                        onDragPointerDown={
                            reorderable ? drag.onPointerDown : undefined
                        }
                        onReorderKeyDown={
                            reorderable ? handleReorderKeyDown : undefined
                        }
                    />
                ),
            )}
            <span className={styles.srOnly} aria-live="polite">
                {announcement}
            </span>
        </div>
    );
}
