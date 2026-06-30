import type { InputDescriptor, InputSignal } from '../../input';
import type { EEnabledState } from '../../state/state';

// Public props for the Slider scalar control.
//
// The control is value-driven: the consumer owns `value` and updates it from
// `onChange`. Optional `onSignal` plus `descriptor` opt the control into the
// framework InputSignal path; both must be present for a signal to emit.
export type SliderProps = Readonly<{
    label: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    enabled?: EEnabledState;
    onChange?: (value: number) => void;
    onSignal?: (signal: InputSignal) => void;
    descriptor?: InputDescriptor;
    formatValueText?: ((value: number) => string) | undefined;
}>;
