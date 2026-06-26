import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// The autocomplete intent of a secret field. Required, because the core gap of a
// half-built password field is advertising "password" while omitting the
// autocomplete semantics an auth field implies. Forcing the choice between a login
// (current) and a create/change (new) field is the correctness fix. Modeled as the
// standard E-prefixed annotated const object - enums-as-language are banned.
export const ESecretAutocomplete: {
    readonly Current: 'current-password';
    readonly New: 'new-password';
} = {
    Current: 'current-password',
    New: 'new-password',
};
export type ESecretAutocomplete =
    (typeof ESecretAutocomplete)[keyof typeof ESecretAutocomplete];

// Reveal state. Drives the native input type (hidden -> password, revealed ->
// text) and the data-reveal attribute the glyph CSS selects on. Presentation only;
// it never holds the value.
export const ERevealState: {
    readonly Hidden: 'hidden';
    readonly Revealed: 'revealed';
} = {
    Hidden: 'hidden',
    Revealed: 'revealed',
};
export type ERevealState = (typeof ERevealState)[keyof typeof ERevealState];

// Caps-lock awareness state derived from key events while focused. Unknown is the
// resting/blurred state so a stale warning never persists after leaving the field.
export const ECapsLockState: {
    readonly Off: 'off';
    readonly On: 'on';
    readonly Unknown: 'unknown';
} = {
    Off: 'off',
    On: 'on',
    Unknown: 'unknown',
};
export type ECapsLockState = (typeof ECapsLockState)[keyof typeof ECapsLockState];

// Props for the SecretField: the masked secret/password input of the UI layer.
// Controlled (`value` in, `onValueChange` out with the parsed string, never the raw
// event; the component retains and logs nothing). A <label> is always rendered and
// associated by id (`id` falls back to a generated useId). `autoComplete` is
// REQUIRED and constrained to current/new-password. `name` is optional, forwarded
// so a password manager can associate the field. `toggleLabel`/`capsLockWarning`
// override the reveal-toggle and caps-advisory strings for i18n. The toggle name is
// deliberately stable (state-independent): shown/hidden is conveyed by aria-pressed,
// not by a changing accessible name. `enabled` resolves through useResolvedEnabled;
// `tone` drives the focus ring and
// border accent through the tone scope. Masking is the native input type - there is
// no plaintext copy in component state - so reveal toggles the type rather than
// reconstructing a value.
export type SecretFieldProps = Readonly<
    {
        label: string;
        value: string;
        autoComplete: ESecretAutocomplete;
        onValueChange?: (value: string) => void;
        id?: string;
        name?: string;
        placeholder?: string;
        enabled?: EEnabledState;
        error?: string;
        toggleLabel?: string;
        capsLockWarning?: string;
    } & Toned
>;
