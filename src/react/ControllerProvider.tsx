// Provider for the ambient controller configuration. Memoizes the context value
// so a control's memoized InputSource is not rebuilt on every render (an inline
// object value would defeat that stability). Only the fields the consumer
// supplies are carried; each defaults to undefined, which resolves to the
// control's own prop and default.

import { type ReactElement, type ReactNode, useMemo } from 'react';

import type { InputSignal } from '../input';
import type { EEnabledState } from '../state/state';
import {
    ControllerContext,
    type ControllerContextValue,
} from './ControllerContext';

export type ControllerProviderProps = Readonly<{
    onSignal?: ((signal: InputSignal) => void) | undefined;
    enabled?: EEnabledState | undefined;
    idNamespace?: string | undefined;
    children: ReactNode;
}>;

export function ControllerProvider({
    onSignal,
    enabled,
    idNamespace,
    children,
}: ControllerProviderProps): ReactElement {
    const value: ControllerContextValue = useMemo<ControllerContextValue>(
        (): ControllerContextValue => ({ onSignal, enabled, idNamespace }),
        [onSignal, enabled, idNamespace],
    );

    return (
        <ControllerContext.Provider value={value}>
            {children}
        </ControllerContext.Provider>
    );
}
