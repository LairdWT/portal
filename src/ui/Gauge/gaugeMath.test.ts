import { describe, expect, it } from 'vitest';

import {
    arcPath,
    GAUGE_END_DEGREES,
    GAUGE_START_DEGREES,
    GAUGE_SWEEP_DEGREES,
    gaugeAngle,
    gaugeFraction,
    gaugePoint,
} from './gaugeMath';

describe('gaugeFraction', (): void => {
    it('maps the value linearly across the span', (): void => {
        expect(gaugeFraction(50, 0, 100)).toBe(0.5);
        expect(gaugeFraction(25, 0, 100)).toBe(0.25);
        expect(gaugeFraction(30, 20, 40)).toBe(0.5);
    });

    it('clamps values outside the bounds', (): void => {
        expect(gaugeFraction(-10, 0, 100)).toBe(0);
        expect(gaugeFraction(250, 0, 100)).toBe(1);
    });

    it('reads a degenerate or inverted span as empty', (): void => {
        expect(gaugeFraction(5, 10, 10)).toBe(0);
        expect(gaugeFraction(5, 10, 0)).toBe(0);
    });

    it('reads a non-finite value as empty', (): void => {
        expect(gaugeFraction(Number.NaN, 0, 100)).toBe(0);
        expect(gaugeFraction(Number.POSITIVE_INFINITY, 0, 100)).toBe(0);
    });
});

describe('gaugeAngle', (): void => {
    it('spans the sweep from start to end', (): void => {
        expect(gaugeAngle(0)).toBe(GAUGE_START_DEGREES);
        expect(gaugeAngle(1)).toBe(GAUGE_END_DEGREES);
        expect(gaugeAngle(0.5)).toBe(GAUGE_START_DEGREES + GAUGE_SWEEP_DEGREES / 2);
    });

    it('clamps fractions outside 0..1', (): void => {
        expect(gaugeAngle(-1)).toBe(GAUGE_START_DEGREES);
        expect(gaugeAngle(2)).toBe(GAUGE_END_DEGREES);
    });
});

describe('gaugePoint', (): void => {
    it('places the cardinal directions around the viewBox center', (): void => {
        expect(gaugePoint(40, 0)).toEqual({ x: 50, y: 10 });
        expect(gaugePoint(40, 90)).toEqual({ x: 90, y: 50 });
        expect(gaugePoint(40, 180)).toEqual({ x: 50, y: 90 });
        expect(gaugePoint(40, -90)).toEqual({ x: 10, y: 50 });
    });

    it('rounds to the emitted precision', (): void => {
        // sin(-135 deg) = -0.7071..., scaled by 40 and offset from center.
        expect(gaugePoint(40, -135)).toEqual({ x: 21.716, y: 78.284 });
    });
});

describe('arcPath', (): void => {
    it('emits a clockwise arc with the large-arc flag on the full sweep', (): void => {
        const path: string = arcPath(GAUGE_START_DEGREES, GAUGE_END_DEGREES, 40);
        expect(path).toBe('M 21.716 78.284 A 40 40 0 1 1 78.284 78.284');
    });

    it('drops the large-arc flag under a half turn', (): void => {
        const path: string = arcPath(0, 90, 40);
        expect(path).toContain(' A 40 40 0 0 1 ');
    });

    it('yields the empty string for degenerate spans', (): void => {
        expect(arcPath(90, 90, 40)).toBe('');
        expect(arcPath(90, 0, 40)).toBe('');
    });

    it('yields the empty string for non-finite or non-positive input', (): void => {
        expect(arcPath(Number.NaN, 90, 40)).toBe('');
        expect(arcPath(0, Number.POSITIVE_INFINITY, 40)).toBe('');
        expect(arcPath(0, 90, 0)).toBe('');
        expect(arcPath(0, 90, Number.NaN)).toBe('');
    });
});
