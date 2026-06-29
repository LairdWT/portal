// Shared selection-mode enum for the generic UI layer's controlled collections.
//
// List and DataTable both model "how many rows may be selected at once" the same
// way, so the mode lives here as the single canonical definition (mirroring the
// way tone.ts shares Toned / EUiStatus) rather than being declared twice and
// marshalled between siblings. None disables selection entirely; Single keeps at
// most one selected key; Multi allows a set, with toggle and contiguous-range
// extension. Modeled as the standard E-prefixed annotated const object -
// enums-as-language are banned. The kebab-case values double as a data attribute
// hook the CSS/tests may read.
export const ESelectionMode: {
    readonly None: 'none';
    readonly Single: 'single';
    readonly Multi: 'multi';
} = {
    None: 'none',
    Single: 'single',
    Multi: 'multi',
};
export type ESelectionMode = (typeof ESelectionMode)[keyof typeof ESelectionMode];
