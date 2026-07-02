import type { ReactNode } from 'react';

import type { RadialSides } from './radialGeometry';

export type { RadialSides } from './radialGeometry';

// One radiating section: a selectable option placed at a polygon edge. `label`
// is the accessible name (used as the button's aria-label); `icon` is optional
// decorative content shown above the label and is marked aria-hidden.
export type RadialItem = Readonly<{
    id: string;
    label: string;
    icon?: ReactNode;
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
// props onto this shape and supplies the activation behavior.
export type RadialCoreProps = Readonly<{
    open: boolean;
    onClose: () => void;
    label: string;
    sides: RadialSides;
    items: readonly RadialItem[];
    centerActions: readonly ERadialAction[];
    variant: ERadialVariant;
    onActivateSection: (item: RadialItem, index: number) => void;
    onActivateAction: (action: ERadialAction) => void;
    disabled: boolean;
    tone?: string | undefined;
}>;

// Props for the generic-UI RadialMenu. An open/close modal radial menu portaled
// onto the shared overlay layer: `items` fan out from each edge, a click selects
// one (and closes it unless closeOnSelect is false); the optional center hub
// carries confirm/cancel/next/previous as drawn symbols. Cancel always closes.
export type RadialMenuProps = Readonly<{
    open: boolean;
    onClose: () => void;
    label: string;
    items: readonly RadialItem[];
    onSelect: (id: string) => void;
    sides?: RadialSides;
    centerActions?: readonly ERadialAction[];
    onCenterAction?: (action: ERadialAction) => void;
    // Close the menu after a section is selected (default true). Set false to
    // keep it open, e.g. while paging through pages with the center next/previous.
    closeOnSelect?: boolean;
    tone?: string | undefined;
}>;
