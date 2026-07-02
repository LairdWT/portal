import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { TimePicker } from './TimePicker';
import {
    ETimePickerCycle,
    type TimePickerProps,
    type TimeValue,
} from './TimePicker.types';

// Controlled harness so every story types and steps live.
function TimePickerDemo(props: TimePickerProps): ReactElement {
    const [value, setValue]: [TimeValue, Dispatch<SetStateAction<TimeValue>>] =
        useState<TimeValue>(props.value);
    return <TimePicker {...props} value={value} onValueChange={setValue} />;
}

const meta: Meta<typeof TimePicker> = {
    title: 'UI/TimePicker',
    component: TimePicker,
    render: (args: TimePickerProps): ReactElement => <TimePickerDemo {...args} />,
    args: {
        label: 'Departure',
        value: { hours: 13, minutes: 45, seconds: 0 },
        cycle: ETimePickerCycle.H23,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwelveHour: Story = {
    args: { cycle: ETimePickerCycle.H12 },
};

export const WithSeconds: Story = {
    args: { withSeconds: true },
};

export const WithError: Story = {
    args: { error: 'Departures pause between 02:00 and 04:00.' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};
