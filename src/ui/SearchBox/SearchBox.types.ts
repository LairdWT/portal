import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// Fill state of the search field, surfaced through the root data-state attribute
// so the styles can react to an empty versus a populated query (the clear button
// is only present once there is something to clear). Modeled as the standard
// E-prefixed annotated const object - enums-as-language are banned.
export const ESearchBoxState: {
    readonly Empty: 'empty';
    readonly Filled: 'filled';
} = {
    Empty: 'empty',
    Filled: 'filled',
};
export type ESearchBoxState =
    (typeof ESearchBoxState)[keyof typeof ESearchBoxState];

// Props for the SearchBox: the generic, domain-agnostic search input of the UI
// layer. It builds on the TextField pattern - a controlled field (`value` in,
// `onChange` out with the parsed string, not the raw event) with an always
// rendered, programmatically associated <label> (`id` falls back to a generated
// useId so a caller never has to invent one). The rendered <input type="search">
// exposes the implicit `searchbox` role. A decorative search affordance leads the
// field and a clear button (aria-label "Clear search") trails it; the clear
// button is present only while the value is non-empty and, when pressed, empties
// the value and returns focus to the input. `onSubmit` fires with the current
// value when the user presses Enter. `enabled` is an enum resolved through
// useResolvedEnabled; the native disabled attribute derives from it and gates
// every callback. `tone` drives the focus ring, border accent, and the search
// affordance through the tone scope; the field surface stays the dark tone scrim,
// never a solid accent fill.
export type SearchBoxProps = Readonly<
    {
        label: string;
        value: string;
        onChange?: (value: string) => void;
        onSubmit?: (value: string) => void;
        id?: string;
        // Optional id of the element this search field controls, forwarded to the
        // input's aria-controls (e.g. the List a SearchableList filters).
        ariaControls?: string;
        placeholder?: string;
        enabled?: EEnabledState;
    } & Toned
>;
