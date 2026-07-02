import {
    type CSSProperties,
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    useId,
    useRef,
} from 'react';

import {
    type PointerDragBinding,
    type PointerDragState,
    usePointerDrag,
} from '../../react/hooks/usePointerDrag';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './RangeSlider.module.css';
import {
    ERangeThumb,
    type RangeSliderProps,
    type RangeSliderValue,
} from './RangeSlider.types';

const DEFAULT_MIN: number = 0;
const DEFAULT_MAX: number = 100;
const DEFAULT_STEP: number = 1;
const PAGE_STEP_MULTIPLIER: number = 10;
const LOWER_FRACTION_PROPERTY: string = '--range-lower';
const UPPER_FRACTION_PROPERTY: string = '--range-upper';

// Snap a raw value onto the step lattice anchored at min, clamped to the
// bounds. The result is rounded to the step's decimal precision so float
// artifacts (0.30000000000000004) never reach the consumer.
function quantize(raw: number, min: number, max: number, step: number): number {
    const stepsFromMin: number = Math.round((raw - min) / step);
    const snapped: number = min + stepsFromMin * step;
    const decimals: number = (String(step).split('.')[1] ?? '').length;
    const rounded: number = Number(snapped.toFixed(decimals));
    return Math.min(max, Math.max(min, rounded));
}

export function RangeSlider({
    label,
    value,
    onValueChange,
    min,
    max,
    step,
    lowerLabel,
    upperLabel,
    formatValue,
    enabled,
    tone,
}: RangeSliderProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const resolvedMin: number = min ?? DEFAULT_MIN;
    const resolvedMax: number = Math.max(max ?? DEFAULT_MAX, resolvedMin);
    const resolvedStep: number =
        step !== undefined && step > 0 ? step : DEFAULT_STEP;
    const span: number = resolvedMax - resolvedMin;

    const labelId: string = useId();
    const trackRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const lowerThumbRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const upperThumbRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const activeThumbRef: RefObject<ERangeThumb> = useRef<ERangeThumb>(
        ERangeThumb.Lower,
    );

    // Defensive render clamp: a consumer-supplied pair outside the bounds (or
    // crossed) renders sane and is re-clamped on the first edit.
    const lower: number = Math.min(Math.max(value.lower, resolvedMin), resolvedMax);
    const upper: number = Math.min(
        Math.max(Math.max(value.upper, lower), resolvedMin),
        resolvedMax,
    );
    const lowerFraction: number = span === 0 ? 0 : (lower - resolvedMin) / span;
    const upperFraction: number = span === 0 ? 0 : (upper - resolvedMin) / span;

    // Commit an edit to one thumb: quantize, clamp against the sibling so the
    // pair can never cross, and emit only on a real change.
    function commit(thumb: ERangeThumb, raw: number): void {
        const quantized: number = quantize(
            raw,
            resolvedMin,
            resolvedMax,
            resolvedStep,
        );
        if (thumb === ERangeThumb.Lower) {
            const nextLower: number = Math.min(quantized, upper);
            if (nextLower === lower) {
                return;
            }
            const next: RangeSliderValue = { lower: nextLower, upper };
            onValueChange(next);
            return;
        }
        const nextUpper: number = Math.max(quantized, lower);
        if (nextUpper === upper) {
            return;
        }
        const next: RangeSliderValue = { lower, upper: nextUpper };
        onValueChange(next);
    }

    // Pointer position -> value, in LOGICAL coordinates: the fraction runs
    // from the inline-start edge, so an RTL track mirrors correctly. Bounds
    // come from the TRACK element (measured fresh), not the drag state: the
    // same drag binding is attached to the rail overlay and to both thumbs,
    // whose own rects are not the value space.
    function valueAtPointer(state: PointerDragState): number {
        const track: HTMLDivElement | null = trackRef.current;
        const bounds: DOMRect = track?.getBoundingClientRect() ?? state.bounds;
        if (bounds.width <= 0) {
            return resolvedMin;
        }
        const physicalFraction: number = Math.min(
            1,
            Math.max(0, (state.x - bounds.left) / bounds.width),
        );
        const isRtl: boolean =
            track !== null && getComputedStyle(track).direction === 'rtl';
        const fraction: number = isRtl ? 1 - physicalFraction : physicalFraction;
        return resolvedMin + fraction * span;
    }

    const drag: PointerDragBinding<HTMLDivElement> = usePointerDrag<HTMLDivElement>(
        {
            disabled: isDisabled,
            onDragStart: (state: PointerDragState): void => {
                const pressed: number = valueAtPointer(state);
                // The nearest thumb takes the gesture; ties go to the upper thumb
                // so a fully-left pair can still be widened.
                const lowerDistance: number = Math.abs(pressed - lower);
                const upperDistance: number = Math.abs(pressed - upper);
                const thumb: ERangeThumb =
                    lowerDistance < upperDistance
                        ? ERangeThumb.Lower
                        : ERangeThumb.Upper;
                activeThumbRef.current = thumb;
                const thumbElement: HTMLDivElement | null =
                    thumb === ERangeThumb.Lower
                        ? lowerThumbRef.current
                        : upperThumbRef.current;
                thumbElement?.focus();
                commit(thumb, pressed);
            },
            onDrag: (state: PointerDragState): void => {
                commit(activeThumbRef.current, valueAtPointer(state));
            },
        },
    );

    // Shared keyboard stepping for both thumbs. Left/Right follow the visual
    // direction (flipped under RTL); Up/Down and paging are direction-free.
    function handleThumbKeyDown(
        thumb: ERangeThumb,
        event: KeyboardEvent<HTMLDivElement>,
    ): void {
        if (isDisabled) {
            return;
        }
        const current: number = thumb === ERangeThumb.Lower ? lower : upper;
        const track: HTMLDivElement | null = trackRef.current;
        const isRtl: boolean =
            track !== null && getComputedStyle(track).direction === 'rtl';
        const inlineStep: number = isRtl ? -resolvedStep : resolvedStep;
        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                commit(thumb, current + inlineStep);
                return;
            case 'ArrowLeft':
                event.preventDefault();
                commit(thumb, current - inlineStep);
                return;
            case 'ArrowUp':
                event.preventDefault();
                commit(thumb, current + resolvedStep);
                return;
            case 'ArrowDown':
                event.preventDefault();
                commit(thumb, current - resolvedStep);
                return;
            case 'PageUp':
                event.preventDefault();
                commit(thumb, current + resolvedStep * PAGE_STEP_MULTIPLIER);
                return;
            case 'PageDown':
                event.preventDefault();
                commit(thumb, current - resolvedStep * PAGE_STEP_MULTIPLIER);
                return;
            case 'Home':
                event.preventDefault();
                commit(thumb, thumb === ERangeThumb.Lower ? resolvedMin : lower);
                return;
            case 'End':
                event.preventDefault();
                commit(thumb, thumb === ERangeThumb.Upper ? resolvedMax : upper);
                return;
            default:
                return;
        }
    }

    const trackStyle: CSSProperties = {
        [LOWER_FRACTION_PROPERTY]: lowerFraction,
        [UPPER_FRACTION_PROPERTY]: upperFraction,
    };

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-enabled={resolvedEnabled}
        >
            <span id={labelId} className={styles.label}>
                {label}
            </span>
            <div
                ref={trackRef}
                role="group"
                aria-labelledby={labelId}
                className={styles.track}
                style={trackStyle}
            >
                <span className={styles.rail} aria-hidden="true" />
                <span className={styles.fill} aria-hidden="true" />
                {/* Pointer capture surface: role=presentation is exempt from
                    the noninteractive-handler rule; the thumbs (interactive
                    role=slider) carry the same binding so a press anywhere
                    starts the gesture with the track as the value space. */}
                <div
                    className={styles.surface}
                    role="presentation"
                    onPointerDown={drag.onPointerDown}
                />
                <div
                    ref={lowerThumbRef}
                    role="slider"
                    tabIndex={isDisabled ? -1 : 0}
                    className={styles.thumb}
                    data-thumb={ERangeThumb.Lower}
                    aria-label={lowerLabel ?? 'Minimum'}
                    aria-valuemin={resolvedMin}
                    aria-valuemax={upper}
                    aria-valuenow={lower}
                    aria-valuetext={formatValue?.(lower)}
                    aria-disabled={isDisabled ? true : undefined}
                    onPointerDown={drag.onPointerDown}
                    onKeyDown={(event: KeyboardEvent<HTMLDivElement>): void => {
                        handleThumbKeyDown(ERangeThumb.Lower, event);
                    }}
                />
                <div
                    ref={upperThumbRef}
                    role="slider"
                    tabIndex={isDisabled ? -1 : 0}
                    className={styles.thumb}
                    data-thumb={ERangeThumb.Upper}
                    aria-label={upperLabel ?? 'Maximum'}
                    aria-valuemin={lower}
                    aria-valuemax={resolvedMax}
                    aria-valuenow={upper}
                    aria-valuetext={formatValue?.(upper)}
                    aria-disabled={isDisabled ? true : undefined}
                    onPointerDown={drag.onPointerDown}
                    onKeyDown={(event: KeyboardEvent<HTMLDivElement>): void => {
                        handleThumbKeyDown(ERangeThumb.Upper, event);
                    }}
                />
            </div>
        </div>
    );
}
