import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type Toned } from '../tone';

// Per-tab presentation state. Modeled as an E-prefixed const-object enum so the
// two distinct visual states are a named member set. The kebab-case values
// double as the data-state attribute the CSS reads. Selected is paired with the
// aria-selected attribute on the tab, so the active state is never conveyed by
// tone color alone.
export const ETabState: {
    readonly Selected: 'selected';
    readonly Idle: 'idle';
} = {
    Selected: 'selected',
    Idle: 'idle',
};
export type ETabState = (typeof ETabState)[keyof typeof ETabState];

// One item in a Tabs set. `id` is an opaque consumer string used for selection
// identity (the value the component reports through onChange and compares
// against the controlled `value`). `label` is arbitrary renderable content.
export type UiTabItem = Readonly<{
    id: string;
    label: ReactNode;
}>;

// Props for the Tabs / SegmentedControl: a controlled, domain-agnostic tablist.
//
// `items` is the ordered set of tabs; `value` is the controlled selected id and
// `onChange` is a plain value-shaped callback reporting the next id. Selection
// is automatic on arrow navigation: Arrow Left/Right move to the previous/next
// tab and report it, Home/End jump to the first/last, and Enter/Space select
// the focused tab. `enabled` is an enum resolved through useResolvedEnabled; the
// native disabled attribute on each tab derives from it. `tone` flows through
// the shared tone scope and drives the selected indicator only.
export type TabsProps = Readonly<{
    items: readonly UiTabItem[];
    value: string;
    onChange?: (id: string) => void;
    enabled?: EEnabledState;
}> &
    Toned;
