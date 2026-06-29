import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type Toned } from '../tone';

// Public contract for NavRail: a controlled <nav> landmark presenting a vertical
// stack of navigation bands. Accessibility: the landmark requires an accessible
// name (AccessibleName XOR); a vertical roving tabindex gives the group one tab
// stop; activation is MANUAL (arrow keys move focus only, Enter/Space/click
// activate); the active item carries aria-current="page" paired with the
// data-state attribute, so selection is never conveyed by tone color alone; tone
// drives the active indicator (accent bar, fill scrim, glow) only.

// Per-item presentation state. E-prefixed const-object enum (enums-as-language
// are banned). The kebab-case values double as the data-state attribute the CSS
// reads. Active is paired with aria-current so selection is never conveyed by
// tone color alone. Mirrors ETabState / ESegmentState.
export const ENavItemState: {
    readonly Active: 'active';
    readonly Idle: 'idle';
} = {
    Active: 'active',
    Idle: 'idle',
};
export type ENavItemState = (typeof ENavItemState)[keyof typeof ENavItemState];

// One navigation entry. `id` is the opaque selection identity (compared to the
// controlled active id and reported through onChange). `label` is arbitrary
// renderable content and supplies the item's accessible name. `icon` is an
// optional decorative leading ReactNode slot (Portal ships no icon set). `badge`
// is an optional trailing ReactNode slot (compose the existing Badge for a count
// or status indicator). When `href` is present the item renders as an <a>
// navigation link; otherwise it renders as a <button> reporting selection
// through onChange.
export type NavRailItem = Readonly<{
    id: string;
    label: ReactNode;
    icon?: ReactNode;
    badge?: ReactNode;
    href?: string;
}>;

// Props for NavRail: a controlled, domain-agnostic vertical navigation rail.
//
// `items` is the ordered entry set; `value` is the controlled active id and
// `onChange` reports the next id when a button item is activated (link items
// navigate natively and do not call onChange). Arrow Up/Down move the roving
// focus, Home/End jump to first/last, and Enter/Space activate the focused item
// (manual activation - arrows never activate). `enabled` resolves through
// useResolvedEnabled; a disabled rail renders every item as a disabled button.
// `tone` flows through the shared tone scope and drives the active indicator
// only. The nav landmark requires an accessible name (AccessibleName XOR union):
// exactly one of `label` (aria-label) or `labelledBy` (aria-labelledby).
export type NavRailProps = Readonly<{
    items: readonly NavRailItem[];
    value: string;
    onChange?: (id: string) => void;
    enabled?: EEnabledState;
}> &
    AccessibleName &
    Toned;
