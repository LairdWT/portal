import { fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { ColorPicker } from './ColorPicker';
import { type ColorPickerProps } from './ColorPicker.types';

const PICKER_LABEL: string = 'Brush color';

// A controlled host so a real, updating value drives the children while still
// exercising the onValueChange contract (the TextField test pattern).
function ControlledHost(props: ColorPickerProps): ReturnType<typeof ColorPicker> {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    function handleChange(next: string): void {
        setValue(next);
        props.onValueChange?.(next);
    }
    return <ColorPicker {...props} value={value} onValueChange={handleChange} />;
}

describe('ColorPicker', (): void => {
    it('renders a group named by the label', (): void => {
        render(<ColorPicker label={PICKER_LABEL} value="#102030" />);

        expect(
            screen.getByRole('group', { name: PICKER_LABEL }),
        ).toBeInTheDocument();
    });

    it('announces the swatch with the current hex', (): void => {
        render(<ColorPicker label={PICKER_LABEL} value="#102030" />);

        const swatch: HTMLElement = screen.getByRole('img');
        expect(swatch.getAttribute('aria-label')).toContain('#102030');
    });

    it('renders a neutral fallback swatch for an unparseable value', (): void => {
        render(<ColorPicker label={PICKER_LABEL} value="not-a-color" />);

        const swatch: HTMLElement = screen.getByRole('img');
        expect(swatch.getAttribute('aria-label')).toContain('#000000');
    });

    it('renders red/green/blue channels and no alpha slider by default', (): void => {
        render(<ColorPicker label={PICKER_LABEL} value="#102030" />);

        expect(screen.getByLabelText('Red')).toBeInTheDocument();
        expect(screen.getByLabelText('Green')).toBeInTheDocument();
        expect(screen.getByLabelText('Blue')).toBeInTheDocument();
        expect(screen.queryByLabelText('Alpha')).not.toBeInTheDocument();
    });

    it('renders an alpha channel when alpha is enabled', (): void => {
        render(<ColorPicker label={PICKER_LABEL} value="#102030FF" alpha />);

        expect(screen.getByLabelText('Alpha')).toBeInTheDocument();
    });

    it('emits the new hex and updates the swatch when a channel changes', (): void => {
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <ControlledHost
                label={PICKER_LABEL}
                value="#102030"
                onValueChange={onValueChange}
            />,
        );

        fireEvent.change(screen.getByLabelText('Red'), {
            target: { value: '255' },
        });

        expect(onValueChange).toHaveBeenLastCalledWith('#FF2030');
        expect(screen.getByRole('img').getAttribute('aria-label')).toContain(
            '#FF2030',
        );
    });

    it('switches to HSV mode and converts on a hue change', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <ControlledHost
                label={PICKER_LABEL}
                value="#FF0000"
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('radio', { name: 'HSV' }));
        const hue: HTMLElement = screen.getByLabelText('Hue');
        expect(hue).toBeInTheDocument();

        fireEvent.change(hue, { target: { value: '120' } });
        expect(onValueChange).toHaveBeenLastCalledWith('#00FF00');
    });

    it('shows the canonical hex in Hex mode and normalizes valid input', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <ControlledHost
                label={PICKER_LABEL}
                value="#102030"
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('radio', { name: 'Hex' }));
        const hex: HTMLElement = screen.getByLabelText('Hex');
        expect(hex).toHaveValue('#102030');

        await user.clear(hex);
        await user.type(hex, 'abcdef');
        expect(onValueChange).toHaveBeenLastCalledWith('#ABCDEF');
    });

    it('rejects invalid hex safely without emitting and surfaces the error', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <ControlledHost
                label={PICKER_LABEL}
                value="#102030"
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('radio', { name: 'Hex' }));
        const hex: HTMLElement = screen.getByLabelText('Hex');

        await user.clear(hex);
        await user.type(hex, 'zz');
        expect(hex).toHaveAttribute('aria-invalid', 'true');
        expect(
            screen.getByText('Enter 3, 4, 6, or 8 hex digits.'),
        ).toBeInTheDocument();

        await user.clear(hex);
        await user.type(hex, 'gggggg');
        expect(hex).toHaveAttribute('aria-invalid', 'true');
        expect(
            screen.getByText('Use only the digits 0-9 and A-F.'),
        ).toBeInTheDocument();

        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('resets the hex field to the canonical value on blur', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<ControlledHost label={PICKER_LABEL} value="#102030" />);

        await user.click(screen.getByRole('radio', { name: 'Hex' }));
        const hex: HTMLElement = screen.getByLabelText('Hex');

        await user.clear(hex);
        await user.type(hex, 'zz');
        expect(hex).toHaveValue('zz');

        fireEvent.focusOut(hex);
        expect(hex).toHaveValue('#102030');
    });

    it('maps an alpha percent to the correct byte', (): void => {
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <ControlledHost
                label={PICKER_LABEL}
                value="#FF0000FF"
                alpha
                onValueChange={onValueChange}
            />,
        );

        fireEvent.change(screen.getByLabelText('Alpha'), {
            target: { value: '50' },
        });

        expect(onValueChange).toHaveBeenLastCalledWith('#FF000080');
    });

    it('disables every child control when disabled', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <ColorPicker
                label={PICKER_LABEL}
                value="#102030"
                enabled={EEnabledState.Disabled}
                onValueChange={onValueChange}
            />,
        );

        expect(screen.getByLabelText('Red')).toBeDisabled();
        expect(screen.getByRole('radio', { name: 'RGB' })).toBeDisabled();

        await user.click(screen.getByRole('radio', { name: 'HSV' }));
        expect(onValueChange).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('Hue')).not.toBeInTheDocument();
    });

    it('applies the tone seed and a neutral status to the root', (): void => {
        render(
            <ColorPicker
                label={PICKER_LABEL}
                value="#102030"
                tone="oklch(0.7 0.18 25)"
            />,
        );

        const group: HTMLElement = screen.getByRole('group');
        expect(group.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.18 25)',
        );
        expect(group).toHaveAttribute('data-status', 'none');
    });

    it('switches mode with the radiogroup arrow keys', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<ColorPicker label={PICKER_LABEL} value="#102030" />);

        screen.getByRole('radio', { name: 'RGB' }).focus();
        await user.keyboard('{ArrowRight}');

        expect(screen.getByLabelText('Hue')).toBeInTheDocument();
    });

    // E1: the numeric channel value is shown on screen (the input's display value
    // IS the readout) and does not collide with the slider's accessible name.
    it('shows a numeric input beside each channel when channelInputs is set', (): void => {
        render(<ColorPicker label={PICKER_LABEL} value="#102030" channelInputs />);

        expect(screen.getByLabelText('Red')).toBeInTheDocument();
        expect(screen.getByLabelText('Red value')).toHaveValue('16');
        expect(screen.getByLabelText('Green value')).toHaveValue('32');
        expect(screen.getByLabelText('Blue value')).toHaveValue('48');
    });

    it('renders no channel inputs by default', (): void => {
        render(<ColorPicker label={PICKER_LABEL} value="#102030" />);

        expect(screen.queryByLabelText('Red value')).not.toBeInTheDocument();
    });

    // E2: the numeric input writes through the same controlled contract the
    // slider uses; clamps; rejects non-numeric without emitting; resyncs on blur.
    it('emits the new hex when a channel number is typed', (): void => {
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <ControlledHost
                label={PICKER_LABEL}
                value="#102030"
                channelInputs
                onValueChange={onValueChange}
            />,
        );

        fireEvent.change(screen.getByLabelText('Red value'), {
            target: { value: '255' },
        });

        expect(onValueChange).toHaveBeenLastCalledWith('#FF2030');
    });

    it('clamps an over-range channel number to the maximum', (): void => {
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <ControlledHost
                label={PICKER_LABEL}
                value="#102030"
                channelInputs
                onValueChange={onValueChange}
            />,
        );

        fireEvent.change(screen.getByLabelText('Red value'), {
            target: { value: '999' },
        });

        expect(onValueChange).toHaveBeenLastCalledWith('#FF2030');
    });

    it('rejects a non-numeric channel entry without emitting and marks it invalid', (): void => {
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <ControlledHost
                label={PICKER_LABEL}
                value="#102030"
                channelInputs
                onValueChange={onValueChange}
            />,
        );

        const redValue: HTMLElement = screen.getByLabelText('Red value');
        fireEvent.change(redValue, { target: { value: 'abc' } });

        expect(redValue).toHaveAttribute('aria-invalid', 'true');
        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('resyncs a channel input to the canonical value on blur', (): void => {
        render(
            <ControlledHost label={PICKER_LABEL} value="#102030" channelInputs />,
        );

        const redValue: HTMLElement = screen.getByLabelText('Red value');
        fireEvent.change(redValue, { target: { value: 'abc' } });
        expect(redValue).toHaveValue('abc');

        fireEvent.blur(redValue);
        expect(redValue).toHaveValue('16');
    });

    it('disables the channel inputs when the picker is disabled', (): void => {
        render(
            <ColorPicker
                label={PICKER_LABEL}
                value="#102030"
                channelInputs
                enabled={EEnabledState.Disabled}
            />,
        );

        expect(screen.getByLabelText('Red value')).toBeDisabled();
    });

    // E3: hex shorthand (#RGB) is accepted and normalized to the canonical hex.
    it('accepts hex shorthand and normalizes it', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <ControlledHost
                label={PICKER_LABEL}
                value="#102030"
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('radio', { name: 'Hex' }));
        const hex: HTMLElement = screen.getByLabelText('Hex');

        await user.clear(hex);
        await user.type(hex, 'fff');
        expect(onValueChange).toHaveBeenLastCalledWith('#FFFFFF');
    });
});
