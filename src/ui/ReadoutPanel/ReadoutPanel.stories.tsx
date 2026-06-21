import type { Meta, StoryObj } from '@storybook/react-vite';

import { ReadoutPanel } from './ReadoutPanel';
import { type UiReadout } from './ReadoutPanel.types';

const baseReadouts: readonly UiReadout[] = [
    { id: 'energy', label: 'Energy', value: 7 },
    { id: 'shield', label: 'Shield', value: 42 },
    { id: 'hull', label: 'Hull', value: 100 },
    { id: 'phase', label: 'Phase', value: 'combat' },
];

const meta: Meta<typeof ReadoutPanel> = {
    title: 'UI/ReadoutPanel',
    component: ReadoutPanel,
    args: {
        label: 'Ship status',
        readouts: baseReadouts,
    },
};

export default meta;

type Story = StoryObj<typeof ReadoutPanel>;

export const Default: Story = {};

export const Toned: Story = {
    args: {
        label: 'Crimson fleet',
        tone: 'oklch(0.62 0.2 25)',
        readouts: baseReadouts,
    },
};

export const PerReadoutTones: Story = {
    args: {
        label: 'Resource pool',
        readouts: [
            {
                id: 'crimson',
                label: 'Crimson',
                value: 3,
                tone: 'oklch(0.62 0.2 25)',
            },
            { id: 'azure', label: 'Azure', value: 5, tone: 'oklch(0.7 0.15 240)' },
            {
                id: 'verdant',
                label: 'Verdant',
                value: 2,
                tone: 'oklch(0.72 0.16 150)',
            },
            { id: 'amber', label: 'Amber', value: 8, tone: 'oklch(0.78 0.15 80)' },
        ],
    },
};

export const DangerStatus: Story = {
    args: {
        label: 'Critical systems',
        readouts: [
            {
                id: 'hull',
                label: 'Hull',
                value: 0,
                tone: 'var(--portal-color-danger)',
            },
            {
                id: 'shield',
                label: 'Shield',
                value: 0,
                tone: 'var(--portal-color-danger)',
            },
            { id: 'reactor', label: 'Reactor', value: 'offline' },
        ],
    },
};
