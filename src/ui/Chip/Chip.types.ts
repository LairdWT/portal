import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type EUiStatus, type Toned } from '../tone';

// Selected vs idle presentation for a Chip. Modeled as an E-prefixed const-object
// enum so the two distinct visual states are a named member set. The kebab-case
// values double as the data-state attribute the CSS reads. Selected is paired
// with a non-color indicator marker, so the active state is never conveyed by
// tone color alone.
export const EChipState: {
    readonly Selected: 'selected';
    readonly Idle: 'idle';
} = {
    Selected: 'selected',
    Idle: 'idle',
};
export type EChipState = (typeof EChipState)[keyof typeof EChipState];

// Props for the Chip: a domain-agnostic removable tag token.
//
// `children` is the arbitrary renderable label content. `label` is the plain
// text used to build the remove button's accessible name ("Remove <label>") and
// to name the chip root for assistive technology; supply it whenever the chip is
// removable so the control reads clearly. `selected` flags the visual selected
// state, exposed through data-state and a non-color marker. Selection is
// presentational only: it is reflected visually but is NOT announced to assistive
// technology (the chip is a labelled group, not a toggle). A consumer that needs
// an announced on/off state should wrap the chip in a real toggle control
// (for example a button with aria-pressed). `onRemove` opts the
// chip into removable behaviour: it renders a dedicated remove button (activated
// by click or Enter/Space). `status` is the universal danger/success override and
// `tone` flows through the shared tone scope; `enabled` is resolved through
// useResolvedEnabled and gates the remove button (native disabled).
export type ChipProps = Readonly<{
    children: ReactNode;
    label?: string;
    selected?: boolean;
    onRemove?: () => void;
    status?: EUiStatus;
    enabled?: EEnabledState;
}> &
    Toned;
