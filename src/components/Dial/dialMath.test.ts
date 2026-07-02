import { describe, expect, it } from 'vitest';

import {
    DIAL_END_DEGREES,
    DIAL_START_DEGREES,
    DIAL_SWEEP_DEGREES,
    nearestDetent,
    pointerAngle,
    quantize,
    wrapDeltaDegrees,
} from './dialMath';

describe('dial sweep constants', (): void => {
    it('shares the Gauge instrument sweep', (): void => {
        expect(DIAL_START_DEGREES).toBe(-135);
        expect(DIAL_END_DEGREES).toBe(135);
        expect(DIAL_SWEEP_DEGREES).toBe(270);
    });
});

describe('pointerAngle', (): void => {
    it('maps the cardinal directions clockwise from up', (): void => {
        expect(pointerAngle(50, 10, 50, 50)).toBe(0);
        expect(pointerAngle(90, 50, 50, 50)).toBe(90);
        expect(pointerAngle(50, 90, 50, 50)).toBe(180);
        expect(pointerAngle(10, 50, 50, 50)).toBe(-90);
    });

    it('maps the diagonals', (): void => {
        expect(pointerAngle(90, 10, 50, 50)).toBe(45);
        expect(pointerAngle(10, 10, 50, 50)).toBe(-45);
    });
});

describe('wrapDeltaDegrees', (): void => {
    it('passes short-way deltas through', (): void => {
        expect(wrapDeltaDegrees(90)).toBe(90);
        expect(wrapDeltaDegrees(-90)).toBe(-90);
        expect(wrapDeltaDegrees(180)).toBe(180);
    });

    it('wraps seam crossings onto the short way', (): void => {
        // A twist crossing the bottom seam: 170 -> -170 reads as +20.
        expect(wrapDeltaDegrees(-340)).toBe(20);
        expect(wrapDeltaDegrees(340)).toBe(-20);
        expect(wrapDeltaDegrees(-180)).toBe(180);
    });

    it('reads a non-finite delta as no rotation', (): void => {
        expect(wrapDeltaDegrees(Number.NaN)).toBe(0);
        expect(wrapDeltaDegrees(Number.POSITIVE_INFINITY)).toBe(0);
    });
});

describe('quantize', (): void => {
    it('snaps onto the step lattice anchored at min', (): void => {
        expect(quantize(33.4, 0, 100, 1)).toBe(33);
        expect(quantize(33.5, 0, 100, 1)).toBe(34);
        expect(quantize(7, 0, 100, 5)).toBe(5);
    });

    it('clamps to the bounds', (): void => {
        expect(quantize(-10, 0, 100, 1)).toBe(0);
        expect(quantize(250, 0, 100, 1)).toBe(100);
    });

    it('rounds to the step precision so float artifacts never escape', (): void => {
        expect(quantize(0.30000000000000004, 0, 1, 0.1)).toBe(0.3);
    });
});

describe('nearestDetent', (): void => {
    it('settles onto the nearest detent', (): void => {
        expect(nearestDetent(33, [0, 50, 100], 0, 100)).toBe(50);
        expect(nearestDetent(20, [0, 50, 100], 0, 100)).toBe(0);
    });

    it('clamps out-of-range detents before comparison', (): void => {
        expect(nearestDetent(95, [0, 500], 0, 100)).toBe(100);
    });

    it('ignores non-finite detents and passes through when none are usable', (): void => {
        expect(nearestDetent(33, [Number.NaN, 30], 0, 100)).toBe(30);
        expect(nearestDetent(33, [], 0, 100)).toBe(33);
        expect(nearestDetent(33, [Number.NaN], 0, 100)).toBe(33);
    });
});
