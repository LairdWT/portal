import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { TreeView } from './TreeView';
import { type TreeNode } from './TreeView.types';

// A single (non-union) story args shape. TreeView's own props are an XOR union
// (AccessibleName), which collapses Storybook's arg inference to `never`; the
// stories only ever exercise the `label` form, so a flat args type keeps the meta
// and story typing sound while still feeding valid TreeView props.
type TreeViewStoryArgs = Readonly<{
    nodes: readonly TreeNode[];
    label: string;
    expandedIds: ReadonlySet<string>;
    selectedId?: string | null;
    enabled?: EEnabledState;
    tone?: string;
}>;

const FILE_TREE: readonly TreeNode[] = [
    {
        id: 'src',
        label: 'src',
        children: [
            { id: 'index', label: 'index.ts' },
            {
                id: 'ui',
                label: 'ui',
                children: [
                    { id: 'button', label: 'Button.tsx' },
                    { id: 'tree', label: 'TreeView.tsx' },
                ],
            },
        ],
    },
    { id: 'readme', label: 'README.md' },
    { id: 'license', label: 'LICENSE' },
];

const DEEP_TREE: readonly TreeNode[] = [
    {
        id: 'root',
        label: 'workspace',
        children: [
            {
                id: 'packages',
                label: 'packages',
                children: [
                    {
                        id: 'core',
                        label: 'core',
                        children: [
                            { id: 'core-index', label: 'index.ts' },
                            { id: 'core-types', label: 'types.ts' },
                        ],
                    },
                    { id: 'cli', label: 'cli', children: [] },
                ],
            },
            { id: 'changelog', label: 'CHANGELOG.md' },
        ],
    },
];

// A controlled wrapper the stories share: TreeView is controlled, so the story
// owns the expanded set (and, when selectable, the selected id) and feeds them
// back - the pattern a consumer wiring the tree to app state uses. Rendering the
// branches expanded also lets the Storybook a11y addon scan a populated tree.
function ControlledTree(args: TreeViewStoryArgs): ReactElement {
    const [expanded, setExpanded]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(
        (): ReadonlySet<string> => new Set(args.expandedIds),
    );
    const [selected, setSelected]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(args.selectedId ?? null);
    const selectable: boolean = args.selectedId !== undefined;
    return (
        <TreeView
            {...args}
            expandedIds={expanded}
            onExpandedChange={setExpanded}
            {...(selectable
                ? { selectedId: selected, onSelectedChange: setSelected }
                : {})}
        />
    );
}

const meta: Meta<TreeViewStoryArgs> = {
    title: 'UI/TreeView',
    component: TreeView,
    args: {
        nodes: FILE_TREE,
        label: 'Project files',
        expandedIds: new Set(['src', 'ui']),
    },
    render: (args: TreeViewStoryArgs): ReactElement => <ControlledTree {...args} />,
};

export default meta;

type Story = StoryObj<TreeViewStoryArgs>;

// A navigation-only tree (no selectedId) with two branches expanded.
export const Default: Story = {};

// A consumer-supplied opaque tone color drives the selected rail, focus glow, and
// the hierarchy guide rail.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

// Selectable: providing selectedId makes every treeitem carry aria-selected;
// Enter/Space/click report through onSelectedChange.
export const Selectable: Story = {
    args: { selectedId: 'index' },
};

// A deeper hierarchy with three-plus levels and an empty branch (cli) exercising
// aria-level / aria-setsize / aria-posinset and the expandable-but-empty case.
export const DeepHierarchy: Story = {
    args: {
        nodes: DEEP_TREE,
        label: 'Workspace',
        expandedIds: new Set(['root', 'packages', 'core']),
    },
};

// A disabled tree: rows are inert (no expand/collapse/select/keyboard).
export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};
