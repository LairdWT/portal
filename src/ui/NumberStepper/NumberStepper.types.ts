import { type EEnabledState } from '../../state/state';
import { type EUiStatus, type Toned } from '../tone';

// NumberStepper. A controlled, saturating-clamped numeric stepper for the generic
// UI layer, mirroring Helicon's number_stepper ([-] value [+]). The control owns
// no value state: the consumer passes `value` and receives the next CLAMPED value
// through `onChange`, exactly as Helicon returns the changed value and never
// mutates an out-of-range one.
//
// A11y: the value is a read-only role="spinbutton" (a named role, so `label` is
// required and wired to aria-label) flanked by two real <button> step keys. The
// spinbutton carries aria-valuenow / aria-valuetext, plus aria-valuemin /
// aria-valuemax ONLY when a finite bound is passed (an unbounded saturating
// stepper must not announce the safe-integer sentinels). Each step key exposes a
// descriptive name and the native disabled attribute at its bound, matching
// Helicon's dimmed-at-bound control. Keyboard on the spinbutton: ArrowUp /
// ArrowDown by `step`, PageUp / PageDown by `pageStep`, and Home / End to the
// bounds when bounded.

// The step direction. An E-prefixed annotated const-object enum (NOT a bare
// `as const`, which @typescript-eslint/typedef rejects) mirroring Helicon's
// NumberStepperControl. The kebab-case values double as the data-control
// attribute the markup carries. Component-local: only NumberStepper needs it, so
// it stays here rather than being promoted to state.ts.
export const EStepDirection: {
    readonly Decrement: 'decrement';
    readonly Increment: 'increment';
} = {
    Decrement: 'decrement',
    Increment: 'increment',
};
export type EStepDirection = (typeof EStepDirection)[keyof typeof EStepDirection];

// Props for the controlled NumberStepper. The value/onChange pair is controlled
// (the prop is never written back); min/max/step are saturating-clamped; tone and
// the universal status flow through the shared tone scope.
export type NumberStepperProps = Readonly<
    {
        /**
         * Accessible name for the spinbutton (wired to aria-label). Required: the
         * spinbutton is a named role. Mirrors Progress/Slider, not the
         * AccessibleName XOR (the control renders no visible label of its own).
         */
        label: string;
        /**
         * Controlled current value. The displayed value is clamped into [min,max]
         * for render and aria-valuenow; the prop itself is never mutated.
         */
        value: number;
        /**
         * Reports the next CLAMPED value. Omitted -> read-only stepper.
         */
        onChange?: (value: number) => void;
        /**
         * Inclusive bounds. Optional; default to the safe-integer range so the
         * saturating clamp matches Helicon's i64 saturating intent. aria-valuemin
         * / aria-valuemax are emitted ONLY when the caller passes a finite bound.
         */
        min?: number;
        max?: number;
        /**
         * Per-click / Arrow delta. A non-positive value is coerced to 1 (Helicon
         * MINIMUM_STEP).
         */
        step?: number;
        /**
         * PageUp / PageDown delta. Defaults to the normalized step times 10.
         */
        pageStep?: number;
        /**
         * Enabled state enum, resolved through useResolvedEnabled.
         */
        enabled?: EEnabledState;
        /**
         * Universal status routed through the tone scope (data-status). Defaults
         * to EUiStatus.None. Mirrors Progress/StatPill.
         */
        status?: EUiStatus;
        /**
         * Optional formatting for the value text and aria-valuetext (units,
         * locale). Defaults to String(displayedValue).
         */
        formatValue?: (value: number) => string;
        /**
         * Accessible names for the step keys. Default to descriptive strings
         * derived from `label` ("Decrease <label>" / "Increase <label>").
         */
        decrementLabel?: string;
        incrementLabel?: string;
        /**
         * Optional explicit id for the spinbutton element (falls back to useId).
         */
        id?: string;
    } & Toned
>;
