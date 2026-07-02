// Pure arc geometry for the Gauge dial. React-free and DOM-free (the same
// split calendarMath / Drawer.geometry use) so the angle and path math stays
// unit-testable in isolation. Coordinates live in the dial's 0..100 viewBox
// space with the center at (50, 50); angles follow polygonMath's polar
// convention (degrees clockwise from straight up), so the gauge sweep runs
// from the lower-left shoulder through top to the lower-right shoulder and
// the gap sits at the bottom.

import { type Point, polarPoint, roundCoordinate } from '../polygonMath';

// The dial sweep: 270 degrees, symmetric about straight up.
export const GAUGE_START_DEGREES: number = -135;
export const GAUGE_END_DEGREES: number = 135;
export const GAUGE_SWEEP_DEGREES: number = GAUGE_END_DEGREES - GAUGE_START_DEGREES;

// Center of the 0..100 viewBox.
const VIEWBOX_CENTER: number = 50;

// An arc longer than a half turn needs the SVG large-arc flag.
const HALF_TURN_DEGREES: number = 180;

// The value's share of the [min, max] span, clamped to 0..1. A degenerate or
// inverted span (and a non-finite value) reads as empty rather than NaN.
export function gaugeFraction(value: number, min: number, max: number): number {
    const span: number = max - min;
    if (!Number.isFinite(value)) {
        return 0;
    }
    if (!Number.isFinite(span) || span <= 0) {
        return 0;
    }
    return Math.min(1, Math.max(0, (value - min) / span));
}

// The dial angle for a 0..1 fraction along the sweep.
export function gaugeAngle(fraction: number): number {
    const clamped: number = Math.min(1, Math.max(0, fraction));
    return GAUGE_START_DEGREES + clamped * GAUGE_SWEEP_DEGREES;
}

// A dial point in viewBox coordinates at `radius` (viewBox units) toward
// `angleDegrees`.
export function gaugePoint(radius: number, angleDegrees: number): Point {
    const unit: Point = polarPoint(radius, angleDegrees);
    return {
        x: roundCoordinate(VIEWBOX_CENTER + unit.x),
        y: roundCoordinate(VIEWBOX_CENTER + unit.y),
    };
}

// SVG path for the clockwise arc from startDegrees to endDegrees at `radius`.
// Degenerate input (a reversed or empty span, a non-finite angle, a
// non-positive radius) yields the empty string so callers skip the path
// instead of emitting NaN coordinates.
export function arcPath(
    startDegrees: number,
    endDegrees: number,
    radius: number,
): string {
    if (!Number.isFinite(startDegrees) || !Number.isFinite(endDegrees)) {
        return '';
    }
    if (endDegrees <= startDegrees) {
        return '';
    }
    if (!Number.isFinite(radius) || radius <= 0) {
        return '';
    }
    const start: Point = gaugePoint(radius, startDegrees);
    const end: Point = gaugePoint(radius, endDegrees);
    const largeArc: number = endDegrees - startDegrees > HALF_TURN_DEGREES ? 1 : 0;
    const arcRadius: number = roundCoordinate(radius);
    return `M ${String(start.x)} ${String(start.y)} A ${String(arcRadius)} ${String(arcRadius)} 0 ${String(largeArc)} 1 ${String(end.x)} ${String(end.y)}`;
}
