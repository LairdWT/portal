import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { Calendar } from './Calendar';
import type { CalendarDate } from './calendarMath';

const JULY_SECOND: CalendarDate = { year: 2026, month: 7, day: 2 };

describe('Calendar', (): void => {
    it('renders a labelled grid presenting the value month', (): void => {
        render(
            <Calendar label="Mission date" value={JULY_SECOND} locale="en-US" />,
        );
        expect(
            screen.getByRole('grid', { name: 'Mission date' }),
        ).toBeInTheDocument();
        expect(screen.getByText('July 2026')).toBeInTheDocument();
        // Sunday-first en-US header row.
        expect(
            screen.getAllByRole('columnheader')[0]?.getAttribute('aria-label'),
        ).toBe('Sunday');
    });

    it('marks the selected day and reports a pick', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onSelect: Mock = vi.fn();
        render(
            <Calendar
                label="Mission date"
                value={JULY_SECOND}
                onSelect={onSelect}
                locale="en-US"
            />,
        );
        const selected: HTMLElement = screen.getByRole('gridcell', {
            name: 'July 2, 2026',
        });
        expect(selected).toHaveAttribute('aria-selected', 'true');
        await user.click(screen.getByRole('gridcell', { name: 'July 10, 2026' }));
        expect(onSelect).toHaveBeenCalledWith({ year: 2026, month: 7, day: 10 });
    });

    it('moves the roving focus with arrows and turns months with PageDown', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <Calendar label="Mission date" value={JULY_SECOND} locale="en-US" />,
        );
        const start: HTMLElement = screen.getByRole('gridcell', {
            name: 'July 2, 2026',
        });
        expect(start).toHaveAttribute('tabindex', '0');
        start.focus();
        await user.keyboard('{ArrowRight}');
        const next: HTMLElement = screen.getByRole('gridcell', {
            name: 'July 3, 2026',
        });
        expect(next).toHaveAttribute('tabindex', '0');
        expect(next).toHaveFocus();
        await user.keyboard('{PageDown}');
        expect(screen.getByText('August 2026')).toBeInTheDocument();
        expect(
            screen.getByRole('gridcell', { name: 'August 3, 2026' }),
        ).toHaveFocus();
    });

    it('gates selection outside the min/max window', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onSelect: Mock = vi.fn();
        render(
            <Calendar
                label="Mission date"
                value={JULY_SECOND}
                onSelect={onSelect}
                locale="en-US"
                min={{ year: 2026, month: 7, day: 2 }}
                max={{ year: 2026, month: 7, day: 20 }}
            />,
        );
        const blocked: HTMLElement = screen.getByRole('gridcell', {
            name: 'July 1, 2026',
        });
        expect(blocked).toHaveAttribute('aria-disabled', 'true');
        await user.click(blocked);
        expect(onSelect).not.toHaveBeenCalled();
        // The whole previous month is out of range: the turn key locks.
        expect(
            screen.getByRole('button', { name: 'Previous month' }),
        ).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    });

    it('honors a custom disabled-date predicate', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onSelect: Mock = vi.fn();
        render(
            <Calendar
                label="Mission date"
                value={JULY_SECOND}
                onSelect={onSelect}
                locale="en-US"
                isDateDisabled={(date: CalendarDate): boolean => date.day === 4}
            />,
        );
        const blocked: HTMLElement = screen.getByRole('gridcell', {
            name: 'July 4, 2026',
        });
        expect(blocked).toHaveAttribute('aria-disabled', 'true');
        await user.click(blocked);
        expect(onSelect).not.toHaveBeenCalled();
    });
});
