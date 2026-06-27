import { describe, expect, it } from 'vitest';

import { applyStep, clampToRange, normalizeStep } from './NumberStepper.logic';
import { EStepDirection } from './NumberStepper.types';

describe('normalizeStep', (): void => {
    it('keeps a positive step', (): void => {
        expect(normalizeStep(3)).toBe(3);
    });

    it('coerces zero and negative steps to 1 (Helicon MINIMUM_STEP)', (): void => {
        expect(normalizeStep(0)).toBe(1);
        expect(normalizeStep(-5)).toBe(1);
    });
});

describe('clampToRange', (): void => {
    it('clamps into an ordered range', (): void => {
        expect(clampToRange(15, 0, 10)).toBe(10);
        expect(clampToRange(-4, 0, 10)).toBe(0);
        expect(clampToRange(5, 0, 10)).toBe(5);
    });

    it('passes an inverted range (min > max) through untouched', (): void => {
        expect(clampToRange(42, 10, 0)).toBe(42);
    });
});

describe('applyStep', (): void => {
    it('increments and decrements within range', (): void => {
        expect(applyStep(5, EStepDirection.Increment, 2, 0, 10)).toBe(7);
        expect(applyStep(5, EStepDirection.Decrement, 2, 0, 10)).toBe(3);
    });

    it('saturates at the bound instead of overshooting', (): void => {
        expect(applyStep(9, EStepDirection.Increment, 5, 0, 10)).toBe(10);
        expect(applyStep(1, EStepDirection.Decrement, 5, 0, 10)).toBe(0);
    });

    it('clamps a +Infinity overflow candidate to the max bound', (): void => {
        const result: number = applyStep(
            5,
            EStepDirection.Increment,
            Number.POSITIVE_INFINITY,
            0,
            10,
        );
        expect(result).toBe(10);
        expect(Number.isFinite(result)).toBe(true);
    });

    it('clamps a -Infinity overflow candidate to the min bound', (): void => {
        const result: number = applyStep(
            5,
            EStepDirection.Decrement,
            Number.POSITIVE_INFINITY,
            0,
            10,
        );
        expect(result).toBe(0);
        expect(Number.isFinite(result)).toBe(true);
    });
});
