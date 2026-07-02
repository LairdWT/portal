import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { describe, expect, it } from 'vitest';

import { TimePicker } from './TimePicker';
import { ETimePickerCycle, type TimeValue } from './TimePicker.types';

function TimeHarness({
    initial,
    cycle,
    withSeconds,
}: Readonly<{
    initial: TimeValue;
    cycle?: ETimePickerCycle;
    withSeconds?: boolean;
}>): ReactElement {
    const [value, setValue]: [TimeValue, Dispatch<SetStateAction<TimeValue>>] =
        useState<TimeValue>(initial);
    return (
        <>
            <TimePicker
                label="Departure"
                value={value}
                onValueChange={setValue}
                cycle={cycle}
                withSeconds={withSeconds}
            />
            <output data-testid="committed">
                {`${String(value.hours)}:${String(value.minutes)}:${String(value.seconds)}`}
            </output>
        </>
    );
}

describe('TimePicker', (): void => {
    it('renders padded 24-hour segments', (): void => {
        render(
            <TimeHarness
                initial={{ hours: 9, minutes: 5, seconds: 0 }}
                cycle={ETimePickerCycle.H23}
            />,
        );
        expect(screen.getByLabelText('Hours')).toHaveValue('09');
        expect(screen.getByLabelText('Minutes')).toHaveValue('05');
        expect(screen.queryByLabelText('Seconds')).toBeNull();
    });

    it('steps segments with arrows and wraps at the edges', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <TimeHarness
                initial={{ hours: 23, minutes: 59, seconds: 0 }}
                cycle={ETimePickerCycle.H23}
            />,
        );
        const hours: HTMLElement = screen.getByLabelText('Hours');
        hours.focus();
        await user.keyboard('{ArrowUp}');
        expect(screen.getByTestId('committed').textContent).toBe('0:59:0');
        const minutes: HTMLElement = screen.getByLabelText('Minutes');
        minutes.focus();
        await user.keyboard('{ArrowUp}');
        expect(screen.getByTestId('committed').textContent).toBe('0:0:0');
    });

    it('accepts typed digits per segment', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <TimeHarness
                initial={{ hours: 0, minutes: 0, seconds: 0 }}
                cycle={ETimePickerCycle.H23}
            />,
        );
        const minutes: HTMLElement = screen.getByLabelText('Minutes');
        await user.click(minutes);
        await user.keyboard('42');
        expect(screen.getByTestId('committed').textContent).toBe('0:42:0');
    });

    it('presents twelve-hour display with a working meridiem toggle', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <TimeHarness
                initial={{ hours: 13, minutes: 0, seconds: 0 }}
                cycle={ETimePickerCycle.H12}
            />,
        );
        expect(screen.getByLabelText('Hours')).toHaveValue('01');
        const meridiem: HTMLElement = screen.getByRole('button', {
            name: 'Toggle AM or PM',
        });
        expect(meridiem.textContent).toBe('PM');
        await user.click(meridiem);
        expect(screen.getByTestId('committed').textContent).toBe('1:0:0');
        expect(meridiem.textContent).toBe('AM');
    });

    it('renders the seconds segment when requested', (): void => {
        render(
            <TimeHarness
                initial={{ hours: 1, minutes: 2, seconds: 3 }}
                cycle={ETimePickerCycle.H23}
                withSeconds
            />,
        );
        expect(screen.getByLabelText('Seconds')).toHaveValue('03');
    });
});
