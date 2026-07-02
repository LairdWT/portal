import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// One suggestable option. `label` is both the visible text and the fuzzy-match
// haystack; committing an option writes its label into the input and reports
// its id through onSelect.
export type ComboboxOption = Readonly<{
    id: string;
    label: string;
    disabled?: boolean | undefined;
}>;

// Props for the Combobox: the form-level single-value autocomplete of the UI
// layer (the modal CommandPalette's machinery in an inline field). The INPUT
// TEXT is the controlled value (`value` / `onValueChange`); options are
// fuzzy-filtered and ranked against it with the shared fuzzyMatch scorer, and
// matched characters render emphasized. Committing an option (click or Enter
// on the active row) writes its label into the input and fires `onSelect`
// with its id. A free-typed value that matches no option simply stays in the
// input - the combobox never forces a selection. `emptyMessage` renders in
// the open listbox when nothing matches.
export type ComboboxProps = Readonly<
    {
        label: string;
        options: readonly ComboboxOption[];
        value: string;
        onValueChange: (value: string) => void;
        onSelect?: ((id: string) => void) | undefined;
        placeholder?: string | undefined;
        emptyMessage?: string | undefined;
        id?: string | undefined;
        enabled?: EEnabledState | undefined;
        error?: string | undefined;
    } & Toned
>;
