import { describe, expect, it } from 'vitest';

import {
    MINIMAP_VIEW_RADIUS,
    MINIMAP_VIEWBOX_CENTER,
    type MinimapProjection,
    offsetBearing,
    projectMarker,
} from './mapMath';

const ORIGIN: Readonly<{ x: number; y: number }> = { x: 0, y: 0 };

describe('offsetBearing', (): void => {
    it('reads the four cardinal offsets', (): void => {
        expect(offsetBearing(0, -1)).toBe(0); // up
        expect(offsetBearing(1, 0)).toBe(90); // right
        expect(Math.abs(offsetBearing(0, 1))).toBe(180); // down
        expect(offsetBearing(-1, 0)).toBe(-90); // left
    });
});

describe('projectMarker', (): void => {
    it('projects the center world position to the viewBox center', (): void => {
        expect(projectMarker(ORIGIN, ORIGIN, 100, 0, false)).toEqual({
            x: MINIMAP_VIEWBOX_CENTER,
            y: MINIMAP_VIEWBOX_CENTER,
            clamped: false,
        });
    });

    it('maps north to up and east to right on a north-up map', (): void => {
        const north: MinimapProjection = projectMarker(
            { x: 0, y: 100 },
            ORIGIN,
            100,
            0,
            false,
        );
        expect(north).toEqual({
            x: 50,
            y: 50 - MINIMAP_VIEW_RADIUS,
            clamped: false,
        });
        const east: MinimapProjection = projectMarker(
            { x: 50, y: 0 },
            ORIGIN,
            100,
            0,
            false,
        );
        expect(east).toEqual({
            x: 50 + MINIMAP_VIEW_RADIUS / 2,
            y: 50,
            clamped: false,
        });
    });

    it('rotates the map under a heading so dead-ahead renders up', (): void => {
        // Facing east (090): a marker due east projects straight up.
        const ahead: MinimapProjection = projectMarker(
            { x: 100, y: 0 },
            ORIGIN,
            100,
            90,
            false,
        );
        expect(ahead.x).toBeCloseTo(50, 3);
        expect(ahead.y).toBeCloseTo(50 - MINIMAP_VIEW_RADIUS, 3);
        // ...and a marker due north swings to the left edge.
        const port: MinimapProjection = projectMarker(
            { x: 0, y: 100 },
            ORIGIN,
            100,
            90,
            false,
        );
        expect(port.x).toBeCloseTo(50 - MINIMAP_VIEW_RADIUS, 3);
        expect(port.y).toBeCloseTo(50, 3);
    });

    it('pins an out-of-range marker to the ring', (): void => {
        const far: MinimapProjection = projectMarker(
            { x: 0, y: 300 },
            ORIGIN,
            100,
            0,
            false,
        );
        expect(far).toEqual({
            x: 50,
            y: 50 - MINIMAP_VIEW_RADIUS,
            clamped: true,
        });
    });

    it('pins an out-of-range marker to the square frame', (): void => {
        // Far north-east: the circle clamp would pull both axes inside the
        // square; the square clamp pins to the corner region instead.
        const corner: MinimapProjection = projectMarker(
            { x: 300, y: 300 },
            ORIGIN,
            100,
            0,
            true,
        );
        expect(corner.x).toBeCloseTo(50 + MINIMAP_VIEW_RADIUS, 3);
        expect(corner.y).toBeCloseTo(50 - MINIMAP_VIEW_RADIUS, 3);
        expect(corner.clamped).toBe(true);
    });

    it('keeps an in-range diagonal unclamped', (): void => {
        const near: MinimapProjection = projectMarker(
            { x: 30, y: 30 },
            ORIGIN,
            100,
            0,
            false,
        );
        expect(near.clamped).toBe(false);
        expect(near.x).toBeCloseTo(50 + 13.5, 1);
        expect(near.y).toBeCloseTo(50 - 13.5, 1);
    });

    it('resolves degenerate input to the unclamped center', (): void => {
        expect(projectMarker({ x: 10, y: 10 }, ORIGIN, 0, 0, false)).toEqual({
            x: 50,
            y: 50,
            clamped: false,
        });
        expect(
            projectMarker({ x: Number.NaN, y: 10 }, ORIGIN, 100, 0, false),
        ).toEqual({ x: 50, y: 50, clamped: false });
    });
});
