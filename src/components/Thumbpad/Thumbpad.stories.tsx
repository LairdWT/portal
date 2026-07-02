import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Axis2D } from '../../input';
import { EEnabledState } from '../../state/state';
import { Thumbpad } from './Thumbpad';

const meta: Meta<typeof Thumbpad> = {
    title: 'Controls/Thumbpad',
    component: Thumbpad,
    args: {
        label: 'Look thumbpad',
        enabled: EEnabledState.Enabled,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Relative-delta surface: dragging reports the incremental movement since the
// previous pointer sample (camera-look style) rather than an absolute axis.
export const RelativeDelta: Story = {
    args: {
        onDelta: (delta: Axis2D): void => {
            console.log('thumbpad delta', delta.x, delta.y);
        },
    },
};

// Keyboard / assistive tech: Tab to one of the hidden per-axis sliders and arrow
// it; each change emits a relative delta step and moves the thumb offset.
export const Keyboard: Story = {
    args: {
        label: 'Look thumbpad (keyboard)',
        onDelta: (delta: Axis2D): void => {
            console.log('thumbpad keyboard delta', delta.x, delta.y);
        },
    },
};

export const Disabled: Story = {
    args: {
        enabled: EEnabledState.Disabled,
    },
};
