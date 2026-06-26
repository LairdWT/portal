import { fireEvent, render, screen } from '@testing-library/react';
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

// Every render passes an accessible name: the AccessibleName union now makes a
// nameless radiogroup a compile error, so the suite always supplies a name
// (label here, with a dedicated labelledBy variant test below).
const GROUP_LABEL: string = 'Time range';

describe('SegmentedControl', (): void => {
    it('renders a radiogroup with one radio per item', (): void => {
        render(<SegmentedControl items={ITEMS} value="day" label={GROUP_LABEL} />);

        expect(
            screen.getByRole('radiogroup', { name: GROUP_LABEL }),
        ).toBeInTheDocument();
        const segments: readonly HTMLElement[] = screen.getAllByRole('radio');
        expect(segments).toHaveLength(ITEMS.length);
    });

    it('wires label to aria-label on the radiogroup', (): void => {
        render(<SegmentedControl items={ITEMS} value="day" label={GROUP_LABEL} />);

        expect(screen.getByRole('radiogroup')).toHaveAttribute(
            'aria-label',
            GROUP_LABEL,
        );
    });

    it('names the radiogroup through labelledBy when provided', (): void => {
        render(
            <>
                <span id="range-heading">Time range</span>
                <SegmentedControl
                    items={ITEMS}
                    value="day"
                    labelledBy="range-heading"
                />
            </>,
        );

        const group: HTMLElement = screen.getByRole('radiogroup', {
            name: 'Time range',
        });
        expect(group).toHaveAttribute('aria-labelledby', 'range-heading');
        expect(group).not.toHaveAttribute('aria-label');
    });

    it('tracks the controlled value through aria-checked', (): void => {
        render(<SegmentedControl items={ITEMS} value="week" label={GROUP_LABEL} />);

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
        render(<SegmentedControl items={ITEMS} value="week" label={GROUP_LABEL} />);

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
        render(<SegmentedControl items={ITEMS} value="week" label={GROUP_LABEL} />);

        expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute(
            'data-state',
            'selected',
        );
        expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute(
            'data-state',
            'idle',
        );
    });

    it('falls back to the first segment when the value matches no item', (): void => {
        render(
            <SegmentedControl items={ITEMS} value="missing" label={GROUP_LABEL} />,
        );

        // No item is checked, but the roving tabindex still has a valid target.
        expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute(
            'tabindex',
            '0',
        );
        expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
        expect(
            screen.queryByRole('radio', { checked: true }),
        ).not.toBeInTheDocument();
    });

    it('applies the tone seed custom property to the group root', (): void => {
        render(
            <SegmentedControl
                items={ITEMS}
                value="day"
                label={GROUP_LABEL}
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
        render(
            <SegmentedControl
                items={ITEMS}
                value="day"
                label={GROUP_LABEL}
                onChange={onChange}
            />,
        );

        await user.click(screen.getByRole('radio', { name: 'Week' }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('week');
    });

    it('selects the next segment on ArrowRight', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <SegmentedControl
                items={ITEMS}
                value="day"
                label={GROUP_LABEL}
                onChange={onChange}
            />,
        );

        screen.getByRole('radio', { name: 'Day' }).focus();
        await user.keyboard('{ArrowRight}');

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('week');
    });

    it('selects the previous segment on ArrowUp', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <SegmentedControl
                items={ITEMS}
                value="week"
                label={GROUP_LABEL}
                onChange={onChange}
            />,
        );

        screen.getByRole('radio', { name: 'Week' }).focus();
        await user.keyboard('{ArrowUp}');

        expect(onChange).toHaveBeenCalledWith('day');
    });

    it('wraps to the first segment on ArrowRight from the last', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <SegmentedControl
                items={ITEMS}
                value="month"
                label={GROUP_LABEL}
                onChange={onChange}
            />,
        );

        screen.getByRole('radio', { name: 'Month' }).focus();
        await user.keyboard('{ArrowRight}');

        expect(onChange).toHaveBeenCalledWith('day');
    });

    it('jumps to the first and last segment on Home and End', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <SegmentedControl
                items={ITEMS}
                value="week"
                label={GROUP_LABEL}
                onChange={onChange}
            />,
        );

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
                label={GROUP_LABEL}
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

    it('does not change on keyboard navigation when disabled', (): void => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        render(
            <SegmentedControl
                items={ITEMS}
                value="day"
                label={GROUP_LABEL}
                onChange={onChange}
                enabled={EEnabledState.Disabled}
            />,
        );

        // fireEvent reaches the handler directly; the disabled guard in
        // handleKeyDown returns before any selection occurs.
        fireEvent.keyDown(screen.getByRole('radio', { name: 'Day' }), {
            key: 'ArrowRight',
        });

        expect(onChange).not.toHaveBeenCalled();
    });
});
