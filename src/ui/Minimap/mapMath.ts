// Pure projection math for the Minimap. React-free and DOM-free (the
// gaugeMath split) so the world-to-viewport arithmetic stays unit-testable.
// World coordinates use the game convention (+x east, +y north); the
// viewport lives in the SVG's 0..100 viewBox with the center at (50, 50)
// and +y down. Angles follow polygonMath's polar convention (degrees
// clockwise from straight up), so a heading of 90 faces east.

import {
    type Point,
    polarPoint,
    RADIANS_PER_DEGREE,
    roundCoordinate,
} from '../polygonMath';

// A world position (or the viewport offset derived from one).
export type MapPoint = Readonly<{ x: number; y: number }>;

// Center of the 0..100 viewBox.
export const MINIMAP_VIEWBOX_CENTER: number = 50;

// Usable marker radius in viewBox units (a margin stays for the rim).
export const MINIMAP_VIEW_RADIUS: number = 45;

// One projected marker: viewBox coordinates plus whether the marker sits
// outside the range and was pinned to the frame edge.
export type MinimapProjection = Readonly<{
    x: number;
    y: number;
    clamped: boolean;
}>;

const CENTER_PROJECTION: MinimapProjection = {
    x: MINIMAP_VIEWBOX_CENTER,
    y: MINIMAP_VIEWBOX_CENTER,
    clamped: false,
};

// The bearing of a viewport offset, degrees clockwise from up. The polar
// inverse of polygonMath's polarPoint.
export function offsetBearing(x: number, y: number): number {
    return Math.atan2(x, -y) / RADIANS_PER_DEGREE;
}

// Project a world position onto the minimap viewport. `rangeWorld` world
// units map onto the view radius; `headingDegrees` rotates the map so the
// facing points up (pass 0 for a north-up map); `square` clamps out-of-range
// markers to the square frame instead of the circular ring. Degenerate
// input (a non-positive range, non-finite coordinates) resolves to the
// center, unclamped.
export function projectMarker(
    world: MapPoint,
    center: MapPoint,
    rangeWorld: number,
    headingDegrees: number,
    square: boolean,
): MinimapProjection {
    if (!Number.isFinite(rangeWorld) || rangeWorld <= 0) {
        return CENTER_PROJECTION;
    }
    const east: number = world.x - center.x;
    const north: number = world.y - center.y;
    if (!Number.isFinite(east) || !Number.isFinite(north)) {
        return CENTER_PROJECTION;
    }

    const scale: number = MINIMAP_VIEW_RADIUS / rangeWorld;
    let x: number = east * scale;
    let y: number = -north * scale;
    const radius: number = Math.hypot(x, y);

    // Heading-up: rotate the offset by -heading, so a marker dead ahead
    // renders straight up regardless of the facing.
    if (headingDegrees !== 0 && radius > 0) {
        const bearing: number = offsetBearing(x, y);
        const rotated: Point = polarPoint(radius, bearing - headingDegrees);
        x = rotated.x;
        y = rotated.y;
    }

    let clamped: boolean = false;
    if (square) {
        const extent: number = Math.max(Math.abs(x), Math.abs(y));
        if (extent > MINIMAP_VIEW_RADIUS) {
            const factor: number = MINIMAP_VIEW_RADIUS / extent;
            x *= factor;
            y *= factor;
            clamped = true;
        }
    } else if (radius > MINIMAP_VIEW_RADIUS) {
        const factor: number = MINIMAP_VIEW_RADIUS / radius;
        x *= factor;
        y *= factor;
        clamped = true;
    }

    return {
        x: roundCoordinate(MINIMAP_VIEWBOX_CENTER + x),
        y: roundCoordinate(MINIMAP_VIEWBOX_CENTER + y),
        clamped,
    };
}
