import { describe, expect, it } from 'vitest';

import * as portal from './index';

// Freeze lock (runtime/value exports). Any rename, removal, or addition of a
// public VALUE export (component, hook, enum object, or function) changes this
// sorted inventory and produces a visible, reviewed diff. Type-only exports are
// erased at runtime, so this snapshot cannot see them; they are locked instead
// by src/index.types.contract.test.ts, which imports every type-only barrel
// export so deleting one breaks tsc. See the 1.0 stabilization plan, Track 3.
describe('public barrel value exports', (): void => {
    it('matches the frozen export-name inventory', (): void => {
        const names: readonly string[] = Object.keys(portal).sort();
        expect(names).toMatchSnapshot();
    });
});
