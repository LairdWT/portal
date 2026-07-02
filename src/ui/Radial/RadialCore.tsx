import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type RefObject,
    type SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useDismiss } from '../../react/hooks/useDismiss';
import { useFocusTrap } from '../../react/hooks/useFocusTrap';
import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { EOverlayMotion } from '../overlayMotion';
import { ensureOverlayRoot } from '../overlayRoot';
import { toneProperties } from '../tone';
import {
    ERadialAction as ACTION,
    type ERadialAction,
    type RadialCoreProps,
    type RadialItem,
} from './Radial.types';
import styles from './RadialCore.module.css';
import {
    type RadialHubCell,
    type RadialHubGeometry,
    radialHubGeometry,
    type RadialSides,
    type RadialWedge,
    radialWedges,
    resolveRadialSides,
} from './radialGeometry';

// Human-readable accessible name for each hub action, announced to assistive
// tech through aria-label (the glyphs are decorative and aria-hidden).
const ACTION_LABELS: Readonly<Record<ERadialAction, string>> = {
    [ACTION.Confirm]: 'Confirm',
    [ACTION.Cancel]: 'Cancel',
    [ACTION.Previous]: 'Previous',
    [ACTION.Next]: 'Next',
};

// The local class that composes the correct drawn symbol (and its color /
// rotation) for each hub action. Confirm reads as a bold success-green ring,
// cancel as a bold danger-red cross, next/previous as accent triangles, so
// the recognisable status colors reinforce the symbol.
const ACTION_GLYPH_CLASS: Readonly<Record<ERadialAction, string | undefined>> = {
    [ACTION.Confirm]: styles.glyphConfirm,
    [ACTION.Cancel]: styles.glyphCancel,
    [ACTION.Previous]: styles.glyphPrevious,
    [ACTION.Next]: styles.glyphNext,
};

// The hub button area caps at four actions (the 2x2 grid). Slice defensively
// so an over-long centerActions array can never spill past the grid.
const MAX_CENTER_ACTIONS: number = 4;

// Open/close lifecycle as a state enum. Open and Closing are the two
// presented states (mirrored onto data-state so the CSS plays the staggered
// outward emergence or the inward collapse); Closed is the unmounted rest
// state the collapse settles into.
const ERadialPhase: {
    readonly Closed: 'closed';
    readonly Closing: 'closing';
    readonly Open: 'open';
} = {
    Closed: 'closed',
    Closing: 'closing',
    Open: 'open',
};
type ERadialPhase = (typeof ERadialPhase)[keyof typeof ERadialPhase];

// The presented open/close state for a given render: the prop wins (so the
// frame on which `open` flips already presents correctly), the lifecycle
// phase distinguishes an animating close from the settled rest state (which
// only the collapsible form ever renders - the overlay form unmounts).
function presentedState(open: boolean, phase: ERadialPhase): ERadialPhase {
    if (open) {
        return ERadialPhase.Open;
    }
    if (phase === ERadialPhase.Closing) {
        return ERadialPhase.Closing;
    }
    return ERadialPhase.Closed;
}

// The exit keyframe name (CSS modules scope it with a suffix, so the
// animationend handler matches by inclusion). Ending this animation - or the
// fallback timer, whichever comes first - unmounts the surface.
const EXIT_ANIMATION_NAME: string = 'portal-radial-section-out';

// Unmount fallback while closing, covering the exit duration (ui-base) plus
// generous headroom for a throttled frame; also the unmount path when a
// 0-section radial closes (no wedge, so no animationend arrives).
const EXIT_FALLBACK_MS: number = 600;

// Per-wedge custom properties driving the CSS geometry: the wedge clip
// silhouette, the rim-inset face, the label anchor / transform origin, the
// entrance-motion start offset, and the stagger index. String-typed (not
// string literals) so the computed keys satisfy the CSSProperties index
// signature, the same pattern tone.ts and Slider use for --portal-* inline
// custom properties.
const CLIP_PROPERTY: string = '--radial-clip';
const FACE_CLIP_PROPERTY: string = '--radial-face-clip';
const ANCHOR_X_PROPERTY: string = '--radial-anchor-x';
const ANCHOR_Y_PROPERTY: string = '--radial-anchor-y';
const ENTER_X_PROPERTY: string = '--radial-enter-x';
const ENTER_Y_PROPERTY: string = '--radial-enter-y';
const INDEX_PROPERTY: string = '--radial-index';
const HUB_CLIP_PROPERTY: string = '--radial-hub-clip';
const HUB_FRACTION_PROPERTY: string = '--radial-hub-fraction';
const CELL_CLIP_PROPERTY: string = '--radial-cell-clip';

export function RadialCore({
    open,
    onClose,
    onOpen,
    label,
    sides,
    items,
    centerActions,
    variant,
    collapsible,
    toggleIcon,
    toggleText,
    onActivateSection,
    onActivateAction,
    disabled,
    tone,
}: RadialCoreProps): ReactElement | null {
    const panelRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion: boolean = useReducedMotion();

    // Lifecycle phase: the surface stays mounted in Closing after `open`
    // flips false so the wedges can play the collapse animation; the
    // animationend handler (or the fallback timer) then settles it to
    // Closed. Under reduced motion the close is immediate - Closing exists
    // only to be animated.
    const [phase, setPhase]: [
        ERadialPhase,
        Dispatch<SetStateAction<ERadialPhase>>,
    ] = useState<ERadialPhase>(open ? ERadialPhase.Open : ERadialPhase.Closed);

    // The most recently activated target ('section:<id>' / 'action:<name>' -
    // prefixed so a section id can never collide with an action name). While
    // the surface is closing, the activated target plays the selection flash
    // instead of the plain collapse.
    const [activated, setActivated]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(null);

    // Follow the `open` prop through the render-phase derived-state pattern
    // ("adjusting state when a prop changes"), not an effect: the phase moves
    // to Closing on the very render where `open` flips false, so the surface
    // never unmounts for a frame before the collapse plays. Under reduced
    // motion the close settles immediately - Closing exists only to animate.
    // Every (re)open clears the previous selection so a later Escape-close
    // cannot replay a stale flash.
    if (open && phase !== ERadialPhase.Open) {
        setPhase(ERadialPhase.Open);
        setActivated(null);
    }
    if (!open && phase === ERadialPhase.Open) {
        setPhase(prefersReducedMotion ? ERadialPhase.Closed : ERadialPhase.Closing);
    }

    // While closing, settle to Closed when the wedges' exit animation ends.
    // A NATIVE animationend listener on the panel (the wedges' events
    // bubble to it), not the synthetic onAnimationEnd: the panel lives in a
    // portal and the native listener works identically in the browser and in
    // jsdom. The timer is the backstop - a throttled frame, and the
    // no-wedge (empty items) close, where no animationend ever arrives.
    useEffect((): (() => void) | undefined => {
        if (phase !== ERadialPhase.Closing) {
            return undefined;
        }
        const timer: number = window.setTimeout((): void => {
            setPhase(ERadialPhase.Closed);
        }, EXIT_FALLBACK_MS);
        const panel: HTMLDivElement | null = panelRef.current;
        if (panel === null) {
            return (): void => {
                window.clearTimeout(timer);
            };
        }
        const handleAnimationEnd: (event: AnimationEvent) => void = (
            event: AnimationEvent,
        ): void => {
            // CSS modules scope the keyframe name, so match by inclusion.
            if (!event.animationName.includes(EXIT_ANIMATION_NAME)) {
                return;
            }
            setPhase(ERadialPhase.Closed);
        };
        panel.addEventListener('animationend', handleAnimationEnd);
        return (): void => {
            window.clearTimeout(timer);
            panel.removeEventListener('animationend', handleAnimationEnd);
        };
    }, [phase]);

    // Shared overlay mount point, acquired once through a lazy initializer - the
    // same idempotent pattern Popover and Dialog use. Null under SSR.
    const [overlayRoot]: [
        HTMLElement | null,
        Dispatch<SetStateAction<HTMLElement | null>>,
    ] = useState<HTMLElement | null>((): HTMLElement | null => ensureOverlayRoot());

    // Overlay radial: trap focus inside the ring while open and restore it on
    // close (the collapsible form is a non-modal inline disclosure, so it
    // never traps); either form dismisses on Escape or an outside
    // pointerdown. Both hooks are no-ops while closed (gated on `open`), so
    // focus is restored the moment closing starts, not when the collapse
    // finishes.
    useFocusTrap({
        active: open && !collapsible,
        containerRef: panelRef,
        restoreFocus: true,
    });
    useDismiss({ enabled: open, onDismiss: onClose, refs: [panelRef] });

    const handleSectionClick: (item: RadialItem, index: number) => void =
        useCallback(
            (item: RadialItem, index: number): void => {
                if (disabled || item.disabled === true) {
                    return;
                }
                setActivated(`section:${item.id}`);
                onActivateSection(item, index);
            },
            [disabled, onActivateSection],
        );

    const handleActionClick: (action: ERadialAction) => void = useCallback(
        (action: ERadialAction): void => {
            if (disabled) {
                return;
            }
            setActivated(`action:${action}`);
            onActivateAction(action);
        },
        [disabled, onActivateAction],
    );

    // The collapsible hub toggle: expand when collapsed, collapse when open.
    const handleToggleClick: () => void = useCallback((): void => {
        if (disabled) {
            return;
        }
        if (open) {
            onClose();
            return;
        }
        onOpen?.();
    }, [disabled, open, onClose, onOpen]);

    // The overlay form unmounts entirely once closed; the collapsible form
    // always renders (its persistent hub IS the collapsed state).
    if (!collapsible && !open && phase === ERadialPhase.Closed) {
        return null;
    }

    const motion: EOverlayMotion = prefersReducedMotion
        ? EOverlayMotion.Reduced
        : EOverlayMotion.Full;
    const state: ERadialPhase = presentedState(open, phase);
    // Normalize once at the render choke point: every consumer below (wedge
    // geometry, item cap, hub geometry, the data-sides CSS hook) sees only a
    // supported side count, so an out-of-range runtime value can never
    // produce NaN clip polygons or an unmatched label-budget rule.
    const resolvedSides: RadialSides = resolveRadialSides(sides);
    const wedges: readonly RadialWedge[] = radialWedges(resolvedSides);
    // Wedges exist while open or animating closed; the collapsible rest state
    // renders none.
    const showWedges: boolean = open || phase === ERadialPhase.Closing;
    const visibleItems: readonly RadialItem[] = showWedges
        ? items.slice(0, resolvedSides)
        : [];
    // Dedupe (a repeated action would collide on key and read twice) before
    // capping to the 2x2 grid.
    const hubActions: readonly ERadialAction[] = Array.from(
        new Set(centerActions),
    ).slice(0, MAX_CENTER_ACTIONS);
    // The collapsible hub presents the full-face toggle whenever it is not
    // showing action cells: always while collapsed, and while open with no
    // actions configured (so the fan can still be closed in place).
    const hubToggle: boolean = collapsible && (!open || hubActions.length === 0);
    const hub: RadialHubGeometry = radialHubGeometry(
        resolvedSides,
        hubToggle ? 0 : hubActions.length,
    );
    const hubStyle: CSSProperties = {
        [HUB_CLIP_PROPERTY]: hub.clipPath,
    };
    // The hub fraction rides the PANEL so both the hub sizing and the
    // collapsible form's rest-state box (which collapses to exactly the hub
    // footprint) resolve it; custom properties inherit down to the hub.
    const panelStyle: CSSProperties = {
        ...toneProperties(tone),
        [HUB_FRACTION_PROPERTY]: hub.sizeFraction,
    };

    // The panel itself is shared by both forms: the overlay wraps it in the
    // backdrop + positioner and portals it; the collapsible form renders it
    // inline as a non-modal disclosure group.
    const panel: ReactElement = (
        <div
            ref={panelRef}
            role={collapsible ? 'group' : 'dialog'}
            aria-modal={collapsible ? undefined : true}
            aria-label={label}
            tabIndex={collapsible ? undefined : -1}
            className={styles.panel}
            style={panelStyle}
            data-variant={variant}
            data-sides={resolvedSides}
            data-motion={motion}
            data-state={state}
            data-overlay={collapsible ? 'false' : 'true'}
            data-hub={collapsible ? 'persistent' : 'overlay'}
        >
            {visibleItems.map(
                (item: RadialItem, index: number): ReactElement | null => {
                    const wedge: RadialWedge | undefined = wedges[index];
                    if (wedge === undefined) {
                        // Unreachable: visibleItems is capped to
                        // `sides` and radialWedges returns one wedge
                        // per side. Guarded so a geometry regression
                        // can never render an unclipped panel-sized
                        // button.
                        return null;
                    }
                    const wedgeStyle: CSSProperties = {
                        [CLIP_PROPERTY]: wedge.clipPath,
                        [FACE_CLIP_PROPERTY]: wedge.faceClipPath,
                        [ANCHOR_X_PROPERTY]: wedge.anchorX,
                        [ANCHOR_Y_PROPERTY]: wedge.anchorY,
                        [ENTER_X_PROPERTY]: wedge.enterX,
                        [ENTER_Y_PROPERTY]: wedge.enterY,
                        [INDEX_PROPERTY]: index,
                    };
                    // Icon-only sections carry their name through
                    // aria-label alone; the label span is omitted so
                    // the wedge reads as a pure glyph key. Falls back
                    // to the text label when no icon is supplied.
                    const iconOnly: boolean =
                        item.iconOnly === true && item.icon !== undefined;
                    const iconNode: ReactNode =
                        item.icon !== undefined ? (
                            <span className={styles.sectionIcon} aria-hidden="true">
                                {item.icon}
                            </span>
                        ) : null;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={styles.section}
                            style={wedgeStyle}
                            aria-label={item.label}
                            disabled={disabled || item.disabled === true}
                            data-segment={item.id}
                            data-activated={
                                activated === `section:${item.id}`
                                    ? 'true'
                                    : undefined
                            }
                            onClick={(): void => {
                                handleSectionClick(item, index);
                            }}
                        >
                            <span
                                className={styles.sectionBody}
                                data-display={iconOnly ? 'icon' : 'label'}
                            >
                                {iconNode}
                                {iconOnly ? null : (
                                    <span className={styles.sectionLabel}>
                                        {item.label}
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                },
            )}
            <div
                className={styles.hub}
                style={hubStyle}
                data-count={hubToggle ? 0 : hubActions.length}
            >
                {hubToggle ? (
                    // The collapsible open/close toggle: the whole hub face
                    // is the button. Its mark is the themed plus by default;
                    // a consumer-supplied icon and/or short text label
                    // replaces it (the button is still named by aria-label).
                    <button
                        type="button"
                        className={styles.hubButton}
                        style={{
                            [CELL_CLIP_PROPERTY]: hub.cells[0]?.clipPath ?? 'none',
                            [ANCHOR_X_PROPERTY]: hub.cells[0]?.anchorX ?? '50%',
                            [ANCHOR_Y_PROPERTY]: hub.cells[0]?.anchorY ?? '50%',
                        }}
                        aria-expanded={open}
                        aria-label={label}
                        disabled={disabled}
                        onClick={handleToggleClick}
                    >
                        <span className={styles.hubGlyphAnchor} aria-hidden="true">
                            {toggleIcon === undefined &&
                            toggleText === undefined ? (
                                <span
                                    className={styles.hubToggleGlyph}
                                    data-expanded={open ? 'true' : 'false'}
                                />
                            ) : (
                                <span className={styles.hubToggleBody}>
                                    {toggleIcon !== undefined ? (
                                        <span className={styles.hubToggleIcon}>
                                            {toggleIcon}
                                        </span>
                                    ) : null}
                                    {toggleText !== undefined ? (
                                        <span className={styles.hubToggleText}>
                                            {toggleText}
                                        </span>
                                    ) : null}
                                </span>
                            )}
                        </span>
                    </button>
                ) : null}
                {!hubToggle && hubActions.length === 0 ? (
                    // The 0-action hub is a non-interactive center panel: the
                    // themed face with no button semantics.
                    <div
                        className={styles.hubPanel}
                        style={{
                            [CELL_CLIP_PROPERTY]: hub.cells[0]?.clipPath ?? 'none',
                        }}
                        aria-hidden="true"
                    />
                ) : null}
                {!hubToggle && hubActions.length > 0
                    ? hubActions.map(
                          (
                              action: ERadialAction,
                              index: number,
                          ): ReactElement | null => {
                              const cell: RadialHubCell | undefined =
                                  hub.cells[index];
                              if (cell === undefined) {
                                  // Unreachable: the hub geometry returns
                                  // one cell per requested action.
                                  return null;
                              }
                              const cellStyle: CSSProperties = {
                                  [CELL_CLIP_PROPERTY]: cell.clipPath,
                                  [ANCHOR_X_PROPERTY]: cell.anchorX,
                                  [ANCHOR_Y_PROPERTY]: cell.anchorY,
                              };
                              return (
                                  <button
                                      key={action}
                                      type="button"
                                      className={styles.hubButton}
                                      style={cellStyle}
                                      aria-label={ACTION_LABELS[action]}
                                      data-action={action}
                                      data-activated={
                                          activated === `action:${action}`
                                              ? 'true'
                                              : undefined
                                      }
                                      disabled={disabled}
                                      onClick={(): void => {
                                          handleActionClick(action);
                                      }}
                                  >
                                      <span
                                          className={styles.hubGlyphAnchor}
                                          aria-hidden="true"
                                      >
                                          <span
                                              className={ACTION_GLYPH_CLASS[action]}
                                          />
                                      </span>
                                  </button>
                              );
                          },
                      )
                    : null}
            </div>
        </div>
    );

    if (collapsible) {
        return panel;
    }
    if (overlayRoot === null) {
        return null;
    }
    return createPortal(
        <>
            <div
                className={styles.backdrop}
                data-motion={motion}
                data-state={state}
                aria-hidden="true"
            />
            <div className={styles.positioner}>{panel}</div>
        </>,
        overlayRoot,
    );
}
