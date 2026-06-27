import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { NumberStepper } from './NumberStepper';

// A controlled harness mirroring how a consumer wires the stepper to state, so a
// step that drives a key to its bound actually disables that key in the DOM.
function ControlledStepper({
    label,
    initialValue,
    min,
    max,
    step,
}: {
    readonly label: string;
    readonly initialValue: number;
    readonly min: number;
    readonly max: number;
    readonly step: number;
}): ReactElement {
    const [value, setValue]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(initialValue);
    return (
        <NumberStepper
            label={label}
            value={value}
            onChange={setValue}
            min={min}
            max={max}
            step={step}
        />
    );
}

describe('NumberStepper', (): void => {
    it('renders a spinbutton with the clamped value and bounds', (): void => {
        render(<NumberStepper label="Quantity" value={20} min={0} max={10} />);

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Quantity',
        });
        expect(spin).toHaveAttribute('aria-valuenow', '10');
        expect(spin).toHaveTextContent('10');
        // Without a formatter, valueText === aria-valuenow, so aria-valuetext is
        // omitted as redundant noise (AT renders valuetext INSTEAD of valuenow).
        expect(spin).not.toHaveAttribute('aria-valuetext');
        expect(spin).toHaveAttribute('aria-valuemin', '0');
        expect(spin).toHaveAttribute('aria-valuemax', '10');
    });

    it('omits aria-valuemin and aria-valuemax when unbounded', (): void => {
        render(<NumberStepper label="Quantity" value={5} />);

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Quantity',
        });
        expect(spin).toHaveAttribute('aria-valuenow', '5');
        expect(spin).not.toHaveAttribute('aria-valuemin');
        expect(spin).not.toHaveAttribute('aria-valuemax');
    });

    it('renders the step keys with descriptive accessible names', (): void => {
        render(<NumberStepper label="Quantity" value={5} />);

        expect(
            screen.getByRole('button', { name: 'Decrease Quantity' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Increase Quantity' }),
        ).toBeInTheDocument();
    });

    it('uses formatValue for the value text', (): void => {
        render(
            <NumberStepper
                label="Volume"
                value={3}
                formatValue={(value: number): string => `${String(value)}%`}
            />,
        );

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Volume',
        });
        expect(spin).toHaveAttribute('aria-valuetext', '3%');
        expect(spin).toHaveTextContent('3%');
    });

    it('reports value plus step when the increment key is clicked', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={5}
                step={2}
                onChange={onChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Increase Quantity' }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(7);
    });

    it('reports value minus step when the decrement key is clicked', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={5}
                step={2}
                onChange={onChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Decrease Quantity' }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(3);
    });

    it('disables the increment key and reports nothing at the maximum', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={10}
                min={0}
                max={10}
                onChange={onChange}
            />,
        );

        const increment: HTMLElement = screen.getByRole('button', {
            name: 'Increase Quantity',
        });
        expect(increment).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Decrease Quantity' }),
        ).toBeEnabled();

        await user.click(increment);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('disables the decrement key and reports nothing at the minimum', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={0}
                min={0}
                max={10}
                onChange={onChange}
            />,
        );

        const decrement: HTMLElement = screen.getByRole('button', {
            name: 'Decrease Quantity',
        });
        expect(decrement).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Increase Quantity' }),
        ).toBeEnabled();

        await user.click(decrement);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('steps with ArrowUp and ArrowDown by the step amount', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={5}
                step={3}
                min={0}
                max={100}
                onChange={onChange}
            />,
        );

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Quantity',
        });
        spin.focus();
        await user.keyboard('{ArrowUp}');
        expect(onChange).toHaveBeenLastCalledWith(8);

        await user.keyboard('{ArrowDown}');
        expect(onChange).toHaveBeenLastCalledWith(2);
    });

    it('steps with PageUp and PageDown by the page amount', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={50}
                step={1}
                pageStep={10}
                min={0}
                max={100}
                onChange={onChange}
            />,
        );

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Quantity',
        });
        spin.focus();
        await user.keyboard('{PageUp}');
        expect(onChange).toHaveBeenLastCalledWith(60);

        await user.keyboard('{PageDown}');
        expect(onChange).toHaveBeenLastCalledWith(40);
    });

    it('jumps to min and max with Home and End when bounded', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={5}
                min={0}
                max={10}
                onChange={onChange}
            />,
        );

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Quantity',
        });
        spin.focus();
        await user.keyboard('{End}');
        expect(onChange).toHaveBeenLastCalledWith(10);

        await user.keyboard('{Home}');
        expect(onChange).toHaveBeenLastCalledWith(0);
    });

    it('coerces a non-positive step to 1', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={5}
                step={0}
                onChange={onChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Increase Quantity' }));

        expect(onChange).toHaveBeenCalledWith(6);
    });

    it('saturates an overflowing step to the bound', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={5}
                min={0}
                max={10}
                step={Number.POSITIVE_INFINITY}
                onChange={onChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Increase Quantity' }));

        expect(onChange).toHaveBeenCalledWith(10);
        const reported: number | undefined = onChange.mock.calls[0]?.[0];
        expect(Number.isFinite(reported)).toBe(true);
    });

    it('is inert when disabled', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={5}
                enabled={EEnabledState.Disabled}
                onChange={onChange}
            />,
        );

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Quantity',
        });
        expect(spin).toHaveAttribute('tabindex', '-1');
        expect(spin).toHaveAttribute('aria-disabled', 'true');
        expect(
            screen.getByRole('button', { name: 'Increase Quantity' }),
        ).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Increase Quantity' }));
        spin.focus();
        await user.keyboard('{ArrowUp}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('applies the tone to the root and reflects the status', (): void => {
        const toneColor: string = 'rgb(0, 255, 0)';
        render(
            <NumberStepper
                label="Quantity"
                value={5}
                tone={toneColor}
                status={EUiStatus.Danger}
            />,
        );

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Quantity',
        });
        const root: HTMLElement | null = spin.parentElement;
        if (root === null) {
            throw new Error('NumberStepper root element was not found');
        }
        expect(root.style.getPropertyValue('--portal-tone')).toBe(toneColor);
        expect(root).toHaveAttribute('data-status', EUiStatus.Danger);
    });

    it('moves focus to the spinbutton when a key disables at its bound', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <ControlledStepper
                label="Quantity"
                initialValue={9}
                min={0}
                max={10}
                step={1}
            />,
        );

        const increment: HTMLElement = screen.getByRole('button', {
            name: 'Increase Quantity',
        });
        await user.click(increment);

        expect(increment).toBeDisabled();
        expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toHaveFocus();
    });

    it('announces read-only and disables the step keys when onChange is omitted', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<NumberStepper label="Quantity" value={5} min={0} max={10} />);

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Quantity',
        });
        expect(spin).toHaveAttribute('aria-readonly', 'true');
        expect(spin).not.toHaveAttribute('aria-disabled');

        const increment: HTMLElement = screen.getByRole('button', {
            name: 'Increase Quantity',
        });
        const decrement: HTMLElement = screen.getByRole('button', {
            name: 'Decrease Quantity',
        });
        expect(increment).toBeDisabled();
        expect(decrement).toBeDisabled();

        // Inert: a click on the disabled key and a key on the focused spinbutton
        // leave the displayed value untouched (there is no onChange to call).
        await user.click(increment);
        spin.focus();
        await user.keyboard('{ArrowUp}');
        expect(spin).toHaveTextContent('5');
    });

    it('ignores Home and End when the stepper is unbounded', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(<NumberStepper label="Quantity" value={5} onChange={onChange} />);

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Quantity',
        });
        expect(spin).not.toHaveAttribute('aria-valuemin');
        expect(spin).not.toHaveAttribute('aria-valuemax');

        spin.focus();
        await user.keyboard('{Home}');
        await user.keyboard('{End}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('defaults the page step to ten times the resolved step', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NumberStepper
                label="Quantity"
                value={50}
                step={2}
                min={0}
                max={1000}
                onChange={onChange}
            />,
        );

        const spin: HTMLElement = screen.getByRole('spinbutton', {
            name: 'Quantity',
        });
        spin.focus();
        await user.keyboard('{PageUp}');
        expect(onChange).toHaveBeenLastCalledWith(70);
    });
});
