import { describe, expect, it } from 'vitest';

import { ESplitOrientation } from '../SplitPane/SplitPane.types';
import {
    type DockLayoutState,
    type DockNode,
    type DockSplitNode,
    type DockTabsNode,
    EDockEdge,
    EDockNodeKind,
} from './DockLayout.types';
import {
    dockAtEdge,
    type DockBounds,
    dockedPanelIds,
    dockIntoGroup,
    dropTargetAtPoint,
    floatPanel,
    layoutPanelIds,
    moveFloating,
    normalizeNode,
    removePanel,
    setActiveTab,
    setFraction,
} from './dockMath';

function tabs(panelIds: readonly string[], activeId?: string): DockTabsNode {
    return {
        kind: EDockNodeKind.Tabs,
        panelIds,
        activeId: activeId ?? panelIds[0] ?? '',
    };
}

function split(
    first: DockNode,
    second: DockNode,
    fraction: number = 0.5,
    orientation: ESplitOrientation = ESplitOrientation.Horizontal,
): DockSplitNode {
    return { kind: EDockNodeKind.Split, orientation, fraction, first, second };
}

const EMPTY: DockLayoutState = { root: null, floating: [] };

// nav | (editor+preview / console)
const WORKSPACE: DockLayoutState = {
    root: split(
        tabs(['nav']),
        split(
            tabs(['editor', 'preview'], 'editor'),
            tabs(['console']),
            0.7,
            ESplitOrientation.Vertical,
        ),
        0.25,
    ),
    floating: [
        { panelId: 'palette', rect: { x: 40, y: 40, width: 320, height: 240 } },
    ],
};

describe('panel inventories', (): void => {
    it('lists docked ids in tree order and layout ids with floating', (): void => {
        expect(dockedPanelIds(WORKSPACE.root)).toEqual([
            'nav',
            'editor',
            'preview',
            'console',
        ]);
        expect(layoutPanelIds(WORKSPACE)).toEqual([
            'nav',
            'editor',
            'preview',
            'console',
            'palette',
        ]);
        expect(dockedPanelIds(null)).toEqual([]);
    });
});

describe('normalizeNode', (): void => {
    it('collapses empty tabs and one-sided splits', (): void => {
        expect(normalizeNode(tabs([]))).toBeNull();
        expect(normalizeNode(split(tabs([]), tabs(['a'])))).toEqual(tabs(['a']));
        expect(normalizeNode(split(tabs([]), tabs([])))).toBeNull();
    });

    it('repairs a dangling activeId and clamps fractions', (): void => {
        expect(normalizeNode(tabs(['a', 'b'], 'gone'))).toEqual(
            tabs(['a', 'b'], 'a'),
        );
        const clamped: DockNode | null = normalizeNode(
            split(tabs(['a']), tabs(['b']), 0.01),
        );
        expect(clamped?.kind === EDockNodeKind.Split && clamped.fraction).toBe(0.1);
    });

    it('returns the same reference when nothing changes', (): void => {
        const node: DockSplitNode = split(tabs(['a']), tabs(['b']), 0.5);
        expect(normalizeNode(node)).toBe(node);
    });
});

describe('removePanel', (): void => {
    it('removes a tab and keeps the group', (): void => {
        const next: DockLayoutState = removePanel(WORKSPACE, 'preview');
        expect(dockedPanelIds(next.root)).toEqual(['nav', 'editor', 'console']);
    });

    it('collapses the split when the last tab of a side leaves', (): void => {
        const next: DockLayoutState = removePanel(WORKSPACE, 'nav');
        expect(next.root?.kind).toBe(EDockNodeKind.Split);
        expect(dockedPanelIds(next.root)).toEqual(['editor', 'preview', 'console']);
    });

    it('removes a floating panel and ignores unknown ids', (): void => {
        const next: DockLayoutState = removePanel(WORKSPACE, 'palette');
        expect(next.floating).toEqual([]);
        expect(removePanel(WORKSPACE, 'ghost')).toBe(WORKSPACE);
    });

    it('repairs the activeId when the active tab leaves', (): void => {
        const state: DockLayoutState = {
            root: tabs(['a', 'b'], 'a'),
            floating: [],
        };
        const next: DockLayoutState = removePanel(state, 'a');
        expect(next.root).toEqual(tabs(['b'], 'b'));
    });
});

describe('dockAtEdge', (): void => {
    it('docks into an empty layout as the root group', (): void => {
        const next: DockLayoutState = dockAtEdge(EMPTY, 'a', EDockEdge.InlineStart);
        expect(next.root).toEqual(tabs(['a']));
    });

    it('splits the root with the panel on the requested side', (): void => {
        const base: DockLayoutState = { root: tabs(['main']), floating: [] };
        const start: DockLayoutState = dockAtEdge(
            base,
            'side',
            EDockEdge.InlineStart,
        );
        expect(start.root).toEqual(split(tabs(['side']), tabs(['main']), 0.25));
        const bottom: DockLayoutState = dockAtEdge(
            base,
            'side',
            EDockEdge.BlockEnd,
        );
        expect(bottom.root).toEqual(
            split(tabs(['main']), tabs(['side']), 0.75, ESplitOrientation.Vertical),
        );
    });

    it('pulls the panel out of its current home first', (): void => {
        const next: DockLayoutState = dockAtEdge(
            WORKSPACE,
            'preview',
            EDockEdge.BlockStart,
        );
        expect(dockedPanelIds(next.root)[0]).toBe('preview');
        expect(
            dockedPanelIds(next.root).filter(
                (id: string): boolean => id === 'preview',
            ),
        ).toHaveLength(1);
    });

    it('docks a floating panel and clears its floating entry', (): void => {
        const next: DockLayoutState = dockAtEdge(
            WORKSPACE,
            'palette',
            EDockEdge.InlineEnd,
        );
        expect(next.floating).toEqual([]);
        expect(dockedPanelIds(next.root)).toContain('palette');
    });
});

describe('dockIntoGroup', (): void => {
    it('appends to the target group and activates the moved panel', (): void => {
        const next: DockLayoutState = dockIntoGroup(WORKSPACE, 'console', 'editor');
        const ids: readonly string[] = dockedPanelIds(next.root);
        expect(ids).toEqual(['nav', 'editor', 'preview', 'console']);
        // The console group collapsed; the editor group gained console active.
        const root: DockNode | null = next.root;
        expect(root?.kind).toBe(EDockNodeKind.Split);
    });

    it('is a no-op for self-targets and missing targets', (): void => {
        expect(dockIntoGroup(WORKSPACE, 'editor', 'editor')).toBe(WORKSPACE);
        expect(dockIntoGroup(WORKSPACE, 'editor', 'ghost')).toBe(WORKSPACE);
    });

    it('docks a floating panel into a group', (): void => {
        const next: DockLayoutState = dockIntoGroup(WORKSPACE, 'palette', 'nav');
        expect(next.floating).toEqual([]);
        expect(dockedPanelIds(next.root)).toContain('palette');
    });
});

describe('floatPanel / moveFloating', (): void => {
    it('floats a docked panel at the requested rect', (): void => {
        const rect: { x: number; y: number; width: number; height: number } = {
            x: 10,
            y: 20,
            width: 300,
            height: 200,
        };
        const next: DockLayoutState = floatPanel(WORKSPACE, 'console', rect);
        expect(dockedPanelIds(next.root)).toEqual(['nav', 'editor', 'preview']);
        expect(next.floating).toContainEqual({ panelId: 'console', rect });
    });

    it('moves a floating rect and ignores unknown ids', (): void => {
        const rect: { x: number; y: number; width: number; height: number } = {
            x: 99,
            y: 99,
            width: 320,
            height: 240,
        };
        const next: DockLayoutState = moveFloating(WORKSPACE, 'palette', rect);
        expect(next.floating[0]?.rect).toEqual(rect);
        expect(moveFloating(WORKSPACE, 'ghost', rect)).toBe(WORKSPACE);
    });
});

describe('setFraction', (): void => {
    it('updates the addressed split, clamped', (): void => {
        const next: DockLayoutState = setFraction(WORKSPACE, [], 0.4);
        expect(next.root?.kind === EDockNodeKind.Split && next.root.fraction).toBe(
            0.4,
        );
        const nested: DockLayoutState = setFraction(WORKSPACE, [1], 0.99);
        const root: DockNode | null = nested.root;
        if (root?.kind !== EDockNodeKind.Split) {
            throw new Error('expected split root');
        }
        expect(
            root.second.kind === EDockNodeKind.Split && root.second.fraction,
        ).toBe(0.9);
    });

    it('ignores invalid paths', (): void => {
        expect(setFraction(WORKSPACE, [0, 0], 0.5)).toBe(WORKSPACE);
        expect(setFraction(WORKSPACE, [2], 0.5)).toBe(WORKSPACE);
        expect(setFraction(EMPTY, [], 0.5)).toBe(EMPTY);
    });
});

describe('setActiveTab', (): void => {
    it('activates a docked panel in its group', (): void => {
        const next: DockLayoutState = setActiveTab(WORKSPACE, 'preview');
        const root: DockNode | null = next.root;
        if (root?.kind !== EDockNodeKind.Split) {
            throw new Error('expected split root');
        }
        const inner: DockNode = root.second;
        if (inner.kind !== EDockNodeKind.Split) {
            throw new Error('expected nested split');
        }
        expect(
            inner.first.kind === EDockNodeKind.Tabs && inner.first.activeId,
        ).toBe('preview');
    });

    it('is a no-op for unknown or already-active ids', (): void => {
        expect(setActiveTab(WORKSPACE, 'ghost')).toBe(WORKSPACE);
        expect(setActiveTab(WORKSPACE, 'editor')).toBe(WORKSPACE);
    });
});

describe('dropTargetAtPoint', (): void => {
    const BOUNDS: DockBounds = { left: 0, top: 0, width: 1000, height: 500 };
    const GROUPS: readonly { targetPanelId: string; bounds: DockBounds }[] = [
        {
            targetPanelId: 'editor',
            bounds: { left: 300, top: 100, width: 400, height: 300 },
        },
    ];

    it('floats outside the container', (): void => {
        expect(dropTargetAtPoint(BOUNDS, -10, 50, GROUPS, false)).toEqual({
            kind: 'float',
        });
        expect(dropTargetAtPoint(BOUNDS, 500, 600, GROUPS, false)).toEqual({
            kind: 'float',
        });
    });

    it('resolves the nearest edge inside the band', (): void => {
        expect(dropTargetAtPoint(BOUNDS, 50, 250, GROUPS, false)).toEqual({
            kind: 'edge',
            edge: EDockEdge.InlineStart,
        });
        expect(dropTargetAtPoint(BOUNDS, 950, 250, GROUPS, false)).toEqual({
            kind: 'edge',
            edge: EDockEdge.InlineEnd,
        });
        expect(dropTargetAtPoint(BOUNDS, 500, 30, GROUPS, false)).toEqual({
            kind: 'edge',
            edge: EDockEdge.BlockStart,
        });
        expect(dropTargetAtPoint(BOUNDS, 500, 470, GROUPS, false)).toEqual({
            kind: 'edge',
            edge: EDockEdge.BlockEnd,
        });
        // A corner point picks the nearer edge.
        expect(dropTargetAtPoint(BOUNDS, 40, 60, GROUPS, false)).toEqual({
            kind: 'edge',
            edge: EDockEdge.InlineStart,
        });
    });

    it('mirrors the inline edges under RTL', (): void => {
        expect(dropTargetAtPoint(BOUNDS, 50, 250, GROUPS, true)).toEqual({
            kind: 'edge',
            edge: EDockEdge.InlineEnd,
        });
        expect(dropTargetAtPoint(BOUNDS, 950, 250, GROUPS, true)).toEqual({
            kind: 'edge',
            edge: EDockEdge.InlineStart,
        });
    });

    it('docks into the group under the pointer, else floats', (): void => {
        expect(dropTargetAtPoint(BOUNDS, 500, 250, GROUPS, false)).toEqual({
            kind: 'group',
            targetPanelId: 'editor',
        });
        expect(dropTargetAtPoint(BOUNDS, 250, 250, [], false)).toEqual({
            kind: 'float',
        });
    });

    it('floats on degenerate bounds', (): void => {
        const flat: DockBounds = { left: 0, top: 0, width: 0, height: 500 };
        expect(dropTargetAtPoint(flat, 0, 10, GROUPS, false)).toEqual({
            kind: 'float',
        });
    });
});
