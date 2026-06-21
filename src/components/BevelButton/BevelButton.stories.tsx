import { type Meta, type StoryObj } from '@storybook/react-vite';

import {
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { EEnabledState } from '../../state/state';
import { BevelButton } from './BevelButton';

const fireDescriptor: InputDescriptor = {
    id: 'bevel-button-demo',
    kind: EInputValueType.Digital,
    label: 'Fire',
};

function logSignal(signal: InputSignal): void {
    console.log('BevelButton signal', signal);
}

const meta: Meta<typeof BevelButton> = {
    title: 'Controls/BevelButton',
    component: BevelButton,
    args: { children: 'Fire' },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const SignalWired: Story = {
    args: { descriptor: fireDescriptor, onSignal: logSignal },
};
