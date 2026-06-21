// Provider for the ambient selection sink. Memoizes the context value so a
// selectable component's memoized work is not rebuilt on every render. The
// field defaults to undefined, which resolves to the component's own onSelect.

import { type ReactElement, type ReactNode, useMemo } from 'react';

import { SelectionContext, type SelectionContextValue } from './SelectionContext';

export type SelectionProviderProps = Readonly<{
    onSelect?: ((id: string) => void) | undefined;
    children: ReactNode;
}>;

export function SelectionProvider({
    onSelect,
    children,
}: SelectionProviderProps): ReactElement {
    const value: SelectionContextValue = useMemo<SelectionContextValue>(
        (): SelectionContextValue => ({ onSelect }),
        [onSelect],
    );

    return (
        <SelectionContext.Provider value={value}>
            {children}
        </SelectionContext.Provider>
    );
}
