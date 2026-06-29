import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
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
// against the controlled `value`) AND the seed of the deterministic per-tab DOM
// id. `label` is arbitrary renderable content. `controls` is the optional id of
// the consumer-owned tabpanel this tab labels: when present it is wired to the
// tab's aria-controls so a consumer can form the APG tab/tabpanel relationship
// (additive - omit it for a tablist with no attached panels).
export type TabItem = Readonly<{
    id: string;
    label: ReactNode;
    controls?: string;
}>;

// Props for the Tabs: a controlled, domain-agnostic tablist.
//
// `items` is the ordered set of tabs; `value` is the controlled selected id and
// `onChange` is a plain value-shaped callback reporting the next id. Selection
// is automatic on arrow navigation: Arrow Left/Right move to the previous/next
// tab and report it, Home/End jump to the first/last, and Enter/Space select
// the focused tab. `enabled` is an enum resolved through useResolvedEnabled; the
// native disabled attribute on each tab derives from it. `tone` flows through
// the shared tone scope and drives the selected indicator only. The tablist is a
// named role, so an accessible name is required through the shared AccessibleName
// union: pass EXACTLY ONE of `label` (wired to aria-label) or `labelledBy` (an id
// wired to aria-labelledby).
export type TabsProps = Readonly<{
    items: readonly TabItem[];
    value: string;
    onChange?: (id: string) => void;
    enabled?: EEnabledState;
}> &
    AccessibleName &
    Toned;
