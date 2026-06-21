import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import {
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { EEnabledState } from '../../state/state';
import { Toggle } from './Toggle';
import { ECheckedState, type ToggleProps } from './Toggle.types';

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

// Uncontrolled: no checked prop, so the Toggle manages its own state and flips
// on click out of the box.
export const Default: Story = {};

// Uncontrolled but starting in the on position via defaultChecked.
export const Checked: Story = {
    args: { defaultChecked: ECheckedState.Checked },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

// Uncontrolled, additionally emitting a typed Digital InputSignal per toggle.
export const SignalWired: Story = {
    args: { descriptor: muteDescriptor, onSignal: logSignal },
};

// Controlled: the story owns the state and feeds it back through `checked`, the
// pattern a consumer wiring the Toggle to app state uses.
export const Controlled: Story = {
    render: function ControlledToggle(args: ToggleProps): ReactElement {
        const [checked, setChecked]: [
            ECheckedState,
            Dispatch<SetStateAction<ECheckedState>>,
        ] = useState<ECheckedState>(ECheckedState.Unchecked);
        return <Toggle {...args} checked={checked} onChange={setChecked} />;
    },
};
