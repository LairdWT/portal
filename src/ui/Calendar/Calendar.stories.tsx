import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Calendar } from './Calendar';
import type { CalendarProps } from './Calendar.types';
import type { CalendarDate } from './calendarMath';

// Controlled harness so every story selects live. A fixed anchor date keeps
// the visual gates deterministic (no dependence on the run date).
function CalendarDemo(props: CalendarProps): ReactElement {
    const [value, setValue]: [
        CalendarDate | undefined,
        Dispatch<SetStateAction<CalendarDate | undefined>>,
    ] = useState<CalendarDate | undefined>(props.value);
    return (
        <Calendar
            {...props}
            {...(value !== undefined ? { value } : {})}
            onSelect={setValue}
        />
    );
}

const meta: Meta<typeof Calendar> = {
    title: 'UI/Calendar',
    component: Calendar,
    render: (args: CalendarProps): ReactElement => <CalendarDemo {...args} />,
    args: {
        label: 'Mission date',
        value: { year: 2026, month: 7, day: 2 },
        locale: 'en-US',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MondayFirst: Story = {
    args: { locale: 'de-DE' },
};

export const Windowed: Story = {
    args: {
        min: { year: 2026, month: 7, day: 6 },
        max: { year: 2026, month: 7, day: 24 },
        value: { year: 2026, month: 7, day: 10 },
    },
};

export const BlockedWeekends: Story = {
    args: {
        isDateDisabled: (date: CalendarDate): boolean => {
            const weekday: number = new Date(
                Date.UTC(date.year, date.month - 1, date.day),
            ).getUTCDay();
            return weekday === 0 || weekday === 6;
        },
    },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};
