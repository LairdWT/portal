import {
    type CSSProperties,
    type Dispatch,
    type FocusEvent as ReactFocusEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useDismiss } from '../../react/hooks/useDismiss';
import { useFocusTrap } from '../../react/hooks/useFocusTrap';
import {
    type PointerDragBinding,
    type PointerDragState,
    usePointerDrag,
} from '../../react/hooks/usePointerDrag';
import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { useScrollLock } from '../../react/hooks/useScrollLock';
import surfaceStyles from '../../theme/surfaces.module.css';
import { EOverlayMotion } from '../overlayMotion';
import { ensureOverlayRoot } from '../overlayRoot';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Window.module.css';
import {
    EWindowFrame,
    EWindowResizeEdge,
    EWindowResizeMode,
    EWindowState,
    type WindowProps,
    type WindowRect,
    type WindowSize,
} from './Window.types';
import {
    applyDragDelta,
    applyResizeDelta,
    clampWindowRect,
    edgeHonorsHorizontal,
    edgeHonorsVertical,
    type WindowViewport,
} from './windowGeometry';

// Inline custom properties the CSS reads: the JS-computed translate offsets, the
// live size, and the focus-order z-index offset above --portal-z-overlay. The
// layout geometry is owned by state (not authored layout px in the CSS) because a
// draggable/resizable window's position and size are inherently runtime values.
const WINDOW_X_PROPERTY: string = '--portal-window-x';
const WINDOW_Y_PROPERTY: string = '--portal-window-y';
const WINDOW_Z_PROPERTY: string = '--portal-window-z';

// Seed geometry when the consumer supplies no defaultPosition / defaultSize.
const DEFAULT_X: number = 96;
const DEFAULT_Y: number = 96;
const DEFAULT_WIDTH: number = 480;
const DEFAULT_HEIGHT: number = 320;
const DEFAULT_MIN_WIDTH: number = 240;
const DEFAULT_MIN_HEIGHT: number = 160;

// Keyboard nudge steps (CSS px). Shift uses the larger step.
const MOVE_STEP: number = 8;
const MOVE_STEP_LARGE: number = 32;

// Module-level monotonic z-order counter: each new window mounts above the
// previous one, and focusing a window raises it to the next value. This is the
// MVP focus-to-front engine (a context-based WindowLayerProvider is deferred).
let windowZCounter: number = 0;
function nextWindowZIndex(): number {
    windowZCounter += 1;
    return windowZCounter;
}

const EDGE_LABELS: Readonly<Record<EWindowResizeEdge, string>> = {
    n: 'Resize top edge',
    s: 'Resize bottom edge',
    e: 'Resize right edge',
    w: 'Resize left edge',
    ne: 'Resize top-right corner',
    nw: 'Resize top-left corner',
    se: 'Resize bottom-right corner',
    sw: 'Resize bottom-left corner',
};

const EDGES_BOTH: readonly EWindowResizeEdge[] = [
    EWindowResizeEdge.North,
    EWindowResizeEdge.South,
    EWindowResizeEdge.East,
    EWindowResizeEdge.West,
    EWindowResizeEdge.NorthEast,
    EWindowResizeEdge.NorthWest,
    EWindowResizeEdge.SouthEast,
    EWindowResizeEdge.SouthWest,
];
const EDGES_HORIZONTAL: readonly EWindowResizeEdge[] = [
    EWindowResizeEdge.East,
    EWindowResizeEdge.West,
];
const EDGES_VERTICAL: readonly EWindowResizeEdge[] = [
    EWindowResizeEdge.North,
    EWindowResizeEdge.South,
];

function resolveEdges(resize: EWindowResizeMode): readonly EWindowResizeEdge[] {
    switch (resize) {
        case EWindowResizeMode.None:
            return [];
        case EWindowResizeMode.Horizontal:
            return EDGES_HORIZONTAL;
        case EWindowResizeMode.Vertical:
            return EDGES_VERTICAL;
        case EWindowResizeMode.Both:
            return EDGES_BOTH;
    }
}

function getViewport(): WindowViewport {
    if (typeof window === 'undefined') {
        return { width: 0, height: 0 };
    }
    return { width: window.innerWidth, height: window.innerHeight };
}

function joinClassNames(...names: readonly (string | false | undefined)[]): string {
    return names
        .filter(
            (entry: string | false | undefined): entry is string =>
                typeof entry === 'string',
        )
        .join(' ');
}

function buildFrameStyle(
    tone: string | undefined,
    state: EWindowState,
    rect: WindowRect,
    zOffset: number,
): CSSProperties {
    const vars: Record<string, string | number> = { [WINDOW_Z_PROPERTY]: zOffset };
    if (state !== EWindowState.Maximized) {
        vars[WINDOW_X_PROPERTY] = `${String(rect.x)}px`;
        vars[WINDOW_Y_PROPERTY] = `${String(rect.y)}px`;
    }
    const style: CSSProperties = { ...toneProperties(tone), ...vars };
    if (state === EWindowState.Normal) {
        return {
            ...style,
            inlineSize: `${String(rect.width)}px`,
            blockSize: `${String(rect.height)}px`,
        };
    }
    if (state === EWindowState.Minimized) {
        return { ...style, inlineSize: `${String(rect.width)}px` };
    }
    return style;
}

type ResizeHandleProps = Readonly<{
    edge: EWindowResizeEdge;
    label: string;
    onResizeStart: (edge: EWindowResizeEdge) => void;
    onResizeDrag: (edge: EWindowResizeEdge, state: PointerDragState) => void;
    onResizeEnd: (edge: EWindowResizeEdge) => void;
    onResizeKeyDown: (
        edge: EWindowResizeEdge,
        event: ReactKeyboardEvent<HTMLButtonElement>,
    ) => void;
}>;

// One focusable resize grip. Its own usePointerDrag instance owns the pointer
// gesture; the keyboard handler is a NAMED handler closing over the stable `edge`
// prop (not a ref), so the rules-of-hooks ref guidance is satisfied.
function ResizeHandle(props: ResizeHandleProps): ReactElement {
    const {
        edge,
        label,
        onResizeStart,
        onResizeDrag,
        onResizeEnd,
        onResizeKeyDown,
    }: ResizeHandleProps = props;

    const binding: PointerDragBinding<HTMLButtonElement> =
        usePointerDrag<HTMLButtonElement>({
            onDragStart: (): void => {
                onResizeStart(edge);
            },
            onDrag: (state: PointerDragState): void => {
                onResizeDrag(edge, state);
            },
            onDragEnd: (): void => {
                onResizeEnd(edge);
            },
        });

    function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>): void {
        onResizeKeyDown(edge, event);
    }

    // Advertise only the arrows this edge actually honors (a single-axis grip
    // honors one axis; a corner honors both), matching the keyboard handler.
    const resizeKeyshortcuts: string = [
        edgeHonorsVertical(edge) ? 'ArrowUp ArrowDown' : '',
        edgeHonorsHorizontal(edge) ? 'ArrowLeft ArrowRight' : '',
    ]
        .filter((part: string): boolean => part.length > 0)
        .join(' ');

    return (
        <button
            type="button"
            className={styles.resizeHandle}
            data-edge={edge}
            aria-label={label}
            aria-keyshortcuts={resizeKeyshortcuts}
            onKeyDown={handleKeyDown}
            onPointerDown={binding.onPointerDown}
        />
    );
}

export function Window(props: WindowProps): ReactElement | null {
    const {
        open,
        onOpenChange,
        title,
        children,
        leadingIcon,
        statusText,
        titleBarActions,
        defaultPosition,
        defaultSize,
        minSize,
        position,
        size,
        onMove,
        onResize,
        resize = EWindowResizeMode.Both,
        minimizable = false,
        maximizable = false,
        windowState,
        onWindowStateChange,
        status = EUiStatus.None,
        frame = EWindowFrame.Highlight,
        tone,
    }: WindowProps = props;

    const modal: boolean = props.modal === true;
    const closeOnEscape: boolean = props.closeOnEscape ?? modal;
    const closeOnBackdrop: boolean =
        props.modal === true ? (props.closeOnBackdrop ?? true) : false;

    const panelRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion: boolean = useReducedMotion();
    const [overlayRoot]: [
        HTMLElement | null,
        Dispatch<SetStateAction<HTMLElement | null>>,
    ] = useState<HTMLElement | null>((): HTMLElement | null => ensureOverlayRoot());
    const titleId: string = useId();

    const minWidth: number = minSize?.width ?? DEFAULT_MIN_WIDTH;
    const minHeight: number = minSize?.height ?? DEFAULT_MIN_HEIGHT;
    const resolvedMinSize: WindowSize = useMemo(
        (): WindowSize => ({ width: minWidth, height: minHeight }),
        [minWidth, minHeight],
    );

    const [internalRect, setInternalRect]: [
        WindowRect,
        Dispatch<SetStateAction<WindowRect>>,
    ] = useState<WindowRect>(
        (): WindowRect => ({
            x: defaultPosition?.x ?? DEFAULT_X,
            y: defaultPosition?.y ?? DEFAULT_Y,
            width: defaultSize?.width ?? DEFAULT_WIDTH,
            height: defaultSize?.height ?? DEFAULT_HEIGHT,
        }),
    );

    const [internalWindowState, setInternalWindowState]: [
        EWindowState,
        Dispatch<SetStateAction<EWindowState>>,
    ] = useState<EWindowState>(EWindowState.Normal);

    const [zOffset, setZOffset]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>((): number => nextWindowZIndex());
    const [isFront, setIsFront]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);

    const resolvedRect: WindowRect = {
        x: position?.x ?? internalRect.x,
        y: position?.y ?? internalRect.y,
        width: size?.width ?? internalRect.width,
        height: size?.height ?? internalRect.height,
    };
    const resolvedWindowState: EWindowState = windowState ?? internalWindowState;

    // Gesture origin rectangles captured at drag/resize start. usePointerDrag
    // reports the cumulative delta from origin, so the math always derives from
    // the start rect (never the live, mid-gesture rect).
    const dragOriginRef: RefObject<WindowRect> = useRef<WindowRect>(resolvedRect);
    const resizeOriginRef: RefObject<WindowRect> = useRef<WindowRect>(resolvedRect);
    // Latest committed rectangle, read by onDragEnd/onResizeEnd to report the
    // final value without depending on the async state flush.
    const liveRectRef: RefObject<WindowRect> = useRef<WindowRect>(resolvedRect);

    function bringToFront(): void {
        setIsFront(true);
        setZOffset((current: number): number =>
            current === windowZCounter ? current : nextWindowZIndex(),
        );
    }

    function handleFrameFocus(): void {
        bringToFront();
    }

    function handleFrameBlur(event: ReactFocusEvent<HTMLDivElement>): void {
        const next: EventTarget | null = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) {
            return;
        }
        setIsFront(false);
    }

    function commitRect(next: WindowRect): void {
        liveRectRef.current = next;
        setInternalRect(next);
    }

    function commitWindowState(next: EWindowState): void {
        if (windowState === undefined) {
            setInternalWindowState(next);
        }
        onWindowStateChange?.(next);
    }

    function handleMoveStart(): void {
        dragOriginRef.current = resolvedRect;
        liveRectRef.current = resolvedRect;
        bringToFront();
    }

    function handleMoveDrag(state: PointerDragState): void {
        const next: WindowRect = clampWindowRect(
            applyDragDelta(dragOriginRef.current, state.dx, state.dy),
            getViewport(),
            resolvedMinSize,
        );
        commitRect(next);
    }

    function handleMoveEnd(): void {
        onMove?.({ x: liveRectRef.current.x, y: liveRectRef.current.y });
    }

    const moveBinding: PointerDragBinding<HTMLDivElement> =
        usePointerDrag<HTMLDivElement>({
            disabled: resolvedWindowState !== EWindowState.Normal,
            onDragStart: handleMoveStart,
            onDrag: handleMoveDrag,
            onDragEnd: handleMoveEnd,
        });

    function handleTitleBarPointerDown(
        event: ReactPointerEvent<HTMLDivElement>,
    ): void {
        if (!(event.target instanceof Element)) {
            return;
        }
        if (event.target.closest('[data-window-drag-ignore]') !== null) {
            return;
        }
        moveBinding.onPointerDown(event);
    }

    function handleMoveKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>): void {
        if (resolvedWindowState !== EWindowState.Normal) {
            return;
        }
        const step: number = event.shiftKey ? MOVE_STEP_LARGE : MOVE_STEP;
        let dx: number = 0;
        let dy: number = 0;
        switch (event.key) {
            case 'ArrowUp':
                dy = -step;
                break;
            case 'ArrowDown':
                dy = step;
                break;
            case 'ArrowLeft':
                dx = -step;
                break;
            case 'ArrowRight':
                dx = step;
                break;
            default:
                return;
        }
        event.preventDefault();
        const next: WindowRect = clampWindowRect(
            applyDragDelta(resolvedRect, dx, dy),
            getViewport(),
            resolvedMinSize,
        );
        commitRect(next);
        onMove?.({ x: next.x, y: next.y });
    }

    function handleResizeStart(): void {
        resizeOriginRef.current = resolvedRect;
        liveRectRef.current = resolvedRect;
        bringToFront();
    }

    function handleResizeDrag(
        edge: EWindowResizeEdge,
        state: PointerDragState,
    ): void {
        const next: WindowRect = clampWindowRect(
            applyResizeDelta(
                resizeOriginRef.current,
                edge,
                state.dx,
                state.dy,
                resolvedMinSize,
            ),
            getViewport(),
            resolvedMinSize,
        );
        commitRect(next);
    }

    function handleResizeEnd(): void {
        const committed: WindowRect = liveRectRef.current;
        onResize?.({ width: committed.width, height: committed.height });
        onMove?.({ x: committed.x, y: committed.y });
    }

    function handleResizeKeyDown(
        edge: EWindowResizeEdge,
        event: ReactKeyboardEvent<HTMLButtonElement>,
    ): void {
        if (resolvedWindowState !== EWindowState.Normal) {
            return;
        }
        const step: number = event.shiftKey ? MOVE_STEP_LARGE : MOVE_STEP;
        let dx: number = 0;
        let dy: number = 0;
        switch (event.key) {
            case 'ArrowUp':
                dy = -step;
                break;
            case 'ArrowDown':
                dy = step;
                break;
            case 'ArrowLeft':
                dx = -step;
                break;
            case 'ArrowRight':
                dx = step;
                break;
            default:
                return;
        }
        // Ignore a cross-axis arrow (e.g. ArrowUp on an east/west grip): this edge
        // does not honor that axis, so leave the key unhandled (no preventDefault)
        // and emit no no-op resize.
        if (
            (dx !== 0 && !edgeHonorsHorizontal(edge)) ||
            (dy !== 0 && !edgeHonorsVertical(edge))
        ) {
            return;
        }
        event.preventDefault();
        const next: WindowRect = clampWindowRect(
            applyResizeDelta(resolvedRect, edge, dx, dy, resolvedMinSize),
            getViewport(),
            resolvedMinSize,
        );
        commitRect(next);
        onResize?.({ width: next.width, height: next.height });
        // A position-moving edge (west/north and the corners) shifts x/y as it
        // resizes; report it so the keyboard path matches the pointer resize.
        onMove?.({ x: next.x, y: next.y });
    }

    function handleClose(): void {
        onOpenChange(false);
    }

    function handleToggleMinimize(): void {
        commitWindowState(
            resolvedWindowState === EWindowState.Minimized
                ? EWindowState.Normal
                : EWindowState.Minimized,
        );
    }

    function handleToggleMaximize(): void {
        commitWindowState(
            resolvedWindowState === EWindowState.Maximized
                ? EWindowState.Normal
                : EWindowState.Maximized,
        );
    }

    function handleDismiss(): void {
        onOpenChange(false);
    }

    // Modal-only primitives, no-ops while closed or non-modal.
    useScrollLock({ locked: open && modal });
    useFocusTrap({
        active: open && modal,
        containerRef: panelRef,
        restoreFocus: true,
    });
    useDismiss({
        enabled: open,
        onDismiss: handleDismiss,
        refs: [panelRef],
        escapeKey: closeOnEscape,
        outsidePointer: closeOnBackdrop,
    });

    // Re-clamp the (uncontrolled) rectangle when the viewport shrinks, with full
    // listener cleanup. Depends only on the memoized min size so it re-subscribes
    // on neither every render nor a changing callback.
    useEffect((): (() => void) | undefined => {
        if (!open) {
            return undefined;
        }
        if (typeof window === 'undefined') {
            return undefined;
        }
        function handleViewportResize(): void {
            setInternalRect(
                (current: WindowRect): WindowRect =>
                    clampWindowRect(current, getViewport(), resolvedMinSize),
            );
        }
        window.addEventListener('resize', handleViewportResize);
        return (): void => {
            window.removeEventListener('resize', handleViewportResize);
        };
    }, [open, resolvedMinSize]);

    if (!open) {
        return null;
    }
    if (overlayRoot === null) {
        return null;
    }

    const motion: EOverlayMotion = prefersReducedMotion
        ? EOverlayMotion.Reduced
        : EOverlayMotion.Full;
    const frameClassName: string = joinClassNames(
        toneStyles.toneScope,
        styles.frame,
        frame === EWindowFrame.Metal
            ? surfaceStyles.metalEdge
            : styles.frameHighlight,
    );
    const titleBarClassName: string = joinClassNames(
        styles.titleBar,
        frame === EWindowFrame.Metal
            ? isFront
                ? surfaceStyles.metalTrim
                : surfaceStyles.metalEdge
            : styles.titleBarHighlight,
    );
    const frameStyle: CSSProperties = buildFrameStyle(
        tone,
        resolvedWindowState,
        resolvedRect,
        zOffset,
    );
    const edges: readonly EWindowResizeEdge[] = resolveEdges(resize);
    const showResize: boolean =
        resize !== EWindowResizeMode.None &&
        resolvedWindowState === EWindowState.Normal;
    const minimizeLabel: string =
        resolvedWindowState === EWindowState.Minimized ? 'Restore' : 'Minimize';
    const maximizeLabel: string =
        resolvedWindowState === EWindowState.Maximized ? 'Restore' : 'Maximize';

    return createPortal(
        <>
            {modal ? (
                <div
                    className={styles.backdrop}
                    data-motion={motion}
                    aria-hidden="true"
                />
            ) : null}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal={modal}
                tabIndex={-1}
                aria-labelledby={titleId}
                className={frameClassName}
                style={frameStyle}
                data-state={resolvedWindowState}
                data-status={status}
                data-motion={motion}
                data-modal={modal}
                data-resize={resize}
                data-frame={frame}
                onFocus={handleFrameFocus}
                onBlur={handleFrameBlur}
            >
                {/* The title bar is a pointer-drag region; its keyboard-accessible
                    move affordance is the focusable grip button below, so the bar
                    itself needs no interactive role. */}
                {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                <div
                    className={titleBarClassName}
                    data-front={isFront}
                    onPointerDown={handleTitleBarPointerDown}
                >
                    <button
                        type="button"
                        className={styles.moveGrip}
                        aria-label={`Move ${title}`}
                        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
                        onKeyDown={handleMoveKeyDown}
                    >
                        <span className={styles.gripDots} aria-hidden="true" />
                    </button>
                    {leadingIcon !== undefined ? (
                        <span className={styles.leadingIcon} aria-hidden="true">
                            {leadingIcon}
                        </span>
                    ) : null}
                    <h2 id={titleId} className={styles.title}>
                        {title}
                    </h2>
                    {statusText !== undefined ? (
                        <span className={styles.status}>{statusText}</span>
                    ) : null}
                    <div className={styles.actions} data-window-drag-ignore>
                        {titleBarActions}
                        {minimizable ? (
                            <button
                                type="button"
                                className={styles.affordance}
                                aria-label={minimizeLabel}
                                onClick={handleToggleMinimize}
                            >
                                <span aria-hidden="true">{'_'}</span>
                            </button>
                        ) : null}
                        {maximizable ? (
                            <button
                                type="button"
                                className={styles.affordance}
                                aria-label={maximizeLabel}
                                aria-pressed={
                                    resolvedWindowState === EWindowState.Maximized
                                }
                                onClick={handleToggleMaximize}
                            >
                                <span aria-hidden="true">{'[]'}</span>
                            </button>
                        ) : null}
                        <button
                            type="button"
                            className={joinClassNames(
                                styles.affordance,
                                styles.close,
                            )}
                            aria-label="Close"
                            onClick={handleClose}
                        >
                            <span aria-hidden="true">{'X'}</span>
                        </button>
                    </div>
                </div>
                {resolvedWindowState !== EWindowState.Minimized ? (
                    <div className={styles.body}>{children}</div>
                ) : null}
                {showResize
                    ? edges.map(
                          (edge: EWindowResizeEdge): ReactElement => (
                              <ResizeHandle
                                  key={edge}
                                  edge={edge}
                                  label={EDGE_LABELS[edge]}
                                  onResizeStart={handleResizeStart}
                                  onResizeDrag={handleResizeDrag}
                                  onResizeEnd={handleResizeEnd}
                                  onResizeKeyDown={handleResizeKeyDown}
                              />
                          ),
                      )
                    : null}
            </div>
        </>,
        overlayRoot,
    );
}
