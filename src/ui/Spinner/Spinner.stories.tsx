import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

import { Spinner } from './Spinner';
import { ESpinnerSize } from './Spinner.types';

const meta: Meta<typeof Spinner> = {
    title: 'UI/Spinner',
    component: Spinner,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Spinner size={ESpinnerSize.Sm} label="Loading (small)" />
            <Spinner size={ESpinnerSize.Md} label="Loading (medium)" />
            <Spinner size={ESpinnerSize.Lg} label="Loading (large)" />
        </div>
    ),
};

export const Labelled: Story = {
    args: { label: 'Syncing telemetry' },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};
