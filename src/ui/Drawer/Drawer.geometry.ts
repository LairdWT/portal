// Pure, side-effect-free edge -> axis / orientation / resize-sign geometry for
// Drawer. This module is React-free and DOM-mutation-free (it only reads the
// EDrawerEdge const-object enum), so the resize math stays unit-testable in
// isolation and the component module keeps Fast-Refresh export purity - the same
// split Popover.position.ts uses.
//
// The dock edge decides four things: which pointer axis a drag runs along, the
// separator's aria-orientation, the SIGN that maps a drag delta to a size change
// (a start-docked panel grows toward the positive axis; an end-docked panel
// grows toward the negative axis), and the clamp to [minSize, maxSize].

import { EDrawerEdge } from './Drawer.types';

// The pointer axis a resize drag runs along. 'x' for the inline (side) edges,
// 'y' for the block-end (bottom) edge. Mirrors usePointerDrag's axisLock.
export type DrawerDragAxis = 'x' | 'y';

// The WAI-ARIA window-splitter orientation: a vertical separator divides
// left / right (the inline side edges); a horizontal separator divides
// top / bottom (the block-end bottom edge).
export type DrawerSeparatorOrientation = 'horizontal' | 'vertical';

// Resolve the drag axis for an edge.
export function edgeAxis(edge: EDrawerEdge): DrawerDragAxis {
    switch (edge) {
        case EDrawerEdge.InlineStart:
        case EDrawerEdge.InlineEnd:
            return 'x';
        case EDrawerEdge.BlockEnd:
            return 'y';
    }
}

// Resolve the separator orientation for an edge.
export function edgeOrientation(edge: EDrawerEdge): DrawerSeparatorOrientation {
    switch (edge) {
        case EDrawerEdge.InlineStart:
        case EDrawerEdge.InlineEnd:
            return 'vertical';
        case EDrawerEdge.BlockEnd:
            return 'horizontal';
    }
}

// The sign that converts a positive-axis drag delta (rightward dx / downward dy)
// into a size change. A start-docked panel (InlineStart) GROWS as the pointer
// moves right, so +1. An end-docked panel (InlineEnd / BlockEnd) grows as the
// pointer moves toward the negative axis (left / up), so -1.
export function resizeSign(edge: EDrawerEdge): number {
    switch (edge) {
        case EDrawerEdge.InlineStart:
            return 1;
        case EDrawerEdge.InlineEnd:
        case EDrawerEdge.BlockEnd:
            return -1;
    }
}

// Clamp a candidate size into [minSize, maxSize]. An inverted range (max < min)
// collapses to the floor so a misconfigured pair never yields a value above the
// requested minimum.
export function clampSize(size: number, minSize: number, maxSize: number): number {
    if (maxSize < minSize) {
        return minSize;
    }
    if (size < minSize) {
        return minSize;
    }
    if (size > maxSize) {
        return maxSize;
    }
    return size;
}

// Map a cumulative pointer delta (dx, dy from the gesture origin) to the next
// clamped size for the edge. Only the on-axis component is used; the sign routes
// the growth direction per edge.
export function sizeFromDrag(
    edge: EDrawerEdge,
    startSize: number,
    dx: number,
    dy: number,
    minSize: number,
    maxSize: number,
): number {
    const axisDelta: number = edgeAxis(edge) === 'x' ? dx : dy;
    const next: number = startSize + resizeSign(edge) * axisDelta;
    return clampSize(next, minSize, maxSize);
}

// Settle a released size onto the nearest snap point. Points are clamped
// into [minSize, maxSize] before comparison so an out-of-range point can
// never win; non-finite points are ignored. Without any usable point the
// size passes through unchanged (snapping is opt-in per gesture end).
export function nearestSnap(
    size: number,
    snapPoints: readonly number[],
    minSize: number,
    maxSize: number,
): number {
    let best: number | null = null;
    let bestDistance: number = Number.POSITIVE_INFINITY;
    for (const point of snapPoints) {
        if (!Number.isFinite(point)) {
            continue;
        }
        const clamped: number = clampSize(point, minSize, maxSize);
        const distance: number = Math.abs(clamped - size);
        if (distance < bestDistance) {
            best = clamped;
            bestDistance = distance;
        }
    }
    return best ?? size;
}

// The signed unit step a single arrow press contributes along the edge axis: +1
// for ArrowRight (vertical separator) / ArrowDown (horizontal), -1 for
// ArrowLeft / ArrowUp, and null for any other key or a cross-axis arrow (which
// the splitter ignores, per the APG).
function arrowAxisDelta(axis: DrawerDragAxis, key: string): number | null {
    if (axis === 'x') {
        if (key === 'ArrowRight') {
            return 1;
        }
        if (key === 'ArrowLeft') {
            return -1;
        }
        return null;
    }
    if (key === 'ArrowDown') {
        return 1;
    }
    if (key === 'ArrowUp') {
        return -1;
    }
    return null;
}

// Map a keyboard resize key to the next clamped size, or null when the key is not
// a resize control for this edge. Home / End jump to the bounds; the on-axis
// arrows step by `step` in the grow direction; cross-axis arrows are ignored.
export function sizeFromKey(
    edge: EDrawerEdge,
    currentSize: number,
    key: string,
    step: number,
    minSize: number,
    maxSize: number,
): number | null {
    if (key === 'Home') {
        return minSize;
    }
    if (key === 'End') {
        // End jumps to the upper bound, but an unbounded panel (no maxSize, so
        // maxSize === +Infinity) has no finite maximum to jump to; ignore End
        // rather than emit a non-finite size into onSizeChange / aria-valuenow.
        if (!Number.isFinite(maxSize)) {
            return null;
        }
        return maxSize;
    }
    const axisDelta: number | null = arrowAxisDelta(edgeAxis(edge), key);
    if (axisDelta === null) {
        return null;
    }
    const next: number = currentSize + resizeSign(edge) * axisDelta * step;
    return clampSize(next, minSize, maxSize);
}
