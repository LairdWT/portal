import {
    type CSSProperties,
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    useRef,
} from 'react';

import {
    type PointerDragBinding,
    type PointerDragState,
    usePointerDrag,
} from '../../react/hooks/usePointerDrag';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import {
    type ScalarControlBinding,
    useScalarControl,
} from '../../react/hooks/useScalarControl';
import { EEnabledState } from '../../state/state';
import { gaugeFraction } from '../../ui/Gauge/gaugeMath';
import styles from './Dial.module.css';
import { type DialProps } from './Dial.types';
import {
    DIAL_SWEEP_DEGREES,
    nearestDetent,
    pointerAngle,
    quantize,
    wrapDeltaDegrees,
} from './dialMath';

const DEFAULT_MIN: number = 0;
const DEFAULT_MAX: number = 100;
const DEFAULT_STEP: number = 1;
const PAGE_STEP_MULTIPLIER: number = 10;
const FILL_PROPERTY: string = '--portal-dial-fill';

// The live twist accumulator for one pointer gesture: the unquantized value
// and the previous pointer angle the next wrapped delta is measured from.
type TwistState = {
    liveValue: number;
    lastAngle: number;
};

// The Dial: a rotary game-input scalar control. The knob is the single
// interactive element (role=slider); a pointer gesture twists the value
// RELATIVELY from wherever the knob was grabbed, the toned ring arc mirrors
// the value across the shared 270-degree instrument sweep, and the machined
// mark rotates with a compositor-cheap transform.
export function Dial({
    label,
    value,
    min,
    max,
    step,
    detents,
    enabled,
    onChange,
    onSignal,
    descriptor,
    formatValueText,
}: DialProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const resolvedMin: number = min ?? DEFAULT_MIN;
    const resolvedMax: number = Math.max(max ?? DEFAULT_MAX, resolvedMin);
    const resolvedStep: number =
        step !== undefined && step > 0 ? step : DEFAULT_STEP;
    const span: number = resolvedMax - resolvedMin;

    const knobRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
        null,
    );
    const twistRef: RefObject<TwistState | null> = useRef<TwistState | null>(null);
    const { emitScalar }: ScalarControlBinding = useScalarControl(
        descriptor,
        onSignal,
    );

    // Defensive render clamp: a non-finite or out-of-range consumer value
    // renders sane and is re-clamped on the first edit (RangeSlider posture).
    const safeValue: number = Number.isFinite(value)
        ? Math.min(Math.max(value, resolvedMin), resolvedMax)
        : resolvedMin;
    const fraction: number = gaugeFraction(safeValue, resolvedMin, resolvedMax);

    // Commit an edit: quantize onto the step lattice and emit only on a real
    // change (onChange and the scalar signal fire together, per Slider).
    function commit(raw: number): void {
        const quantized: number = quantize(
            raw,
            resolvedMin,
            resolvedMax,
            resolvedStep,
        );
        if (quantized === safeValue) {
            return;
        }
        onChange?.(quantized);
        emitScalar(quantized);
    }

    // The pointer angle around the LIVE knob center (re-measured per sample;
    // the state bounds are the gesture-start fallback).
    function angleAtPointer(state: PointerDragState): number {
        const knob: HTMLDivElement | null = knobRef.current;
        const bounds: DOMRect = knob?.getBoundingClientRect() ?? state.bounds;
        return pointerAngle(
            state.x,
            state.y,
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2,
        );
    }

    const drag: PointerDragBinding<HTMLDivElement> = usePointerDrag<HTMLDivElement>(
        {
            disabled: isDisabled,
            onDragStart: (state: PointerDragState): void => {
                knobRef.current?.focus();
                twistRef.current = {
                    liveValue: safeValue,
                    lastAngle: angleAtPointer(state),
                };
            },
            onDrag: (state: PointerDragState): void => {
                const twist: TwistState | null = twistRef.current;
                if (twist === null) {
                    return;
                }
                const angle: number = angleAtPointer(state);
                const delta: number = wrapDeltaDegrees(angle - twist.lastAngle);
                twist.lastAngle = angle;
                twist.liveValue = Math.min(
                    resolvedMax,
                    Math.max(
                        resolvedMin,
                        twist.liveValue + (delta / DIAL_SWEEP_DEGREES) * span,
                    ),
                );
                commit(twist.liveValue);
            },
            onDragEnd: (): void => {
                const twist: TwistState | null = twistRef.current;
                twistRef.current = null;
                if (twist === null) {
                    return;
                }
                if (detents === undefined || detents.length === 0) {
                    return;
                }
                // Detents win over the step lattice, so the settle emits the
                // detent value directly rather than routing through commit.
                const settled: number = nearestDetent(
                    twist.liveValue,
                    detents,
                    resolvedMin,
                    resolvedMax,
                );
                if (settled === safeValue) {
                    return;
                }
                onChange?.(settled);
                emitScalar(settled);
            },
        },
    );

    // Keyboard stepping. Rotation is chirality-fixed, so the arrows map by
    // magnitude (Up/Right increase, Down/Left decrease) without RTL mirroring.
    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        if (isDisabled) {
            return;
        }
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowRight':
                event.preventDefault();
                commit(safeValue + resolvedStep);
                return;
            case 'ArrowDown':
            case 'ArrowLeft':
                event.preventDefault();
                commit(safeValue - resolvedStep);
                return;
            case 'PageUp':
                event.preventDefault();
                commit(safeValue + resolvedStep * PAGE_STEP_MULTIPLIER);
                return;
            case 'PageDown':
                event.preventDefault();
                commit(safeValue - resolvedStep * PAGE_STEP_MULTIPLIER);
                return;
            case 'Home':
                event.preventDefault();
                commit(resolvedMin);
                return;
            case 'End':
                event.preventDefault();
                commit(resolvedMax);
                return;
            default:
                return;
        }
    }

    const rootStyle: CSSProperties = {
        [FILL_PROPERTY]: String(fraction),
    };

    return (
        <div
            className={styles.dial}
            style={rootStyle}
            data-enabled={resolvedEnabled}
        >
            <span className={styles.label}>{label}</span>
            <div className={styles.shell}>
                <span className={styles.ring} aria-hidden="true" />
                <div
                    ref={knobRef}
                    role="slider"
                    tabIndex={isDisabled ? -1 : 0}
                    className={styles.knob}
                    aria-label={label}
                    aria-valuemin={resolvedMin}
                    aria-valuemax={resolvedMax}
                    aria-valuenow={safeValue}
                    aria-valuetext={formatValueText?.(safeValue)}
                    aria-disabled={isDisabled ? true : undefined}
                    onPointerDown={drag.onPointerDown}
                    onKeyDown={handleKeyDown}
                >
                    <span className={styles.mark} aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}
