// Pure pointer-angle / value math for the Dial rotary control. React-free and
// DOM-free so the rotation model is unit-testable in isolation. Angles follow
// polygonMath's polar convention (degrees clockwise from straight up); the
// dial shares the Gauge's 270-degree instrument sweep, so the two radial
// instruments read as one family.
//
// The drag model is RELATIVE: grabbing the knob never jumps the value to the
// press point (a machined knob is grabbed anywhere and twisted). Each move
// contributes the WRAPPED angular delta from the previous sample, so a
// gesture crossing the atan2 seam at the bottom of the dial accumulates
// smoothly instead of flipping by a full turn.

import {
    GAUGE_END_DEGREES,
    GAUGE_START_DEGREES,
    GAUGE_SWEEP_DEGREES,
} from '../../ui/Gauge/gaugeMath';

export const DIAL_START_DEGREES: number = GAUGE_START_DEGREES;
export const DIAL_END_DEGREES: number = GAUGE_END_DEGREES;
export const DIAL_SWEEP_DEGREES: number = GAUGE_SWEEP_DEGREES;

const DEGREES_PER_RADIAN: number = 180 / Math.PI;
const HALF_TURN_DEGREES: number = 180;
const FULL_TURN_DEGREES: number = 360;

// Pointer angle in degrees clockwise from straight up, from the knob center
// to the pointer. atan2(dx, -dy) maps screen coordinates (+y down) onto the
// polar convention: up = 0, right = 90, down = +/-180, left = -90.
export function pointerAngle(
    pointerX: number,
    pointerY: number,
    centerX: number,
    centerY: number,
): number {
    return Math.atan2(pointerX - centerX, centerY - pointerY) * DEGREES_PER_RADIAN;
}

// Normalize an angular delta onto (-180, 180] so a move that crosses the
// atan2 seam (the bottom of the dial) reads as its short-way rotation.
export function wrapDeltaDegrees(delta: number): number {
    if (!Number.isFinite(delta)) {
        return 0;
    }
    let wrapped: number = delta;
    while (wrapped > HALF_TURN_DEGREES) {
        wrapped -= FULL_TURN_DEGREES;
    }
    while (wrapped <= -HALF_TURN_DEGREES) {
        wrapped += FULL_TURN_DEGREES;
    }
    return wrapped;
}

// Snap a raw value onto the step lattice anchored at min, clamped to the
// bounds, rounded to the step's decimal precision so float artifacts never
// reach the consumer (mirrors RangeSlider's quantize).
export function quantize(
    raw: number,
    min: number,
    max: number,
    step: number,
): number {
    const stepsFromMin: number = Math.round((raw - min) / step);
    const snapped: number = min + stepsFromMin * step;
    const decimals: number = (String(step).split('.')[1] ?? '').length;
    const rounded: number = Number(snapped.toFixed(decimals));
    return Math.min(max, Math.max(min, rounded));
}

// Settle a released value onto the nearest detent (the Drawer nearestSnap
// read). Detents are clamped into [min, max] before comparison so an
// out-of-range detent can never win; non-finite detents are ignored. Without
// any usable detent the value passes through unchanged.
export function nearestDetent(
    value: number,
    detents: readonly number[],
    min: number,
    max: number,
): number {
    let best: number | null = null;
    let bestDistance: number = Number.POSITIVE_INFINITY;
    for (const detent of detents) {
        if (!Number.isFinite(detent)) {
            continue;
        }
        const clamped: number = Math.min(max, Math.max(min, detent));
        const distance: number = Math.abs(clamped - value);
        if (distance < bestDistance) {
            best = clamped;
            bestDistance = distance;
        }
    }
    return best ?? value;
}
