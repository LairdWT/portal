import { type EUiStatus, type Toned } from '../tone';

// Progress feedback for the generic UI layer. Two modes, modeled as a
// discriminated union on `mode` so each shape only carries the fields it needs:
//
//   - determinate: a tonal bar driven by `value` / `max`. It renders as a real
//     role="progressbar" with aria-valuenow/valuemin/valuemax, so assistive
//     technology reads the completion ratio. Tone drives the fill accent.
//   - indeterminate: an activity indicator for work of unknown duration. It is
//     still a role="progressbar", but omits aria-valuenow (the ARIA signal for
//     an indeterminate bar). Its motion is gated behind reduced-motion and holds
//     a static segment when motion is suppressed.
//
// `label` is required: a progressbar needs an accessible name. `tone` flows
// through the shared tone scope and colors the fill / indicator; `status`
// overrides the tone seed with the universal danger/success tokens.

// The two progress modes. The kebab-case values double as the data-mode
// attribute the markup carries and the CSS keys off.
export const EProgressMode: {
    readonly Determinate: 'determinate';
    readonly Indeterminate: 'indeterminate';
} = {
    Determinate: 'determinate',
    Indeterminate: 'indeterminate',
};
export type EProgressMode = (typeof EProgressMode)[keyof typeof EProgressMode];

// Fields shared by both modes.
type ProgressCommon = Readonly<{
    label: string;
    status?: EUiStatus;
}> &
    Toned;

// A determinate bar. `value` is the current amount and `max` is the full amount
// (defaults to 1, so an omitted `max` treats `value` as a 0..1 fraction). The
// reported ratio is clamped to the [0, max] range.
export type DeterminateProgressProps = Readonly<{
    mode: typeof EProgressMode.Determinate;
    value: number;
    max?: number;
}> &
    ProgressCommon;

// An indeterminate activity indicator: no value, just an animated (or, under
// reduced motion, static) segment signaling that work is in progress.
export type IndeterminateProgressProps = Readonly<{
    mode: typeof EProgressMode.Indeterminate;
}> &
    ProgressCommon;

export type ProgressProps = DeterminateProgressProps | IndeterminateProgressProps;
