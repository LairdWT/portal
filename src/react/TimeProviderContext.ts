import { type Context, createContext, useContext } from 'react';

import {
    performanceNowTimeProvider,
    type TimeProvider,
} from '../input/TimeProvider';

// Ambient clock for input hooks, defaulting to the browser performance clock.
// Override it (for example a host-synced or deterministic test clock) by
// wrapping a subtree in TimeProviderContext.Provider; input hooks read it via
// useTimeProvider unless given an explicit timeProvider option.
export const TimeProviderContext: Context<TimeProvider> =
    createContext<TimeProvider>(performanceNowTimeProvider);

export function useTimeProvider(): TimeProvider {
    return useContext(TimeProviderContext);
}
