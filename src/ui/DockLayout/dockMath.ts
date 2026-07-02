// Pure layout-tree operations for DockLayout. React-free and DOM-free (the
// calendarMath / Drawer.geometry split): every operation takes a
// DockLayoutState and returns a NEW normalized state - or the INPUT state
// unchanged (same reference) when the operation cannot apply - so the
// component layer is pure wiring and the whole docking model is
// unit-testable in isolation.
//
// Normalization invariants (enforced after every mutation):
//   - a tabs node always has at least one panelId and an activeId drawn
//     from its panelIds;
//   - a split never has an empty side (a one-sided split collapses to its
//     surviving child);
//   - a split fraction stays inside [MIN_FRACTION, MAX_FRACTION] (the
//     SplitPane bounds).

import { ESplitOrientation } from '../SplitPane/SplitPane.types';
import { type WindowRect } from '../Window/Window.types';
import {
    type DockFloatingPanel,
    type DockLayoutState,
    type DockNode,
    type DockSplitNode,
    type DockTabsNode,
    EDockEdge,
    EDockNodeKind,
} from './DockLayout.types';

// SplitPane's fraction bounds, mirrored so a persisted layout can never
// render a collapsed pane.
const MIN_FRACTION: number = 0.1;
const MAX_FRACTION: number = 0.9;

// The share a fresh edge-docked panel takes of the container.
const EDGE_DOCK_FRACTION: number = 0.25;

// How deep the pointer edge zones reach into the container, as a fraction
// of the container box.
const EDGE_ZONE_FRACTION: number = 0.2;

// A minimal client-space rectangle (a DOMRect satisfies it).
export type DockBounds = Readonly<{
    left: number;
    top: number;
    width: number;
    height: number;
}>;

// One rendered tab group's live box, keyed by its active panel (the group
// identity dockIntoGroup targets).
export type DockGroupRect = Readonly<{
    targetPanelId: string;
    bounds: DockBounds;
}>;

// Where a drag would drop: onto a container edge (split the root), into an
// existing tab group, or floating at the pointer.
export type DockDropTarget =
    | Readonly<{ kind: 'edge'; edge: EDockEdge }>
    | Readonly<{ kind: 'group'; targetPanelId: string }>
    | Readonly<{ kind: 'float' }>;

function clampFraction(fraction: number): number {
    if (!Number.isFinite(fraction)) {
        return EDGE_DOCK_FRACTION;
    }
    return Math.min(MAX_FRACTION, Math.max(MIN_FRACTION, fraction));
}

// Every panel id docked under `node`, in tree order.
export function dockedPanelIds(node: DockNode | null): readonly string[] {
    if (node === null) {
        return [];
    }
    if (node.kind === EDockNodeKind.Tabs) {
        return node.panelIds;
    }
    return [...dockedPanelIds(node.first), ...dockedPanelIds(node.second)];
}

// Every panel id present anywhere in the layout (docked plus floating).
export function layoutPanelIds(state: DockLayoutState): readonly string[] {
    return [
        ...dockedPanelIds(state.root),
        ...state.floating.map((entry: DockFloatingPanel): string => entry.panelId),
    ];
}

// Re-establish the tree invariants under `node`; null means the subtree is
// empty and the parent must collapse.
export function normalizeNode(node: DockNode): DockNode | null {
    if (node.kind === EDockNodeKind.Tabs) {
        if (node.panelIds.length === 0) {
            return null;
        }
        if (node.panelIds.includes(node.activeId)) {
            return node;
        }
        const fallback: string | undefined = node.panelIds[0];
        if (fallback === undefined) {
            return null;
        }
        return { ...node, activeId: fallback };
    }
    const first: DockNode | null = normalizeNode(node.first);
    const second: DockNode | null = normalizeNode(node.second);
    if (first === null) {
        return second;
    }
    if (second === null) {
        return first;
    }
    const fraction: number = clampFraction(node.fraction);
    if (
        first === node.first &&
        second === node.second &&
        fraction === node.fraction
    ) {
        return node;
    }
    return { ...node, first, second, fraction };
}

// Remove one panel id from the subtree (normalized).
function removeFromNode(node: DockNode, panelId: string): DockNode | null {
    if (node.kind === EDockNodeKind.Tabs) {
        if (!node.panelIds.includes(panelId)) {
            return node;
        }
        const remaining: readonly string[] = node.panelIds.filter(
            (id: string): boolean => id !== panelId,
        );
        return normalizeNode({ ...node, panelIds: remaining });
    }
    const first: DockNode | null = removeFromNode(node.first, panelId);
    const second: DockNode | null = removeFromNode(node.second, panelId);
    if (first === node.first && second === node.second) {
        return node;
    }
    if (first === null) {
        return second;
    }
    if (second === null) {
        return first;
    }
    return { ...node, first, second };
}

// Remove a panel from the entire layout (tree and floating). Unknown ids
// return the input state unchanged.
export function removePanel(
    state: DockLayoutState,
    panelId: string,
): DockLayoutState {
    const root: DockNode | null =
        state.root === null ? null : removeFromNode(state.root, panelId);
    const floating: readonly DockFloatingPanel[] = state.floating.filter(
        (entry: DockFloatingPanel): boolean => entry.panelId !== panelId,
    );
    if (root === state.root && floating.length === state.floating.length) {
        return state;
    }
    return { root, floating };
}

// Dock a panel against a container edge: the panel becomes a fresh
// single-tab group splitting the current root (or becomes the root when the
// tree is empty). The panel is pulled out of wherever it currently lives
// first, so the same op re-docks a floating or already-docked panel.
export function dockAtEdge(
    state: DockLayoutState,
    panelId: string,
    edge: EDockEdge,
): DockLayoutState {
    const without: DockLayoutState = removePanel(state, panelId);
    const panelNode: DockTabsNode = {
        kind: EDockNodeKind.Tabs,
        panelIds: [panelId],
        activeId: panelId,
    };
    if (without.root === null) {
        return { root: panelNode, floating: without.floating };
    }
    const orientation: ESplitOrientation =
        edge === EDockEdge.InlineStart || edge === EDockEdge.InlineEnd
            ? ESplitOrientation.Horizontal
            : ESplitOrientation.Vertical;
    const panelFirst: boolean =
        edge === EDockEdge.InlineStart || edge === EDockEdge.BlockStart;
    const root: DockSplitNode = {
        kind: EDockNodeKind.Split,
        orientation,
        fraction: panelFirst ? EDGE_DOCK_FRACTION : 1 - EDGE_DOCK_FRACTION,
        first: panelFirst ? panelNode : without.root,
        second: panelFirst ? without.root : panelNode,
    };
    return { root, floating: without.floating };
}

// Append `panelId` to the tab group containing `targetPanelId` and activate
// it; null when the target group is not in the subtree.
function insertIntoGroup(
    node: DockNode,
    panelId: string,
    targetPanelId: string,
): DockNode | null {
    if (node.kind === EDockNodeKind.Tabs) {
        if (!node.panelIds.includes(targetPanelId)) {
            return null;
        }
        return {
            ...node,
            panelIds: [...node.panelIds, panelId],
            activeId: panelId,
        };
    }
    const first: DockNode | null = insertIntoGroup(
        node.first,
        panelId,
        targetPanelId,
    );
    if (first !== null) {
        return { ...node, first };
    }
    const second: DockNode | null = insertIntoGroup(
        node.second,
        panelId,
        targetPanelId,
    );
    if (second !== null) {
        return { ...node, second };
    }
    return null;
}

// Dock a panel into the tab group that contains `targetPanelId`. A missing
// target (or self-target) returns the input state unchanged.
export function dockIntoGroup(
    state: DockLayoutState,
    panelId: string,
    targetPanelId: string,
): DockLayoutState {
    if (panelId === targetPanelId) {
        return state;
    }
    const without: DockLayoutState = removePanel(state, panelId);
    if (without.root === null) {
        return state;
    }
    const root: DockNode | null = insertIntoGroup(
        without.root,
        panelId,
        targetPanelId,
    );
    if (root === null) {
        return state;
    }
    return { root, floating: without.floating };
}

// Float a panel at `rect`, pulling it out of wherever it currently lives.
export function floatPanel(
    state: DockLayoutState,
    panelId: string,
    rect: WindowRect,
): DockLayoutState {
    const without: DockLayoutState = removePanel(state, panelId);
    return {
        root: without.root,
        floating: [...without.floating, { panelId, rect }],
    };
}

// Update a floating panel's rect. Unknown ids return the input unchanged.
export function moveFloating(
    state: DockLayoutState,
    panelId: string,
    rect: WindowRect,
): DockLayoutState {
    if (
        !state.floating.some(
            (entry: DockFloatingPanel): boolean => entry.panelId === panelId,
        )
    ) {
        return state;
    }
    return {
        root: state.root,
        floating: state.floating.map(
            (entry: DockFloatingPanel): DockFloatingPanel =>
                entry.panelId === panelId ? { panelId, rect } : entry,
        ),
    };
}

// Set a split fraction by tree path (0 = first, 1 = second at each split).
// An invalid path returns the input unchanged.
export function setFraction(
    state: DockLayoutState,
    path: readonly number[],
    fraction: number,
): DockLayoutState {
    function update(node: DockNode, depth: number): DockNode | null {
        if (node.kind !== EDockNodeKind.Split) {
            return null;
        }
        if (depth === path.length) {
            return { ...node, fraction: clampFraction(fraction) };
        }
        const step: number | undefined = path[depth];
        if (step === 0) {
            const first: DockNode | null = update(node.first, depth + 1);
            if (first === null) {
                return null;
            }
            return { ...node, first };
        }
        if (step === 1) {
            const second: DockNode | null = update(node.second, depth + 1);
            if (second === null) {
                return null;
            }
            return { ...node, second };
        }
        return null;
    }
    if (state.root === null) {
        return state;
    }
    const root: DockNode | null = update(state.root, 0);
    if (root === null) {
        return state;
    }
    return { root, floating: state.floating };
}

// Activate a docked panel inside its tab group. Unknown ids return the
// input unchanged.
export function setActiveTab(
    state: DockLayoutState,
    panelId: string,
): DockLayoutState {
    function activate(node: DockNode): DockNode | null {
        if (node.kind === EDockNodeKind.Tabs) {
            if (!node.panelIds.includes(panelId)) {
                return null;
            }
            if (node.activeId === panelId) {
                return node;
            }
            return { ...node, activeId: panelId };
        }
        const first: DockNode | null = activate(node.first);
        if (first !== null) {
            return first === node.first ? node : { ...node, first };
        }
        const second: DockNode | null = activate(node.second);
        if (second !== null) {
            return second === node.second ? node : { ...node, second };
        }
        return null;
    }
    if (state.root === null) {
        return state;
    }
    const root: DockNode | null = activate(state.root);
    if (root === null || root === state.root) {
        return state;
    }
    return { root, floating: state.floating };
}

// Resolve where a drag at client point (x, y) would drop. Outside the
// container floats; an edge band (EDGE_ZONE_FRACTION deep, nearest edge
// wins) splits the root, with the inline axis mirrored under RTL; a point
// over a rendered group docks into it; anywhere else floats.
export function dropTargetAtPoint(
    bounds: DockBounds,
    x: number,
    y: number,
    groups: readonly DockGroupRect[],
    rtl: boolean,
): DockDropTarget {
    if (bounds.width <= 0 || bounds.height <= 0) {
        return { kind: 'float' };
    }
    const relativeX: number = (x - bounds.left) / bounds.width;
    const relativeY: number = (y - bounds.top) / bounds.height;
    if (relativeX < 0 || relativeX > 1 || relativeY < 0 || relativeY > 1) {
        return { kind: 'float' };
    }
    const edgeDistances: readonly (readonly [EDockEdge, number])[] = [
        [rtl ? EDockEdge.InlineEnd : EDockEdge.InlineStart, relativeX],
        [rtl ? EDockEdge.InlineStart : EDockEdge.InlineEnd, 1 - relativeX],
        [EDockEdge.BlockStart, relativeY],
        [EDockEdge.BlockEnd, 1 - relativeY],
    ];
    let nearestEdge: EDockEdge | null = null;
    let nearestDistance: number = EDGE_ZONE_FRACTION;
    for (const [edge, distance] of edgeDistances) {
        if (distance < nearestDistance) {
            nearestEdge = edge;
            nearestDistance = distance;
        }
    }
    if (nearestEdge !== null) {
        return { kind: 'edge', edge: nearestEdge };
    }
    for (const group of groups) {
        const inside: boolean =
            x >= group.bounds.left &&
            x < group.bounds.left + group.bounds.width &&
            y >= group.bounds.top &&
            y < group.bounds.top + group.bounds.height;
        if (inside) {
            return { kind: 'group', targetPanelId: group.targetPanelId };
        }
    }
    return { kind: 'float' };
}
