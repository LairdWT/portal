import {
    type CSSProperties,
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
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
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './SplitPane.module.css';
import { ESplitOrientation, type SplitPaneProps } from './SplitPane.types';

// The inline grid-track custom properties the module reads. String-typed (not a
// string literal) so the computed keys satisfy CSSProperties, matching the
// --portal-tone pattern in tone.ts.
const PRIMARY_TRACK_VAR: string = '--portal-split-primary';
const SECONDARY_TRACK_VAR: string = '--portal-split-secondary';

// The PageUp/PageDown multiplier over the base keyboard step.
const PAGE_STEP_MULTIPLIER: number = 10;

// Clamp a fraction into the inclusive [min, max] bounds. Pure; covered through
// the component interaction in the tests (kept non-exported so SplitPane.tsx
// exports only the component for react-refresh purity).
function clampFraction(value: number, min: number, max: number): number {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

export function SplitPane({
    orientation = ESplitOrientation.Horizontal,
    fraction,
    onFractionChange,
    minFraction = 0.1,
    maxFraction = 0.9,
    minPrimarySize,
    minSecondarySize,
    keyboardStep = 0.02,
    primary,
    secondary,
    enabled,
    status = EUiStatus.None,
    label,
    labelledBy,
    tone,
}: SplitPaneProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const isHorizontal: boolean = orientation === ESplitOrientation.Horizontal;

    // The displayed fraction is the controlled prop clamped for render, ARIA, and
    // the track sizing. The prop is never written back: the control only EMITS
    // clamped values (no self-correcting effect), matching NumberStepper.
    const displayedFraction: number = clampFraction(
        fraction,
        minFraction,
        maxFraction,
    );

    // A handle to the frame so the pointer-drag callback can measure the
    // CONTAINER rect (usePointerDrag's bounds is the GRIP rect, the wrong basis
    // for a container-relative fraction). Read inside handleDrag, a callback
    // passed to the hook - not a JSX inline-arrow event prop.
    const frameRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);

    const [dragging, setDragging]: [boolean, (next: boolean) => void] =
        useState<boolean>(false);

    const baseId: string = useId();
    const primaryId: string = `${baseId}-primary`;
    const secondaryId: string = `${baseId}-secondary`;

    const className: string = [toneStyles.toneScope, styles.frame]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    // Single commit funnel: clamps, drops a no-op (Helicon reports changed=false
    // on a frame that does not move), and stays silent when disabled.
    function commit(next: number): void {
        if (isDisabled) {
            return;
        }
        const clamped: number = clampFraction(next, minFraction, maxFraction);
        if (clamped === displayedFraction) {
            return;
        }
        onFractionChange(clamped);
    }

    // Pointer-drag resize. Derives the fraction from the live pointer position
    // and the CONTAINER rect (Helicon's (pointer - left) / width), then commits.
    function handleDrag(state: PointerDragState): void {
        const frame: HTMLDivElement | null = frameRef.current;
        if (frame === null) {
            return;
        }
        const rect: DOMRect = frame.getBoundingClientRect();
        const span: number = isHorizontal ? rect.width : rect.height;
        if (span <= 0) {
            return;
        }
        const offset: number = isHorizontal
            ? state.x - rect.left
            : state.y - rect.top;
        commit(offset / span);
    }

    const dragBinding: PointerDragBinding<HTMLDivElement> =
        usePointerDrag<HTMLDivElement>({
            onDrag: handleDrag,
            onDragStart: (): void => {
                setDragging(true);
            },
            onDragEnd: (): void => {
                setDragging(false);
            },
            disabled: isDisabled,
            axisLock: isHorizontal ? 'x' : 'y',
        });

    // Main-axis arrows step the divider; Home/End jump to the bounds;
    // PageUp/PageDown use the 10x step. The cross-axis arrows fall through to the
    // default and are ignored. Negative-first: disabled returns before any work.
    function handleSeparatorKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        if (isDisabled) {
            return;
        }
        const decreaseKey: string = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
        const increaseKey: string = isHorizontal ? 'ArrowRight' : 'ArrowDown';
        const pageStep: number = keyboardStep * PAGE_STEP_MULTIPLIER;

        if (event.key === decreaseKey) {
            event.preventDefault();
            commit(displayedFraction - keyboardStep);
            return;
        }
        if (event.key === increaseKey) {
            event.preventDefault();
            commit(displayedFraction + keyboardStep);
            return;
        }
        switch (event.key) {
            case 'Home':
                event.preventDefault();
                commit(minFraction);
                return;
            case 'End':
                event.preventDefault();
                commit(maxFraction);
                return;
            case 'PageUp':
                event.preventDefault();
                commit(displayedFraction + pageStep);
                return;
            case 'PageDown':
                event.preventDefault();
                commit(displayedFraction - pageStep);
                return;
            default:
                return;
        }
    }

    // The fraction-derived grid tracks, intersected with the optional absolute
    // per-pane minimums through minmax(). JS-computed inline (the module CSS stays
    // token-only and free of authored px), mirroring how List's windowing sizes
    // live in inline styles.
    const minPrimary: string = minPrimarySize ?? '0';
    const minSecondary: string = minSecondarySize ?? '0';
    const frameStyle: CSSProperties = {
        ...toneProperties(tone),
        [PRIMARY_TRACK_VAR]: `minmax(${minPrimary}, ${String(displayedFraction)}fr)`,
        [SECONDARY_TRACK_VAR]: `minmax(${minSecondary}, ${String(
            1 - displayedFraction,
        )}fr)`,
    };

    // The separator's operable handlers are applied as a single spread binding.
    // role="separator" is the APG Window Splitter's focusable, operable widget,
    // but aria-query 5.3.0 models separator as structure-only (non-interactive),
    // so jsx-a11y would flag literal handler attributes on it. Applying them via
    // the same spreadable-binding pattern usePointerDrag already uses keeps the
    // canonical role and full keyboard without an eslint-disable.
    const separatorHandlers: PointerDragBinding<HTMLDivElement> & {
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
    } = { ...dragBinding, onKeyDown: handleSeparatorKeyDown };

    const valueNow: number = Math.round(displayedFraction * 100);
    const valueMin: number = Math.round(minFraction * 100);
    const valueMax: number = Math.round(maxFraction * 100);

    return (
        <div
            ref={frameRef}
            role="group"
            className={className}
            style={frameStyle}
            data-orientation={orientation}
            data-status={status}
            data-enabled={resolvedEnabled}
        >
            <div id={primaryId} className={styles.pane}>
                {primary}
            </div>
            <div
                role="separator"
                aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
                aria-controls={primaryId}
                aria-valuenow={valueNow}
                aria-valuemin={valueMin}
                aria-valuemax={valueMax}
                className={styles.divider}
                data-active={dragging}
                tabIndex={isDisabled ? undefined : 0}
                {...(label !== undefined ? { 'aria-label': label } : {})}
                {...(labelledBy !== undefined
                    ? { 'aria-labelledby': labelledBy }
                    : {})}
                {...(isDisabled ? { 'aria-disabled': true } : {})}
                {...separatorHandlers}
            >
                <span className={styles.handle} aria-hidden="true" />
            </div>
            <div id={secondaryId} className={styles.pane}>
                {secondary}
            </div>
        </div>
    );
}
