import { renderHook, type RenderHookResult } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
    EInputInteraction,
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { type ScalarControlBinding, useScalarControl } from './useScalarControl';

const descriptor: InputDescriptor = {
    id: 'throttle',
    kind: EInputValueType.Scalar,
    label: 'Throttle',
};

describe('useScalarControl', (): void => {
    it('emits a Move scalar signal carrying the value', (): void => {
        const signals: InputSignal[] = [];
        const view: RenderHookResult<ScalarControlBinding, unknown> = renderHook(
            (): ScalarControlBinding =>
                useScalarControl(descriptor, (signal: InputSignal): void => {
                    signals.push(signal);
                }),
        );

        view.result.current.emitScalar(42);

        expect(signals).toHaveLength(1);
        expect(signals[0]?.value).toEqual({
            valueType: EInputValueType.Scalar,
            scalar: 42,
        });
        expect(signals[0]?.interaction).toBe(EInputInteraction.Move);
    });

    it('is a guarded no-op when no descriptor or onSignal is supplied', (): void => {
        const view: RenderHookResult<ScalarControlBinding, unknown> = renderHook(
            (): ScalarControlBinding => useScalarControl(undefined, undefined),
        );

        expect((): void => {
            view.result.current.emitScalar(1);
        }).not.toThrow();
    });

    it('returns referentially stable binding identity across re-renders', (): void => {
        const view: RenderHookResult<ScalarControlBinding, unknown> = renderHook(
            (): ScalarControlBinding => useScalarControl(undefined, undefined),
        );

        const first: ScalarControlBinding = view.result.current;
        view.rerender();

        expect(view.result.current).toBe(first);
    });
});
