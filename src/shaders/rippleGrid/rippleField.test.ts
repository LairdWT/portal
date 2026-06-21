import { describe, expect, it } from 'vitest';

import { createRippleField, MAX_RIPPLES, type RippleField } from './rippleField';

describe('createRippleField', (): void => {
    it('sizes the structure-of-arrays to the ripple capacity', (): void => {
        const field: RippleField = createRippleField();
        expect(field.origins).toHaveLength(MAX_RIPPLES * 2);
        expect(field.startTimes).toHaveLength(MAX_RIPPLES);
    });

    it('writes a spawned ripple into the next slot', (): void => {
        const field: RippleField = createRippleField();
        field.spawn({ originU: 0.25, originV: 0.75, timeSeconds: 2 });
        expect(field.origins[0]).toBeCloseTo(0.25);
        expect(field.origins[1]).toBeCloseTo(0.75);
        expect(field.startTimes[0]).toBeCloseTo(2);
    });

    it('reuses the oldest slot once capacity is exceeded', (): void => {
        const field: RippleField = createRippleField();
        for (let index: number = 0; index <= MAX_RIPPLES; index++) {
            field.spawn({ originU: index / 100, originV: 0, timeSeconds: index });
        }
        // The (MAX_RIPPLES + 1)th spawn wraps back onto slot 0.
        expect(field.startTimes[0]).toBeCloseTo(MAX_RIPPLES);
    });
});
