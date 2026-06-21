// Pure pointer-to-axis math for the Portal input spine.
//
// No React imports. No document, window, or DOMRect lookups. Callers pass a
// DOMRect-shaped rectangle and client coordinates; these functions never touch
// the live DOM.

import type { Axis2D } from './InputContract';

// Minimal DOMRect-shaped rectangle. Accepts a real DOMRect or any plain object
// with the same fields, which keeps this module testable without the DOM.
export type RectLike = Readonly<{
    width: number;
    height: number;
    left: number;
    top: number;
}>;

// Rescale a magnitude through a radial dead zone.
//
// Magnitudes at or below deadZone collapse to 0. Magnitudes above it are
// rescaled so that the dead-zone edge maps to 0 and a magnitude of 1 maps to 1.
// The result is clamped to the inclusive range [0, 1]. A deadZone of 1 (or
// greater) would divide by zero, so it is treated as a fully dead surface.
export function applyDeadZone(magnitude: number, deadZone: number): number {
    const clampedDeadZone: number = Math.min(Math.max(deadZone, 0), 1);
    if (clampedDeadZone >= 1) {
        return 0;
    }
    if (magnitude <= clampedDeadZone) {
        return 0;
    }
    const span: number = 1 - clampedDeadZone;
    const rescaled: number = (magnitude - clampedDeadZone) / span;
    return Math.min(Math.max(rescaled, 0), 1);
}

// Resolve a pointer position to a center-origin, normalized, dead-zoned axis.
//
// The rectangle defines the active surface. Client coordinates are mapped so the
// rectangle center is (0, 0), the horizontal edges are +/-1, and the vertical
// edges are +/-1. The raw vector is clamped to the unit circle, then the
// dead zone is applied along the radial direction. A zero-sized rectangle
// yields a centered (0, 0) axis rather than dividing by zero.
export function resolveAxis2D(
    rect: RectLike,
    clientX: number,
    clientY: number,
    deadZone: number,
): Axis2D {
    const halfWidth: number = rect.width / 2;
    const halfHeight: number = rect.height / 2;
    if (halfWidth <= 0 || halfHeight <= 0) {
        return { x: 0, y: 0 };
    }

    const rawX: number = (clientX - (rect.left + halfWidth)) / halfWidth;
    const rawY: number = (clientY - (rect.top + halfHeight)) / halfHeight;

    const rawMagnitude: number = Math.hypot(rawX, rawY);
    if (rawMagnitude === 0) {
        return { x: 0, y: 0 };
    }

    // Clamp to the unit circle so corners do not exceed magnitude 1.
    const clampedMagnitude: number = Math.min(rawMagnitude, 1);
    const directionX: number = rawX / rawMagnitude;
    const directionY: number = rawY / rawMagnitude;

    const scaledMagnitude: number = applyDeadZone(clampedMagnitude, deadZone);
    return {
        x: directionX * scaledMagnitude,
        y: directionY * scaledMagnitude,
    };
}

// Resolve the rect-normalized delta between two pointer samples.
//
// Uses the same normalization basis as resolveAxis2D: the horizontal component
// is scaled by half the rectangle width and the vertical by half the height, so
// a drag spanning the full width reports a delta x of 2. Relative look surfaces
// report raw incremental motion, so no dead zone or unit-circle clamp is applied
// here. A zero-sized rectangle yields a zero delta rather than dividing by zero.
export function resolveDelta(
    rect: RectLike,
    previousClientX: number,
    previousClientY: number,
    clientX: number,
    clientY: number,
): Axis2D {
    const halfWidth: number = rect.width / 2;
    const halfHeight: number = rect.height / 2;
    if (halfWidth <= 0 || halfHeight <= 0) {
        return { x: 0, y: 0 };
    }
    return {
        x: (clientX - previousClientX) / halfWidth,
        y: (clientY - previousClientY) / halfHeight,
    };
}

// Clamp an axis vector into the unit circle. Vectors already within the circle
// are returned unchanged; longer vectors are scaled to magnitude 1 along their
// direction. Keeps alternate input paths (paired axis sliders, accumulated
// relative offsets) within the same magnitude bound the pointer path enforces.
export function clampToUnitCircle(axis: Axis2D): Axis2D {
    const magnitude: number = Math.hypot(axis.x, axis.y);
    if (magnitude <= 1) {
        return axis;
    }
    return { x: axis.x / magnitude, y: axis.y / magnitude };
}

// Single-active-pointer tracker. Models the one-pointer-at-a-time rule the
// controller pad enforces: the first pointer to claim the surface owns it until
// it releases or is cleared. This is plain mutable state with no DOM ties.
export type PointerTracker = {
    activePointerId: number | null;
};

export function createPointerTracker(): PointerTracker {
    return { activePointerId: null };
}

// Claim the surface for a pointer if it is currently free. Returns true when the
// pointer becomes (or already is) the active pointer.
export function claimPointer(tracker: PointerTracker, pointerId: number): boolean {
    if (tracker.activePointerId === null) {
        tracker.activePointerId = pointerId;
        return true;
    }
    return tracker.activePointerId === pointerId;
}

// Report whether a pointer is the active pointer.
export function isActivePointer(
    tracker: PointerTracker,
    pointerId: number,
): boolean {
    return tracker.activePointerId === pointerId;
}

// Release the surface if the given pointer owns it. Returns true when a release
// actually occurred.
export function releasePointer(
    tracker: PointerTracker,
    pointerId: number,
): boolean {
    if (tracker.activePointerId !== pointerId) {
        return false;
    }
    tracker.activePointerId = null;
    return true;
}
