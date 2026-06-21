import { renderHook, type RenderHookResult } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
    type BindingResolution,
    createRegistry,
    type IInputBindingRegistry,
} from '../../input';
import { useInputBinding } from './useInputBinding';

const registry: IInputBindingRegistry = createRegistry([
    { inputId: 'fire', actionId: 'weapon.primary' },
    { inputId: 'select', actionId: 'ship.deploy', context: 'gameplay' },
]);

describe('useInputBinding', (): void => {
    it('resolves the bound action for an input', (): void => {
        const view: RenderHookResult<BindingResolution, unknown> = renderHook(
            (): BindingResolution => useInputBinding(registry, 'fire'),
        );

        expect(view.result.current.actionId).toBe('weapon.primary');
    });

    it('resolves a context-scoped action', (): void => {
        const view: RenderHookResult<BindingResolution, unknown> = renderHook(
            (): BindingResolution =>
                useInputBinding(registry, 'select', 'gameplay'),
        );

        expect(view.result.current.actionId).toBe('ship.deploy');
    });

    it('returns a stable resolution across re-renders for the same inputs', (): void => {
        const view: RenderHookResult<BindingResolution, unknown> = renderHook(
            (): BindingResolution => useInputBinding(registry, 'fire'),
        );

        const first: BindingResolution = view.result.current;
        view.rerender();

        expect(view.result.current).toBe(first);
    });
});
