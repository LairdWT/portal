// Public contract for the Window component: a portal-rendered, draggable,
// optionally resizable machined-HUD frame with a title-bar drag handle, close /
// minimize / maximize affordances, focus-to-front z-order, viewport clamping, and
// an opt-in modal backdrop. It is the React-DOM realization of Helicon's
// FloatingWindow builder plus its PopoutBuilder chrome - the floating window and
// the modal popout are folded into one component, switched by the `modal`
// discriminant.
//
// Accessibility contract: the root is role="dialog" named by aria-labelledby ->
// the title heading; `aria-modal` reflects `modal`. Every affordance is a real
// <button type="button"> with an explicit aria-label; the maximize button mirrors
// its state with aria-pressed. The move grip and the resize handles are focusable
// buttons exposing aria-keyshortcuts for keyboard move/resize. Tone drives the
// frame edge, the title-bar glow/sheen, and the resize marks ONLY - never
// AA-critical text, which always uses --portal-color-text-*.

import { type ReactNode } from 'react';

import { type EUiStatus, type Toned } from '../tone';

// Window display state. The kebab values double as the data-state attribute the
// CSS keys off (machined chrome + layout differ per state). Minimized collapses
// to the title bar; Maximized fills the padded viewport; Normal is the
// free-floating draggable/resizable frame.
export const EWindowState: {
    readonly Normal: 'normal';
    readonly Minimized: 'minimized';
    readonly Maximized: 'maximized';
} = { Normal: 'normal', Minimized: 'minimized', Maximized: 'maximized' };
export type EWindowState = (typeof EWindowState)[keyof typeof EWindowState];

// Which edges/corners expose a resize grip. None disables resize entirely
// (Helicon non-resizable). Both = all 8 handles. Horizontal exposes the two
// side edges; Vertical exposes the top/bottom edges. The value doubles as the
// data-resize attribute.
export const EWindowResizeMode: {
    readonly None: 'none';
    readonly Horizontal: 'horizontal';
    readonly Vertical: 'vertical';
    readonly Both: 'both';
} = {
    None: 'none',
    Horizontal: 'horizontal',
    Vertical: 'vertical',
    Both: 'both',
};
export type EWindowResizeMode =
    (typeof EWindowResizeMode)[keyof typeof EWindowResizeMode];

// Which edge/corner a resize handle controls. The single-letter compass values
// double as the data-edge attribute the CSS positions each handle from; the
// resize math in windowGeometry reads the same values to decide which sides move.
export const EWindowResizeEdge: {
    readonly North: 'n';
    readonly South: 's';
    readonly East: 'e';
    readonly West: 'w';
    readonly NorthEast: 'ne';
    readonly NorthWest: 'nw';
    readonly SouthEast: 'se';
    readonly SouthWest: 'sw';
} = {
    North: 'n',
    South: 's',
    East: 'e',
    West: 'w',
    NorthEast: 'ne',
    NorthWest: 'nw',
    SouthEast: 'se',
    SouthWest: 'sw',
};
export type EWindowResizeEdge =
    (typeof EWindowResizeEdge)[keyof typeof EWindowResizeEdge];

// CSS-pixel rectangle of the window in viewport coordinates. Position is the
// top-left; size is the box size. Consumed by the pure clamp/resize helpers.
export type WindowRect = Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
}>;

export type WindowSize = Readonly<{ width: number; height: number }>;
export type WindowPoint = Readonly<{ x: number; y: number }>;

// Shared, mode-independent fields.
type WindowSharedProps = {
    // Controlled visibility (mirrors Dialog open/onClose). The owner clears open
    // in response to a dismissal request reported through onOpenChange(false).
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // Title text; the accessible name (aria-labelledby -> the title element).
    // Required, so a nameless window is a compile error - same posture as Dialog.
    title: string;
    children: ReactNode;
    // Title-bar slots (the generalized Helicon title_bar): a leading decorative
    // mark, a secondary status string, and a host-supplied action cluster.
    leadingIcon?: ReactNode;
    statusText?: string;
    titleBarActions?: ReactNode;
    // Seed geometry (Helicon default_pos / default_size). Uncontrolled by
    // default; internal state owns live position/size after first paint.
    defaultPosition?: WindowPoint;
    defaultSize?: WindowSize;
    minSize?: WindowSize;
    // OPTIONAL fully-controlled geometry override + committed reports. When
    // position/size are supplied the window is controlled on that axis; onMove /
    // onResize report committed (drag-end / resize-end) values regardless.
    position?: WindowPoint;
    size?: WindowSize;
    onMove?: (point: WindowPoint) => void;
    onResize?: (size: WindowSize) => void;
    resize?: EWindowResizeMode;
    // Affordance opt-ins. Close is always present (open is controlled).
    minimizable?: boolean;
    maximizable?: boolean;
    // Controlled window state (minimize/maximize) + report. Uncontrolled when
    // omitted (internal EWindowState, defaults Normal).
    windowState?: EWindowState;
    onWindowStateChange?: (state: EWindowState) => void;
    status?: EUiStatus;
};

// Floating (non-modal) member: draggable, raised-on-focus, NOT input-blocking.
// role="dialog" aria-modal="false". closeOnEscape gates Escape dismissal
// (default false for non-modal - a floating panel usually persists).
export type WindowFloatingProps = Readonly<
    {
        modal?: false;
        closeOnEscape?: boolean;
    } & WindowSharedProps
> &
    Toned;

// Modal member: backdrop + scroll-lock + focus-trap, input blocked elsewhere.
// role="dialog" aria-modal="true". closeOnEscape / closeOnBackdrop default true
// (Dialog parity).
export type WindowModalProps = Readonly<
    {
        modal: true;
        closeOnEscape?: boolean;
        closeOnBackdrop?: boolean;
    } & WindowSharedProps
> &
    Toned;

// Discriminated public props union. The component branches on props.modal; the
// impossible states (a backdrop dismissal option on a non-modal window) are
// unrepresentable.
export type WindowProps = WindowFloatingProps | WindowModalProps;
