// Pure unit tests for the Window geometry helpers, porting the intent of
// Helicon's bounded_window_size / bounded_window_position clamp tests: the size
// is capped to the margin-inset viewport with a min-extent floor, and the
// position is clamped so the whole box stays inside the inset region. No DOM, no
// React - fast and deterministic.

import { describe, expect, it } from 'vitest';

import {
    EWindowResizeEdge,
    type WindowRect,
    type WindowSize,
} from './Window.types';
import {
    applyDragDelta,
    applyResizeDelta,
    clampWindowRect,
    WINDOW_SCREEN_MARGIN,
    type WindowViewport,
} from './windowGeometry';

const VIEWPORT: WindowViewport = { width: 1000, height: 800 };
const MIN: WindowSize = { width: 200, height: 120 };

describe('clampWindowRect', (): void => {
    it('leaves an in-bounds rectangle unchanged', (): void => {
        const rect: WindowRect = { x: 100, y: 80, width: 400, height: 300 };
        expect(clampWindowRect(rect, VIEWPORT, MIN)).toEqual(rect);
    });

    it('clamps the position into the margin-inset viewport', (): void => {
        const rect: WindowRect = { x: -50, y: -50, width: 400, height: 300 };
        const clamped: WindowRect = clampWindowRect(rect, VIEWPORT, MIN);
        expect(clamped.x).toBe(WINDOW_SCREEN_MARGIN);
        expect(clamped.y).toBe(WINDOW_SCREEN_MARGIN);
    });

    it('pins the rectangle against the far edge when it overflows', (): void => {
        const rect: WindowRect = { x: 5000, y: 5000, width: 400, height: 300 };
        const clamped: WindowRect = clampWindowRect(rect, VIEWPORT, MIN);
        expect(clamped.x).toBe(VIEWPORT.width - WINDOW_SCREEN_MARGIN - 400);
        expect(clamped.y).toBe(VIEWPORT.height - WINDOW_SCREEN_MARGIN - 300);
    });

    it('caps the size to the inset viewport extent', (): void => {
        const rect: WindowRect = { x: 0, y: 0, width: 5000, height: 5000 };
        const clamped: WindowRect = clampWindowRect(rect, VIEWPORT, MIN);
        expect(clamped.width).toBe(VIEWPORT.width - WINDOW_SCREEN_MARGIN * 2);
        expect(clamped.height).toBe(VIEWPORT.height - WINDOW_SCREEN_MARGIN * 2);
    });

    it('floors the size at the requested minimum', (): void => {
        const rect: WindowRect = { x: 100, y: 100, width: 10, height: 10 };
        const clamped: WindowRect = clampWindowRect(rect, VIEWPORT, MIN);
        expect(clamped.width).toBe(MIN.width);
        expect(clamped.height).toBe(MIN.height);
    });
});

describe('applyDragDelta', (): void => {
    it('translates the rectangle and preserves the size', (): void => {
        const rect: WindowRect = { x: 100, y: 100, width: 300, height: 200 };
        expect(applyDragDelta(rect, 40, -25)).toEqual({
            x: 140,
            y: 75,
            width: 300,
            height: 200,
        });
    });
});

describe('applyResizeDelta', (): void => {
    const rect: WindowRect = { x: 100, y: 100, width: 300, height: 200 };

    it('grows from the east edge by the horizontal delta', (): void => {
        const next: WindowRect = applyResizeDelta(
            rect,
            EWindowResizeEdge.East,
            50,
            999,
            MIN,
        );
        expect(next).toEqual({ x: 100, y: 100, width: 350, height: 200 });
    });

    it('moves the left edge for a west drag', (): void => {
        const next: WindowRect = applyResizeDelta(
            rect,
            EWindowResizeEdge.West,
            -40,
            0,
            MIN,
        );
        expect(next).toEqual({ x: 60, y: 100, width: 340, height: 200 });
    });

    it('resizes both axes for a corner drag', (): void => {
        const next: WindowRect = applyResizeDelta(
            rect,
            EWindowResizeEdge.SouthEast,
            25,
            30,
            MIN,
        );
        expect(next).toEqual({ x: 100, y: 100, width: 325, height: 230 });
    });

    it('honors the min floor on an east drag without moving the left edge', (): void => {
        const next: WindowRect = applyResizeDelta(
            rect,
            EWindowResizeEdge.East,
            -1000,
            0,
            MIN,
        );
        expect(next.x).toBe(100);
        expect(next.width).toBe(MIN.width);
    });

    it('honors the min floor on a west drag by pinning the left edge', (): void => {
        const next: WindowRect = applyResizeDelta(
            rect,
            EWindowResizeEdge.West,
            1000,
            0,
            MIN,
        );
        // The left edge cannot pass the right edge minus the min width.
        expect(next.x).toBe(rect.x + rect.width - MIN.width);
        expect(next.width).toBe(MIN.width);
    });

    it('honors the min floor on a north drag by pinning the top edge', (): void => {
        const next: WindowRect = applyResizeDelta(
            rect,
            EWindowResizeEdge.North,
            0,
            1000,
            MIN,
        );
        expect(next.y).toBe(rect.y + rect.height - MIN.height);
        expect(next.height).toBe(MIN.height);
    });
});
