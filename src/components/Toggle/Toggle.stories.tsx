import { type Meta, type StoryObj } from '@storybook/react-vite';

import {
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { EEnabledState } from '../../state/state';
import { Toggle } from './Toggle';
import { ECheckedState } from './Toggle.types';

const muteDescriptor: InputDescriptor = {
    id: 'toggle-demo',
    kind: EInputValueType.Digital,
    label: 'Mute',
};

function logSignal(signal: InputSignal): void {
    console.log('Toggle signal', signal);
}

const meta: Meta<typeof Toggle> = {
    title: 'Controls/Toggle',
    component: Toggle,
    args: { label: 'Mute' },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
    args: { checked: ECheckedState.Checked },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const SignalWired: Story = {
    args: { descriptor: muteDescriptor, onSignal: logSignal },
};
