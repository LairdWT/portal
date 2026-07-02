import type { ReactNode } from 'react';

import type { RadialSides } from './radialGeometry';

export type { RadialSides } from './radialGeometry';

// One radiating section: a selectable option placed at a polygon edge. `label`
// is the accessible name (used as the button's aria-label); `icon` is optional
// decorative content shown above the label and is marked aria-hidden. Set
// `iconOnly` to present the section as a pure glyph key: the visible text is
// omitted while `label` still names the button for assistive tech (ignored
// when no icon is supplied, so a section never renders empty).
export type RadialItem = Readonly<{
    id: string;
    label: string;
    icon?: ReactNode;
    iconOnly?: boolean;
    disabled?: boolean;
}>;

// Center-hub action. The hub holds 0..4 of these as symbol buttons in a 2x2
// grid: confirm/cancel on the top row, previous/next on the bottom row. Values
// double as the data-action attribute and (in RadialPad) the emitted signal id
// suffix, so the lowercase strings are load-bearing. Drawn as centered symbols
// (check, cross, triangles), never words.
export const ERadialAction: {
    readonly Confirm: 'confirm';
    readonly Cancel: 'cancel';
    readonly Previous: 'previous';
    readonly Next: 'next';
} = {
    Confirm: 'confirm',
    Cancel: 'cancel',
    Previous: 'previous',
    Next: 'next',
};
export type ERadialAction = (typeof ERadialAction)[keyof typeof ERadialAction];

// Which visual family the shared core renders. Internal: the public wrappers set
// it, consumers never see it. Menu is the Tier-2 beveled HUD surface; Controller
// is the Tier-1 brushed-metal controller face, matching DPad / BevelButton.
export const ERadialVariant: {
    readonly Menu: 'menu';
    readonly Controller: 'controller';
} = {
    Menu: 'menu',
    Controller: 'controller',
};
export type ERadialVariant = (typeof ERadialVariant)[keyof typeof ERadialVariant];

// Internal props for the shared RadialCore. NOT part of the public barrel: the
// core is behavior-agnostic (it renders the overlay, geometry, hub, and
// animation and reports raw activations) and each public wrapper maps its own
// props onto this shape and supplies the activation behavior. `collapsible`
// switches the core from a portaled modal overlay to an INLINE disclosure: the
// hub stays mounted as the collapsed state (a toggle button wearing the shared
// toggle chip) and only the wedges fan out/collapse; `onOpen` is the toggle's
// expand request.
export type RadialCoreProps = Readonly<{
    open: boolean;
    onClose: () => void;
    onOpen?: (() => void) | undefined;
    label: string;
    sides: RadialSides;
    items: readonly RadialItem[];
    centerActions: readonly ERadialAction[];
    variant: ERadialVariant;
    collapsible: boolean;
    onActivateSection: (item: RadialItem, index: number) => void;
    onActivateAction: (action: ERadialAction) => void;
    disabled: boolean;
    tone?: string | undefined;
}>;

// Props for the generic-UI RadialMenu. An open/close radial menu: `items` fan
// out from each edge, a click selects one (and closes it unless closeOnSelect
// is false); the optional center hub carries confirm/cancel/next/previous as
// drawn symbols. Cancel always closes.
//
// Paging: when more items than sides are supplied, the Next / Previous center
// actions page through them (wrapping) with the wedge entrance replaying per
// page; onCenterAction still fires for every action press.
//
// Collapsible: by default the menu is a portaled MODAL overlay. Set
// `collapsible` for the inline disclosure form - the center hub stays mounted
// as the collapsed state (a toggle button named by `label`, wearing the shared
// toggle chip) and the wedges animate out around it on open and collapse back
// into it on close; `onOpen` receives the toggle's expand request.
export type RadialMenuProps = Readonly<{
    open: boolean;
    onClose: () => void;
    onOpen?: () => void;
    label: string;
    items: readonly RadialItem[];
    onSelect: (id: string) => void;
    sides?: RadialSides;
    centerActions?: readonly ERadialAction[];
    onCenterAction?: (action: ERadialAction) => void;
    // Close the menu after a section is selected (default true). Set false to
    // keep it open, e.g. while paging through pages with the center next/previous.
    closeOnSelect?: boolean;
    collapsible?: boolean;
    tone?: string | undefined;
}>;
