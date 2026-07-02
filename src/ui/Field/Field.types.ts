import type { ReactNode } from 'react';

import type { Toned } from '../tone';

// The wiring Field hands to its control through the children render prop. The
// keys are literal ARIA/DOM attribute names so a consumer can spread the whole
// object onto a native input ({...control}) or forward the pieces onto a
// Portal input's props. `aria-describedby` joins the hint and error ids (only
// the rendered ones); `aria-invalid` and `aria-required` are present only when
// true so a spread never stamps a redundant "false".
export type FieldControlProps = Readonly<{
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': true | undefined;
    'aria-required': true | undefined;
}>;

// Props for Field: the form scaffolding wrapper of the UI layer. It renders
// the label / hint / error frame and wires the ids; the control itself is
// supplied by the children render prop, which receives the FieldControlProps
// to attach. Field owns NO input state - it is pure layout and association.
// When `error` is set the message renders below the control and the wiring
// marks the control invalid; `required` adds the visible marker (decorative -
// the control receives aria-required through the wiring).
export type FieldProps = Readonly<
    {
        label: string;
        children: (control: FieldControlProps) => ReactNode;
        id?: string;
        hint?: string;
        error?: string;
        required?: boolean;
    } & Toned
>;
