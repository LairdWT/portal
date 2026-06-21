import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { EEnabledState } from '../../state/state';
import { ActionButton } from './ActionButton';
import { EBevelCorners } from './ActionButton.types';

const meta: Meta<typeof ActionButton> = {
    title: 'Controls/ActionButton',
    component: ActionButton,
    args: {
        label: 'Fire',
        enabled: EEnabledState.Enabled,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Default: all four corners squircle.
export const Default: Story = {};

export const Disabled: Story = {
    args: {
        enabled: EEnabledState.Disabled,
    },
};

export const TopLeftBottomRight: Story = {
    args: { bevelCorners: EBevelCorners.TopLeftBottomRight },
};

export const TopRightBottomLeft: Story = {
    args: { bevelCorners: EBevelCorners.TopRightBottomLeft },
};

// The grid use case: alternating bevel diagonals so adjacent buttons interlock
// into one cohesive cluster, as in a controller's A/B/X/Y face buttons.
export const Grid: Story = {
    render: (): ReactElement => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 4rem)',
                gap: '0.5rem',
            }}
        >
            <ActionButton
                label="A"
                bevelCorners={EBevelCorners.TopLeftBottomRight}
            />
            <ActionButton
                label="B"
                bevelCorners={EBevelCorners.TopRightBottomLeft}
            />
            <ActionButton
                label="X"
                bevelCorners={EBevelCorners.TopRightBottomLeft}
            />
            <ActionButton
                label="Y"
                bevelCorners={EBevelCorners.TopLeftBottomRight}
            />
        </div>
    ),
};
