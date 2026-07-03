// Pure zoom/pan math for the Lightbox media viewer. React-free and DOM-free
// (the gaugeMath split) so the clamping arithmetic stays unit-testable. The
// zoomed canvas scales about its center, so the pan range on each axis is
// symmetric: at scale s over an extent e the content overhangs the frame by
// e * (s - 1), half of it on each side.

// The resting scale; zoom never goes below the fitted view.
export const ZOOM_MIN: number = 1;
// The magnification ceiling.
export const ZOOM_MAX: number = 4;
// One wheel notch multiplies (or divides) the scale by this.
export const ZOOM_WHEEL_FACTOR: number = 1.2;
// One toolbar step multiplies (or divides) the scale by this.
export const ZOOM_STEP_FACTOR: number = 1.5;
// The double-click toggle target.
export const ZOOM_TOGGLE_SCALE: number = 2;

// Clamp a scale into [ZOOM_MIN, ZOOM_MAX]; non-finite input rests at fit.
export function clampZoomScale(scale: number): number {
    if (!Number.isFinite(scale)) {
        return ZOOM_MIN;
    }
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale));
}

// Clamp one pan axis so the scaled content can never detach from the frame:
// the offset is bounded by half the overhang, extent * (scale - 1) / 2.
export function clampPanOffset(
    offset: number,
    extent: number,
    scale: number,
): number {
    if (!Number.isFinite(offset)) {
        return 0;
    }
    const overhang: number = Math.max(0, extent) * (clampZoomScale(scale) - 1);
    const limit: number = overhang / 2;
    if (limit === 0) {
        return 0;
    }
    return Math.min(limit, Math.max(-limit, offset));
}
