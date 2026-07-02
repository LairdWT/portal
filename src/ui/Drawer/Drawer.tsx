/*
 * Drawer is intentionally an EDGE-DOCKED panel: it resizes only along its dock
 * axis (a single role=separator grip), and its cross axis is pinned to the
 * viewport. Free two-axis resize from any edge or corner is a different
 * contract, served by the Window component (8 edge/corner handles, role=dialog,
 * keyboard resize) - reach for Window when a floating, freely-resizable panel is
 * wanted rather than growing Drawer's docked contract.
 */
import {
    type CSSProperties,
    type Dispatch,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode,
    type RefObject,
    type SetStateAction,
    useId,
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
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { useScrollLock } from '../../react/hooks/useScrollLock';
import { EEnabledState } from '../../state/state';
import { EOverlayMotion } from '../overlayMotion';
import { ensureOverlayRoot } from '../overlayRoot';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import {
    clampSize,
    edgeAxis,
    edgeOrientation,
    nearestSnap,
    sizeFromDrag,
    sizeFromKey,
} from './Drawer.geometry';
import styles from './Drawer.module.css';
import {
    type DrawerHeadingLevel,
    type DrawerInlineProps,
    type DrawerOverlayProps,
    type DrawerProps,
    type DrawerResize,
    EDrawerEdge,
    EDrawerMode,
} from './Drawer.types';

// Fallback dock-axis size (px) when neither `size` nor `defaultSize` is given.
// These are JS-computed inline-style px (the sanctioned exception to the
// no-fixed-px-in-CSS rule), never authored in the module CSS.
const DEFAULT_INLINE_SIZE: number = 320;
const DEFAULT_BLOCK_SIZE: number = 220;
// Keyboard resize step (px) per Arrow press on the splitter.
const DEFAULT_RESIZE_STEP: number = 16;
// Default resize floor when no minSize is supplied.
const DEFAULT_MIN_SIZE: number = 0;

const DEFAULT_RESIZE_LABEL: string = 'Resize panel';
const DEFAULT_CLOSE_LABEL: string = 'Close';
const DEFAULT_TOGGLE_LABEL: string = 'Toggle panel';

// Body reveal state, doubling as the data-state attribute the collapse CSS keys
// off (grid-template 0fr <-> 1fr).
const ERevealState: {
    readonly Collapsed: 'collapsed';
    readonly Expanded: 'expanded';
} = { Collapsed: 'collapsed', Expanded: 'expanded' };
type ERevealState = (typeof ERevealState)[keyof typeof ERevealState];

// The resolved size model fed to the splitter and the panel inline style.
type ResizeModel = Readonly<{
    size: number;
    minSize: number;
    maxSize: number;
    hasMax: boolean;
    snapPoints: readonly number[];
}>;

// Join the tone scope and a component class into one definite string (the CSS
// module lookups are possibly-undefined under noUncheckedIndexedAccess).
function composeClassName(
    scope: string | undefined,
    local: string | undefined,
): string {
    return [scope, local]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
}

// Resolve the effective, clamped size plus the bounds for ARIA and clamping.
function resolveResizeModel(edge: EDrawerEdge, resize: DrawerResize): ResizeModel {
    const fallback: number =
        edgeAxis(edge) === 'x' ? DEFAULT_INLINE_SIZE : DEFAULT_BLOCK_SIZE;
    const minSize: number = resize.minSize ?? DEFAULT_MIN_SIZE;
    const hasMax: boolean = resize.maxSize !== undefined;
    const maxSize: number = resize.maxSize ?? Number.POSITIVE_INFINITY;
    const raw: number = resize.size ?? resize.defaultSize ?? fallback;
    return {
        size: clampSize(raw, minSize, maxSize),
        minSize,
        maxSize,
        hasMax,
        snapPoints: resize.snapPoints ?? [],
    };
}

// The dock-axis inline-size / block-size style (the only authored px, computed in
// JS per the size model). The cross axis is owned by the module CSS.
function sizeStyle(edge: EDrawerEdge, size: number): CSSProperties {
    if (edgeAxis(edge) === 'x') {
        return { inlineSize: `${String(size)}px` };
    }
    return { blockSize: `${String(size)}px` };
}

// The viewport extent (CSS px) along an edge's resize axis, read from the
// document element. An edge-docked drawer can never grow past this, so an
// unbounded resize uses it as the effective ARIA maximum. Returns 0 when there is
// no document (SSR), letting the caller floor the ceiling at the current size
// instead of throwing.
function viewportExtentForEdge(edge: EDrawerEdge): number {
    if (typeof document === 'undefined') {
        return 0;
    }
    if (edgeAxis(edge) === 'x') {
        return document.documentElement.clientWidth;
    }
    return document.documentElement.clientHeight;
}

// Render the header-strip title at the configured heading level. The level is
// constrained to 2..6 by the prop type, so the switch is exhaustive and never
// interpolates a tag name from a string.
function renderHeading(
    level: DrawerHeadingLevel,
    headerId: string,
    content: ReactNode,
): ReactElement {
    switch (level) {
        case 2:
            return (
                <h2 id={headerId} className={styles.heading}>
                    {content}
                </h2>
            );
        case 3:
            return (
                <h3 id={headerId} className={styles.heading}>
                    {content}
                </h3>
            );
        case 4:
            return (
                <h4 id={headerId} className={styles.heading}>
                    {content}
                </h4>
            );
        case 5:
            return (
                <h5 id={headerId} className={styles.heading}>
                    {content}
                </h5>
            );
        case 6:
            return (
                <h6 id={headerId} className={styles.heading}>
                    {content}
                </h6>
            );
    }
}

type DrawerResizeHandleProps = Readonly<{
    edge: EDrawerEdge;
    controlsId: string;
    handleId: string;
    model: ResizeModel;
    disabled: boolean;
    label: string;
    onSizeChange: ((size: number) => void) | undefined;
    onToggleCollapse?: (() => void) | undefined;
}>;

// The WAI-ARIA window-splitter: a focusable role="separator" driven by the shared
// usePointerDrag pointer engine for drag resize and by Arrow / Home / End for
// keyboard resize. The visible grip is a hairline; the CSS pads the hit area to
// the 3rem touch floor on the drag axis.
function DrawerResizeHandle(props: DrawerResizeHandleProps): ReactElement {
    const {
        edge,
        controlsId,
        handleId,
        model,
        disabled,
        label,
        onSizeChange,
        onToggleCollapse,
    }: DrawerResizeHandleProps = props;

    // The size captured at gesture start; the cumulative pointer delta is added to
    // it so a controlled re-render mid-drag never drifts the origin.
    const startSizeRef: RefObject<number> = useRef<number>(model.size);

    const dragBinding: PointerDragBinding<HTMLDivElement> =
        usePointerDrag<HTMLDivElement>({
            disabled,
            axisLock: edgeAxis(edge),
            onDragStart: (): void => {
                startSizeRef.current = model.size;
            },
            onDrag: (state: PointerDragState): void => {
                const next: number = sizeFromDrag(
                    edge,
                    startSizeRef.current,
                    state.dx,
                    state.dy,
                    model.minSize,
                    model.maxSize,
                );
                onSizeChange?.(next);
            },
            // On release (pointerup AND pointercancel share this path) the
            // size settles onto the nearest snap point when any are
            // configured; the live drag above stays free.
            onDragEnd: (state: PointerDragState): void => {
                if (model.snapPoints.length === 0) {
                    return;
                }
                const released: number = sizeFromDrag(
                    edge,
                    startSizeRef.current,
                    state.dx,
                    state.dy,
                    model.minSize,
                    model.maxSize,
                );
                const settled: number = nearestSnap(
                    released,
                    model.snapPoints,
                    model.minSize,
                    model.maxSize,
                );
                if (settled === released) {
                    return;
                }
                onSizeChange?.(settled);
            },
        });

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        if (disabled) {
            return;
        }
        if (event.key === 'Enter') {
            if (onToggleCollapse === undefined) {
                return;
            }
            event.preventDefault();
            onToggleCollapse();
            return;
        }
        const next: number | null = sizeFromKey(
            edge,
            model.size,
            event.key,
            DEFAULT_RESIZE_STEP,
            model.minSize,
            model.maxSize,
        );
        if (next === null) {
            return;
        }
        event.preventDefault();
        onSizeChange?.(next);
    }

    // The size ARIA reports against an EFFECTIVE maximum. A bounded drawer uses its
    // author maxSize; an unbounded one has no author ceiling, but an edge-docked
    // panel can never grow past the viewport extent along its resize axis, so that
    // extent (captured at render) is the ARIA ceiling. The helper returns 0 with no
    // layout (SSR / jsdom), so the ceiling is floored at the current size: a
    // reported max must never fall below the value it bounds.
    const viewportExtent: number = viewportExtentForEdge(edge);
    const effectiveMax: number = model.hasMax
        ? model.maxSize
        : Math.max(viewportExtent, model.size);

    // ALWAYS emit the full value triplet: an unbounded grip would otherwise
    // announce raw px against ARIA's implied 0..100. valuenow is clamped into
    // [min, effectiveMax] for the ARIA report ONLY - drag / key resize still reads
    // the unclamped model.size.
    const ariaValueMin: number = Math.round(model.minSize);
    const ariaValueMax: number = Math.round(effectiveMax);
    const ariaValueNow: number = Math.round(
        clampSize(model.size, model.minSize, effectiveMax),
    );
    // Spoken value in absolute pixels, meaningful regardless of any CSS scale on
    // the panel (mirrors Slider's aria-valuetext).
    const ariaValueText: string = `${String(ariaValueNow)} pixels`;

    // The operable handlers are applied as a single spread binding. role="separator"
    // is the APG Window Splitter's focusable, operable widget, but aria-query models
    // separator as structure-only (non-interactive), so jsx-a11y would flag literal
    // handler attributes on it. Spreading the pointer-down + key-down handlers
    // through the same binding pattern usePointerDrag returns keeps the canonical
    // role and the full Arrow / Home / End / Enter keyboard without an
    // eslint-disable - the exact pattern SplitPane's divider uses, which disproves
    // the earlier role="slider" workaround this replaces.
    const separatorHandlers: PointerDragBinding<HTMLDivElement> & {
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
    } = { ...dragBinding, onKeyDown: handleKeyDown };

    return (
        <div
            id={handleId}
            role="separator"
            className={styles.handle}
            tabIndex={disabled ? -1 : 0}
            aria-orientation={edgeOrientation(edge)}
            aria-controls={controlsId}
            aria-label={label}
            aria-valuenow={ariaValueNow}
            aria-valuemin={ariaValueMin}
            aria-valuemax={ariaValueMax}
            aria-valuetext={ariaValueText}
            aria-disabled={disabled ? true : undefined}
            data-edge={edge}
            data-disabled={disabled ? '' : undefined}
            {...separatorHandlers}
        />
    );
}

// Overlay (modal) drawer. Reuses the EXACT Dialog overlay primitive set so it
// shares one stacking layer and one dismissal contract.
function OverlayDrawer(props: DrawerOverlayProps): ReactElement | null {
    const {
        open,
        onClose,
        title,
        children,
        edge = EDrawerEdge.InlineStart,
        headingLevel = 2,
        status = EUiStatus.None,
        enabled,
        tone,
        label,
        labelledBy,
        closeOnEscape = true,
        closeOnBackdrop = true,
        closeLabel = DEFAULT_CLOSE_LABEL,
        initialFocusRef,
        resizable = false,
        resizeLabel = DEFAULT_RESIZE_LABEL,
    }: DrawerOverlayProps = props;

    const panelRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion: boolean = useReducedMotion();
    const [overlayRoot]: [
        HTMLElement | null,
        Dispatch<SetStateAction<HTMLElement | null>>,
    ] = useState<HTMLElement | null>((): HTMLElement | null => ensureOverlayRoot());
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const baseId: string = useId();

    // The Dialog primitive set, gated on `open` (no-ops while closed). Called
    // unconditionally before the early returns so the hook order stays stable.
    useScrollLock({ locked: open });
    useFocusTrap({
        active: open,
        containerRef: panelRef,
        ...(initialFocusRef !== undefined ? { initialFocusRef } : {}),
        restoreFocus: true,
    });
    useDismiss({
        enabled: open,
        onDismiss: onClose,
        refs: [panelRef],
        escapeKey: closeOnEscape,
        outsidePointer: closeOnBackdrop,
    });

    if (!open) {
        return null;
    }
    if (overlayRoot === null) {
        return null;
    }

    const disabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const motion: EOverlayMotion = prefersReducedMotion
        ? EOverlayMotion.Reduced
        : EOverlayMotion.Full;
    const headerId: string = `${baseId}-header`;
    const bodyId: string = `${baseId}-body`;
    const handleId: string = `${baseId}-handle`;
    const model: ResizeModel = resolveResizeModel(edge, props);
    const panelStyle: CSSProperties = {
        ...toneProperties(tone),
        ...sizeStyle(edge, model.size),
    };

    function handleClose(): void {
        if (disabled) {
            return;
        }
        onClose();
    }

    return createPortal(
        <>
            <div
                className={styles.backdrop}
                data-motion={motion}
                aria-hidden="true"
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal={true}
                tabIndex={-1}
                className={composeClassName(toneStyles.toneScope, styles.panel)}
                style={panelStyle}
                data-mode={EDrawerMode.Overlay}
                data-edge={edge}
                data-motion={motion}
                data-status={status}
                data-enabled={resolvedEnabled}
                {...(label !== undefined ? { 'aria-label': label } : {})}
                {...(labelledBy !== undefined
                    ? { 'aria-labelledby': labelledBy }
                    : {})}
            >
                <div className={styles.header}>
                    {renderHeading(
                        headingLevel,
                        headerId,
                        <span className={styles.title}>{title}</span>,
                    )}
                    <button
                        type="button"
                        className={styles.close}
                        disabled={disabled}
                        data-enabled={resolvedEnabled}
                        aria-label={closeLabel}
                        onClick={handleClose}
                    >
                        <span className={styles.closeGlyph} aria-hidden="true" />
                    </button>
                </div>
                <div id={bodyId} className={styles.body}>
                    {children}
                </div>
                {resizable ? (
                    <DrawerResizeHandle
                        edge={edge}
                        controlsId={bodyId}
                        handleId={handleId}
                        model={model}
                        disabled={disabled}
                        label={resizeLabel}
                        onSizeChange={props.onSizeChange}
                    />
                ) : null}
            </div>
        </>,
        overlayRoot,
    );
}

// Inline (docked, non-modal) drawer. The direct Helicon SidePanel / BottomPanel
// analog: a header strip, an optional collapse chevron, an optional resize edge,
// the body shown only when expanded.
function InlineDrawer(props: DrawerInlineProps): ReactElement {
    const {
        title,
        children,
        edge = EDrawerEdge.InlineStart,
        headingLevel = 2,
        status = EUiStatus.None,
        enabled,
        tone,
        label,
        labelledBy,
        collapsible = false,
        collapsed = false,
        onCollapsedChange,
        toggleLabel = DEFAULT_TOGGLE_LABEL,
        landmark = true,
        resizable = false,
        resizeLabel = DEFAULT_RESIZE_LABEL,
    }: DrawerInlineProps = props;

    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const disabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const baseId: string = useId();
    const headerId: string = `${baseId}-header`;
    const bodyId: string = `${baseId}-body`;
    const handleId: string = `${baseId}-handle`;
    const model: ResizeModel = resolveResizeModel(edge, props);
    const revealState: ERevealState = collapsed
        ? ERevealState.Collapsed
        : ERevealState.Expanded;
    const panelStyle: CSSProperties = {
        ...toneProperties(tone),
        ...sizeStyle(edge, model.size),
    };

    function handleToggle(): void {
        if (disabled) {
            return;
        }
        onCollapsedChange?.(!collapsed);
    }

    const chevron: ReactElement | null = collapsible ? (
        <button
            type="button"
            className={styles.chevron}
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            aria-label={toggleLabel}
            disabled={disabled}
            data-enabled={resolvedEnabled}
            onClick={handleToggle}
        >
            <span className={styles.markerGlyph} aria-hidden="true" />
        </button>
    ) : null;

    const headingContent: ReactNode = (
        <>
            {chevron}
            <span className={styles.title}>{title}</span>
        </>
    );

    // The grip toggles collapse on Enter (APG-optional) only when the panel is
    // collapsible, so the convenience never appears on a non-collapsible drawer.
    const toggleForHandle: (() => void) | undefined = collapsible
        ? handleToggle
        : undefined;

    const inner: ReactNode = (
        <>
            <div className={styles.header}>
                {renderHeading(headingLevel, headerId, headingContent)}
            </div>
            <div className={styles.bodyReveal} data-state={revealState}>
                <div className={styles.bodyClip}>
                    <div
                        id={bodyId}
                        className={styles.body}
                        inert={collapsed ? true : undefined}
                    >
                        {children}
                    </div>
                </div>
            </div>
            {resizable && !collapsed ? (
                <DrawerResizeHandle
                    edge={edge}
                    controlsId={bodyId}
                    handleId={handleId}
                    model={model}
                    disabled={disabled}
                    label={resizeLabel}
                    onSizeChange={props.onSizeChange}
                    onToggleCollapse={toggleForHandle}
                />
            ) : null}
        </>
    );

    const className: string = composeClassName(toneStyles.toneScope, styles.panel);

    if (landmark) {
        return (
            <aside
                className={className}
                style={panelStyle}
                data-mode={EDrawerMode.Inline}
                data-edge={edge}
                data-status={status}
                data-state={revealState}
                data-enabled={resolvedEnabled}
                {...(label !== undefined ? { 'aria-label': label } : {})}
                {...(labelledBy !== undefined
                    ? { 'aria-labelledby': labelledBy }
                    : {})}
            >
                {inner}
            </aside>
        );
    }

    return (
        <section
            className={className}
            style={panelStyle}
            data-mode={EDrawerMode.Inline}
            data-edge={edge}
            data-status={status}
            data-state={revealState}
            data-enabled={resolvedEnabled}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
        >
            {inner}
        </section>
    );
}

// Drawer - the single edge-docked panel. The mode discriminant selects the
// overlay (modal sheet) or inline (in-flow docked) realization; the switch has no
// default branch, so a new mode is a compile error.
export function Drawer(props: DrawerProps): ReactElement | null {
    switch (props.mode) {
        case EDrawerMode.Overlay:
            return <OverlayDrawer {...props} />;
        case EDrawerMode.Inline:
            return <InlineDrawer {...props} />;
    }
}
