// useListboxNavigation - the combobox-model active-cursor for the CommandPalette
// listbox. DOM focus stays on the combobox input; this hook owns only the logical
// cursor over the ENABLED option rows (headers and disabled rows are excluded by
// the caller, so the cursor never lands on a non-activatable row) and reports the
// active absolute row index for aria-activedescendant + the scroll-into-view
// layout effect.
//
// The cursor resets to the first option whenever the reset token changes (a new
// query rebuilds the result set - standard type-to-filter behaviour). Movement
// wraps at the ends. Pointer hover may set the cursor to a specific row via
// setActiveRow. No timers or listeners, so the hook owns no cleanup.

import { type Dispatch, type SetStateAction, useState } from 'react';

export type ListboxNavigation = Readonly<{
    // Absolute row index of the active option, or -1 when there are no options.
    activeIndex: number;
    // Move the cursor by delta enabled options, wrapping at the ends.
    moveBy: (delta: number) => void;
    // Jump the cursor to the first / last enabled option.
    moveToFirst: () => void;
    moveToLast: () => void;
    // Set the cursor to the option at the given absolute row index (pointer).
    setActiveRow: (rowIndex: number) => void;
}>;

export type UseListboxNavigationOptions = Readonly<{
    // Absolute row indices of the enabled, selectable options in render order.
    optionIndices: readonly number[];
    // When this token changes the cursor resets to the first option.
    resetToken: string;
}>;

export function useListboxNavigation(
    options: UseListboxNavigationOptions,
): ListboxNavigation {
    const { optionIndices, resetToken }: UseListboxNavigationOptions = options;
    const [cursor, setCursor]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);

    // Reset the cursor to the first option when the reset token (the query)
    // changes, using the React-endorsed "adjust state during render" pattern: the
    // previous token is held in state and an in-render setState resets the cursor.
    // This applies before paint with no effect round-trip and no ref read.
    const [previousToken, setPreviousToken]: [
        string,
        Dispatch<SetStateAction<string>>,
    ] = useState<string>(resetToken);
    if (previousToken !== resetToken) {
        setPreviousToken(resetToken);
        setCursor(0);
    }

    const count: number = optionIndices.length;
    const clamped: number =
        count === 0 ? -1 : Math.min(Math.max(cursor, 0), count - 1);
    const activeIndex: number = clamped < 0 ? -1 : (optionIndices[clamped] ?? -1);

    function moveBy(delta: number): void {
        if (count === 0) {
            return;
        }
        const base: number = clamped < 0 ? 0 : clamped;
        const next: number = (((base + delta) % count) + count) % count;
        setCursor(next);
    }

    function moveToFirst(): void {
        if (count === 0) {
            return;
        }
        setCursor(0);
    }

    function moveToLast(): void {
        if (count === 0) {
            return;
        }
        setCursor(count - 1);
    }

    function setActiveRow(rowIndex: number): void {
        const position: number = optionIndices.indexOf(rowIndex);
        if (position < 0) {
            return;
        }
        setCursor(position);
    }

    return { activeIndex, moveBy, moveToFirst, moveToLast, setActiveRow };
}
