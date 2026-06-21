import { renderHook, type RenderHookResult } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
    EInputInteraction,
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
    type InputSource,
    type TimeProvider,
} from '../../input';
import { useInputSource } from './useInputSource';

const descriptor: InputDescriptor = {
    id: 'test-input',
    kind: EInputValueType.Digital,
    label: 'Test',
};

describe('useInputSource', (): void => {
    it('returns null when descriptor or onSignal is missing', (): void => {
        const view: RenderHookResult<InputSource | null, unknown> = renderHook(
            (): InputSource | null => useInputSource(undefined, undefined),
        );
        expect(view.result.current).toBeNull();
    });

    it('threads an injected time provider into emitted timestamps', (): void => {
        const signals: InputSignal[] = [];
        const fakeClock: TimeProvider = (): number => 4242;
        const view: RenderHookResult<InputSource | null, unknown> = renderHook(
            (): InputSource | null =>
                useInputSource(
                    descriptor,
                    (signal: InputSignal): void => {
                        signals.push(signal);
                    },
                    fakeClock,
                ),
        );

        view.result.current?.emitDigital(true, EInputInteraction.Press);

        expect(signals).toHaveLength(1);
        expect(signals[0]?.timeStampMs).toBe(4242);
    });

    it('defaults the timestamp to 0 when no provider is supplied', (): void => {
        const signals: InputSignal[] = [];
        const view: RenderHookResult<InputSource | null, unknown> = renderHook(
            (): InputSource | null =>
                useInputSource(descriptor, (signal: InputSignal): void => {
                    signals.push(signal);
                }),
        );

        view.result.current?.emitDigital(true, EInputInteraction.Press);

        expect(signals[0]?.timeStampMs).toBe(0);
    });
});
