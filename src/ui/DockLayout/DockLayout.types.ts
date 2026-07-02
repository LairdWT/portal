import { type ReactNode } from 'react';

import { type ESplitOrientation } from '../SplitPane/SplitPane.types';
import { type Toned } from '../tone';
import { type WindowRect } from '../Window/Window.types';

// The node discriminant for the serializable layout tree. The values are
// load-bearing strings in persisted layouts - never renumber.
export const EDockNodeKind: {
    readonly Split: 'split';
    readonly Tabs: 'tabs';
} = {
    Split: 'split',
    Tabs: 'tabs',
};
export type EDockNodeKind = (typeof EDockNodeKind)[keyof typeof EDockNodeKind];

// A dockable container edge, in LOGICAL directions (the Drawer edge
// convention); pointer hit testing maps physical zones through the live text
// direction. The values are load-bearing in persisted menu wiring.
export const EDockEdge: {
    readonly InlineStart: 'inline-start';
    readonly InlineEnd: 'inline-end';
    readonly BlockStart: 'block-start';
    readonly BlockEnd: 'block-end';
} = {
    InlineStart: 'inline-start',
    InlineEnd: 'inline-end',
    BlockStart: 'block-start',
    BlockEnd: 'block-end',
};
export type EDockEdge = (typeof EDockEdge)[keyof typeof EDockEdge];

// A binary split: two child regions along an orientation, divided at
// `fraction` (the first region's share, the SplitPane contract).
export type DockSplitNode = Readonly<{
    kind: typeof EDockNodeKind.Split;
    orientation: ESplitOrientation;
    fraction: number;
    first: DockNode;
    second: DockNode;
}>;

// A tab group of docked panels; `activeId` is the visible one.
export type DockTabsNode = Readonly<{
    kind: typeof EDockNodeKind.Tabs;
    panelIds: readonly string[];
    activeId: string;
}>;

export type DockNode = DockSplitNode | DockTabsNode;

// One floating panel: a Window at `rect` in viewport coordinates.
export type DockFloatingPanel = Readonly<{
    panelId: string;
    rect: WindowRect;
}>;

// The complete serializable layout: a docked tree (null when nothing is
// docked) plus the floating set. JSON-safe by construction - strings and
// numbers only - so a layout persists and rehydrates verbatim.
export type DockLayoutState = Readonly<{
    root: DockNode | null;
    floating: readonly DockFloatingPanel[];
}>;

// One dockable panel: pure data (the Tabs/Menu data-driven convention -
// panels are declared, not mounted as children). A panel whose id never
// appears in the layout simply does not render.
export type DockPanelDef = Readonly<{
    id: string;
    title: string;
    content: ReactNode;
}>;

// Props for the DockLayout: a CONTROLLED docking manager composing SplitPane
// (splits), Tabs (groups), and Window (floating panels). Every mutation -
// drag-docking, tab switches, splitter resizes, floating moves - reports the
// next layout through `onLayoutChange`; the consumer owns persistence.
// Keyboard path: each group header carries a panel menu with every dock
// destination, so no pointer-only outcome exists.
export type DockLayoutProps = Readonly<{
    /**
     * Accessible name for the dock region.
     */
    label: string;
    panels: readonly DockPanelDef[];
    layout: DockLayoutState;
    onLayoutChange: (layout: DockLayoutState) => void;
    /**
     * Container block-size as a CSS length/token string. Default a
     * token-derived height.
     */
    blockSize?: string | undefined;
}> &
    Toned;
