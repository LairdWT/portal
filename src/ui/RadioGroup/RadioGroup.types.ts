import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type Toned } from '../tone';

// Per-radio presentation state. An E-prefixed const-object enum so the two
// distinct visual states are a named member set. The kebab-case values double
// as the data-state attribute the CSS reads. Selected is paired with the
// aria-checked attribute on the radio, so the active state is never conveyed by
// tone color alone (the marker dot and aria-checked carry it redundantly).
export const ERadioState: {
    readonly Selected: 'selected';
    readonly Idle: 'idle';
} = {
    Selected: 'selected',
    Idle: 'idle',
};
export type ERadioState = (typeof ERadioState)[keyof typeof ERadioState];

// Group orientation. The values double as the aria-orientation attribute and
// the data-orientation attribute the CSS reads to lay options out as a column
// (Vertical, the default) or a row (Horizontal). Orientation also chooses the
// PRIMARY arrow-key axis: Up/Down for Vertical, Left/Right for Horizontal. Both
// axes are accepted at runtime regardless (APG permits handling both pairs), so
// orientation governs the announced axis and layout, not a hard key lockout.
export const ERadioOrientation: {
    readonly Vertical: 'vertical';
    readonly Horizontal: 'horizontal';
} = {
    Vertical: 'vertical',
    Horizontal: 'horizontal',
};
export type ERadioOrientation =
    (typeof ERadioOrientation)[keyof typeof ERadioOrientation];

// One option in a RadioGroup set. `id` is an opaque consumer string used for
// selection identity (the value reported through onChange and compared against
// the controlled `value`). `label` is arbitrary renderable content. `disabled`
// marks a single option inert: it renders with aria-disabled, takes the native
// disabled attribute, and is SKIPPED by roving arrow/Home/End navigation.
export type RadioItem = Readonly<{
    id: string;
    label: ReactNode;
    disabled?: boolean;
}>;

// Props for the RadioGroup: a controlled, domain-agnostic single-select group
// implementing the radiogroup ARIA pattern with visual radio controls.
//
// `items` is the ordered option set; `value` is the controlled selected id and
// `onChange` is a plain value-shaped callback reporting the next id. Selection
// follows focus on arrow navigation: along the orientation axis, the next/prev
// ENABLED option is moved to and reported; Home/End jump to the first/last
// enabled option; Enter/Space (re)select the focused option. Per-item disabled
// options are skipped by navigation. The radiogroup is a named role, so an
// accessible name is required through the shared AccessibleName union: pass
// EXACTLY ONE of `label` (wired to aria-label) or `labelledBy` (an id wired to
// aria-labelledby). `enabled` is an enum resolved through useResolvedEnabled;
// the native disabled attribute on each radio derives from it (a whole-group
// gate) combined with the per-item disabled flag. `orientation` defaults to
// Vertical and sets aria-orientation plus the primary arrow axis. `tone` flows
// through the shared tone scope and drives the selected marker ring/dot/glow
// only - never the label text.
export type RadioGroupProps = Readonly<{
    items: readonly RadioItem[];
    value: string;
    onChange?: (id: string) => void;
    enabled?: EEnabledState;
    orientation?: ERadioOrientation;
}> &
    AccessibleName &
    Toned;
