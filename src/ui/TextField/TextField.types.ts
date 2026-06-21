import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// Native input type forwarded to the rendered <input>. Values are the literal
// HTML input type strings; they double as the data-free native type attribute.
// Restricted to single-line text variants the controller surface needs - no
// number/password/etc. until a consumer asks for them.
export const ETextFieldType: {
    readonly Text: 'text';
    readonly Search: 'search';
    readonly Email: 'email';
    readonly Tel: 'tel';
} = {
    Text: 'text',
    Search: 'search',
    Email: 'email',
    Tel: 'tel',
};
export type ETextFieldType = (typeof ETextFieldType)[keyof typeof ETextFieldType];

// Props for the TextField: the generic, domain-agnostic single-line input of the
// UI layer. The input is controlled (`value` in, `onValueChange` out with the
// parsed string, not the raw event). A programmatic <label> is always rendered
// and associated by id; `id` falls back to a generated useId when omitted, so a
// caller is never forced to invent one. `enabled` is an enum resolved through
// useResolvedEnabled; the native disabled attribute derives from it. When `error`
// is set the input is marked aria-invalid and described by a rendered error
// message. `tone` drives the focus ring and border accent through the tone scope;
// the field surface is the dark tone scrim, never a solid accent fill.
export type TextFieldProps = Readonly<
    {
        label: string;
        value: string;
        onValueChange?: (value: string) => void;
        id?: string;
        placeholder?: string;
        type?: ETextFieldType;
        enabled?: EEnabledState;
        error?: string;
    } & Toned
>;
