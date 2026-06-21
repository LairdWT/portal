import { useCallback, useMemo } from 'react';

import {
    type Axis2D,
    type EInputInteraction,
    type InputDescriptor,
    type InputSignal,
    type InputSource,
    type TimeProvider,
} from '../../input';
import { useTimeProvider } from '../TimeProviderContext';
import { useInputSource } from './useInputSource';

// Stable, clock-bound emit surface over useInputSource. Any control reuses this
// to push typed InputSignals without re-implementing the inputSource null-guard
// or the timestamp wiring. The returned emit functions are referentially stable
// across renders whose descriptor/onSignal are unchanged. A no-op (guarded) when
// no descriptor or onSignal was supplied, exactly like the raw producer.

export type EmitBinding = Readonly<{
    emitDigital: (pressed: boolean, interaction: EInputInteraction) => void;
    emitScalar: (scalar: number, interaction: EInputInteraction) => void;
    emitAxis2D: (axis: Axis2D, interaction: EInputInteraction) => void;
}>;

export function useEmitBinding(
    descriptor: InputDescriptor | undefined,
    onSignal: ((signal: InputSignal) => void) | undefined,
): EmitBinding {
    const timeProvider: TimeProvider = useTimeProvider();
    const inputSource: InputSource | null = useInputSource(
        descriptor,
        onSignal,
        timeProvider,
    );

    const emitDigital: EmitBinding['emitDigital'] = useCallback(
        (pressed: boolean, interaction: EInputInteraction): void => {
            if (inputSource === null) {
                return;
            }
            inputSource.emitDigital(pressed, interaction);
        },
        [inputSource],
    );

    const emitScalar: EmitBinding['emitScalar'] = useCallback(
        (scalar: number, interaction: EInputInteraction): void => {
            if (inputSource === null) {
                return;
            }
            inputSource.emitScalar(scalar, interaction);
        },
        [inputSource],
    );

    const emitAxis2D: EmitBinding['emitAxis2D'] = useCallback(
        (axis: Axis2D, interaction: EInputInteraction): void => {
            if (inputSource === null) {
                return;
            }
            inputSource.emitAxis2D(axis, interaction);
        },
        [inputSource],
    );

    return useMemo<EmitBinding>(
        (): EmitBinding => ({ emitDigital, emitScalar, emitAxis2D }),
        [emitDigital, emitScalar, emitAxis2D],
    );
}
