import type { Meta, StoryObj } from '@storybook/react-vite';

import { EEnabledState } from '../../state/state';
import { ActionButton } from './ActionButton';

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

export const Default: Story = {};

export const Disabled: Story = {
    args: {
        enabled: EEnabledState.Disabled,
    },
};
