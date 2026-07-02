import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Combobox } from './Combobox';
import type { ComboboxOption, ComboboxProps } from './Combobox.types';

const SYSTEMS: readonly ComboboxOption[] = [
    { id: 'nav', label: 'Navigation array' },
    { id: 'shield', label: 'Shield matrix' },
    { id: 'sensor', label: 'Sensor sweep' },
    { id: 'engine', label: 'Engine governor' },
    { id: 'life', label: 'Life support' },
    { id: 'comms', label: 'Comms uplink', disabled: true },
];

// Controlled harness so every story types, ranks, and commits live.
function ComboboxDemo(props: ComboboxProps): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    return (
        <div style={{ inlineSize: 'min(22rem, 80vw)' }}>
            <Combobox
                {...props}
                value={value}
                onValueChange={setValue}
                onSelect={(id: string): void => {
                    console.log('select', id);
                }}
            />
        </div>
    );
}

const meta: Meta<typeof Combobox> = {
    title: 'UI/Combobox',
    component: Combobox,
    render: (args: ComboboxProps): ReactElement => <ComboboxDemo {...args} />,
    args: {
        label: 'Target system',
        options: SYSTEMS,
        value: '',
        placeholder: 'Type to search systems',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Prefilled: Story = {
    args: { value: 'sensor' },
};

export const NoMatches: Story = {
    args: { value: 'zzz', emptyMessage: 'No system answers that call.' },
};

export const WithError: Story = {
    args: { error: 'That system is offline.' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};
