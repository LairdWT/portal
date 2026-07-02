import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import type { CalendarDate } from '../Calendar/calendarMath';
import { DatePicker } from './DatePicker';
import type { DatePickerProps } from './DatePicker.types';

// Controlled harness so every story types and picks live.
function DatePickerDemo(props: DatePickerProps): ReactElement {
    const [value, setValue]: [
        CalendarDate | null,
        Dispatch<SetStateAction<CalendarDate | null>>,
    ] = useState<CalendarDate | null>(props.value);
    return (
        <div style={{ inlineSize: 'min(20rem, 80vw)' }}>
            <DatePicker {...props} value={value} onValueChange={setValue} />
        </div>
    );
}

const meta: Meta<typeof DatePicker> = {
    title: 'UI/DatePicker',
    component: DatePicker,
    render: (args: DatePickerProps): ReactElement => <DatePickerDemo {...args} />,
    args: {
        label: 'Launch date',
        value: { year: 2026, month: 7, day: 2 },
        locale: 'en-US',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyValue: Story = {
    args: { value: null },
};

export const Windowed: Story = {
    args: {
        min: { year: 2026, month: 7, day: 1 },
        max: { year: 2026, month: 9, day: 30 },
    },
};

export const WithError: Story = {
    args: { error: 'Launch slots are fully booked that week.' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};
