import { describe, expect, it } from 'vitest';

import { clampPanOffset, clampZoomScale, ZOOM_MAX, ZOOM_MIN } from './lightboxZoom';

describe('clampZoomScale', (): void => {
    it('clamps into the zoom range', (): void => {
        expect(clampZoomScale(0.5)).toBe(ZOOM_MIN);
        expect(clampZoomScale(1)).toBe(1);
        expect(clampZoomScale(2.5)).toBe(2.5);
        expect(clampZoomScale(9)).toBe(ZOOM_MAX);
    });

    it('rests non-finite input at the fitted view', (): void => {
        // NaN and Infinity alike are garbage inputs, not big numbers: both
        // rest at fit rather than guessing a direction.
        expect(clampZoomScale(Number.NaN)).toBe(ZOOM_MIN);
        expect(clampZoomScale(Number.POSITIVE_INFINITY)).toBe(ZOOM_MIN);
    });
});

describe('clampPanOffset', (): void => {
    it('bounds the offset by half the overhang', (): void => {
        // 400px frame at 2x overhangs 400px total, 200 each side.
        expect(clampPanOffset(0, 400, 2)).toBe(0);
        expect(clampPanOffset(150, 400, 2)).toBe(150);
        expect(clampPanOffset(250, 400, 2)).toBe(200);
        expect(clampPanOffset(-250, 400, 2)).toBe(-200);
    });

    it('pins the fitted view to center', (): void => {
        expect(clampPanOffset(120, 400, 1)).toBe(0);
        expect(clampPanOffset(-120, 400, 1)).toBe(0);
    });

    it('treats degenerate extents and offsets as centered', (): void => {
        expect(clampPanOffset(50, 0, 3)).toBe(0);
        expect(clampPanOffset(50, -100, 3)).toBe(0);
        expect(clampPanOffset(Number.NaN, 400, 2)).toBe(0);
    });

    it('clamps the scale before computing the overhang', (): void => {
        // Scale 9 clamps to 4: 400 * 3 / 2 = 600 each side.
        expect(clampPanOffset(1000, 400, 9)).toBe(600);
    });
});
