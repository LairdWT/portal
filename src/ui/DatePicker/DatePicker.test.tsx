import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { describe, expect, it } from 'vitest';

import type { CalendarDate } from '../Calendar/calendarMath';
import { DatePicker } from './DatePicker';

// Controlled harness reporting the committed value as ISO text for easy
// assertions.
function PickerHarness({
    initial,
    min,
    max,
}: Readonly<{
    initial?: CalendarDate | null;
    min?: CalendarDate;
    max?: CalendarDate;
}>): ReactElement {
    const [value, setValue]: [
        CalendarDate | null,
        Dispatch<SetStateAction<CalendarDate | null>>,
    ] = useState<CalendarDate | null>(initial ?? null);
    return (
        <>
            <DatePicker
                label="Launch date"
                value={value}
                onValueChange={setValue}
                locale="en-US"
                min={min}
                max={max}
            />
            <output data-testid="committed">
                {value === null
                    ? 'null'
                    : `${String(value.year)}-${String(value.month)}-${String(value.day)}`}
            </output>
        </>
    );
}

describe('DatePicker', (): void => {
    it('commits a typed ISO date', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<PickerHarness />);
        await user.type(screen.getByLabelText('Launch date'), '2026-07-02');
        expect(screen.getByTestId('committed').textContent).toBe('2026-7-2');
    });

    it('marks an unparseable draft invalid without destroying the value', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<PickerHarness initial={{ year: 2026, month: 7, day: 2 }} />);
        const input: HTMLElement = screen.getByLabelText('Launch date');
        await user.clear(input);
        await user.type(input, 'not a date');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Use YYYY-MM-DD.')).toBeInTheDocument();
        // The last committed state is the cleared null, never a garbage date.
        expect(screen.getByTestId('committed').textContent).toBe('null');
    });

    it('commits null when cleared', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<PickerHarness initial={{ year: 2026, month: 7, day: 2 }} />);
        await user.clear(screen.getByLabelText('Launch date'));
        expect(screen.getByTestId('committed').textContent).toBe('null');
    });

    it('refuses an ISO date outside the window', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <PickerHarness
                min={{ year: 2026, month: 7, day: 1 }}
                max={{ year: 2026, month: 7, day: 31 }}
            />,
        );
        const input: HTMLElement = screen.getByLabelText('Launch date');
        await user.type(input, '2026-08-15');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByTestId('committed').textContent).toBe('null');
    });

    it('opens the calendar dialog and commits a picked day', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<PickerHarness initial={{ year: 2026, month: 7, day: 2 }} />);
        await user.click(screen.getByRole('button', { name: 'Open calendar' }));
        expect(
            screen.getByRole('dialog', { name: 'Choose date' }),
        ).toBeInTheDocument();
        await user.click(screen.getByRole('gridcell', { name: 'July 10, 2026' }));
        expect(screen.getByTestId('committed').textContent).toBe('2026-7-10');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.getByLabelText('Launch date')).toHaveValue('2026-07-10');
    });
});
