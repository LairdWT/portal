// Public type contract for Drawer - an edge-docked side / bottom panel.
//
// One directory, one component, whose `mode` discriminant selects between two
// realizations of the same edge-docked panel idiom (Helicon dock_panel's
// side_panel_left + bottom_panel):
//
//   - EDrawerMode.Overlay  - a portal-rendered MODAL drawer / sheet: a scrim
//     backdrop, focus trap, body scroll-lock, and Escape + outside-pointer
//     dismissal, slid in from an edge. It reuses the EXACT Dialog overlay
//     primitives (useFocusTrap, useScrollLock, useDismiss, ensureOverlayRoot,
//     EOverlayMotion), so it shares one stacking layer and one dismissal
//     contract. role="dialog", aria-modal.
//   - EDrawerMode.Inline   - an in-flow DOCKED panel: no portal, no scrim, no
//     focus trap, no scroll-lock; it participates in the page flow like
//     Helicon's SidePanel / TopBottomPanel. role="complementary" (a landmark)
//     or role="region".
//
// The mode is a discriminated union so impossible states are unrepresentable:
// an overlay carries open / onClose and never collapsed; an inline panel
// carries collapsed / onCollapsedChange and never onClose. The shared shell
// (edge, header strip, machined-HUD bevel chrome, collapse marker, resize
// handle) is authored once. The body is interface-forwarded `children`; Drawer
// owns the shell, never the content (Helicon's body: impl FnOnce(&mut Ui)).
//
// A11y: an overlay role="dialog" and an inline role="complementary" landmark
// each require an accessible name, so AccessibleName (label XOR labelledBy) is
// mixed into BOTH modes - a nameless drawer is a compile error. Tone drives the
// HUD edge border, glow, and the resize-handle grip via --portal-tone-*; status
// routes danger / success through data-status. Resize (both modes) is the
// WAI-ARIA window-splitter pattern (role="separator", arrow-key resize) driven
// by the shared usePointerDrag pointer engine; the collapse chevron is a real
// <button aria-expanded aria-controls>.

import { type ReactNode, type RefObject } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type EUiStatus, type Toned } from '../tone';

// Presentation / behavior mode. The string value doubles as the discriminant on
// the props union and as the data-mode attribute the CSS keys off.
export const EDrawerMode: {
    readonly Overlay: 'overlay';
    readonly Inline: 'inline';
} = { Overlay: 'overlay', Inline: 'inline' };
export type EDrawerMode = (typeof EDrawerMode)[keyof typeof EDrawerMode];

// Docked edge, expressed in LOGICAL terms so RTL flips inline-start / inline-end
// for free. InlineStart / InlineEnd are the side panels (left / right in LTR);
// BlockEnd is the bottom panel. The value doubles as the data-edge attribute
// that drives the slide axis and the resize-handle side in CSS.
export const EDrawerEdge: {
    readonly InlineStart: 'inline-start';
    readonly InlineEnd: 'inline-end';
    readonly BlockEnd: 'block-end';
} = {
    InlineStart: 'inline-start',
    InlineEnd: 'inline-end',
    BlockEnd: 'block-end',
};
export type EDrawerEdge = (typeof EDrawerEdge)[keyof typeof EDrawerEdge];

// Heading level for the header-strip title. Constrained so the heading switch in
// the component stays exhaustive and never interpolates a tag name from a string.
export type DrawerHeadingLevel = 2 | 3 | 4 | 5 | 6;

// Caller-owned size model (mirrors Helicon default_width / min_width). `size` is
// a CSS-px number on the dock axis (inline-size for the side edges, block-size
// for BlockEnd); minSize / maxSize clamp it. When `resizable` is omitted / false
// the drawer is fixed at size ?? defaultSize and renders no handle. The size px
// are applied as a JS-computed inline style (never authored in module CSS), so
// the "no fixed-px layout in CSS" rule holds.
export type DrawerResize = Readonly<{
    resizable?: boolean;
    size?: number;
    onSizeChange?: (size: number) => void;
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
    resizeLabel?: string;
}>;

// Fields shared by both modes.
type DrawerSharedProps = {
    edge?: EDrawerEdge;
    title: ReactNode;
    headingLevel?: DrawerHeadingLevel;
    children: ReactNode;
    enabled?: EEnabledState;
    status?: EUiStatus;
} & DrawerResize;

// Overlay (modal) drawer: portal + scrim + focus-trap + scroll-lock + dismissal,
// reusing the Dialog primitives. `open` drives visibility; `onClose` fires on
// every dismissal request (Escape, outside pointer, or a composed close). A named
// dialog role REQUIRES an accessible name, so AccessibleName is mixed in.
export type DrawerOverlayProps = Readonly<
    {
        mode: typeof EDrawerMode.Overlay;
        open: boolean;
        onClose: () => void;
        closeOnEscape?: boolean;
        closeOnBackdrop?: boolean;
        closeLabel?: string;
        initialFocusRef?: RefObject<HTMLElement | null>;
    } & DrawerSharedProps
> &
    AccessibleName &
    Toned;

// Inline (docked, non-modal) drawer: the direct Helicon SidePanel / BottomPanel
// analog. `collapsible` adds the chevron; `collapsed` is the controlled
// open / closed of the body (Helicon's persisted collapse promoted to a
// controlled prop). role="complementary" is a landmark and also needs a name, so
// AccessibleName is mixed in; `landmark: false` downgrades to role="region" for a
// nested drawer.
export type DrawerInlineProps = Readonly<
    {
        mode: typeof EDrawerMode.Inline;
        collapsible?: boolean;
        collapsed?: boolean;
        onCollapsedChange?: (collapsed: boolean) => void;
        toggleLabel?: string;
        landmark?: boolean;
    } & DrawerSharedProps
> &
    AccessibleName &
    Toned;

// Discriminated public props union. The component switches on props.mode with no
// default branch (switch-exhaustiveness makes a new mode a compile error); an
// overlay can never carry collapsed and an inline can never carry onClose.
export type DrawerProps = DrawerOverlayProps | DrawerInlineProps;
