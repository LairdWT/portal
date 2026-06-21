import { type InputDescriptor, type InputSignal } from '../../input';
import { type EEnabledState } from '../../state/state';

// Checked state for the Toggle switch. Modeled as an E-prefixed const-object
// enum rather than a boolean so the on/off state is a named member set and the
// derived ARIA and data-attribute values stay explicit.
export const ECheckedState: {
    readonly Checked: 'checked';
    readonly Unchecked: 'unchecked';
} = {
    Checked: 'checked',
    Unchecked: 'unchecked',
};
export type ECheckedState = (typeof ECheckedState)[keyof typeof ECheckedState];

// Props for the Toggle boolean-switch primitive.
//
// `checked` and `enabled` are enums, not booleans, so the ARIA and disabled DOM
// states are derived rather than stored. When `checked` is provided the Toggle
// is controlled and the consumer owns the state; otherwise it is uncontrolled
// and manages its own state, seeded once from `defaultChecked`. When both
// `onSignal` and `descriptor` are provided the component also emits a typed
// Digital InputSignal on each toggle alongside the raw `onChange` callback.
export type ToggleProps = Readonly<{
    label: string;
    checked?: ECheckedState;
    defaultChecked?: ECheckedState;
    enabled?: EEnabledState;
    onChange?: (checked: ECheckedState) => void;
    onSignal?: (signal: InputSignal) => void;
    descriptor?: InputDescriptor;
}>;
