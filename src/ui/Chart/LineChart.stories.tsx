import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType, ReactElement } from 'react';

import { LineChart } from './LineChart';

const SAMPLES: readonly number[] = [
    120, 132, 128, 155, 149, 170, 168, 190, 205, 198, 224, 236,
];

const meta: Meta<typeof LineChart> = {
    title: 'UI/LineChart',
    component: LineChart,
    // The centered story canvas shrink-wraps; an explicit inline size keeps
    // the demo at a readable trend width (the component itself also floors
    // its own min width, so it can never collapse to a sliver again).
    decorators: [
        (Story: ComponentType): ReactElement => (
            <div style={{ inlineSize: 'min(36rem, 90vw)' }}>
                <Story />
            </div>
        ),
    ],
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
