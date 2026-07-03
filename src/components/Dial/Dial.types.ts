import type { InputDescriptor, InputSignal } from '../../input';
import type { EEnabledState } from '../../state/state';

// Public props for the Dial rotary scalar control.
//
// The control is value-driven: the consumer owns `value` and updates it from
// `onChange` (the Slider contract). Optional `onSignal` plus `descriptor` opt
// the control into the framework InputSignal path; both must be present for a
// signal to emit. The pointer gesture is a RELATIVE twist - grabbing the knob
// never jumps the value - and rotation is chirality-fixed (a rotary control
// does not mirror under RTL; only the keyboard arrows follow the slider
// convention).
//
// Optional props admit `undefined` explicitly so composition wrappers can
// forward their own optional values under exactOptionalPropertyTypes.
export type DialProps = Readonly<{
    label: string;
    value: number;
    min?: number | undefined;
    max?: number | undefined;
    step?: number | undefined;
    /**
     * Optional settle values in VALUE units. The live twist stays free; the
     * released value snaps to the nearest detent (which may sit off the step
     * lattice - detents win over quantization). Keyboard steps ignore
     * detents and stay on the lattice.
     */
    detents?: readonly number[] | undefined;
    enabled?: EEnabledState | undefined;
    onChange?: ((value: number) => void) | undefined;
    onSignal?: ((signal: InputSignal) => void) | undefined;
    descriptor?: InputDescriptor | undefined;
    formatValueText?: ((value: number) => string) | undefined;
    /**
     * Renders the live mono readout under the knob. Default true; pass
     * false for a bare knob.
     */
    showValue?: boolean | undefined;
    /**
     * Upgrades the readout to a direct-entry field: type a number and
     * commit on Enter or blur (clamped to the bounds and quantized to the
     * step lattice; detents are ignored - a typed value is deliberate).
     * Escape reverts. A disabled dial falls back to the plain readout.
     */
    editable?: boolean | undefined;
}>;
