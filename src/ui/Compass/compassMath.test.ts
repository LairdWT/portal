import { describe, expect, it } from 'vitest';

import {
    type CompassTick,
    compassTicks,
    headingDelta,
    nearestCardinal,
    normalizeHeading,
} from './compassMath';

describe('normalizeHeading', (): void => {
    it('wraps into [0, 360)', (): void => {
        expect(normalizeHeading(0)).toBe(0);
        expect(normalizeHeading(360)).toBe(0);
        expect(normalizeHeading(725)).toBe(5);
        expect(normalizeHeading(-90)).toBe(270);
    });

    it('reads non-finite input as north', (): void => {
        expect(normalizeHeading(Number.NaN)).toBe(0);
        expect(normalizeHeading(Number.POSITIVE_INFINITY)).toBe(0);
    });
});

describe('headingDelta', (): void => {
    it('returns the shortest signed turn', (): void => {
        expect(headingDelta(0, 90)).toBe(90);
        expect(headingDelta(90, 0)).toBe(-90);
        expect(headingDelta(350, 10)).toBe(20);
        expect(headingDelta(10, 350)).toBe(-20);
        expect(headingDelta(0, 180)).toBe(180);
    });
});

describe('nearestCardinal', (): void => {
    it('rounds to the nearest of the eight cardinals', (): void => {
        expect(nearestCardinal(0)).toBe('N');
        expect(nearestCardinal(21)).toBe('N');
        expect(nearestCardinal(23)).toBe('NE');
        expect(nearestCardinal(90)).toBe('E');
        expect(nearestCardinal(200)).toBe('S');
        expect(nearestCardinal(340)).toBe('N');
    });
});

describe('compassTicks', (): void => {
    it('yields no ticks for degenerate windows', (): void => {
        expect(compassTicks(0, 0, 15)).toEqual([]);
        expect(compassTicks(0, 90, 0)).toEqual([]);
        expect(compassTicks(0, Number.NaN, 15)).toEqual([]);
    });

    it('centers the window on the heading', (): void => {
        const ticks: readonly CompassTick[] = compassTicks(90, 90, 15);
        // 45..135 at step 15 = 7 ticks.
        expect(ticks.map((tick: CompassTick): number => tick.degrees)).toEqual([
            45, 60, 75, 90, 105, 120, 135,
        ]);
        const east: CompassTick | undefined = ticks.find(
            (tick: CompassTick): boolean => tick.degrees === 90,
        );
        expect(east?.offsetFraction).toBe(0);
        expect(east?.major).toBe(true);
        expect(east?.label).toBe('E');
        const edge: CompassTick | undefined = ticks.find(
            (tick: CompassTick): boolean => tick.degrees === 45,
        );
        expect(edge?.offsetFraction).toBe(-0.5);
        expect(edge?.label).toBe('NE');
    });

    it('wraps across the north seam', (): void => {
        const ticks: readonly CompassTick[] = compassTicks(0, 90, 15);
        expect(ticks.map((tick: CompassTick): number => tick.degrees)).toEqual([
            315, 330, 345, 0, 15, 30, 45,
        ]);
        const north: CompassTick | undefined = ticks.find(
            (tick: CompassTick): boolean => tick.degrees === 0,
        );
        expect(north?.offsetFraction).toBe(0);
        expect(north?.label).toBe('N');
        const west: CompassTick | undefined = ticks.find(
            (tick: CompassTick): boolean => tick.degrees === 315,
        );
        expect(west?.offsetFraction).toBe(-0.5);
        expect(west?.label).toBe('NW');
    });

    it('marks only 45-degree ticks as labelled majors', (): void => {
        const ticks: readonly CompassTick[] = compassTicks(90, 90, 15);
        for (const tick of ticks) {
            if (tick.degrees % 45 === 0) {
                expect(tick.major).toBe(true);
                expect(tick.label).toBeDefined();
            } else {
                expect(tick.major).toBe(false);
                expect(tick.label).toBeUndefined();
            }
        }
    });
});
