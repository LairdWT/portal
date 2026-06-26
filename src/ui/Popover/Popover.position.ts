// Pure positioning core for the Popover primitive. This module is React-free
// (zero React imports): it owns the flip/shift geometry plus the rectangle and
// coordinate types the Popover component feeds it, so the math stays testable in
// isolation and the component module keeps fast-refresh export purity and a clean
// logic/render split. Only EPopoverPlacement (a const-object enum, not a React
// value) is imported.

import { EPopoverPlacement } from './Popover.types';

// A minimal rectangle (a subset of DOMRect) the positioning math consumes.
export type PopoverRect = Readonly<{
    top: number;
    left: number;
    width: number;
    height: number;
}>;

export type PopoverViewport = Readonly<{
    width: number;
    height: number;
}>;

// The resolved fixed-position coordinates plus the side actually used after any
// flip, so the caller can mirror it onto data-placement.
export type PopoverCoords = Readonly<{
    top: number;
    left: number;
    placement: EPopoverPlacement;
}>;

export type ResolvePopoverPositionInput = Readonly<{
    anchor: PopoverRect;
    panel: PopoverRect;
    viewport: PopoverViewport;
    placement: EPopoverPlacement;
    offset: number;
    padding: number;
}>;

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

// Pure positioning: place the panel on the preferred side of the anchor, flip to
// the opposite side when the preferred side cannot fit but the opposite can, then
// shift along the cross axis to stay within the padded viewport. Coordinates are
// viewport-relative (the panel is position: fixed), so no scroll offset is added.
export function resolvePopoverPosition(
    input: ResolvePopoverPositionInput,
): PopoverCoords {
    const {
        anchor,
        panel,
        viewport,
        placement,
        offset,
        padding,
    }: ResolvePopoverPositionInput = input;
    const anchorBottom: number = anchor.top + anchor.height;
    const anchorRight: number = anchor.left + anchor.width;

    if (
        placement === EPopoverPlacement.Left ||
        placement === EPopoverPlacement.Right
    ) {
        const spaceRight: number = viewport.width - anchorRight - offset;
        const spaceLeft: number = anchor.left - offset;
        let resolved: EPopoverPlacement = placement;
        if (
            placement === EPopoverPlacement.Right &&
            panel.width > spaceRight &&
            panel.width <= spaceLeft
        ) {
            resolved = EPopoverPlacement.Left;
        } else if (
            placement === EPopoverPlacement.Left &&
            panel.width > spaceLeft &&
            panel.width <= spaceRight
        ) {
            resolved = EPopoverPlacement.Right;
        }
        const left: number =
            resolved === EPopoverPlacement.Right
                ? anchorRight + offset
                : anchor.left - panel.width - offset;
        const top: number = clampValue(
            anchor.top,
            padding,
            viewport.height - panel.height - padding,
        );
        return { top, left, placement: resolved };
    }

    const spaceBelow: number = viewport.height - anchorBottom - offset;
    const spaceAbove: number = anchor.top - offset;
    let resolved: EPopoverPlacement = placement;
    if (
        placement === EPopoverPlacement.Bottom &&
        panel.height > spaceBelow &&
        panel.height <= spaceAbove
    ) {
        resolved = EPopoverPlacement.Top;
    } else if (
        placement === EPopoverPlacement.Top &&
        panel.height > spaceAbove &&
        panel.height <= spaceBelow
    ) {
        resolved = EPopoverPlacement.Bottom;
    }
    const top: number =
        resolved === EPopoverPlacement.Bottom
            ? anchorBottom + offset
            : anchor.top - panel.height - offset;
    const left: number = clampValue(
        anchor.left,
        padding,
        viewport.width - panel.width - padding,
    );
    return { top, left, placement: resolved };
}

// Convert a live DOMRect into the minimal rectangle the positioning math uses.
export function toRect(rect: DOMRect): PopoverRect {
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
    };
}
