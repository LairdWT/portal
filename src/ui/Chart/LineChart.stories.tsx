import type { Meta, StoryObj } from '@storybook/react-vite';

import { LineChart } from './LineChart';

const SAMPLES: readonly number[] = [
    120, 132, 128, 155, 149, 170, 168, 190, 205, 198, 224, 236,
];

const meta: Meta<typeof LineChart> = {
    title: 'UI/LineChart',
    component: LineChart,
    args: {
        label: 'Reactor output (MW)',
        values: SAMPLES,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
    args: { filled: true },
};

export const Empty: Story = {
    args: { values: [], emptyLabel: 'No telemetry received.' },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)', filled: true },
};
