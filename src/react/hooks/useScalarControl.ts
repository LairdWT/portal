// Reusable scalar control seam. A scalar control (Slider) reports a single
// continuous value; this hook binds that value to a Move InputSignal through the
// clock-bound emit surface so the control does not re-implement the inputSource
// guard or the interaction constant. The control keeps its own visual work (fill
// ratio, public onChange callback); this seam only owns emission. The returned
// binding is referentially stable across renders whose inputs are unchanged.

import { useCallback, useMemo } from 'react';

import {
    EInputInteraction,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { type EmitBinding, useEmitBinding } from './useEmitBinding';

export type ScalarControlBinding = Readonly<{
    emitScalar: (value: number) => void;
}>;

export function useScalarControl(
    descriptor: InputDescriptor | undefined,
    onSignal: ((signal: InputSignal) => void) | undefined,
): ScalarControlBinding {
    const { emitScalar: emitScalarSignal }: EmitBinding = useEmitBinding(
        descriptor,
        onSignal,
    );

    const emitMove: (value: number) => void = useCallback(
        (value: number): void => {
            emitScalarSignal(value, EInputInteraction.Move);
        },
        [emitScalarSignal],
    );

    return useMemo<ScalarControlBinding>(
        (): ScalarControlBinding => ({ emitScalar: emitMove }),
        [emitMove],
    );
}
