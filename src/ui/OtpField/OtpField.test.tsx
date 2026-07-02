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
import { OtpField } from './OtpField';
import { EOtpFieldMode } from './OtpField.types';

// Controlled harness so typing and paste flow through real state updates.
function OtpHarness({
    onComplete,
    mode,
    length,
}: Readonly<{
    onComplete?: (value: string) => void;
    mode?: EOtpFieldMode;
    length?: number;
}>): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('');
    return (
        <OtpField
            label="Access code"
            value={value}
            onValueChange={setValue}
            onComplete={onComplete}
            mode={mode}
            length={length}
        />
    );
}

describe('OtpField', (): void => {
    it('renders one cell per position and a labelled hidden input', (): void => {
        const view: { container: HTMLElement } = render(
            <OtpField label="Access code" value="12" length={4} />,
        );
        expect(screen.getByLabelText('Access code')).toBeInTheDocument();
        const cells: NodeListOf<Element> =
            view.container.querySelectorAll('[data-filled]');
        expect(cells).toHaveLength(4);
        expect(cells[0]?.textContent).toBe('1');
        expect(cells[1]?.textContent).toBe('2');
        expect(cells[2]?.getAttribute('data-active')).toBe('true');
    });

    it('strips non-digits in numeric mode', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<OtpHarness length={6} />);
        const input: HTMLElement = screen.getByLabelText('Access code');
        await user.click(input);
        await user.paste('1a2b3c');
        expect(input).toHaveValue('123');
    });

    it('splits a pasted code with whitespace and fires onComplete once full', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onComplete: Mock = vi.fn();
        render(<OtpHarness length={6} onComplete={onComplete} />);
        const input: HTMLElement = screen.getByLabelText('Access code');
        await user.click(input);
        await user.paste('123 456');
        expect(input).toHaveValue('123456');
        expect(onComplete).toHaveBeenCalledWith('123456');
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('accepts letters in text mode', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<OtpHarness length={4} mode={EOtpFieldMode.Text} />);
        const input: HTMLElement = screen.getByLabelText('Access code');
        await user.click(input);
        await user.paste('AB12');
        expect(input).toHaveValue('AB12');
    });

    it('retreats on backspace through the native input', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<OtpHarness length={4} />);
        const input: HTMLElement = screen.getByLabelText('Access code');
        await user.click(input);
        await user.paste('12');
        await user.keyboard('{Backspace}');
        expect(input).toHaveValue('1');
    });

    it('marks the input invalid and described by the error message', (): void => {
        render(<OtpField label="Access code" value="" error="Code expired." />);
        const input: HTMLElement = screen.getByLabelText('Access code');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        const describedBy: string = input.getAttribute('aria-describedby') ?? '';
        expect(describedBy).toBe(screen.getByText('Code expired.').id);
    });

    it('disables the input from the enabled enum', (): void => {
        render(
            <OtpField
                label="Access code"
                value=""
                enabled={EEnabledState.Disabled}
            />,
        );
        expect(screen.getByLabelText('Access code')).toBeDisabled();
    });
});
