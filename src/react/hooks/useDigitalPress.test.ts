import { renderHook, type RenderHookResult } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EEnabledState } from '../../state/state';
import { type DigitalPressBinding, useDigitalPress } from './useDigitalPress';

describe('useDigitalPress', (): void => {
    it('returns a referentially stable binding across re-renders with unchanged inputs', (): void => {
        const view: RenderHookResult<DigitalPressBinding, unknown> = renderHook(
            (): DigitalPressBinding =>
                useDigitalPress({ enabled: EEnabledState.Enabled }),
        );

        const first: DigitalPressBinding = view.result.current;
        view.rerender();
        const second: DigitalPressBinding = view.result.current;

        expect(second.onPointerDown).toBe(first.onPointerDown);
        expect(second.onPointerUp).toBe(first.onPointerUp);
        expect(second.onPointerCancel).toBe(first.onPointerCancel);
        expect(second).toBe(first);
    });
});
