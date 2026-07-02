import { type Meta, type StoryObj } from '@storybook/react-vite';

import {
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { EEnabledState } from '../../state/state';
import { DPad } from './DPad';
import { EDpadMode } from './DPad.types';

const directionDescriptor: InputDescriptor = {
    id: 'dpad-demo',
    kind: EInputValueType.Digital,
    label: 'Direction',
};

function logSignal(signal: InputSignal): void {
    console.log('DPad signal', signal);
}

const meta: Meta<typeof DPad> = {
    title: 'Controls/DPad',
    component: DPad,
    args: {
        label: 'Direction pad',
        enabled: EEnabledState.Enabled,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

// The four-button cross is the DPad's default form.
export const Default: Story = {};

export const EightWay: Story = {
    args: { mode: EDpadMode.EightWay },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const SignalWired: Story = {
    args: { descriptor: directionDescriptor, onSignal: logSignal },
};

// Keyboard and assistive-tech path: Tab moves focus across the direction
// buttons inside the group; Enter or Space momentarily presses the focused
// direction. Each button exposes aria-pressed reflecting the active direction.
export const KeyboardAndAssistiveTech: Story = {
    args: {
        mode: EDpadMode.EightWay,
        descriptor: directionDescriptor,
        onSignal: logSignal,
    },
    parameters: {
        docs: {
            description: {
                story:
                    'Tab to a direction button and press Enter or Space to ' +
                    'momentarily hold that direction. aria-pressed reflects the ' +
                    'active direction for assistive tech.',
            },
        },
    },
};
