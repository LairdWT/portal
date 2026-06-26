import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type Toned } from '../tone';

// Per-segment presentation state. Modeled as an E-prefixed const-object enum so
// the two distinct visual states are a named member set. The kebab-case values
// double as the data-state attribute the CSS reads. Selected is paired with the
// aria-checked attribute on the radio, so the active state is never conveyed by
// tone color alone.
export const ESegmentState: {
    readonly Selected: 'selected';
    readonly Idle: 'idle';
} = {
    Selected: 'selected',
    Idle: 'idle',
};
export type ESegmentState = (typeof ESegmentState)[keyof typeof ESegmentState];

// One item in a SegmentedControl set. `id` is an opaque consumer string used for
// selection identity (the value the component reports through onChange and
// compares against the controlled `value`). `label` is arbitrary renderable
// content.
export type UiSegmentItem = Readonly<{
    id: string;
    label: ReactNode;
}>;

// Props for the SegmentedControl: a controlled, domain-agnostic single-select
// segment group implementing the radiogroup ARIA pattern.
//
// `items` is the ordered set of segments; `value` is the controlled selected id
// and `onChange` is a plain value-shaped callback reporting the next id.
// Selection is automatic on arrow navigation: Arrow Right/Down move to the next
// segment and report it, Arrow Left/Up move to the previous, Home/End jump to
// the first/last, and Enter/Space select the focused segment. `label` is the
// accessible name applied to the radiogroup. `enabled` is an enum resolved
// through useResolvedEnabled; the native disabled attribute on each segment
// derives from it. `tone` flows through the shared tone scope and drives the
// selected-segment indicator only.
export type SegmentedControlProps = Readonly<{
    items: readonly UiSegmentItem[];
    value: string;
    onChange?: (id: string) => void;
    label?: string;
    enabled?: EEnabledState;
}> &
    Toned;
