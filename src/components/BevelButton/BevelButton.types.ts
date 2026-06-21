import { type ReactNode } from 'react';

import { type InputDescriptor, type InputSignal } from '../../input';
import { type EEnabledState } from '../../state/state';

// Props for the BevelButton digital press primitive.
//
// `enabled` is an enum, not a boolean, so the disabled DOM state is derived
// rather than stored. When both `onSignal` and `descriptor` are provided the
// component emits a typed Digital InputSignal on press and release in addition
// to the raw `onPress` and `onRelease` callbacks.
//
// Optional props admit `undefined` explicitly so composition wrappers can
// forward their own optional values straight through under the project
// `exactOptionalPropertyTypes` setting without widening assertions.
export type BevelButtonProps = Readonly<{
    children: ReactNode;
    enabled?: EEnabledState | undefined;
    onPress?: (() => void) | undefined;
    onRelease?: (() => void) | undefined;
    onSignal?: ((signal: InputSignal) => void) | undefined;
    descriptor?: InputDescriptor | undefined;
}>;
