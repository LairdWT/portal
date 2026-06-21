// Ambient selection sink for the generic UI layer. A SelectableTile (or other
// selectable surface) with no explicit onSelect falls back to this context's
// onSelect(id), so a consumer wires one selection handler instead of drilling it
// into every tile. Mirrors ControllerContext: an explicit prop always overrides
// the ambient value, and with no provider mounted the field is undefined (no-op).
// Domain-agnostic: the id is an opaque string the consumer defines. No dependency
// on the input core or wire codec.

import { type Context, createContext, useContext } from 'react';

export type SelectionContextValue = Readonly<{
    onSelect?: ((id: string) => void) | undefined;
}>;

const EMPTY_SELECTION_CONTEXT: SelectionContextValue = {};

export const SelectionContext: Context<SelectionContextValue> =
    createContext<SelectionContextValue>(EMPTY_SELECTION_CONTEXT);

export function useSelectionContext(): SelectionContextValue {
    return useContext(SelectionContext);
}
