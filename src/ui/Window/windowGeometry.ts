// Pure geometry core for the Window component. This module is React-free and
// DOM-free (it consumes plain {x,y,width,height} rectangles, never a live
// element), so the clamp/drag/resize math stays unit-testable in isolation and
// the component module keeps a clean logic/render split. It mirrors Helicon's
// bounded_window_size / bounded_window_position (popout_window.rs): the requested
// size and position are clamped into the viewport inset by a fixed screen margin,
// with a minimum extent floor.

import {
    EWindowResizeEdge,
    type WindowRect,
    type WindowSize,
} from './Window.types';

// The viewport rectangle the window is clamped inside (CSS pixels).
export type WindowViewport = Readonly<{ width: number; height: number }>;

// Helicon WINDOW_SCREEN_MARGIN: the inset between the viewport edge and the
// clamped window rectangle.
export const WINDOW_SCREEN_MARGIN: number = 8;

// Helicon min-extent floor (1px) - a window never collapses below this even when
// a consumer passes a smaller minSize.
export const WINDOW_MIN_EXTENT: number = 1;

function clampValue(value: number, min: number, max: number): number {
    if (max < min) {
        return min;
    }
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

// Clamp a requested rectangle into the margin-inset viewport: first cap the size
// to the available extent (floored at the min extent), then clamp the top-left so
// the whole box stays inside the inset region. Mirrors bounded_window_size +
// bounded_window_position.
export function clampWindowRect(
    rect: WindowRect,
    viewport: WindowViewport,
    minSize: WindowSize,
    margin: number = WINDOW_SCREEN_MARGIN,
): WindowRect {
    const minWidth: number = Math.max(minSize.width, WINDOW_MIN_EXTENT);
    const minHeight: number = Math.max(minSize.height, WINDOW_MIN_EXTENT);
    const maxWidth: number = Math.max(viewport.width - margin * 2, minWidth);
    const maxHeight: number = Math.max(viewport.height - margin * 2, minHeight);
    const width: number = clampValue(rect.width, minWidth, maxWidth);
    const height: number = clampValue(rect.height, minHeight, maxHeight);
    const maxX: number = Math.max(viewport.width - margin - width, margin);
    const maxY: number = Math.max(viewport.height - margin - height, margin);
    const x: number = clampValue(rect.x, margin, maxX);
    const y: number = clampValue(rect.y, margin, maxY);
    return { x, y, width, height };
}

// Translate the rectangle by a raw cumulative pixel delta (the move-grip drag).
// Size is unchanged; clamping into the viewport is the caller's separate step.
export function applyDragDelta(
    rect: WindowRect,
    dx: number,
    dy: number,
): WindowRect {
    return {
        x: rect.x + dx,
        y: rect.y + dy,
        width: rect.width,
        height: rect.height,
    };
}

function edgeMovesLeft(edge: EWindowResizeEdge): boolean {
    return (
        edge === EWindowResizeEdge.West ||
        edge === EWindowResizeEdge.NorthWest ||
        edge === EWindowResizeEdge.SouthWest
    );
}

function edgeMovesRight(edge: EWindowResizeEdge): boolean {
    return (
        edge === EWindowResizeEdge.East ||
        edge === EWindowResizeEdge.NorthEast ||
        edge === EWindowResizeEdge.SouthEast
    );
}

function edgeMovesTop(edge: EWindowResizeEdge): boolean {
    return (
        edge === EWindowResizeEdge.North ||
        edge === EWindowResizeEdge.NorthEast ||
        edge === EWindowResizeEdge.NorthWest
    );
}

function edgeMovesBottom(edge: EWindowResizeEdge): boolean {
    return (
        edge === EWindowResizeEdge.South ||
        edge === EWindowResizeEdge.SouthEast ||
        edge === EWindowResizeEdge.SouthWest
    );
}

// Resize a rectangle by dragging one edge/corner: the dragged sides move by the
// raw cumulative delta, then the min-extent floor is enforced on the side that is
// actually moving (so a west/north drag never inverts the box). Viewport capping
// is the caller's separate clampWindowRect step.
export function applyResizeDelta(
    rect: WindowRect,
    edge: EWindowResizeEdge,
    dx: number,
    dy: number,
    minSize: WindowSize,
): WindowRect {
    let left: number = rect.x;
    let right: number = rect.x + rect.width;
    let top: number = rect.y;
    let bottom: number = rect.y + rect.height;

    if (edgeMovesRight(edge)) {
        right += dx;
    }
    if (edgeMovesLeft(edge)) {
        left += dx;
    }
    if (edgeMovesBottom(edge)) {
        bottom += dy;
    }
    if (edgeMovesTop(edge)) {
        top += dy;
    }

    const minWidth: number = Math.max(minSize.width, WINDOW_MIN_EXTENT);
    const minHeight: number = Math.max(minSize.height, WINDOW_MIN_EXTENT);

    if (right - left < minWidth) {
        if (edgeMovesLeft(edge)) {
            left = right - minWidth;
        } else {
            right = left + minWidth;
        }
    }
    if (bottom - top < minHeight) {
        if (edgeMovesTop(edge)) {
            top = bottom - minHeight;
        } else {
            bottom = top + minHeight;
        }
    }

    return { x: left, y: top, width: right - left, height: bottom - top };
}
