import { describe, expect, it } from 'vitest';

import type { Axis2D } from './InputContract';
import { applyDeadZone, type RectLike, resolveAxis2D } from './PointerSpine';

describe('applyDeadZone', () => {
    it('collapses a magnitude at or below the dead zone to zero', () => {
        const belowEdge: number = applyDeadZone(0.1, 0.2);
        const atEdge: number = applyDeadZone(0.2, 0.2);

        expect(belowEdge).toBe(0);
        expect(atEdge).toBe(0);
    });

    it('maps a full magnitude of one to one', () => {
        const result: number = applyDeadZone(1, 0.2);

        expect(result).toBe(1);
    });

    it('rescales a midpoint magnitude across the live span', () => {
        // Dead zone 0.5 leaves a span of 0.5; a raw 0.75 sits halfway across it.
        const result: number = applyDeadZone(0.75, 0.5);

        expect(result).toBeCloseTo(0.5, 10);
    });

    it('treats a dead zone of one or greater as a fully dead surface', () => {
        const atOne: number = applyDeadZone(1, 1);
        const aboveOne: number = applyDeadZone(1, 1.5);

        expect(atOne).toBe(0);
        expect(aboveOne).toBe(0);
    });

    it('clamps a magnitude above one back to one', () => {
        const result: number = applyDeadZone(2, 0.2);

        expect(result).toBe(1);
    });
});

describe('resolveAxis2D', () => {
    const rect: RectLike = { width: 200, height: 200, left: 0, top: 0 };

    it('returns a centred axis for a click at the rectangle centre', () => {
        const axis: Axis2D = resolveAxis2D(rect, 100, 100, 0);

        expect(axis).toEqual({ x: 0, y: 0 });
    });

    it('returns a centred axis for a zero-size rectangle', () => {
        const zeroRect: RectLike = { width: 0, height: 0, left: 0, top: 0 };
        const axis: Axis2D = resolveAxis2D(zeroRect, 50, 50, 0);

        expect(axis).toEqual({ x: 0, y: 0 });
    });

    it('produces a unit-ish vector inside the unit circle for an edge click', () => {
        // Right edge of the surface: positive x, no vertical component.
        const axis: Axis2D = resolveAxis2D(rect, 200, 100, 0);
        const magnitude: number = Math.hypot(axis.x, axis.y);

        expect(axis.x).toBeGreaterThan(0);
        expect(axis.y).toBeCloseTo(0, 10);
        expect(magnitude).toBeGreaterThan(0);
        expect(magnitude).toBeLessThanOrEqual(1);
    });
});
