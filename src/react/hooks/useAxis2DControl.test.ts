import { renderHook, type RenderHookResult } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
    EInputInteraction,
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import {
    type Axis2DControlBinding,
    EAxis2DSource,
    useAxis2DControl,
} from './useAxis2DControl';

const descriptor: InputDescriptor = {
    id: 'stick',
    kind: EInputValueType.Axis2D,
    label: 'Stick',
};

describe('useAxis2DControl', (): void => {
    it('emits a Move axis signal carrying the raw vector', (): void => {
        const signals: InputSignal[] = [];
        const view: RenderHookResult<
            Axis2DControlBinding<HTMLDivElement>,
            unknown
        > = renderHook(
            (): Axis2DControlBinding<HTMLDivElement> =>
                useAxis2DControl<HTMLDivElement>({
                    mode: EAxis2DSource.Absolute,
                    onVector: vi.fn(),
                    descriptor,
                    onSignal: (signal: InputSignal): void => {
                        signals.push(signal);
                    },
                }),
        );

        view.result.current.emitAxis2D({ x: 0.25, y: -0.75 });

        expect(signals).toHaveLength(1);
        expect(signals[0]?.value).toEqual({
            valueType: EInputValueType.Axis2D,
            axis: { x: 0.25, y: -0.75 },
        });
        expect(signals[0]?.interaction).toBe(EInputInteraction.Move);
    });

    it('exposes ref and pointer handlers for both source modes', (): void => {
        const absolute: RenderHookResult<
            Axis2DControlBinding<HTMLDivElement>,
            unknown
        > = renderHook(
            (): Axis2DControlBinding<HTMLDivElement> =>
                useAxis2DControl<HTMLDivElement>({
                    mode: EAxis2DSource.Absolute,
                    onVector: vi.fn(),
                }),
        );
        const relative: RenderHookResult<
            Axis2DControlBinding<HTMLDivElement>,
            unknown
        > = renderHook(
            (): Axis2DControlBinding<HTMLDivElement> =>
                useAxis2DControl<HTMLDivElement>({
                    mode: EAxis2DSource.Relative,
                    onVector: vi.fn(),
                }),
        );

        for (const binding of [absolute.result.current, relative.result.current]) {
            expect(binding.ref).toHaveProperty('current');
            expect(typeof binding.onPointerDown).toBe('function');
            expect(typeof binding.onPointerMove).toBe('function');
            expect(typeof binding.onPointerUp).toBe('function');
            expect(typeof binding.onPointerCancel).toBe('function');
            expect(typeof binding.emitAxis2D).toBe('function');
        }
    });

    it('is a guarded no-op when no descriptor or onSignal is supplied', (): void => {
        const onVector: (vector: { x: number; y: number }) => void = vi.fn();
        const view: RenderHookResult<
            Axis2DControlBinding<HTMLDivElement>,
            unknown
        > = renderHook(
            (): Axis2DControlBinding<HTMLDivElement> =>
                useAxis2DControl<HTMLDivElement>({
                    mode: EAxis2DSource.Absolute,
                    onVector,
                }),
        );

        expect((): void => {
            view.result.current.emitAxis2D({ x: 1, y: 1 });
        }).not.toThrow();
    });

    it('returns referentially stable binding identity across re-renders', (): void => {
        const onVector: (vector: { x: number; y: number }) => void = vi.fn();
        const view: RenderHookResult<
            Axis2DControlBinding<HTMLDivElement>,
            unknown
        > = renderHook(
            (): Axis2DControlBinding<HTMLDivElement> =>
                useAxis2DControl<HTMLDivElement>({
                    mode: EAxis2DSource.Absolute,
                    onVector,
                }),
        );

        const first: Axis2DControlBinding<HTMLDivElement> = view.result.current;
        view.rerender();

        expect(view.result.current).toBe(first);
    });
});
