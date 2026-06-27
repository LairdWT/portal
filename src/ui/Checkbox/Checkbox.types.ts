import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type Toned } from '../tone';

// Accessible-name contract for Checkbox. A checkbox is a named control, so it
// must carry an accessible name supplied EXACTLY ONE of two ways and never both:
// a visible `label` (ReactNode) rendered inside the wrapping <label> (the input
// takes its name from the wrapped text), or a `labelledBy` id referencing visible
// text elsewhere (wired to aria-labelledby with no visible label rendered).
// Modeled as a discriminated XOR union so "exactly one" is a compile-time
// guarantee: omitting the name fails to compile and supplying both is rejected.
// This mirrors src/ui/accessibleName.ts but carries a ReactNode visible label
// instead of a plain aria-label string, so it is a dedicated type rather than a
// reuse of AccessibleName.
export type CheckboxNaming =
    | { readonly label: ReactNode; readonly labelledBy?: undefined }
    | { readonly labelledBy: string; readonly label?: undefined };

// Public contract for the Checkbox: a controlled, tri-aware boolean control.
//
//   - `checked` is the controlled boolean state (required; the consumer owns it).
//   - `indeterminate` is an INDEPENDENT visual overlay set imperatively on the
//     input DOM node (it is a DOM property, not an attribute, so it is never a
//     React prop on the element). It is orthogonal to `checked`: a checkbox may
//     be indeterminate regardless of its checked value (native semantics). When
//     true, the box shows the dash and the checkmark is suppressed.
//   - `onChange` is value-shaped: it reports the NEXT checked boolean (read from
//     the native input's `checked` after the user toggles). Omit it for a
//     read-only display of `checked` (the internal change handler is still wired
//     so React does not warn about a controlled input without onChange).
//   - `enabled` is resolved through useResolvedEnabled; the native `disabled`
//     attribute derives from it.
//   - `tone` flows through the shared tone scope and drives the checked /
//     indeterminate fill + border and the decorative markers only - never the
//     AA-critical label text.
//   - `name` / `value` / `required` are optional native form-participation
//     attributes forwarded verbatim to the input, so the checkbox submits with a
//     surrounding <form> like a native control.
//   - CheckboxNaming supplies the accessible name (see above).
export type CheckboxProps = Readonly<{
    checked: boolean;
    indeterminate?: boolean;
    onChange?: (checked: boolean) => void;
    enabled?: EEnabledState;
    name?: string;
    value?: string;
    required?: boolean;
}> &
    CheckboxNaming &
    Toned;
