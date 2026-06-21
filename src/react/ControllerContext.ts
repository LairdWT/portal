// Ambient controller configuration shared by every control in a subtree. A
// consumer wires the cross-cutting pieces once - the signal sink, a
// controller-wide enabled gate, and an optional descriptor-id namespace -
// instead of drilling them into every control. This mirrors TimeProviderContext:
// a control reads these values ambiently, and an explicit prop always overrides
// the ambient value. With no provider mounted every field is undefined, so
// behavior is identical to passing the props directly. No DOM globals.

import { type Context, createContext, useContext } from 'react';

import type { InputSignal } from '../input';
import type { EEnabledState } from '../state/state';

export type ControllerContextValue = Readonly<{
    onSignal?: ((signal: InputSignal) => void) | undefined;
    enabled?: EEnabledState | undefined;
    idNamespace?: string | undefined;
}>;

const EMPTY_CONTROLLER_CONTEXT: ControllerContextValue = {};

export const ControllerContext: Context<ControllerContextValue> =
    createContext<ControllerContextValue>(EMPTY_CONTROLLER_CONTEXT);

export function useControllerContext(): ControllerContextValue {
    return useContext(ControllerContext);
}
