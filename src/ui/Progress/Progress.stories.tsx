import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { EUiStatus } from '../tone';
import { Progress } from './Progress';
import { EProgressMode } from './Progress.types';

const meta: Meta<typeof Progress> = {
    title: 'UI/Progress',
    component: Progress,
};

export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {
    args: {
        mode: EProgressMode.Determinate,
        label: 'Loading assets',
        value: 0.6,
    },
};

export const Complete: Story = {
    args: {
        mode: EProgressMode.Determinate,
        label: 'Upload',
        value: 100,
        max: 100,
        status: EUiStatus.Success,
    },
};

export const Toned: Story = {
    args: {
        mode: EProgressMode.Determinate,
        label: 'Shield charge',
        value: 0.4,
        tone: 'oklch(0.7 0.15 240)',
    },
};

export const DangerStatus: Story = {
    args: {
        mode: EProgressMode.Determinate,
        label: 'Hull integrity',
        value: 0.2,
        status: EUiStatus.Danger,
    },
};

export const Indeterminate: Story = {
    args: {
        mode: EProgressMode.Indeterminate,
        label: 'Working',
    },
};

export const ProgressStack: Story = {
    render: (): ReactElement => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                inlineSize: 'min(24rem, 100%)',
            }}
        >
            <Progress
                mode={EProgressMode.Determinate}
                label="Download"
                value={0.3}
            />
            <Progress
                mode={EProgressMode.Determinate}
                label="Shield"
                value={0.7}
                tone="oklch(0.7 0.15 240)"
            />
            <Progress
                mode={EProgressMode.Determinate}
                label="Hull"
                value={0.15}
                status={EUiStatus.Danger}
            />
            <Progress
                mode={EProgressMode.Determinate}
                label="Sync"
                value={1}
                status={EUiStatus.Success}
            />
            <Progress mode={EProgressMode.Indeterminate} label="Scanning" />
        </div>
    ),
};
