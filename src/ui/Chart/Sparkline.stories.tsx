import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

import { Sparkline } from './Sparkline';

const SAMPLES: readonly number[] = [42, 48, 45, 61, 58, 70, 66, 82, 78, 91];

const meta: Meta<typeof Sparkline> = {
    title: 'UI/Sparkline',
    component: Sparkline,
    args: {
        label: 'Hull integrity',
        values: SAMPLES,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
    args: { filled: true },
};

export const BesideAValue: Story = {
    render: (): ReactElement => (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--portal-space-3)',
                color: 'var(--portal-color-text-0)',
                fontFamily: 'var(--portal-font-mono)',
                fontSize: 'var(--portal-size-text-lg)',
            }}
        >
            <span>91%</span>
            <Sparkline label="Hull integrity trend" values={SAMPLES} filled />
        </div>
    ),
};

export const Empty: Story = {
    args: { values: [] },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.62 0.2 25)', filled: true },
};
