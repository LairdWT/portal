import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type RefObject,
    type SetStateAction,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useDismiss } from '../../react/hooks/useDismiss';
import { useFocusTrap } from '../../react/hooks/useFocusTrap';
import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Popover.module.css';
import {
    EPopoverPlacement,
    EPopoverRole,
    type PopoverProps,
} from './Popover.types';

// A minimal rectangle (a subset of DOMRect) the positioning math consumes.
export type PopoverRect = Readonly<{
    top: number;
    left: number;
    width: number;
    height: number;
}>;

export type PopoverViewport = Readonly<{
    width: number;
    height: number;
}>;

// The resolved fixed-position coordinates plus the side actually used after any
// flip, so the caller can mirror it onto data-placement.
export type PopoverCoords = Readonly<{
    top: number;
    left: number;
    placement: EPopoverPlacement;
}>;

export type ResolvePopoverPositionInput = Readonly<{
    anchor: PopoverRect;
    panel: PopoverRect;
    viewport: PopoverViewport;
    placement: EPopoverPlacement;
    offset: number;
    padding: number;
}>;

const MOTION_FULL: string = 'full';
const MOTION_REDUCED: string = 'reduced';
const OVERLAY_ROOT_ATTRIBUTE: string = 'data-portal-overlay-root';

function clampValue(value: number, min: number, max: number): number {
    if (max < min) {
        return min;
    }
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

// Pure positioning: place the panel on the preferred side of the anchor, flip to
// the opposite side when the preferred side cannot fit but the opposite can, then
// shift along the cross axis to stay within the padded viewport. Coordinates are
// viewport-relative (the panel is position: fixed), so no scroll offset is added.
export function resolvePopoverPosition(
    input: ResolvePopoverPositionInput,
): PopoverCoords {
    const {
        anchor,
        panel,
        viewport,
        placement,
        offset,
        padding,
    }: ResolvePopoverPositionInput = input;
    const anchorBottom: number = anchor.top + anchor.height;
    const anchorRight: number = anchor.left + anchor.width;

    if (
        placement === EPopoverPlacement.Left ||
        placement === EPopoverPlacement.Right
    ) {
        const spaceRight: number = viewport.width - anchorRight - offset;
        const spaceLeft: number = anchor.left - offset;
        let resolved: EPopoverPlacement = placement;
        if (
            placement === EPopoverPlacement.Right &&
            panel.width > spaceRight &&
            panel.width <= spaceLeft
        ) {
            resolved = EPopoverPlacement.Left;
        } else if (
            placement === EPopoverPlacement.Left &&
            panel.width > spaceLeft &&
            panel.width <= spaceRight
        ) {
            resolved = EPopoverPlacement.Right;
        }
        const left: number =
            resolved === EPopoverPlacement.Right
                ? anchorRight + offset
                : anchor.left - panel.width - offset;
        const top: number = clampValue(
            anchor.top,
            padding,
            viewport.height - panel.height - padding,
        );
        return { top, left, placement: resolved };
    }

    const spaceBelow: number = viewport.height - anchorBottom - offset;
    const spaceAbove: number = anchor.top - offset;
    let resolved: EPopoverPlacement = placement;
    if (
        placement === EPopoverPlacement.Bottom &&
        panel.height > spaceBelow &&
        panel.height <= spaceAbove
    ) {
        resolved = EPopoverPlacement.Top;
    } else if (
        placement === EPopoverPlacement.Top &&
        panel.height > spaceAbove &&
        panel.height <= spaceBelow
    ) {
        resolved = EPopoverPlacement.Bottom;
    }
    const top: number =
        resolved === EPopoverPlacement.Bottom
            ? anchorBottom + offset
            : anchor.top - panel.height - offset;
    const left: number = clampValue(
        anchor.left,
        padding,
        viewport.width - panel.width - padding,
    );
    return { top, left, placement: resolved };
}

function toRect(rect: DOMRect): PopoverRect {
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
    };
}

// Find or lazily create the single overlay root appended to <body>. All popovers
// portal into the same element; it is a bare mount point (panels are positioned
// fixed and carry the z-index token), so it adds no layout or stacking of its
// own. Returns null with no DOM (SSR), so the panel simply does not render.
function ensureOverlayRoot(): HTMLElement | null {
    if (typeof document === 'undefined') {
        return null;
    }
    const existing: Element | null = document.querySelector(
        `[${OVERLAY_ROOT_ATTRIBUTE}]`,
    );
    if (existing instanceof HTMLElement) {
        return existing;
    }
    const root: HTMLElement = document.createElement('div');
    root.setAttribute(OVERLAY_ROOT_ATTRIBUTE, '');
    document.body.appendChild(root);
    return root;
}

export function Popover({
    open,
    onClose,
    anchorRef,
    trigger,
    children,
    placement = EPopoverPlacement.Bottom,
    role = EPopoverRole.Dialog,
    label,
    labelledBy,
    offset = 8,
    viewportPadding = 8,
    trapFocus = false,
    restoreFocus = true,
    initialFocusRef,
    tone,
}: PopoverProps): ReactElement {
    const panelRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const internalTriggerRef: RefObject<HTMLElement | null> =
        useRef<HTMLElement | null>(null);
    const previousFocusRef: RefObject<HTMLElement | null> =
        useRef<HTMLElement | null>(null);
    const wasOpenRef: RefObject<boolean> = useRef<boolean>(false);
    const prefersReducedMotion: boolean = useReducedMotion();

    const [coords, setCoords]: [
        PopoverCoords | null,
        Dispatch<SetStateAction<PopoverCoords | null>>,
    ] = useState<PopoverCoords | null>(null);

    // Resolve the active anchor: an explicit external ref wins, otherwise the
    // trigger the Popover rendered. Stable across renders unless anchorRef
    // identity changes, so it is a safe effect dependency.
    const readAnchor: () => HTMLElement | null =
        useCallback((): HTMLElement | null => {
            const external: HTMLElement | null = anchorRef?.current ?? null;
            return external ?? internalTriggerRef.current;
        }, [anchorRef]);

    const handleRequestClose: () => void = useCallback((): void => {
        onClose?.();
    }, [onClose]);

    // Stable callback ref for the inline trigger wrapper. It is used only as a
    // JSX ref attribute and writes the ref at commit (inside the callback), never
    // during render, so it integrates with the dismiss inside-check and focus
    // restoration without handing a ref to a consumer-rendered function.
    const setTriggerNode: (node: HTMLElement | null) => void = useCallback(
        (node: HTMLElement | null): void => {
            internalTriggerRef.current = node;
        },
        [],
    );

    // Outside-click + Escape dismissal, active only while open. The anchor and
    // panel are the inside refs, so toggling via the trigger or interacting in
    // the panel never self-dismisses.
    useDismiss({
        enabled: open,
        onDismiss: handleRequestClose,
        refs: [panelRef, anchorRef ?? internalTriggerRef],
    });

    // Modal focus trap, engaged only in modal mode. It captures the pre-trap
    // focus and restores it on release, so in modal mode it owns restoration; the
    // non-modal restore effect below stands down. Non-modal overlays (tooltips,
    // menus) leave it inactive.
    useFocusTrap({
        active: open && trapFocus,
        containerRef: panelRef,
        ...(initialFocusRef !== undefined ? { initialFocusRef } : {}),
        restoreFocus,
    });

    // Position the panel and keep it in view. Recomputes on scroll (capture, to
    // catch any scroll container), on window resize, and on element resize via
    // ResizeObserver where available. Every listener and the observer are removed
    // on cleanup; the effect re-runs only when open or a geometry input changes.
    useLayoutEffect((): (() => void) | undefined => {
        if (!open) {
            return undefined;
        }
        const panel: HTMLDivElement | null = panelRef.current;
        const anchor: HTMLElement | null = readAnchor();
        if (panel === null || anchor === null) {
            return undefined;
        }

        function update(): void {
            const liveAnchor: HTMLElement | null = readAnchor();
            const livePanel: HTMLDivElement | null = panelRef.current;
            if (liveAnchor === null || livePanel === null) {
                return;
            }
            const next: PopoverCoords = resolvePopoverPosition({
                anchor: toRect(liveAnchor.getBoundingClientRect()),
                panel: toRect(livePanel.getBoundingClientRect()),
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
                placement,
                offset,
                padding: viewportPadding,
            });
            setCoords((prev: PopoverCoords | null): PopoverCoords | null => {
                if (
                    prev !== null &&
                    prev.top === next.top &&
                    prev.left === next.left &&
                    prev.placement === next.placement
                ) {
                    return prev;
                }
                return next;
            });
        }

        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        let observer: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver((): void => {
                update();
            });
            observer.observe(anchor);
            observer.observe(panel);
        }
        return (): void => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
            if (observer !== null) {
                observer.disconnect();
            }
        };
    }, [open, placement, offset, viewportPadding, readAnchor]);

    // Non-modal focus restoration. Capture the focused element when opening; on
    // close, return focus to it only when focus fell back to <body> - i.e. the
    // focused panel was removed - so an outside click that intentionally moved
    // focus elsewhere is left alone. In modal mode the focus trap owns this, so
    // this effect stands down.
    useEffect((): void => {
        const wasOpen: boolean = wasOpenRef.current;
        wasOpenRef.current = open;
        if (trapFocus) {
            return;
        }
        if (open && !wasOpen) {
            const active: Element | null = document.activeElement;
            previousFocusRef.current =
                active instanceof HTMLElement && active !== document.body
                    ? active
                    : readAnchor();
            return;
        }
        if (!open && wasOpen && restoreFocus) {
            const active: Element | null = document.activeElement;
            const focusLost: boolean = active === null || active === document.body;
            if (focusLost) {
                const target: HTMLElement | null =
                    previousFocusRef.current ?? readAnchor();
                target?.focus();
            }
        }
    }, [open, restoreFocus, trapFocus, readAnchor]);

    const panelClassName: string = [toneStyles.toneScope, styles.panel]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    const resolvedPlacement: EPopoverPlacement = coords?.placement ?? placement;
    const panelStyle: CSSProperties = {
        ...toneProperties(tone),
        ...(coords !== null
            ? {
                  top: `${String(coords.top)}px`,
                  left: `${String(coords.left)}px`,
                  visibility: 'visible',
              }
            : { visibility: 'hidden' }),
    };

    const overlayRoot: HTMLElement | null = ensureOverlayRoot();

    const triggerSlot: ReactNode =
        trigger !== undefined ? (
            <span ref={setTriggerNode} className={styles.anchor}>
                {trigger}
            </span>
        ) : null;

    const panel: ReactNode =
        open && overlayRoot !== null
            ? createPortal(
                  <div
                      ref={panelRef}
                      role={role}
                      className={panelClassName}
                      style={panelStyle}
                      data-status={EUiStatus.None}
                      data-placement={resolvedPlacement}
                      data-motion={
                          prefersReducedMotion ? MOTION_REDUCED : MOTION_FULL
                      }
                      tabIndex={-1}
                      {...(label !== undefined ? { 'aria-label': label } : {})}
                      {...(labelledBy !== undefined
                          ? { 'aria-labelledby': labelledBy }
                          : {})}
                  >
                      {children}
                  </div>,
                  overlayRoot,
              )
            : null;

    return (
        <>
            {triggerSlot}
            {panel}
        </>
    );
}
