import { describe, expect, it } from 'vitest';

import { isWebGlAvailable } from './webglSupport';

describe('isWebGlAvailable', (): void => {
    it('returns a boolean capability result', (): void => {
        const available: boolean = isWebGlAvailable();

        expect(typeof available).toBe('boolean');
    });
});
