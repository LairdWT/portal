// Memoized InputSource factory shared by every control.
//
// A control emits typed InputSignal values only when the caller supplied BOTH a
// descriptor (what the input is) and an onSignal sink (where signals go). This
// hook centralizes that guard and memoizes the producer so a fresh source is
// not built on every render or every interaction. An optional timeProvider is
// threaded into createInputSource so timestamps stay injectable end to end.

import { useMemo } from 'react';

import type {
    InputDescriptor,
    InputSignal,
    InputSource,
    TimeProvider,
} from '../../input';
import { createInputSource } from '../../input';

export function useInputSource(
    descriptor: InputDescriptor | undefined,
    onSignal: ((signal: InputSignal) => void) | undefined,
    timeProvider?: TimeProvider,
): InputSource | null {
    return useMemo<InputSource | null>((): InputSource | null => {
        if (descriptor === undefined || onSignal === undefined) {
            return null;
        }
        // Pass timeProvider only when defined to satisfy exactOptionalPropertyTypes.
        return createInputSource(
            timeProvider === undefined
                ? { descriptor, emit: onSignal }
                : { descriptor, emit: onSignal, timeProvider },
        );
    }, [descriptor, onSignal, timeProvider]);
}
