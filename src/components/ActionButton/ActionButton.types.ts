import type { InputDescriptor, InputSignal } from '../../input';
import type { EEnabledState } from '../../state/state';

// Props for the ActionButton control. A labelled digital action composed over
// the BevelButton press primitive. Every prop other than `label` is forwarded
// unchanged to BevelButton, which owns the press state, enabled handling, and
// InputSignal emission.
//
// When both `onSignal` and `descriptor` are supplied the underlying BevelButton
// emits a framework-agnostic Digital InputSignal on press and release in
// addition to the raw `onPress` and `onRelease` callbacks. `enabled` is an enum
// rather than a boolean; the DOM disabled state is derived from it downstream.
export type ActionButtonProps = Readonly<{
    label: string;
    enabled?: EEnabledState;
    onPress?: () => void;
    onRelease?: () => void;
    onSignal?: (signal: InputSignal) => void;
    descriptor?: InputDescriptor;
}>;
