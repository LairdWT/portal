import { render, type RenderResult, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { Checkbox } from './Checkbox';

// Checkbox is controlled; tests that do not assert the report pass this inert
// handler so the controlled input never warns and the value is not advanced.
function noop(): void {
    // Intentionally empty: the controlled value is not advanced in these cases.
}

// Resolve the wrapping <label> root from the checkbox, narrowing the closest()
// Element | null result with a guard-first instanceof check (no `as` cast).
function rootOf(input: HTMLElement): HTMLElement {
    const root: Element | null = input.closest('label');
    if (!(root instanceof HTMLElement)) {
        throw new Error('expected a wrapping label root');
    }
    return root;
}

// Resolve the checkbox as a concrete HTMLInputElement (so `.indeterminate`, a DOM
// property, is readable) with a guard-first instanceof narrowing rather than a cast.
function checkboxInput(): HTMLInputElement {
    const input: HTMLElement = screen.getByRole('checkbox');
    if (!(input instanceof HTMLInputElement)) {
        throw new Error('expected an HTMLInputElement checkbox');
    }
    return input;
}

describe('Checkbox', (): void => {
    it('renders a checkbox named by the visible label', (): void => {
        render(<Checkbox checked={false} label="Accept" onChange={noop} />);

        expect(
            screen.getByRole('checkbox', { name: 'Accept' }),
        ).toBeInTheDocument();
    });

    it('names the checkbox through labelledBy with no visible label', (): void => {
        render(
            <>
                <span id="cb-label">Accept terms</span>
                <Checkbox checked={false} labelledBy="cb-label" onChange={noop} />
            </>,
        );

        const input: HTMLElement = screen.getByRole('checkbox', {
            name: 'Accept terms',
        });
        expect(input).toHaveAttribute('aria-labelledby', 'cb-label');
        // The naming text lives only in the external span, not duplicated inside
        // the wrapping label (the labelledBy arm renders no visible label).
        expect(rootOf(input)).not.toHaveTextContent('Accept terms');
    });

    it('reflects the controlled checked value', (): void => {
        const view: RenderResult = render(
            <Checkbox checked label="Accept" onChange={noop} />,
        );

        expect(screen.getByRole('checkbox')).toBeChecked();

        view.rerender(<Checkbox checked={false} label="Accept" onChange={noop} />);
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('sets the indeterminate DOM property via the ref effect', (): void => {
        const view: RenderResult = render(
            <Checkbox checked={false} indeterminate label="X" onChange={noop} />,
        );

        const input: HTMLInputElement = checkboxInput();
        expect(input).toBePartiallyChecked();
        expect(input.indeterminate).toBe(true);

        view.rerender(
            <Checkbox
                checked={false}
                indeterminate={false}
                label="X"
                onChange={noop}
            />,
        );
        expect(input.indeterminate).toBe(false);
    });

    it('keeps indeterminate independent of checked', (): void => {
        render(<Checkbox checked indeterminate label="X" onChange={noop} />);

        const input: HTMLInputElement = checkboxInput();
        expect(input).toBeChecked();
        expect(input).toBePartiallyChecked();
    });

    it('calls onChange with the next boolean on click', async (): Promise<void> => {
        const onChange: Mock<(checked: boolean) => void> =
            vi.fn<(checked: boolean) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Checkbox checked={false} label="Accept" onChange={onChange} />);

        await user.click(screen.getByRole('checkbox'));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('reports false on click when currently checked', async (): Promise<void> => {
        const onChange: Mock<(checked: boolean) => void> =
            vi.fn<(checked: boolean) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Checkbox checked label="Accept" onChange={onChange} />);

        await user.click(screen.getByRole('checkbox'));

        expect(onChange).toHaveBeenCalledWith(false);
    });

    it('toggles natively on Space', async (): Promise<void> => {
        const onChange: Mock<(checked: boolean) => void> =
            vi.fn<(checked: boolean) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Checkbox checked={false} label="Accept" onChange={onChange} />);

        const input: HTMLElement = screen.getByRole('checkbox');
        input.focus();
        await user.keyboard(' ');

        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('toggles when the visible label text is clicked', async (): Promise<void> => {
        const onChange: Mock<(checked: boolean) => void> =
            vi.fn<(checked: boolean) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Checkbox checked={false} label="Accept" onChange={onChange} />);

        await user.click(screen.getByText('Accept'));

        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('does not change when disabled', async (): Promise<void> => {
        const onChange: Mock<(checked: boolean) => void> =
            vi.fn<(checked: boolean) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Checkbox
                checked={false}
                label="Accept"
                enabled={EEnabledState.Disabled}
                onChange={onChange}
            />,
        );

        const input: HTMLElement = screen.getByRole('checkbox');
        expect(input).toBeDisabled();

        await user.click(input);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('forwards native form attributes', (): void => {
        render(
            <Checkbox
                checked={false}
                label="Accept"
                name="agree"
                value="yes"
                required
                onChange={noop}
            />,
        );

        const input: HTMLElement = screen.getByRole('checkbox');
        expect(input).toHaveAttribute('name', 'agree');
        expect(input).toHaveAttribute('value', 'yes');
        expect(input).toBeRequired();
    });

    it('applies the tone seed custom property to the root', (): void => {
        render(
            <Checkbox
                checked
                label="Accept"
                tone="oklch(0.7 0.18 25)"
                onChange={noop}
            />,
        );

        const root: HTMLElement = rootOf(screen.getByRole('checkbox'));
        expect(root.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.18 25)',
        );
    });
});
