import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { SegmentedControl } from './SegmentedControl';
import { type UiSegmentItem } from './SegmentedControl.types';

const ITEMS: readonly UiSegmentItem[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
];

describe('SegmentedControl', (): void => {
    it('renders a radiogroup with one radio per item', (): void => {
        render(<SegmentedControl items={ITEMS} value="day" label="Time range" />);

        expect(
            screen.getByRole('radiogroup', { name: 'Time range' }),
        ).toBeInTheDocument();
        const segments: readonly HTMLElement[] = screen.getAllByRole('radio');
        expect(segments).toHaveLength(ITEMS.length);
    });

    it('tracks the controlled value through aria-checked', (): void => {
        render(<SegmentedControl items={ITEMS} value="week" />);

        const selected: HTMLElement = screen.getByRole('radio', {
            name: 'Week',
            checked: true,
        });
        expect(selected).toBeInTheDocument();
        expect(
            screen.getByRole('radio', { name: 'Day', checked: false }),
        ).toBeInTheDocument();
    });

    it('applies roving tabindex with the selected segment focusable', (): void => {
        render(<SegmentedControl items={ITEMS} value="week" />);

        expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute(
            'tabindex',
            '0',
        );
        expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
        expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
    });

    it('reflects the selected state through the data-state attribute', (): void => {
        render(<SegmentedControl items={ITEMS} value="week" />);

        expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute(
            'data-state',
            'selected',
        );
        expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute(
            'data-state',
            'idle',
        );
    });

    it('applies the tone seed custom property to the group root', (): void => {
        render(
            <SegmentedControl
                items={ITEMS}
                value="day"
                tone="oklch(0.7 0.18 25)"
            />,
        );

        const group: HTMLElement = screen.getByRole('radiogroup');
        expect(group.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.18 25)',
        );
    });

    it('calls onChange with the id on click', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<SegmentedControl items={ITEMS} value="day" onChange={onChange} />);

        await user.click(screen.getByRole('radio', { name: 'Week' }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('week');
    });

    it('selects the next segment on ArrowRight', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<SegmentedControl items={ITEMS} value="day" onChange={onChange} />);

        screen.getByRole('radio', { name: 'Day' }).focus();
        await user.keyboard('{ArrowRight}');

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('week');
    });

    it('selects the previous segment on ArrowUp', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<SegmentedControl items={ITEMS} value="week" onChange={onChange} />);

        screen.getByRole('radio', { name: 'Week' }).focus();
        await user.keyboard('{ArrowUp}');

        expect(onChange).toHaveBeenCalledWith('day');
    });

    it('wraps to the first segment on ArrowRight from the last', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <SegmentedControl items={ITEMS} value="month" onChange={onChange} />,
        );

        screen.getByRole('radio', { name: 'Month' }).focus();
        await user.keyboard('{ArrowRight}');

        expect(onChange).toHaveBeenCalledWith('day');
    });

    it('jumps to the first and last segment on Home and End', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<SegmentedControl items={ITEMS} value="week" onChange={onChange} />);

        const selected: HTMLElement = screen.getByRole('radio', { name: 'Week' });
        selected.focus();
        await user.keyboard('{End}');
        expect(onChange).toHaveBeenLastCalledWith('month');

        await user.keyboard('{Home}');
        expect(onChange).toHaveBeenLastCalledWith('day');
    });

    it('does not change when disabled', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <SegmentedControl
                items={ITEMS}
                value="day"
                onChange={onChange}
                enabled={EEnabledState.Disabled}
            />,
        );

        const weekSegment: HTMLElement = screen.getByRole('radio', {
            name: 'Week',
        });
        expect(weekSegment).toBeDisabled();

        await user.click(weekSegment);
        expect(onChange).not.toHaveBeenCalled();
    });
});
