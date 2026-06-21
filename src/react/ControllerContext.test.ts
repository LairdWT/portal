import { renderHook, type RenderHookResult } from '@testing-library/react';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
    EInputInteraction,
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
    type InputSource,
} from '../input';
import { EEnabledState } from '../state/state';
import { ControllerProvider } from './ControllerProvider';
import { useInputSource } from './hooks/useInputSource';
import { useResolvedEnabled } from './hooks/useResolvedEnabled';

const descriptor: InputDescriptor = {
    id: 'fire',
    kind: EInputValueType.Digital,
    label: 'Fire',
};

type WrapperProps = Readonly<{ children: ReactNode }>;

function controllerWrapper(
    onSignal: ((signal: InputSignal) => void) | undefined,
    idNamespace: string | undefined,
    enabled: EEnabledState | undefined,
): (props: WrapperProps) => ReactElement {
    return function Wrapper({ children }: WrapperProps): ReactElement {
        return createElement(ControllerProvider, {
            onSignal,
            idNamespace,
            enabled,
            children,
        });
    };
}

describe('ControllerContext via useInputSource', (): void => {
    it('resolves onSignal from context and applies the id namespace', (): void => {
        const signals: InputSignal[] = [];
        const view: RenderHookResult<InputSource | null, unknown> = renderHook(
            (): InputSource | null => useInputSource(descriptor, undefined),
            {
                wrapper: controllerWrapper(
                    (signal: InputSignal): void => {
                        signals.push(signal);
                    },
                    'p1',
                    undefined,
                ),
            },
        );

        view.result.current?.emitDigital(true, EInputInteraction.Press);

        expect(signals).toHaveLength(1);
        expect(signals[0]?.descriptor.id).toBe('p1.fire');
    });

    it('lets an explicit onSignal override the context sink', (): void => {
        const contextSink: (signal: InputSignal) => void = vi.fn();
        const explicit: InputSignal[] = [];
        const view: RenderHookResult<InputSource | null, unknown> = renderHook(
            (): InputSource | null =>
                useInputSource(descriptor, (signal: InputSignal): void => {
                    explicit.push(signal);
                }),
            { wrapper: controllerWrapper(contextSink, undefined, undefined) },
        );

        view.result.current?.emitDigital(true, EInputInteraction.Press);

        expect(explicit).toHaveLength(1);
        expect(contextSink).not.toHaveBeenCalled();
    });

    it('is null when neither an explicit nor a context sink is present', (): void => {
        const view: RenderHookResult<InputSource | null, unknown> = renderHook(
            (): InputSource | null => useInputSource(descriptor, undefined),
        );

        expect(view.result.current).toBeNull();
    });
});

describe('useResolvedEnabled', (): void => {
    it('prefers an explicit value over context and default', (): void => {
        const view: RenderHookResult<EEnabledState, unknown> = renderHook(
            (): EEnabledState => useResolvedEnabled(EEnabledState.Disabled),
            {
                wrapper: controllerWrapper(
                    undefined,
                    undefined,
                    EEnabledState.Enabled,
                ),
            },
        );

        expect(view.result.current).toBe(EEnabledState.Disabled);
    });

    it('falls back to the context value when no explicit value is given', (): void => {
        const view: RenderHookResult<EEnabledState, unknown> = renderHook(
            (): EEnabledState => useResolvedEnabled(),
            {
                wrapper: controllerWrapper(
                    undefined,
                    undefined,
                    EEnabledState.Disabled,
                ),
            },
        );

        expect(view.result.current).toBe(EEnabledState.Disabled);
    });

    it('defaults to Enabled with no provider', (): void => {
        const view: RenderHookResult<EEnabledState, unknown> = renderHook(
            (): EEnabledState => useResolvedEnabled(),
        );

        expect(view.result.current).toBe(EEnabledState.Enabled);
    });
});
