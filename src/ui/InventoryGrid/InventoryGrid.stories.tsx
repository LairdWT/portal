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
import { moveSlot, relocateSlot } from './slotMath';

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

// A mixed-shape loadout on a 6-column grid: rectangular spans anchored at
// their top-left cell, applied with relocateSlot (swap semantics - splice
// would tear span anchors off their footprints).
function buildLoadout(): readonly InventorySlot[] {
    // 6 columns x 4 rows. The crate (2x2, anchor 0) covers 0,1,6,7; the
    // rifle (3x1, anchor 2) covers 2,3,4; the pack (2x1, anchor 8) covers
    // 8,9; the coil (1x2, anchor 10) covers 10,16. Covered cells stay real
    // empty entries.
    return [
        {
            id: 'crate',
            label: 'Supply crate',
            content: item('CRATE'),
            widthCells: 2,
            heightCells: 2,
        },
        { id: 'l1' },
        {
            id: 'rifle',
            label: 'Plasma rifle',
            content: item('RIFLE'),
            widthCells: 3,
            heightCells: 1,
        },
        { id: 'l3' },
        { id: 'l4' },
        { id: 'visor', label: 'Recon visor', content: item('VISR') },
        { id: 'l6' },
        { id: 'l7' },
        {
            id: 'pack',
            label: 'Field pack',
            content: item('PACK'),
            widthCells: 2,
            heightCells: 1,
        },
        { id: 'l9' },
        {
            id: 'coil',
            label: 'Charge coil',
            content: item('COIL'),
            widthCells: 1,
            heightCells: 2,
        },
        { id: 'l11' },
        { id: 'l12' },
        { id: 'l13' },
        { id: 'l14' },
        { id: 'l15' },
        { id: 'l16' },
        { id: 'l17' },
        { id: 'l18' },
        { id: 'l19' },
        { id: 'l20' },
        { id: 'l21' },
        { id: 'l22' },
        { id: 'l23' },
    ];
}

function MixedShapeInventory(): ReactElement {
    const [slots, setSlots]: [
        readonly InventorySlot[],
        Dispatch<SetStateAction<readonly InventorySlot[]>>,
    ] = useState<readonly InventorySlot[]>(buildLoadout);
    return (
        <InventoryGrid
            label="Loadout"
            slots={slots}
            columns={6}
            onMove={(fromIndex: number, toIndex: number): void => {
                setSlots(
                    (prev: readonly InventorySlot[]): readonly InventorySlot[] =>
                        relocateSlot(prev, fromIndex, toIndex),
                );
            }}
        />
    );
}

export const Default: Story = {
    render: (): ReactElement => <ControlledInventoryGrid />,
};

export const MixedShapes: Story = {
    render: (): ReactElement => <MixedShapeInventory />,
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
