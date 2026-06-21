import type { Meta, StoryObj } from '@storybook/react-vite';

import { EEnabledState } from '../../state/state';
import { Joystick } from './Joystick';

const meta: Meta<typeof Joystick> = {
    title: 'Controls/Joystick',
    component: Joystick,
    args: {
        label: 'Movement joystick',
        deadZone: 0.15,
        enabled: EEnabledState.Enabled,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Keyboard / assistive-tech: tab into the pad to reach the paired horizontal and
// vertical axis sliders, then use the arrow keys to drive each axis. The pad
// thumb tracks the combined axis.
export const Keyboard: Story = {
    args: {
        label: 'Movement joystick (keyboard)',
    },
};

export const Disabled: Story = {
    args: {
        enabled: EEnabledState.Disabled,
    },
};
