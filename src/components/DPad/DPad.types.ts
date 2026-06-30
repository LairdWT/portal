import type { InputDescriptor, InputSignal } from '../../input';
import type { EEnabledState } from '../../state/state';

// Resolution mode for the directional pad. FourWay collapses diagonals onto the
// dominant cardinal axis; EightWay reports the four cardinals and four
// diagonals.
export const EDpadMode: {
    readonly FourWay: 'four-way';
    readonly EightWay: 'eight-way';
} = {
    FourWay: 'four-way',
    EightWay: 'eight-way',
};
export type EDpadMode = (typeof EDpadMode)[keyof typeof EDpadMode];

// Pressed direction resolved from pointer position or keyboard. None is the
// rest state when no direction is held.
export const EDpadDirection: {
    readonly None: 'none';
    readonly Up: 'up';
    readonly Down: 'down';
    readonly Left: 'left';
    readonly Right: 'right';
    readonly UpLeft: 'up-left';
    readonly UpRight: 'up-right';
    readonly DownLeft: 'down-left';
    readonly DownRight: 'down-right';
} = {
    None: 'none',
    Up: 'up',
    Down: 'down',
    Left: 'left',
    Right: 'right',
    UpLeft: 'up-left',
    UpRight: 'up-right',
    DownLeft: 'down-left',
    DownRight: 'down-right',
};
export type EDpadDirection = (typeof EDpadDirection)[keyof typeof EDpadDirection];

// Props for the DPad control. A digital directional pad modelled as a labelled
// role="group" containing one real <button> per operable direction (four
// cardinals in FourWay, plus four diagonals in EightWay). The pressed direction
// is resolved either from pointer position over the pad rectangle (via an octant
// switch) or from the keyboard: Enter or Space on a focused child button is a
// momentary press of that direction. The active direction is reflected to
// assistive tech through aria-pressed on each child button, and to the DOM
// through the group data-direction attribute and per-button data-active.
//
// When both onSignal and descriptor are supplied the control also emits a
// framework-agnostic Digital InputSignal for every direction change: pressed is
// true when a direction is held and false when the pad returns to None.
// onDirectionChange is the simple raw callback and fires regardless of signal
// wiring.
export type DPadProps = Readonly<{
    label: string;
    mode?: EDpadMode;
    enabled?: EEnabledState;
    onDirectionChange?: (direction: EDpadDirection) => void;
    onSignal?: (signal: InputSignal) => void;
    descriptor?: InputDescriptor;
    // Opt-in (default false): when true the pointer gesture only starts on the
    // primary (left/touch) button, forwarded to usePointerControl. Unset leaves
    // the gesture behavior unchanged (any button starts it).
    primaryButtonOnly?: boolean;
}>;
