import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type RefObject,
    type SetStateAction,
    useCallback,
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
import { radialSectionAngles } from './radialGeometry';

// Human-readable accessible name for each hub action, announced to assistive
// tech through aria-label (the glyphs are decorative and aria-hidden).
const ACTION_LABELS: Readonly<Record<ERadialAction, string>> = {
    [ACTION.Confirm]: 'Confirm',
    [ACTION.Cancel]: 'Cancel',
    [ACTION.Previous]: 'Previous',
    [ACTION.Next]: 'Next',
};

// The local class that composes the correct drawn symbol (and its color /
// rotation) for each hub action. Confirm reads success-green, cancel danger-red,
// next/previous accent, so the recognisable status colors reinforce the symbol.
const ACTION_GLYPH_CLASS: Readonly<Record<ERadialAction, string | undefined>> = {
    [ACTION.Confirm]: styles.glyphConfirm,
    [ACTION.Cancel]: styles.glyphCancel,
    [ACTION.Previous]: styles.glyphPrevious,
    [ACTION.Next]: styles.glyphNext,
};

// The hub grid caps at four actions (2x2). Slice defensively so an over-long
// centerActions array can never spill a third row.
const MAX_CENTER_ACTIONS: number = 4;

// Per-slot custom properties driving the CSS geometry. String-typed (not string
// literals) so the computed keys satisfy the CSSProperties index signature, the
// same pattern tone.ts and Slider use for --portal-* inline custom properties.
const ANGLE_PROPERTY: string = '--radial-angle';
const INDEX_PROPERTY: string = '--radial-index';

export function RadialCore({
    open,
    onClose,
    label,
    sides,
    items,
    centerActions,
    variant,
    onActivateSection,
    onActivateAction,
    disabled,
    tone,
}: RadialCoreProps): ReactElement | null {
    const panelRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion: boolean = useReducedMotion();

    // Shared overlay mount point, acquired once through a lazy initializer - the
    // same idempotent pattern Popover and Dialog use. Null under SSR.
    const [overlayRoot]: [
        HTMLElement | null,
        Dispatch<SetStateAction<HTMLElement | null>>,
    ] = useState<HTMLElement | null>((): HTMLElement | null => ensureOverlayRoot());

    // Modal radial: trap focus inside the ring while open and restore it on
    // close; dismiss on Escape or an outside pointerdown (the dimmed backdrop).
    // Both hooks are no-ops while closed (gated on `open`).
    useFocusTrap({ active: open, containerRef: panelRef, restoreFocus: true });
    useDismiss({ enabled: open, onDismiss: onClose, refs: [panelRef] });

    const handleSectionClick: (item: RadialItem, index: number) => void =
        useCallback(
            (item: RadialItem, index: number): void => {
                if (disabled || item.disabled === true) {
                    return;
                }
                onActivateSection(item, index);
            },
            [disabled, onActivateSection],
        );

    const handleActionClick: (action: ERadialAction) => void = useCallback(
        (action: ERadialAction): void => {
            if (disabled) {
                return;
            }
            onActivateAction(action);
        },
        [disabled, onActivateAction],
    );

    if (!open) {
        return null;
    }
    if (overlayRoot === null) {
        return null;
    }

    const motion: EOverlayMotion = prefersReducedMotion
        ? EOverlayMotion.Reduced
        : EOverlayMotion.Full;
    const angles: readonly number[] = radialSectionAngles(sides);
    const visibleItems: readonly RadialItem[] = items.slice(0, sides);
    const hubActions: readonly ERadialAction[] = centerActions.slice(
        0,
        MAX_CENTER_ACTIONS,
    );
    const panelStyle: CSSProperties = toneProperties(tone);

    return createPortal(
        <>
            <div
                className={styles.backdrop}
                data-motion={motion}
                aria-hidden="true"
            />
            <div className={styles.positioner}>
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-modal={true}
                    aria-label={label}
                    tabIndex={-1}
                    className={styles.panel}
                    style={panelStyle}
                    data-variant={variant}
                    data-sides={sides}
                    data-motion={motion}
                >
                    {visibleItems.map(
                        (item: RadialItem, index: number): ReactElement => {
                            const slotStyle: CSSProperties = {
                                [ANGLE_PROPERTY]: `${String(angles[index] ?? 0)}deg`,
                                [INDEX_PROPERTY]: index,
                            };
                            const iconNode: ReactNode =
                                item.icon !== undefined ? (
                                    <span
                                        className={styles.sectionIcon}
                                        aria-hidden="true"
                                    >
                                        {item.icon}
                                    </span>
                                ) : null;
                            return (
                                <div
                                    key={item.id}
                                    className={styles.slot}
                                    style={slotStyle}
                                >
                                    <button
                                        type="button"
                                        className={styles.section}
                                        aria-label={item.label}
                                        disabled={
                                            disabled || item.disabled === true
                                        }
                                        data-segment={item.id}
                                        onClick={(): void => {
                                            handleSectionClick(item, index);
                                        }}
                                    >
                                        {iconNode}
                                        <span className={styles.sectionLabel}>
                                            {item.label}
                                        </span>
                                    </button>
                                </div>
                            );
                        },
                    )}
                    <div className={styles.hub} data-count={hubActions.length}>
                        {hubActions.map(
                            (action: ERadialAction): ReactElement => (
                                <button
                                    key={action}
                                    type="button"
                                    className={styles.hubButton}
                                    aria-label={ACTION_LABELS[action]}
                                    data-action={action}
                                    disabled={disabled}
                                    onClick={(): void => {
                                        handleActionClick(action);
                                    }}
                                >
                                    <span
                                        className={ACTION_GLYPH_CLASS[action]}
                                        aria-hidden="true"
                                    />
                                </button>
                            ),
                        )}
                    </div>
                </div>
            </div>
        </>,
        overlayRoot,
    );
}
