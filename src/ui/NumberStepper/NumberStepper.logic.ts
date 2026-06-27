// Pure, React-free saturating-clamp math for NumberStepper (zero React imports).
// A direct port of Helicon's MINIMUM_STEP coercion, the inverted-range pass-through
// clamp, and the saturating_add / saturating_sub step. Keeping the logic here
// decouples it from render, keeps the component module's exports fast-refresh pure,
// and lets the edge cases (inverted min>max range, +/-Infinity overflow) be
// unit-tested in isolation. The precedent is Pagination.windowing.ts /
// Popover.position.ts. This module is internal: it is not barrel-exported.

import { EStepDirection } from './NumberStepper.types';

// Helicon MINIMUM_STEP: a non-positive step is treated as 1, so a misconfigured
// step never freezes the control.
export function normalizeStep(step: number): number {
    return step > 0 ? step : 1;
}

// Clamp a value into [min, max]. Helicon leaves an inverted/empty range unchanged,
// so a min greater than max returns the value untouched.
export function clampToRange(value: number, min: number, max: number): number {
    if (min > max) {
        return value;
    }
    return Math.min(Math.max(value, min), max);
}

// Apply one step in `direction` by `delta`, saturating at the bound. A non-finite
// candidate (overflow toward +/-Infinity) clamps to the bound instead of producing
// NaN/Infinity, mirroring Helicon saturating_add / saturating_sub.
export function applyStep(
    value: number,
    direction: EStepDirection,
    delta: number,
    min: number,
    max: number,
): number {
    const candidate: number =
        direction === EStepDirection.Increment ? value + delta : value - delta;
    if (!Number.isFinite(candidate)) {
        return direction === EStepDirection.Increment ? max : min;
    }
    return clampToRange(candidate, min, max);
}
