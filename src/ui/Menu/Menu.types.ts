import { type ReactNode, type RefObject } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type EPopoverPlacement } from '../Popover/Popover.types';
import { type Toned } from '../tone';

// The discriminant for a menu node. The kebab values double as the data-kind
// attribute the CSS reads, so they are load-bearing strings.
export const EMenuNodeKind: {
    readonly Action: 'action';
    readonly Checkbox: 'checkbox';
    readonly Radio: 'radio';
    readonly Submenu: 'submenu';
    readonly Separator: 'separator';
} = {
    Action: 'action',
    Checkbox: 'checkbox',
    Radio: 'radio',
    Submenu: 'submenu',
    Separator: 'separator',
};
export type EMenuNodeKind = (typeof EMenuNodeKind)[keyof typeof EMenuNodeKind];

// Orientation: a vertical dropdown menu vs the horizontal menubar. The values
// double as aria-orientation and the data-orientation attribute the CSS reads.
export const EMenuOrientation: {
    readonly Vertical: 'vertical';
    readonly Horizontal: 'horizontal';
} = { Vertical: 'vertical', Horizontal: 'horizontal' };
export type EMenuOrientation =
    (typeof EMenuOrientation)[keyof typeof EMenuOrientation];

// A clickable command item. `id` is the opaque identity reported by onSelect;
// `label` is renderable content (type-ahead matches it only when it is a plain
// string); `shortcut` is a DISPLAY-ONLY hint string (Portal installs no global
// accelerator - the app wires the real key handler); `icon` is an optional
// leading ReactNode slot; `disabled` skips navigation and blocks activation.
export type MenuActionNode = Readonly<{
    kind: typeof EMenuNodeKind.Action;
    id: string;
    label: ReactNode;
    shortcut?: string;
    icon?: ReactNode;
    disabled?: boolean;
}>;

// A checkable item (role=menuitemcheckbox). `checked` is controlled by the
// consumer; activation reports onSelect(id) and the consumer flips it.
export type MenuCheckboxNode = Readonly<{
    kind: typeof EMenuNodeKind.Checkbox;
    id: string;
    label: ReactNode;
    checked: boolean;
    shortcut?: string;
    disabled?: boolean;
}>;

// A radio item (role=menuitemradio). `group` names the single-selection set; the
// consumer enforces exclusivity in its model inside its onSelect handler.
export type MenuRadioNode = Readonly<{
    kind: typeof EMenuNodeKind.Radio;
    id: string;
    label: ReactNode;
    checked: boolean;
    group: string;
    shortcut?: string;
    disabled?: boolean;
}>;

// A submenu parent (role=menuitem, aria-haspopup="menu", aria-expanded).
// `items` is the recursive child set.
export type MenuSubmenuNode = Readonly<{
    kind: typeof EMenuNodeKind.Submenu;
    id: string;
    label: ReactNode;
    items: readonly MenuNode[];
    icon?: ReactNode;
    disabled?: boolean;
}>;

// A non-interactive separator (role=separator); skipped by all navigation.
export type MenuSeparatorNode = Readonly<{
    kind: typeof EMenuNodeKind.Separator;
    id: string;
}>;

export type MenuNode =
    | MenuActionNode
    | MenuCheckboxNode
    | MenuRadioNode
    | MenuSubmenuNode
    | MenuSeparatorNode;

// One top-level entry in a MenuBar.
export type MenuBarMenu = Readonly<{
    id: string;
    label: ReactNode;
    items: readonly MenuNode[];
    disabled?: boolean;
}>;

// Controlled dropdown menu. Anchored to a consumer-owned `anchorRef`.
// `open`/`onOpenChange` are controlled; `onSelect` reports an activated leaf id;
// the menu carries an accessible name via the shared AccessibleName union.
// `placement` is the preferred side (default Bottom). `enabled` resolves through
// useResolvedEnabled; `tone` flows through the shared tone scope.
export type MenuProps = Readonly<{
    items: readonly MenuNode[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (id: string) => void;
    anchorRef: RefObject<HTMLElement | null>;
    placement?: EPopoverPlacement;
    enabled?: EEnabledState;
}> &
    AccessibleName &
    Toned;

// MenuBar: a horizontal menubar of top-level menus, each opening a Menu. Owns
// open state internally; reports onSelect(menuId, itemId).
export type MenuBarProps = Readonly<{
    menus: readonly MenuBarMenu[];
    onSelect: (menuId: string, itemId: string) => void;
    enabled?: EEnabledState;
}> &
    AccessibleName &
    Toned;

// ContextMenu: wraps a trigger region; opens a Menu at the pointer on the
// contextmenu event. `children` is the right-clickable region.
export type ContextMenuProps = Readonly<{
    items: readonly MenuNode[];
    onSelect: (id: string) => void;
    children: ReactNode;
    enabled?: EEnabledState;
}> &
    AccessibleName &
    Toned;
