import type { Axis2D, InputDescriptor, InputSignal } from '../../input';
import type { EEnabledState } from '../../state/state';

// Props for the Joystick control. A returns-to-center analog stick whose live
// axis is pushed to the DOM through custom properties rather than React state.
// On gesture end the value snaps back to center and the thumb eases home.
//
// Pointer input drives the absolute self-centering pad. Keyboard and
// assistive-tech input is provided by two paired, visually hidden range sliders
// (one per axis) rendered inside the group; range inputs give native arrow-key
// handling and announce aria-valuenow/min/max. The slider value maps directly to
// the axis component (+x is screen-right, +y is screen-down), matching the
// pointer path.
//
// When both `onSignal` and `descriptor` are supplied the control also emits a
// framework-agnostic InputSignal for every axis change. `onAxisChange` is the
// simple raw callback and fires regardless of signal wiring.
export type JoystickProps = Readonly<{
    label: string;
    deadZone?: number;
    enabled?: EEnabledState;
    onAxisChange?: (axis: Axis2D) => void;
    onSignal?: (signal: InputSignal) => void;
    descriptor?: InputDescriptor;
}>;
