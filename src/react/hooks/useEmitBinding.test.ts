import { renderHook, type RenderHookResult } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
    EInputInteraction,
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { type EmitBinding, useEmitBinding } from './useEmitBinding';

const descriptor: InputDescriptor = {
    id: 'pad',
    kind: EInputValueType.Axis2D,
    label: 'Pad',
};

describe('useEmitBinding', (): void => {
    it('emits a typed signal through the bound source', (): void => {
        const signals: InputSignal[] = [];
        const view: RenderHookResult<EmitBinding, unknown> = renderHook(
            (): EmitBinding =>
                useEmitBinding(descriptor, (signal: InputSignal): void => {
                    signals.push(signal);
                }),
        );

        view.result.current.emitAxis2D({ x: 0.5, y: -0.5 }, EInputInteraction.Move);

        expect(signals).toHaveLength(1);
        expect(signals[0]?.value).toEqual({
            valueType: EInputValueType.Axis2D,
            axis: { x: 0.5, y: -0.5 },
        });
        expect(signals[0]?.interaction).toBe(EInputInteraction.Move);
    });

    it('is a guarded no-op when no descriptor or onSignal is supplied', (): void => {
        const view: RenderHookResult<EmitBinding, unknown> = renderHook(
            (): EmitBinding => useEmitBinding(undefined, undefined),
        );

        expect((): void => {
            view.result.current.emitDigital(true, EInputInteraction.Press);
        }).not.toThrow();
    });

    it('returns referentially stable emit identities across re-renders', (): void => {
        const view: RenderHookResult<EmitBinding, unknown> = renderHook(
            (): EmitBinding => useEmitBinding(undefined, undefined),
        );

        const first: EmitBinding = view.result.current;
        view.rerender();

        expect(view.result.current).toBe(first);
    });
});
