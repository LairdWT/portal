import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type Toned } from '../tone';

// Public contract for TreeView: a controlled, interface-forwarding hierarchical
// tree. The component owns no tree model - the consumer supplies the whole
// structure through the recursive `nodes` prop, the direct web analog of
// Helicon's tree_view module ("forwards all structure to the consumer; there is
// no owned tree model"). Accessibility: the container is role="tree" with a
// required accessible name (AccessibleName XOR); each node is a role="treeitem"
// carrying aria-level / aria-setsize / aria-posinset, aria-expanded on BRANCHES
// only, and aria-selected on every item ONLY when the tree is selectable. A
// single roving tabindex gives the tree one tab stop; arrow keys, Home/End,
// Enter/Space, and printable-character type-ahead drive navigation, expansion,
// and selection (APG Tree pattern). Expansion is a controlled
// ReadonlySet<string>; every toggle emits a NEW set and never mutates the prop.

// One node in the tree. `id` is a stable id, unique across the WHOLE tree - it is
// the focus target and the expansion-Set key. `label` is arbitrary renderable
// content (Portal ships no icon set). `children` decides branch-vs-leaf: present
// (even an empty array) => the node is an expandable BRANCH that carries
// aria-expanded; absent => the node is a LEAF (no aria-expanded, no child group).
// This is the faithful mapping of Helicon's TreeNodeKind::Branch / ::Leaf onto
// the node shape. `textValue` supplies the type-ahead / matching text when
// `label` is not a plain string.
export type TreeNode = Readonly<{
    id: string;
    label: ReactNode;
    children?: readonly TreeNode[];
    textValue?: string;
}>;

// Per-row presentation state, written onto each treeitem as the data-state
// attribute the CSS selects on (twisty rotation, rail, leaf marker). Modeled as
// an E-prefixed annotated const object (TypeScript enums are banned; the
// annotation satisfies @typescript-eslint/typedef). Tree-local - Accordion's
// disclosure is binary and declares its own enum.
export const ETreeNodeState: {
    readonly Expanded: 'expanded';
    readonly Collapsed: 'collapsed';
    readonly Leaf: 'leaf';
} = {
    Expanded: 'expanded',
    Collapsed: 'collapsed',
    Leaf: 'leaf',
};
export type ETreeNodeState = (typeof ETreeNodeState)[keyof typeof ETreeNodeState];

// Props for TreeView: a controlled, domain-agnostic, interface-forwarding tree.
//
// `nodes` is the recursive structure. `expandedIds` is the controlled set of
// expanded branch ids (the immutable, React-controlled analog of Helicon's
// TreeExpansionState.expanded); `onExpandedChange` receives a NEW set built by
// the expansion helpers on every toggle. Selection is opt-in: providing
// `selectedId` (including `null`) makes the tree selectable - every treeitem then
// carries aria-selected and Enter/Space/click report through `onSelectedChange`;
// omitting `selectedId` entirely makes it a navigation-only tree with no
// aria-selected. `enabled` resolves through useResolvedEnabled (a disabled tree
// is inert). The tree landmark requires an accessible name (AccessibleName XOR:
// exactly one of `label` / `labelledBy`). `tone` flows through the shared tone
// scope and drives the selected rail, focus glow, and hierarchy guide only.
export type TreeViewProps = Readonly<{
    nodes: readonly TreeNode[];
    expandedIds: ReadonlySet<string>;
    onExpandedChange?: (next: ReadonlySet<string>) => void;
    selectedId?: string | null;
    onSelectedChange?: (id: string) => void;
    enabled?: EEnabledState;
}> &
    AccessibleName &
    Toned;
