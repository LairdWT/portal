// Memoized InputSource factory shared by every control.
//
// A control emits typed InputSignal values only when both a descriptor (what the
// input is) and an onSignal sink (where signals go) are available. Each may come
// from an explicit argument or, failing that, from the ambient ControllerContext
// (the sink and an optional descriptor-id namespace); an explicit argument always
// wins. This hook centralizes that resolution and the null-guard, and memoizes
// the producer so a fresh source is not built on every render or interaction. An
// optional timeProvider is threaded into createInputSource so timestamps stay
// injectable end to end.

import { useMemo } from 'react';

import type {
    InputDescriptor,
    InputSignal,
    InputSource,
    TimeProvider,
} from '../../input';
import { createInputSource } from '../../input';
import {
    type ControllerContextValue,
    useControllerContext,
} from '../ControllerContext';

export function useInputSource(
    descriptor: InputDescriptor | undefined,
    onSignal: ((signal: InputSignal) => void) | undefined,
    timeProvider?: TimeProvider,
): InputSource | null {
    const { onSignal: contextOnSignal, idNamespace }: ControllerContextValue =
        useControllerContext();

    const resolvedOnSignal: ((signal: InputSignal) => void) | undefined =
        onSignal ?? contextOnSignal;

    // Apply the context id namespace to the descriptor id when one is set, so
    // multiple controllers on a page never collide. A new descriptor object is
    // built only when a namespace applies, keeping referential stability.
    const resolvedDescriptor: InputDescriptor | undefined = useMemo<
        InputDescriptor | undefined
    >((): InputDescriptor | undefined => {
        if (descriptor === undefined) {
            return undefined;
        }
        if (idNamespace === undefined) {
            return descriptor;
        }
        return { ...descriptor, id: `${idNamespace}.${descriptor.id}` };
    }, [descriptor, idNamespace]);

    return useMemo<InputSource | null>((): InputSource | null => {
        if (resolvedDescriptor === undefined || resolvedOnSignal === undefined) {
            return null;
        }
        // Pass timeProvider only when defined to satisfy exactOptionalPropertyTypes.
        return createInputSource(
            timeProvider === undefined
                ? { descriptor: resolvedDescriptor, emit: resolvedOnSignal }
                : {
                      descriptor: resolvedDescriptor,
                      emit: resolvedOnSignal,
                      timeProvider,
                  },
        );
    }, [resolvedDescriptor, resolvedOnSignal, timeProvider]);
}
