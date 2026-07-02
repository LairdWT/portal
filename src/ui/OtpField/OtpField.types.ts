import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// What the code cells accept. Numeric strips everything but digits (and sets
// the numeric software keyboard); Text accepts any non-whitespace characters.
export const EOtpFieldMode: {
    readonly Numeric: 'numeric';
    readonly Text: 'text';
} = {
    Numeric: 'numeric',
    Text: 'text',
};
export type EOtpFieldMode = (typeof EOtpFieldMode)[keyof typeof EOtpFieldMode];

// Props for the OtpField: segmented one-time-code entry. ONE real (visually
// hidden, focusable) input owns the value, focus, paste, and keyboard - the
// visible cells are a decorative mirror - so paste splitting, backspace, and
// caret behavior are all native. Controlled: `value` in, `onValueChange` out
// with the sanitized code; `onComplete` fires once the code reaches `length`.
// The input advertises autocomplete="one-time-code" for OS code suggestions.
export type OtpFieldProps = Readonly<
    {
        label: string;
        value: string;
        onValueChange?: ((value: string) => void) | undefined;
        onComplete?: ((value: string) => void) | undefined;
        length?: number | undefined;
        mode?: EOtpFieldMode | undefined;
        id?: string | undefined;
        enabled?: EEnabledState | undefined;
        error?: string | undefined;
    } & Toned
>;
