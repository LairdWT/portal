import { type ReactNode, type RefObject } from 'react';

import { type AccessibleName } from '../accessibleName';
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
// primitives built on Popover need (Tooltip, Menu, Select/Combobox, Dialog, plus
// Group for a plain disclosure region whose revealed content carries no special
// widget semantics), so the role is a named member set rather than an arbitrary
// string. A role that names a window (dialog) requires an accessible name: pass
// `label` or `labelledBy`. Group needs no name (it is a generic grouping, not a
// landmark), so it falls into the optional-name branch like Menu/Listbox/Tooltip.
export const EPopoverRole: {
    readonly Dialog: 'dialog';
    readonly Menu: 'menu';
    readonly Listbox: 'listbox';
    readonly Tooltip: 'tooltip';
    readonly Group: 'group';
} = {
    Dialog: 'dialog',
    Menu: 'menu',
    Listbox: 'listbox',
    Tooltip: 'tooltip',
    Group: 'group',
};
export type EPopoverRole = (typeof EPopoverRole)[keyof typeof EPopoverRole];

// Shared, role-independent Popover props: everything except the panel's ARIA
// role and accessible name (those vary by role and are layered on below).
//
// The panel is controlled: `open` drives visibility and `onClose` reports a
// dismissal request (outside-click or Escape) so the owner can clear `open`. The
// panel renders through createPortal into a single managed overlay root and is
// anchored either to an external `anchorRef` or to the `trigger` node the Popover
// renders inline (wrapped so it can be measured and refocused); supply one of
// them. Position is hand-rolled and kept in view by flipping and shifting on
// scroll and resize. `placement` is the preferred side, `offset` the gap from the
// anchor, and `viewportPadding` the minimum gap from the viewport edge.
// `trapFocus` engages a modal focus trap (off for tooltips and menus);
// `restoreFocus` returns focus to the element focused before opening when focus
// would otherwise be lost. `initialFocusRef` overrides the first focus target
// while trapping. `tone` flows through the shared tone scope. `id` is applied to
// the panel element so a consumer can wire an ARIA relationship to it (for
// example a trigger's aria-describedby or a combobox's aria-controls); it is
// purely additive.
type PopoverBaseProps = Readonly<{
    open: boolean;
    onClose?: () => void;
    anchorRef?: RefObject<HTMLElement | null>;
    trigger?: ReactNode;
    children: ReactNode;
    placement?: EPopoverPlacement;
    id?: string;
    offset?: number;
    viewportPadding?: number;
    trapFocus?: boolean;
    restoreFocus?: boolean;
    initialFocusRef?: RefObject<HTMLElement | null>;
}> &
    Toned;

// The relaxed name shape for roles whose accessible name comes from the panel's
// own content or an ARIA relationship rather than a self-supplied label - a
// tooltip named by the trigger's aria-describedby, a listbox named by the
// combobox's aria-labelledby. A self-name stays OPTIONAL here (and mutually
// exclusive when supplied), so these panels are never forced into an awkward,
// semantically-wrong self-name.
type OptionalAccessibleName =
    | { readonly label?: string; readonly labelledBy?: undefined }
    | { readonly labelledBy?: string; readonly label?: undefined };

// Props for the Popover floating-panel primitive.
//
// The accessible-name requirement is scoped to the role. The dialog role names a
// window, so it REQUIRES a name through the shared AccessibleName union (exactly
// one of `label` or `labelledBy`); because dialog is also the default, an omitted
// role falls into this branch and is name-required - closing the nameless-dialog
// gap at compile time. The menu, listbox, and tooltip roles derive their name
// from content or an ARIA relationship, so a self-name is optional for them.
export type PopoverProps =
    | (PopoverBaseProps &
          Readonly<{ role?: typeof EPopoverRole.Dialog }> &
          AccessibleName)
    | (PopoverBaseProps &
          Readonly<{ role: Exclude<EPopoverRole, typeof EPopoverRole.Dialog> }> &
          OptionalAccessibleName);
