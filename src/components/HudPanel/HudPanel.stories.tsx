import type { Meta, StoryObj } from '@storybook/react-vite';

import { HudPanel } from './HudPanel';
import { type HudReadout } from './HudPanel.types';

const meta: Meta<typeof HudPanel> = {
    title: 'Components/HudPanel',
    component: HudPanel,
    parameters: { layout: 'fullscreen' },
    args: {
        label: 'Status readouts',
    },
};

export default meta;

type Story = StoryObj<typeof HudPanel>;

const defaultReadouts: readonly HudReadout[] = [
    { id: 'health', label: 'Health', value01: 0.82 },
    { id: 'shield', label: 'Shield', value01: 0.45 },
    { id: 'boost', label: 'Boost', value01: 0.12 },
];

export const Default: Story = {
    args: {
        readouts: defaultReadouts,
    },
};

const edgeReadouts: readonly HudReadout[] = [
    { id: 'empty', label: 'Empty', value01: 0 },
    { id: 'full', label: 'Full', value01: 1 },
    { id: 'over', label: 'Over range', value01: 1.6 },
    { id: 'under', label: 'Under range', value01: -0.4 },
];

export const EdgeValues: Story = {
    args: {
        label: 'Clamped readouts',
        readouts: edgeReadouts,
    },
};

export const Empty: Story = {
    args: {
        label: 'No readouts',
        readouts: [],
    },
};
