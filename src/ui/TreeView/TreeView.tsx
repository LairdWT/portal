import {
    type Dispatch,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useCallback,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';

import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { setExpanded, toggleExpanded } from '../expansion';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './TreeView.module.css';
import {
    ETreeNodeState,
    type TreeNode,
    type TreeViewProps,
} from './TreeView.types';

// The type-ahead buffer window: keystrokes within this window of the previous
// one extend the current query; a later keystroke starts a fresh search. Compared
// against performance.now(), so there is no timer to leave running or clean up.
const TYPEAHEAD_WINDOW_MS: number = 500;

// A node is a BRANCH when it carries a `children` key (even an empty array);
// otherwise it is a LEAF. The single typed predicate the component branches on.
function isBranch(node: TreeNode): boolean {
    return node.children !== undefined;
}

// A flattened visible row, in DOM order, for keyboard navigation and type-ahead.
// A row is "visible" when every ancestor branch is expanded. `level` is 1-based
// (aria-level); `posInSet`/`setSize` are 1-based within the sibling group.
type VisibleRow = Readonly<{
    id: string;
    node: TreeNode;
    level: number;
    isBranch: boolean;
    isExpanded: boolean;
    parentId: string | null;
    posInSet: number;
    setSize: number;
}>;

// Walks the tree in DOM order, descending only into expanded branches, pushing
// one VisibleRow per visible node into `out`.
function collectVisibleRows(
    nodes: readonly TreeNode[],
    expandedIds: ReadonlySet<string>,
    level: number,
    parentId: string | null,
    out: VisibleRow[],
): void {
    const setSize: number = nodes.length;
    nodes.forEach((node: TreeNode, index: number): void => {
        const branch: boolean = isBranch(node);
        const expanded: boolean = branch && expandedIds.has(node.id);
        out.push({
            id: node.id,
            node,
            level,
            isBranch: branch,
            isExpanded: expanded,
            parentId,
            posInSet: index + 1,
            setSize,
        });
        if (
            branch &&
            expanded &&
            node.children !== undefined &&
            node.children.length > 0
        ) {
            collectVisibleRows(node.children, expandedIds, level + 1, node.id, out);
        }
    });
}

function flattenVisible(
    nodes: readonly TreeNode[],
    expandedIds: ReadonlySet<string>,
): readonly VisibleRow[] {
    const out: VisibleRow[] = [];
    collectVisibleRows(nodes, expandedIds, 1, null, out);
    return out;
}

// The text a row matches against during type-ahead: an explicit textValue, else
// a plain-string label, else empty (non-string labels are skipped).
function resolveRowText(row: VisibleRow): string {
    if (row.node.textValue !== undefined) {
        return row.node.textValue;
    }
    if (typeof row.node.label === 'string') {
        return row.node.label;
    }
    return '';
}

// First visible row (cyclically after fromIndex) whose resolved text starts with
// the lowercased query. Returns its id, or undefined when nothing matches.
function findTypeAheadMatch(
    rows: readonly VisibleRow[],
    query: string,
    fromIndex: number,
): string | undefined {
    const count: number = rows.length;
    if (count === 0) {
        return undefined;
    }
    for (let offset: number = 1; offset <= count; offset += 1) {
        const index: number = (((fromIndex + offset) % count) + count) % count;
        const row: VisibleRow | undefined = rows[index];
        if (row === undefined) {
            continue;
        }
        const text: string = resolveRowText(row).toLowerCase();
        if (text.length === 0) {
            continue;
        }
        if (text.startsWith(query)) {
            return row.id;
        }
    }
    return undefined;
}

export function TreeView({
    nodes,
    expandedIds,
    onExpandedChange,
    selectedId,
    onSelectedChange,
    enabled,
    label,
    labelledBy,
    tone,
}: TreeViewProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const isSelectable: boolean = selectedId !== undefined;
    const prefersReducedMotion: boolean = useReducedMotion();
    const labelBaseId: string = useId();

    const visibleRows: readonly VisibleRow[] = useMemo(
        (): readonly VisibleRow[] => flattenVisible(nodes, expandedIds),
        [nodes, expandedIds],
    );

    // The single element registry for programmatic focus. The ref callback writes
    // on mount and deletes on unmount (the delete IS the cleanup; no listener or
    // timer is attached here).
    const nodeRefs: RefObject<Map<string, HTMLDivElement>> = useRef<
        Map<string, HTMLDivElement>
    >(new Map());
    // The EPHEMERAL roving-focus position (not selection, not expansion). Seeded
    // lazily through resolvedTabbableId below.
    const [tabbableId, setTabbableId]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>,
    ] = useState<string | undefined>(undefined);
    // The type-ahead query plus the timestamp of its last keystroke. A ref (not
    // state) because it must not trigger a render and carries no timer.
    const typeaheadRef: RefObject<{ text: string; at: number }> = useRef<{
        text: string;
        at: number;
    }>({ text: '', at: 0 });

    // The treeitem currently in the tab order. Derived (not an effect) so the
    // roving stop re-clamps for free when the visible set changes: keep the
    // remembered id while it is visible, else fall back to the selected id (when
    // selectable and visible), else the first visible row.
    const resolvedTabbableId: string | undefined = useMemo(():
        | string
        | undefined => {
        if (visibleRows.length === 0) {
            return undefined;
        }
        if (
            tabbableId !== undefined &&
            visibleRows.some((row: VisibleRow): boolean => row.id === tabbableId)
        ) {
            return tabbableId;
        }
        if (
            selectedId !== undefined &&
            selectedId !== null &&
            visibleRows.some((row: VisibleRow): boolean => row.id === selectedId)
        ) {
            return selectedId;
        }
        return visibleRows[0]?.id;
    }, [visibleRows, tabbableId, selectedId]);

    const registerRef: (id: string, element: HTMLDivElement | null) => void =
        useCallback((id: string, element: HTMLDivElement | null): void => {
            if (element === null) {
                nodeRefs.current.delete(id);
                return;
            }
            nodeRefs.current.set(id, element);
        }, []);

    function focusRow(id: string): void {
        setTabbableId(id);
        nodeRefs.current.get(id)?.focus();
    }

    function focusRowAt(index: number): void {
        const target: VisibleRow | undefined = visibleRows[index];
        if (target === undefined) {
            return;
        }
        focusRow(target.id);
    }

    function changeExpansion(id: string, expanded: boolean): void {
        if (isDisabled) {
            return;
        }
        onExpandedChange?.(setExpanded(expandedIds, id, expanded));
    }

    function toggleRowExpansion(id: string): void {
        if (isDisabled) {
            return;
        }
        onExpandedChange?.(toggleExpanded(expandedIds, id));
    }

    function selectRow(id: string): void {
        if (isDisabled) {
            return;
        }
        if (!isSelectable) {
            return;
        }
        onSelectedChange?.(id);
    }

    function runTypeAhead(character: string, currentIndex: number): void {
        const now: number = performance.now();
        const previous: { text: string; at: number } = typeaheadRef.current;
        const base: string =
            now - previous.at > TYPEAHEAD_WINDOW_MS ? '' : previous.text;
        const query: string = (base + character).toLowerCase();
        typeaheadRef.current = { text: query, at: now };
        // A fresh search starts at the next row; a continuation re-includes the
        // current row so a growing query keeps matching it.
        const fromIndex: number = base.length > 0 ? currentIndex - 1 : currentIndex;
        const matchId: string | undefined = findTypeAheadMatch(
            visibleRows,
            query,
            fromIndex,
        );
        if (matchId === undefined) {
            return;
        }
        focusRow(matchId);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        if (isDisabled) {
            return;
        }
        // A single handler on the role="tree" root. The focused element is the
        // treeitem the key event targets; closest tolerates focus landing on an
        // inner element and ignores a stray key event outside any row.
        const element: HTMLElement | null =
            event.target instanceof HTMLElement ? event.target : null;
        if (element === null) {
            return;
        }
        const treeItemElement: Element | null = element.closest('[data-node-id]');
        if (treeItemElement === null) {
            return;
        }
        const nodeId: string | null = treeItemElement.getAttribute('data-node-id');
        if (nodeId === null) {
            return;
        }
        const index: number = visibleRows.findIndex(
            (row: VisibleRow): boolean => row.id === nodeId,
        );
        if (index === -1) {
            return;
        }
        const row: VisibleRow | undefined = visibleRows[index];
        if (row === undefined) {
            return;
        }

        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                focusRowAt(index + 1);
                return;
            }
            case 'ArrowUp': {
                event.preventDefault();
                focusRowAt(index - 1);
                return;
            }
            case 'ArrowRight': {
                event.preventDefault();
                if (!row.isBranch) {
                    return;
                }
                if (!row.isExpanded) {
                    changeExpansion(row.id, true);
                    return;
                }
                const firstChild: VisibleRow | undefined = visibleRows[index + 1];
                if (firstChild?.parentId === row.id) {
                    focusRow(firstChild.id);
                }
                return;
            }
            case 'ArrowLeft': {
                event.preventDefault();
                if (row.isBranch && row.isExpanded) {
                    changeExpansion(row.id, false);
                    return;
                }
                if (row.parentId !== null) {
                    focusRow(row.parentId);
                }
                return;
            }
            case 'Home': {
                event.preventDefault();
                focusRowAt(0);
                return;
            }
            case 'End': {
                event.preventDefault();
                focusRowAt(visibleRows.length - 1);
                return;
            }
            case 'Enter': {
                event.preventDefault();
                if (row.isBranch) {
                    toggleRowExpansion(row.id);
                    if (isSelectable) {
                        selectRow(row.id);
                    }
                    return;
                }
                if (isSelectable) {
                    selectRow(row.id);
                }
                return;
            }
            case ' ': {
                event.preventDefault();
                if (isSelectable) {
                    selectRow(row.id);
                    return;
                }
                if (row.isBranch) {
                    toggleRowExpansion(row.id);
                }
                return;
            }
            default: {
                if (event.ctrlKey || event.metaKey || event.altKey) {
                    return;
                }
                if (event.key.length !== 1) {
                    return;
                }
                event.preventDefault();
                runTypeAhead(event.key, index);
                return;
            }
        }
    }

    function handleClick(event: MouseEvent<HTMLDivElement>): void {
        if (isDisabled) {
            return;
        }
        const element: HTMLElement | null =
            event.target instanceof HTMLElement ? event.target : null;
        if (element === null) {
            return;
        }
        const treeItemElement: Element | null = element.closest('[data-node-id]');
        if (treeItemElement === null) {
            return;
        }
        const nodeId: string | null = treeItemElement.getAttribute('data-node-id');
        if (nodeId === null) {
            return;
        }
        const row: VisibleRow | undefined = visibleRows.find(
            (candidate: VisibleRow): boolean => candidate.id === nodeId,
        );
        if (row === undefined) {
            return;
        }
        focusRow(nodeId);
        const onTwisty: boolean = element.closest('[data-twisty="true"]') !== null;
        if (onTwisty && row.isBranch) {
            toggleRowExpansion(nodeId);
            return;
        }
        if (isSelectable) {
            selectRow(nodeId);
            return;
        }
        if (row.isBranch) {
            toggleRowExpansion(nodeId);
        }
    }

    const className: string = [toneStyles.toneScope, styles.tree]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function renderNodes(
        currentNodes: readonly TreeNode[],
        level: number,
    ): readonly ReactElement[] {
        const setSize: number = currentNodes.length;
        return currentNodes.map((node: TreeNode, index: number): ReactElement => {
            const branch: boolean = isBranch(node);
            const expanded: boolean = branch && expandedIds.has(node.id);
            const rowState: ETreeNodeState = branch
                ? expanded
                    ? ETreeNodeState.Expanded
                    : ETreeNodeState.Collapsed
                : ETreeNodeState.Leaf;
            const isSelected: boolean = isSelectable && node.id === selectedId;
            const isTabbable: boolean = node.id === resolvedTabbableId;
            const rowLabelId: string = `${labelBaseId}-${node.id}`;
            const hasChildren: boolean =
                branch && node.children !== undefined && node.children.length > 0;

            return (
                <div
                    key={node.id}
                    ref={(element: HTMLDivElement | null): void => {
                        registerRef(node.id, element);
                    }}
                    role="treeitem"
                    className={styles.treeitem}
                    data-node-id={node.id}
                    data-state={rowState}
                    data-enabled={resolvedEnabled}
                    data-selected={isSelected ? 'true' : 'false'}
                    tabIndex={isTabbable ? 0 : -1}
                    aria-level={level}
                    aria-setsize={setSize}
                    aria-posinset={index + 1}
                    aria-labelledby={rowLabelId}
                    aria-expanded={branch ? expanded : undefined}
                    aria-selected={isSelectable ? isSelected : undefined}
                    aria-disabled={isDisabled ? true : undefined}
                >
                    <span className={styles.rowContent}>
                        {branch ? (
                            <span
                                className={styles.twisty}
                                data-twisty="true"
                                data-state={rowState}
                                aria-hidden="true"
                            >
                                <span className={styles.twistyMark} />
                            </span>
                        ) : (
                            <span className={styles.leafTick} aria-hidden="true" />
                        )}
                        <span id={rowLabelId} className={styles.label}>
                            {node.label}
                        </span>
                    </span>
                    {hasChildren && expanded && node.children !== undefined ? (
                        <div role="group" className={styles.group}>
                            {renderNodes(node.children, level + 1)}
                        </div>
                    ) : null}
                </div>
            );
        });
    }

    return (
        <div
            role="tree"
            tabIndex={-1}
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
            data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
            aria-multiselectable={isSelectable ? false : undefined}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
        >
            {renderNodes(nodes, 1)}
        </div>
    );
}
