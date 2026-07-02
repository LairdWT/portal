import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// Which end of the range a thumb controls. Doubles as the data-thumb
// attribute the CSS positions on.
export const ERangeThumb: {
    readonly Lower: 'lower';
    readonly Upper: 'upper';
} = {
    Lower: 'lower',
    Upper: 'upper',
};
export type ERangeThumb = (typeof ERangeThumb)[keyof typeof ERangeThumb];

// The controlled value pair. Invariant: lower <= upper (the component clamps
// every edit against the opposite thumb, so it can never emit a crossed pair).
export type RangeSliderValue = Readonly<{
    lower: number;
    upper: number;
}>;

// Props for the RangeSlider: the generic dual-thumb min/max selector of the
// UI layer (distinct from the game-input Slider, which emits input signals).
// Controlled: `value` in, `onValueChange` out with the clamped, quantized
// pair. Each thumb is a real focusable role="slider" with its own accessible
// name (`lowerLabel` / `upperLabel`, defaulting to Minimum / Maximum) and
// full APG keyboard support; pointer drags move the NEAREST thumb, so the
// whole track is the touch target. `formatValue` feeds aria-valuetext for
// units ("30 %", "1,5 s").
export type RangeSliderProps = Readonly<
    {
        label: string;
        value: RangeSliderValue;
        onValueChange: (value: RangeSliderValue) => void;
        min?: number | undefined;
        max?: number | undefined;
        step?: number | undefined;
        lowerLabel?: string | undefined;
        upperLabel?: string | undefined;
        formatValue?: ((value: number) => string) | undefined;
        enabled?: EEnabledState | undefined;
    } & Toned
>;
