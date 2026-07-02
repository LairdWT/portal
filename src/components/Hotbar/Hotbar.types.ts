import type { ReactNode } from 'react';

import type { InputDescriptor, InputSignal } from '../../input';
import type { EEnabledState } from '../../state/state';

// One hotbar slot: an ability/item key with an accessible name, an optional
// keybind chip (display + aria-keyshortcuts only - binding the physical key
// is the consumer's contract via the input-binding layer), and an optional
// per-slot InputDescriptor for typed digital signal emission.
export type HotbarSlot = Readonly<{
    id: string;
    label: string;
    keybind?: string | undefined;
    content?: ReactNode | undefined;
    descriptor?: InputDescriptor | undefined;
}>;

// Props for the Hotbar: a single-row game action bar. Activation is
// value-shaped (`onActivate(id)`, fired for pointer clicks and keyboard
// activation alike); press/release additionally emit typed digital
// InputSignals through the shared `onSignal` when a slot carries a
// descriptor (pointer presses only - the useDigitalPress contract).
// `activeId` marks the selected slot (aria-pressed).
export type HotbarProps = Readonly<{
    label: string;
    slots: readonly HotbarSlot[];
    activeId?: string | undefined;
    onActivate?: ((id: string) => void) | undefined;
    onSignal?: ((signal: InputSignal) => void) | undefined;
    enabled?: EEnabledState | undefined;
}>;
