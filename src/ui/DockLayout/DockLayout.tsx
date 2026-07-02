import {
    type CSSProperties,
    type Dispatch,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useId,
    useRef,
    useState,
} from 'react';

import {
    type PointerDragBinding,
    type PointerDragState,
    usePointerDrag,
} from '../../react/hooks/usePointerDrag';
import { Menu } from '../Menu/Menu';
import { EMenuNodeKind, type MenuNode } from '../Menu/Menu.types';
import { SplitPane } from '../SplitPane/SplitPane';
import { Tabs } from '../Tabs/Tabs';
import { type TabItem } from '../Tabs/Tabs.types';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { Window } from '../Window/Window';
import { EWindowResizeMode, type WindowRect } from '../Window/Window.types';
import styles from './DockLayout.module.css';
import {
    type DockFloatingPanel,
    type DockLayoutProps,
    type DockNode,
    type DockPanelDef,
    type DockTabsNode,
    EDockEdge,
    EDockNodeKind,
} from './DockLayout.types';
import {
    dockAtEdge,
    type DockDropTarget,
    type DockGroupRect,
    dockIntoGroup,
    dropTargetAtPoint,
    floatPanel,
    moveFloating,
    removePanel,
    setActiveTab,
    setFraction,
} from './dockMath';

// Menu item id grammar for the keyboard dock menu.
const MENU_EDGE_PREFIX: string = 'dock-edge:';
const MENU_GROUP_PREFIX: string = 'dock-group:';
const MENU_FLOAT_ID: string = 'float';
const MENU_SEPARATOR_ID: string = 'dock-separator';

// A grip press that never travels past this many pixels is a click, not a
// drag - releasing must not restructure the layout.
const DRAG_THRESHOLD_PX: number = 8;

// Where a menu-floated (or drag-floated) panel lands by default.
const FLOAT_DEFAULT_SIZE: Readonly<{ width: number; height: number }> = {
    width: 360,
    height: 280,
};
const FLOAT_MENU_ORIGIN: Readonly<{ x: number; y: number }> = { x: 120, y: 120 };

const DEFAULT_BLOCK_SIZE: string = 'calc(var(--portal-space-8) * 10)';

// Human-readable edge labels for the dock menu.
const EDGE_MENU_ENTRIES: readonly (readonly [EDockEdge, string])[] = [
    [EDockEdge.InlineStart, 'Dock start'],
    [EDockEdge.InlineEnd, 'Dock end'],
    [EDockEdge.BlockStart, 'Dock top'],
    [EDockEdge.BlockEnd, 'Dock bottom'],
];

// Collect every tab group under `node` (identified by its active panel).
function collectGroups(node: DockNode | null): readonly DockTabsNode[] {
    if (node === null) {
        return [];
    }
    if (node.kind === EDockNodeKind.Tabs) {
        return [node];
    }
    return [...collectGroups(node.first), ...collectGroups(node.second)];
}

type DockGroupProps = Readonly<{
    node: DockTabsNode;
    panelTitle: (panelId: string) => string;
    panelContent: (panelId: string) => DockPanelDef['content'];
    menuItems: (node: DockTabsNode) => readonly MenuNode[];
    onMenuSelect: (panelId: string, itemId: string) => void;
    onTabChange: (panelId: string) => void;
    onGripPointerDown: (
        panelId: string,
        event: ReactPointerEvent<HTMLButtonElement>,
    ) => void;
    dropActive: boolean;
}>;

// One tab group: the Tabs rail, the pointer drag grip, the keyboard dock
// menu, and the active panel body. A child component so each group owns its
// menu state and anchor.
function DockGroup({
    node,
    panelTitle,
    panelContent,
    menuItems,
    onMenuSelect,
    onTabChange,
    onGripPointerDown,
    dropActive,
}: DockGroupProps): ReactElement {
    const [menuOpen, setMenuOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const menuAnchorRef: RefObject<HTMLButtonElement | null> =
        useRef<HTMLButtonElement | null>(null);
    const bodyId: string = useId();
    const activeTitle: string = panelTitle(node.activeId);

    const items: readonly TabItem[] = node.panelIds.map(
        (panelId: string): TabItem => ({
            id: panelId,
            label: panelTitle(panelId),
            controls: bodyId,
        }),
    );

    return (
        <section
            className={styles.group}
            data-dock-group={node.activeId}
            data-drop={dropActive ? 'true' : undefined}
            aria-label={`${activeTitle} group`}
        >
            <div className={styles.groupBar}>
                <div className={styles.groupTabs}>
                    <Tabs
                        items={items}
                        value={node.activeId}
                        onChange={onTabChange}
                        label={`${activeTitle} group tabs`}
                    />
                </div>
                <button
                    type="button"
                    className={styles.grip}
                    aria-label={`Move ${activeTitle}`}
                    onPointerDown={(
                        event: ReactPointerEvent<HTMLButtonElement>,
                    ): void => {
                        onGripPointerDown(node.activeId, event);
                    }}
                >
                    <span className={styles.gripGlyph} aria-hidden="true" />
                </button>
                <button
                    ref={menuAnchorRef}
                    type="button"
                    className={styles.menuKey}
                    aria-label={`${activeTitle} dock options`}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={(): void => {
                        setMenuOpen((prev: boolean): boolean => !prev);
                    }}
                >
                    <span className={styles.menuGlyph} aria-hidden="true" />
                </button>
                <Menu
                    items={menuItems(node)}
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                    onSelect={(itemId: string): void => {
                        onMenuSelect(node.activeId, itemId);
                    }}
                    anchorRef={menuAnchorRef}
                    label={`${activeTitle} dock menu`}
                />
            </div>
            <div
                id={bodyId}
                role="tabpanel"
                aria-label={activeTitle}
                tabIndex={0}
                className={styles.body}
            >
                {panelContent(node.activeId)}
            </div>
        </section>
    );
}

// The DockLayout: a controlled docking manager. The docked tree renders
// through SplitPane (splits addressed by path) and DockGroup (Tabs +
// grip + menu); floating panels render through non-modal Windows. Pointer
// docking drags the grip and drops onto edge zones, a group, or empty space
// (float); the per-group menu reaches every one of those outcomes from the
// keyboard. All mutations flow through dockMath into onLayoutChange.
export function DockLayout({
    label,
    panels,
    layout,
    onLayoutChange,
    blockSize,
    tone,
}: DockLayoutProps): ReactElement {
    const containerRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const gripPanelRef: RefObject<string | null> = useRef<string | null>(null);
    const movedRef: RefObject<boolean> = useRef<boolean>(false);

    const [dragPanelId, setDragPanelId]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(null);
    const [dropTarget, setDropTarget]: [
        DockDropTarget | null,
        Dispatch<SetStateAction<DockDropTarget | null>>,
    ] = useState<DockDropTarget | null>(null);

    function panelById(panelId: string): DockPanelDef | undefined {
        return panels.find((panel: DockPanelDef): boolean => panel.id === panelId);
    }

    function panelTitle(panelId: string): string {
        return panelById(panelId)?.title ?? panelId;
    }

    function panelContent(panelId: string): DockPanelDef['content'] {
        return panelById(panelId)?.content ?? null;
    }

    // The live container box, group boxes, and text direction for one hit
    // test (measured fresh per sample).
    function hitTest(x: number, y: number): DockDropTarget {
        const container: HTMLDivElement | null = containerRef.current;
        if (container === null) {
            return { kind: 'float' };
        }
        const groups: DockGroupRect[] = [];
        container
            .querySelectorAll<HTMLElement>('[data-dock-group]')
            .forEach((element: HTMLElement): void => {
                const targetPanelId: string | undefined = element.dataset.dockGroup;
                if (targetPanelId === undefined) {
                    return;
                }
                groups.push({
                    targetPanelId,
                    bounds: element.getBoundingClientRect(),
                });
            });
        const rtl: boolean = getComputedStyle(container).direction === 'rtl';
        return dropTargetAtPoint(
            container.getBoundingClientRect(),
            x,
            y,
            groups,
            rtl,
        );
    }

    const drag: PointerDragBinding<HTMLButtonElement> =
        usePointerDrag<HTMLButtonElement>({
            onDragStart: (): void => {
                movedRef.current = false;
                setDragPanelId(gripPanelRef.current);
            },
            onDrag: (state: PointerDragState): void => {
                if (gripPanelRef.current === null) {
                    return;
                }
                if (Math.abs(state.dx) + Math.abs(state.dy) > DRAG_THRESHOLD_PX) {
                    movedRef.current = true;
                }
                setDropTarget(hitTest(state.x, state.y));
            },
            onDragEnd: (state: PointerDragState): void => {
                const panelId: string | null = gripPanelRef.current;
                const moved: boolean = movedRef.current;
                gripPanelRef.current = null;
                movedRef.current = false;
                setDragPanelId(null);
                setDropTarget(null);
                if (panelId === null || !moved) {
                    return;
                }
                const target: DockDropTarget = hitTest(state.x, state.y);
                if (target.kind === 'edge') {
                    onLayoutChange(dockAtEdge(layout, panelId, target.edge));
                    return;
                }
                if (target.kind === 'group') {
                    onLayoutChange(
                        dockIntoGroup(layout, panelId, target.targetPanelId),
                    );
                    return;
                }
                onLayoutChange(
                    floatPanel(layout, panelId, {
                        x: state.x - FLOAT_DEFAULT_SIZE.width / 2,
                        y: state.y,
                        width: FLOAT_DEFAULT_SIZE.width,
                        height: FLOAT_DEFAULT_SIZE.height,
                    }),
                );
            },
        });

    function handleGripPointerDown(
        panelId: string,
        event: ReactPointerEvent<HTMLButtonElement>,
    ): void {
        gripPanelRef.current = panelId;
        drag.onPointerDown(event);
    }

    // The keyboard dock menu: every edge, float, and every OTHER group.
    function menuItems(node: DockTabsNode): readonly MenuNode[] {
        const edges: MenuNode[] = EDGE_MENU_ENTRIES.map(
            ([edge, edgeLabel]: readonly [EDockEdge, string]): MenuNode => ({
                kind: EMenuNodeKind.Action,
                id: `${MENU_EDGE_PREFIX}${edge}`,
                label: edgeLabel,
            }),
        );
        const others: MenuNode[] = collectGroups(layout.root)
            .filter(
                (group: DockTabsNode): boolean => group.activeId !== node.activeId,
            )
            .map(
                (group: DockTabsNode): MenuNode => ({
                    kind: EMenuNodeKind.Action,
                    id: `${MENU_GROUP_PREFIX}${group.activeId}`,
                    label: `Move to ${panelTitle(group.activeId)} group`,
                }),
            );
        const float: MenuNode = {
            kind: EMenuNodeKind.Action,
            id: MENU_FLOAT_ID,
            label: 'Float',
        };
        if (others.length === 0) {
            return [...edges, float];
        }
        return [
            ...edges,
            float,
            { kind: EMenuNodeKind.Separator, id: MENU_SEPARATOR_ID },
            ...others,
        ];
    }

    function handleMenuSelect(panelId: string, itemId: string): void {
        if (itemId.startsWith(MENU_EDGE_PREFIX)) {
            const edgeValue: string = itemId.slice(MENU_EDGE_PREFIX.length);
            const edge: EDockEdge | undefined = Object.values(EDockEdge).find(
                (candidate: EDockEdge): boolean => candidate === edgeValue,
            );
            if (edge === undefined) {
                return;
            }
            onLayoutChange(dockAtEdge(layout, panelId, edge));
            return;
        }
        if (itemId.startsWith(MENU_GROUP_PREFIX)) {
            onLayoutChange(
                dockIntoGroup(
                    layout,
                    panelId,
                    itemId.slice(MENU_GROUP_PREFIX.length),
                ),
            );
            return;
        }
        if (itemId === MENU_FLOAT_ID) {
            onLayoutChange(
                floatPanel(layout, panelId, {
                    ...FLOAT_MENU_ORIGIN,
                    ...FLOAT_DEFAULT_SIZE,
                }),
            );
        }
    }

    function renderNode(node: DockNode, path: readonly number[]): ReactElement {
        if (node.kind === EDockNodeKind.Split) {
            return (
                <SplitPane
                    orientation={node.orientation}
                    fraction={node.fraction}
                    onFractionChange={(fraction: number): void => {
                        onLayoutChange(setFraction(layout, path, fraction));
                    }}
                    label={`${label} splitter`}
                    primary={renderNode(node.first, [...path, 0])}
                    secondary={renderNode(node.second, [...path, 1])}
                />
            );
        }
        return (
            <DockGroup
                node={node}
                panelTitle={panelTitle}
                panelContent={panelContent}
                menuItems={menuItems}
                onMenuSelect={handleMenuSelect}
                onTabChange={(panelId: string): void => {
                    onLayoutChange(setActiveTab(layout, panelId));
                }}
                onGripPointerDown={handleGripPointerDown}
                dropActive={
                    dropTarget?.kind === 'group' &&
                    dropTarget.targetPanelId === node.activeId
                }
            />
        );
    }

    function renderFloating(entry: DockFloatingPanel): ReactElement {
        const rect: WindowRect = entry.rect;
        return (
            <Window
                key={entry.panelId}
                open
                onOpenChange={(open: boolean): void => {
                    if (open) {
                        return;
                    }
                    onLayoutChange(removePanel(layout, entry.panelId));
                }}
                title={panelTitle(entry.panelId)}
                position={{ x: rect.x, y: rect.y }}
                size={{ width: rect.width, height: rect.height }}
                onMove={(point: { x: number; y: number }): void => {
                    onLayoutChange(
                        moveFloating(layout, entry.panelId, {
                            ...point,
                            width: rect.width,
                            height: rect.height,
                        }),
                    );
                }}
                onResize={(size: { width: number; height: number }): void => {
                    onLayoutChange(
                        moveFloating(layout, entry.panelId, {
                            x: rect.x,
                            y: rect.y,
                            ...size,
                        }),
                    );
                }}
                resize={EWindowResizeMode.Both}
                titleBarActions={
                    <button
                        type="button"
                        className={styles.dockBackKey}
                        aria-label={`Dock ${panelTitle(entry.panelId)}`}
                        onClick={(): void => {
                            onLayoutChange(
                                dockAtEdge(
                                    layout,
                                    entry.panelId,
                                    EDockEdge.InlineEnd,
                                ),
                            );
                        }}
                    >
                        <span className={styles.dockBackGlyph} aria-hidden="true" />
                    </button>
                }
            >
                {panelContent(entry.panelId)}
            </Window>
        );
    }

    const rootStyle: CSSProperties = {
        ...toneProperties(tone),
        blockSize: blockSize ?? DEFAULT_BLOCK_SIZE,
    };
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    const dragging: boolean = dragPanelId !== null;

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label={label}
            className={className}
            style={rootStyle}
            data-dragging={dragging ? 'true' : undefined}
        >
            <div className={styles.tree}>
                {layout.root === null ? (
                    <p className={styles.empty}>No panels docked.</p>
                ) : (
                    renderNode(layout.root, [])
                )}
            </div>
            {dragging ? (
                <div className={styles.zones} aria-hidden="true">
                    {EDGE_MENU_ENTRIES.map(
                        ([edge]: readonly [EDockEdge, string]): ReactElement => (
                            <span
                                key={edge}
                                className={styles.zone}
                                data-edge={edge}
                                data-active={
                                    dropTarget?.kind === 'edge' &&
                                    dropTarget.edge === edge
                                        ? 'true'
                                        : undefined
                                }
                            />
                        ),
                    )}
                </div>
            ) : null}
            {layout.floating.map(renderFloating)}
        </div>
    );
}
