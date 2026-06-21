import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { TextField } from './TextField';
import { type TextFieldProps } from './TextField.types';

const FIELD_LABEL: string = 'Player name';

// A controlled host so userEvent.type drives a real, updating input value while
// still exercising the onValueChange contract.
function ControlledHost(props: TextFieldProps): ReturnType<typeof TextField> {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    function handleChange(next: string): void {
        setValue(next);
        props.onValueChange?.(next);
    }
    return <TextField {...props} value={value} onValueChange={handleChange} />;
}

describe('TextField', (): void => {
    it('renders the label associated with the input', (): void => {
        render(<TextField label={FIELD_LABEL} value="" />);

        const input: HTMLElement = screen.getByLabelText(FIELD_LABEL);
        expect(input).toBeInTheDocument();
        expect(input.tagName).toBe('INPUT');
    });

    it('calls onValueChange with the typed string', async (): Promise<void> => {
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <ControlledHost
                label={FIELD_LABEL}
                value=""
                onValueChange={onValueChange}
            />,
        );

        await user.type(screen.getByLabelText(FIELD_LABEL), 'Ada');

        expect(onValueChange).toHaveBeenCalledTimes(3);
        expect(onValueChange).toHaveBeenLastCalledWith('Ada');
    });

    it('associates the label via a generated id when no id is given', (): void => {
        render(<TextField label={FIELD_LABEL} value="" />);

        const input: HTMLElement = screen.getByLabelText(FIELD_LABEL);
        expect(input.id).not.toBe('');
    });

    it('marks the input invalid and describes it when error is set', (): void => {
        const errorText: string = 'Name is required.';
        render(<TextField label={FIELD_LABEL} value="" error={errorText} />);

        const input: HTMLElement = screen.getByLabelText(FIELD_LABEL);
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAccessibleDescription(errorText);
    });

    it('has no aria-invalid or description without an error', (): void => {
        render(<TextField label={FIELD_LABEL} value="" />);

        const input: HTMLElement = screen.getByLabelText(FIELD_LABEL);
        expect(input).not.toHaveAttribute('aria-invalid');
        expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('blocks editing when disabled', async (): Promise<void> => {
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <TextField
                label={FIELD_LABEL}
                value=""
                enabled={EEnabledState.Disabled}
                onValueChange={onValueChange}
            />,
        );

        const input: HTMLElement = screen.getByLabelText(FIELD_LABEL);
        expect(input).toBeDisabled();

        await user.type(input, 'Ada');
        expect(onValueChange).not.toHaveBeenCalled();
    });
});
