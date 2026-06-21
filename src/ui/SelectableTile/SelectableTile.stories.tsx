import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { SelectionProvider } from '../../react/SelectionProvider';
import { SelectableTile } from './SelectableTile';
import { ESelectionState } from './SelectableTile.types';

function logSelect(id: string): void {
    console.log('SelectableTile selected', id);
}

const meta: Meta<typeof SelectableTile> = {
    title: 'UI/SelectableTile',
    component: SelectableTile,
    args: {
        id: 'unit-7',
        selectionLabel: 'Select unit 7',
        children: 'Unit 7',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
    args: { state: ESelectionState.Selected },
};

// Targetable is conveyed by the tone border/glow plus a visually hidden text
// hint the component renders, so assistive technology is not reliant on color.
export const Targetable: Story = {
    args: { state: ESelectionState.Targetable },
};

// A consumer-supplied opaque tone color drives the selected/targetable ramp.
export const Toned: Story = {
    args: { state: ESelectionState.Selected, tone: 'oklch(0.7 0.18 25)' },
};

// A grid wrapped in SelectionProvider: tiles omit an explicit onSelect, so each
// click routes to the ambient sink with the tile id, the pattern a consumer
// wires once instead of drilling a handler into every tile.
export const ProviderGrid: Story = {
    render: function ProviderGridStory(): ReactElement {
        return (
            <SelectionProvider onSelect={logSelect}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, auto)',
                        gap: '0.75rem',
                    }}
                >
                    <SelectableTile id="unit-1" selectionLabel="Select unit 1">
                        Unit 1
                    </SelectableTile>
                    <SelectableTile
                        id="unit-2"
                        selectionLabel="Select unit 2"
                        state={ESelectionState.Selected}
                    >
                        Unit 2
                    </SelectableTile>
                    <SelectableTile
                        id="unit-3"
                        selectionLabel="Select unit 3"
                        state={ESelectionState.Targetable}
                    >
                        Unit 3
                    </SelectableTile>
                </div>
            </SelectionProvider>
        );
    },
};
