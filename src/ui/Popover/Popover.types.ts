import { type ReactNode, type RefObject } from 'react';

import { type Toned } from '../tone';

// Preferred side the panel opens toward, relative to the anchor. Modeled as an
// E-prefixed const-object enum; the kebab values double as the data-placement
// attribute the CSS reads. The runtime flips to the opposite side when the
// preferred side lacks room, so this is a preference, not a guarantee.
export const EPopoverPlacement: {
    readonly Top: 'top';
    readonly Bottom: 'bottom';
    readonly Left: 'left';
    readonly Right: 'right';
} = {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
};
export type EPopoverPlacement =
    (typeof EPopoverPlacement)[keyof typeof EPopoverPlacement];

// ARIA role applied to the floating panel. Constrained to the overlay roles the
// primitives built on Popover need (Tooltip, Menu, Select/Combobox, Dialog), so
// the role is a named member set rather than an arbitrary string. A role that
// names a window (dialog) requires an accessible name: pass `label` or
// `labelledBy`.
export const EPopoverRole: {
    readonly Dialog: 'dialog';
    readonly Menu: 'menu';
    readonly Listbox: 'listbox';
    readonly Tooltip: 'tooltip';
} = {
    Dialog: 'dialog',
    Menu: 'menu',
    Listbox: 'listbox',
    Tooltip: 'tooltip',
};
export type EPopoverRole = (typeof EPopoverRole)[keyof typeof EPopoverRole];

// Props for the Popover floating-panel primitive.
//
// The panel is controlled: `open` drives visibility and `onClose` reports a
// dismissal request (outside-click or Escape) so the owner can clear `open`. The
// panel renders through createPortal into a single managed overlay root and is
// anchored either to an external `anchorRef` or to the `trigger` node the Popover
// renders inline (wrapped so it can be measured and refocused); supply one of
// them. Position is hand-rolled and kept in view by flipping and shifting on
// scroll and resize. `placement` is the preferred side, `offset` the gap from the
// anchor, and `viewportPadding` the minimum gap from the viewport edge. `role`
// plus `label`/`labelledBy` set the panel semantics. `trapFocus` engages a modal
// focus trap (off for tooltips and menus); `restoreFocus` returns focus to the
// element focused before opening when focus would otherwise be lost.
// `initialFocusRef` overrides the first focus target while trapping. `tone` flows
// through the shared tone scope. `id` is applied to the panel element so a
// consumer can wire an ARIA relationship to it (for example a trigger's
// aria-describedby or a combobox's aria-controls); it is purely additive.
export type PopoverProps = Readonly<{
    open: boolean;
    onClose?: () => void;
    anchorRef?: RefObject<HTMLElement | null>;
    trigger?: ReactNode;
    children: ReactNode;
    placement?: EPopoverPlacement;
    role?: EPopoverRole;
    label?: string;
    labelledBy?: string;
    id?: string;
    offset?: number;
    viewportPadding?: number;
    trapFocus?: boolean;
    restoreFocus?: boolean;
    initialFocusRef?: RefObject<HTMLElement | null>;
}> &
    Toned;
