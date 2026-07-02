import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { InventoryGrid } from './InventoryGrid';
import { type InventorySlot } from './InventoryGrid.types';
import { moveSlot } from './slotMath';

// A compact mono item tag for occupied slots.
const ITEM_STYLE: CSSProperties = {
    fontFamily: 'var(--portal-font-mono)',
    fontSize: 'var(--portal-size-text-sm)',
    letterSpacing: 'var(--portal-letter-spacing-wide)',
};

function item(tag: string): ReactNode {
    return <span style={ITEM_STYLE}>{tag}</span>;
}

function buildSlots(): readonly InventorySlot[] {
    return [
        { id: 'plasma', label: 'Plasma cell', content: item('PLSM') },
        { id: 'medkit', label: 'Medkit', content: item('MED') },
        { id: 'e3' },
        { id: 'scrap', label: 'Scrap alloy', content: item('SCRP') },
        { id: 'e5' },
        { id: 'e6' },
        { id: 'flare', label: 'Signal flare', content: item('FLRE') },
        { id: 'e8' },
        { id: 'e9' },
        { id: 'cell', label: 'Power cell', content: item('PWR') },
        { id: 'e11' },
        { id: 'e12' },
    ];
}

type HarnessProps = Readonly<{
    columns?: number;
    enabled?: EEnabledState;
    tone?: string;
}>;

// Controlled harness: the story owns the slot order and applies moves with
// the exported moveSlot helper (the documented consumer contract).
function ControlledInventoryGrid(props: HarnessProps): ReactElement {
    const [slots, setSlots]: [
        readonly InventorySlot[],
        Dispatch<SetStateAction<readonly InventorySlot[]>>,
    ] = useState<readonly InventorySlot[]>(buildSlots);
    return (
        <InventoryGrid
            label="Cargo hold"
            slots={slots}
            columns={props.columns ?? 4}
            onMove={(fromIndex: number, toIndex: number): void => {
                setSlots(
                    (prev: readonly InventorySlot[]): readonly InventorySlot[] =>
                        moveSlot(prev, fromIndex, toIndex),
                );
            }}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
            {...(props.tone !== undefined ? { tone: props.tone } : {})}
        />
    );
}

type InventoryGridStoryArgs = Readonly<{ label: string }>;

const meta: Meta<InventoryGridStoryArgs> = {
    title: 'UI/InventoryGrid',
    args: { label: 'InventoryGrid' },
};

export default meta;

type Story = StoryObj<InventoryGridStoryArgs>;

export const Default: Story = {
    render: (): ReactElement => <ControlledInventoryGrid />,
};

export const SixColumns: Story = {
    render: (): ReactElement => <ControlledInventoryGrid columns={6} />,
};

export const Toned: Story = {
    render: (): ReactElement => (
        <ControlledInventoryGrid tone="var(--portal-color-success)" />
    ),
};

export const Disabled: Story = {
    render: (): ReactElement => (
        <ControlledInventoryGrid enabled={EEnabledState.Disabled} />
    ),
};
