import { fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { RadioGroup } from './RadioGroup';
import { ERadioOrientation, type UiRadioItem } from './RadioGroup.types';

const ITEMS: readonly UiRadioItem[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
];

// Every render passes an accessible name: the AccessibleName union makes a
// nameless radiogroup a compile error, so the suite always supplies a name
// (label here, with a dedicated labelledBy variant test below).
const GROUP_LABEL: string = 'Time range';

describe('RadioGroup', (): void => {
    it('renders a radiogroup with one radio per item', (): void => {
        render(<RadioGroup items={ITEMS} value="day" label={GROUP_LABEL} />);

        expect(
            screen.getByRole('radiogroup', { name: GROUP_LABEL }),
        ).toBeInTheDocument();
        const radios: readonly HTMLElement[] = screen.getAllByRole('radio');
        expect(radios).toHaveLength(ITEMS.length);
    });

    it('wires label to aria-label on the radiogroup', (): void => {
        render(<RadioGroup items={ITEMS} value="day" label={GROUP_LABEL} />);

        expect(screen.getByRole('radiogroup')).toHaveAttribute(
            'aria-label',
            GROUP_LABEL,
        );
    });

    it('names the radiogroup through labelledBy when provided', (): void => {
        render(
            <>
                <span id="range-heading">Time range</span>
                <RadioGroup items={ITEMS} value="day" labelledBy="range-heading" />
            </>,
        );

        const group: HTMLElement = screen.getByRole('radiogroup', {
            name: 'Time range',
        });
        expect(group).toHaveAttribute('aria-labelledby', 'range-heading');
        expect(group).not.toHaveAttribute('aria-label');
    });

    it('tracks the controlled value through aria-checked', (): void => {
        render(<RadioGroup items={ITEMS} value="week" label={GROUP_LABEL} />);

        expect(
            screen.getByRole('radio', { name: 'Week', checked: true }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('radio', { name: 'Day', checked: false }),
        ).toBeInTheDocument();
    });

    it('applies roving tabindex with the selected radio focusable', (): void => {
        render(<RadioGroup items={ITEMS} value="week" label={GROUP_LABEL} />);

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
        render(<RadioGroup items={ITEMS} value="week" label={GROUP_LABEL} />);

        expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute(
            'data-state',
            'selected',
        );
        expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute(
            'data-state',
            'idle',
        );
    });

    it('falls back to the first radio for roving when the value matches no item', (): void => {
        render(<RadioGroup items={ITEMS} value="missing" label={GROUP_LABEL} />);

        // No item is checked, but the roving tabindex still has a valid target.
        expect(
            screen.queryByRole('radio', { checked: true }),
        ).not.toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute(
            'tabindex',
            '0',
        );
    });

    it('defaults orientation to vertical', (): void => {
        render(<RadioGroup items={ITEMS} value="day" label={GROUP_LABEL} />);

        expect(screen.getByRole('radiogroup')).toHaveAttribute(
            'aria-orientation',
            'vertical',
        );
    });

    it('sets aria-orientation to horizontal when requested', (): void => {
        render(
            <RadioGroup
                items={ITEMS}
                value="day"
                label={GROUP_LABEL}
                orientation={ERadioOrientation.Horizontal}
            />,
        );

        expect(screen.getByRole('radiogroup')).toHaveAttribute(
            'aria-orientation',
            'horizontal',
        );
    });

    it('applies the tone seed custom property to the group root', (): void => {
        render(
            <RadioGroup
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
            <RadioGroup
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

    it('selects the next radio on ArrowDown and ArrowRight in vertical orientation', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <RadioGroup
                items={ITEMS}
                value="day"
                label={GROUP_LABEL}
                onChange={onChange}
            />,
        );

        screen.getByRole('radio', { name: 'Day' }).focus();
        await user.keyboard('{ArrowDown}');
        expect(onChange).toHaveBeenLastCalledWith('week');

        // Both axes are accepted: ArrowRight also moves forward in vertical.
        await user.keyboard('{ArrowRight}');
        expect(onChange).toHaveBeenLastCalledWith('week');
    });

    it('selects the previous radio on ArrowUp and wraps from the first', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <RadioGroup
                items={ITEMS}
                value="day"
                label={GROUP_LABEL}
                onChange={onChange}
            />,
        );

        screen.getByRole('radio', { name: 'Day' }).focus();
        await user.keyboard('{ArrowUp}');

        expect(onChange).toHaveBeenCalledWith('month');
    });

    it('drives selection through ArrowLeft and ArrowRight in horizontal orientation', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <RadioGroup
                items={ITEMS}
                value="week"
                label={GROUP_LABEL}
                orientation={ERadioOrientation.Horizontal}
                onChange={onChange}
            />,
        );

        screen.getByRole('radio', { name: 'Week' }).focus();
        await user.keyboard('{ArrowRight}');
        expect(onChange).toHaveBeenLastCalledWith('month');

        await user.keyboard('{ArrowLeft}');
        expect(onChange).toHaveBeenLastCalledWith('day');
    });

    it('jumps to the first and last radio on Home and End', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <RadioGroup
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

    it('marks a per-item disabled option and ignores clicks on it', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        const items: readonly UiRadioItem[] = [
            { id: 'day', label: 'Day' },
            { id: 'week', label: 'Week', disabled: true },
            { id: 'month', label: 'Month' },
        ];
        render(
            <RadioGroup
                items={items}
                value="day"
                label={GROUP_LABEL}
                onChange={onChange}
            />,
        );

        const weekRadio: HTMLElement = screen.getByRole('radio', { name: 'Week' });
        expect(weekRadio).toBeDisabled();
        expect(weekRadio).toHaveAttribute('aria-disabled', 'true');

        await user.click(weekRadio);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('skips a disabled middle option during roving navigation', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        const items: readonly UiRadioItem[] = [
            { id: 'day', label: 'Day' },
            { id: 'week', label: 'Week', disabled: true },
            { id: 'month', label: 'Month' },
        ];
        render(
            <RadioGroup
                items={items}
                value="day"
                label={GROUP_LABEL}
                onChange={onChange}
            />,
        );

        screen.getByRole('radio', { name: 'Day' }).focus();
        await user.keyboard('{ArrowDown}');

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('month');
    });

    it('places the roving entry on the first enabled option when earlier options are disabled', (): void => {
        const items: readonly UiRadioItem[] = [
            { id: 'day', label: 'Day', disabled: true },
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
        ];
        render(<RadioGroup items={items} value="missing" label={GROUP_LABEL} />);

        expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute(
            'tabindex',
            '0',
        );
        expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
    });

    it('disables every radio and ignores clicks when group-disabled', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <RadioGroup
                items={ITEMS}
                value="day"
                label={GROUP_LABEL}
                onChange={onChange}
                enabled={EEnabledState.Disabled}
            />,
        );

        for (const radio of screen.getAllByRole('radio')) {
            expect(radio).toBeDisabled();
        }

        await user.click(screen.getByRole('radio', { name: 'Week' }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('does not change on keyboard navigation when group-disabled', (): void => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        render(
            <RadioGroup
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
            key: 'ArrowDown',
        });

        expect(onChange).not.toHaveBeenCalled();
    });
});
