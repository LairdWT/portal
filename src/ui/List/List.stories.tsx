import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { ESelectionMode } from '../selectionMode';
import { EUiStatus } from '../tone';
import { List } from './List';

// A flat (non-union) story args shape. ListProps mixes the AccessibleName XOR
// union, which collapses Storybook's arg inference to `never`; the stories only
// ever exercise the `label` form, so a flat args type keeps the meta and story
// typing sound while still feeding valid List props. Item is fixed to string for
// the stories; the component stays generic over Item.
type ListStoryArgs = Readonly<{
    items: readonly string[];
    label: string;
    selectionMode?: ESelectionMode;
    selectedKeys?: ReadonlySet<string>;
    enabled?: EEnabledState;
    status?: EUiStatus;
    tone?: string;
    rowHeight?: number;
    maxBlockSize?: string;
    getTypeAheadText?: (item: string) => string;
    emptyContent?: ReactNode;
}>;

const FRUITS: readonly string[] = [
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberry',
    'Fig',
    'Grape',
    'Honeydew',
];

// Index-synthesized labels for the large windowing story.
function makeLargeItems(): readonly string[] {
    const out: string[] = [];
    for (let index: number = 0; index < 10000; index += 1) {
        out.push(`Row ${String(index)}`);
    }
    return out;
}

const LARGE_ITEMS: readonly string[] = makeLargeItems();

function itemKey(item: string): string {
    return item;
}

// The interface-forwarding row renderer: the List forwards every visible
// (item, state) here. The List itself already applies the HUD selection styling,
// so this demo just renders the label text.
function renderRow(item: string): ReactNode {
    return <span>{item}</span>;
}

// A controlled wrapper the stories share: List selection is controlled, so the
// story owns the selected keys and feeds them back, the pattern a consumer wiring
// it to app state uses.
function ControlledList(args: ListStoryArgs): ReactElement {
    const [selectedKeys, setSelectedKeys]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(args.selectedKeys ?? new Set<string>());
    return (
        <List<string>
            {...args}
            getItemKey={itemKey}
            renderItem={renderRow}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
        />
    );
}

// List is generic over Item; Storybook's Meta.component wants a concrete
// component type, so it is referenced through the story's fixed-Item shape.
const ListComponent: (props: ListStoryArgs) => ReactElement = List as (
    props: ListStoryArgs,
) => ReactElement;

const meta: Meta<ListStoryArgs> = {
    title: 'UI/List',
    component: ListComponent,
    parameters: { layout: 'fullscreen' },
    args: {
        items: FRUITS,
        label: 'Fruit',
        maxBlockSize: '20rem',
    },
    render: (args: ListStoryArgs): ReactElement => <ControlledList {...args} />,
};

export default meta;

type Story = StoryObj<ListStoryArgs>;

// A modest presentational list (role="list", no selection).
export const Default: Story = {};

// Single selection: role="listbox", one selected option at a time.
export const SingleSelect: Story = {
    args: {
        selectionMode: ESelectionMode.Single,
        selectedKeys: new Set<string>(['Cherry']),
    },
};

// Multiple selection: aria-multiselectable, toggle plus Shift range.
export const MultiSelect: Story = {
    args: {
        selectionMode: ESelectionMode.Multi,
        selectedKeys: new Set<string>(['Banana', 'Date']),
    },
};

// A consumer-supplied opaque tone color drives the selection rail, scrim, and
// glow while the row text stays on the contrast-safe foreground.
export const Toned: Story = {
    args: {
        selectionMode: ESelectionMode.Single,
        selectedKeys: new Set<string>(['Fig']),
        tone: 'oklch(0.7 0.18 25)',
    },
};

// A universal danger status swaps the tone seed, tinting the HUD frame edge.
export const Status: Story = {
    args: {
        selectionMode: ESelectionMode.Single,
        selectedKeys: new Set<string>(['Apple']),
        status: EUiStatus.Danger,
    },
};

// Disabled: the whole list is inert (drops out of the tab order, no selection).
// A non-overflowing block size keeps the inert (tabindex -1) region from being a
// scrollable region without keyboard access.
export const Disabled: Story = {
    args: {
        selectionMode: ESelectionMode.Single,
        selectedKeys: new Set<string>(['Grape']),
        enabled: EEnabledState.Disabled,
        maxBlockSize: '32rem',
    },
};

// Empty: no items renders the default EmptyState placeholder.
export const Empty: Story = {
    args: {
        items: [],
    },
};

// Large virtualization: 10,000 rows, yet only the windowed slice mounts.
export const LargeList: Story = {
    args: {
        label: 'Inventory',
        items: LARGE_ITEMS,
        selectionMode: ESelectionMode.Single,
        maxBlockSize: '24rem',
    },
};

// Type-ahead: printable keys move the active cursor to the next matching row.
export const TypeAhead: Story = {
    args: {
        selectionMode: ESelectionMode.Single,
        getTypeAheadText: itemKey,
    },
};

// Composition: two lists side by side keep their own selection.
export const Composition: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', gap: 'var(--portal-space-4)' }}>
            <ControlledList
                label="Fruit"
                items={FRUITS}
                selectionMode={ESelectionMode.Single}
                selectedKeys={new Set<string>(['Apple'])}
                maxBlockSize="18rem"
            />
            <ControlledList
                label="Inventory"
                items={LARGE_ITEMS}
                selectionMode={ESelectionMode.Single}
                maxBlockSize="18rem"
            />
        </div>
    ),
};
