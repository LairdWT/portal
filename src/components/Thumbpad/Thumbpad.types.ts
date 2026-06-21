import type { Axis2D, InputDescriptor, InputSignal } from '../../input';
import type { EEnabledState } from '../../state/state';

// Props for the Thumbpad control. A RELATIVE delta surface (camera-look /
// trackpad style). It reports the incremental movement since the previous
// pointer sample as a rect-normalized Axis2D delta and does NOT self-center to a
// fixed origin. A larger BACK and a FRONT thumb layer show a transient parallax
// travel under the finger and ease home when idle. Keyboard input emits fixed
// relative delta steps (the host is role="application" and focusable).
//
// When both `onSignal` and `descriptor` are supplied the control also emits a
// framework-agnostic Axis2D InputSignal (interaction Move) carrying the same
// delta. `onDelta` is the simple raw callback and fires regardless of signal
// wiring.
export type ThumbpadProps = Readonly<{
    label: string;
    enabled?: EEnabledState;
    onDelta?: (delta: Axis2D) => void;
    onSignal?: (signal: InputSignal) => void;
    descriptor?: InputDescriptor;
}>;
