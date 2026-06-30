import { fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
    EInputInteraction,
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { EEnabledState } from '../../state/state';
import { BevelButton } from './BevelButton';

const BUTTON_LABEL: string = 'Fire';

const FIRE_DESCRIPTOR: InputDescriptor = {
    id: 'bevel-button-test',
    kind: EInputValueType.Digital,
    label: BUTTON_LABEL,
};

// jsdom does not define the pointer-capture methods; the press hook calls
// setPointerCapture inside its pointerdown handler. Define no-op stubs as
// configurable own properties so they can be removed after the suite.
function definePointerCaptureStubs(): void {
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
        configurable: true,
        value: (): void => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
        configurable: true,
        value: (): void => undefined,
    });
}

function removePointerCaptureStubs(): void {
    delete (HTMLElement.prototype as Partial<HTMLElement>).setPointerCapture;
    delete (HTMLElement.prototype as Partial<HTMLElement>).releasePointerCapture;
}

beforeEach((): void => {
    definePointerCaptureStubs();
});

afterEach((): void => {
    removePointerCaptureStubs();
});

describe('BevelButton', (): void => {
    it('exposes an accessible button carrying its children as the label', (): void => {
        render(<BevelButton>{BUTTON_LABEL}</BevelButton>);

        expect(
            screen.getByRole('button', { name: BUTTON_LABEL }),
        ).toBeInTheDocument();
    });

    it('fires onPress when enabled and pressed', async (): Promise<void> => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <BevelButton enabled={EEnabledState.Enabled} onPress={onPress}>
                {BUTTON_LABEL}
            </BevelButton>,
        );

        await user.click(screen.getByRole('button', { name: BUTTON_LABEL }));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('emits a typed Digital press and release signal via its descriptor', (): void => {
        const onSignal: Mock<(signal: InputSignal) => void> =
            vi.fn<(signal: InputSignal) => void>();
        render(
            <BevelButton
                enabled={EEnabledState.Enabled}
                descriptor={FIRE_DESCRIPTOR}
                onSignal={onSignal}
            >
                {BUTTON_LABEL}
            </BevelButton>,
        );

        const button: HTMLElement = screen.getByRole('button', {
            name: BUTTON_LABEL,
        });

        fireEvent.pointerDown(button, { pointerId: 1, button: 0 });
        expect(onSignal).toHaveBeenLastCalledWith(
            expect.objectContaining({
                descriptor: FIRE_DESCRIPTOR,
                interaction: EInputInteraction.Press,
                value: { valueType: EInputValueType.Digital, pressed: true },
            }),
        );

        fireEvent.pointerUp(button, { pointerId: 1 });
        expect(onSignal).toHaveBeenLastCalledWith(
            expect.objectContaining({
                descriptor: FIRE_DESCRIPTOR,
                interaction: EInputInteraction.Release,
                value: { valueType: EInputValueType.Digital, pressed: false },
            }),
        );
    });

    it('reflects the pressed state through the data-pressed attribute', (): void => {
        render(
            <BevelButton enabled={EEnabledState.Enabled}>
                {BUTTON_LABEL}
            </BevelButton>,
        );

        const button: HTMLElement = screen.getByRole('button', {
            name: BUTTON_LABEL,
        });
        expect(button).toHaveAttribute('data-pressed', 'released');

        fireEvent.pointerDown(button, { pointerId: 1, button: 0 });
        expect(button).toHaveAttribute('data-pressed', 'pressed');

        fireEvent.pointerUp(button, { pointerId: 1 });
        expect(button).toHaveAttribute('data-pressed', 'released');
    });

    it('disables the button and suppresses onPress when disabled', async (): Promise<void> => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <BevelButton enabled={EEnabledState.Disabled} onPress={onPress}>
                {BUTTON_LABEL}
            </BevelButton>,
        );

        const button: HTMLElement = screen.getByRole('button', {
            name: BUTTON_LABEL,
        });
        expect(button).toBeDisabled();

        await user.click(button);
        expect(onPress).not.toHaveBeenCalled();
    });

    it('ignores a secondary-button press when primaryButtonOnly is set', (): void => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        render(
            <BevelButton
                enabled={EEnabledState.Enabled}
                onPress={onPress}
                primaryButtonOnly
            >
                {BUTTON_LABEL}
            </BevelButton>,
        );

        fireEvent.pointerDown(screen.getByRole('button', { name: BUTTON_LABEL }), {
            pointerId: 1,
            button: 2,
        });

        expect(onPress).not.toHaveBeenCalled();
    });

    it('still presses on a secondary button by default (primaryButtonOnly unset)', (): void => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        render(
            <BevelButton enabled={EEnabledState.Enabled} onPress={onPress}>
                {BUTTON_LABEL}
            </BevelButton>,
        );

        fireEvent.pointerDown(screen.getByRole('button', { name: BUTTON_LABEL }), {
            pointerId: 1,
            button: 2,
        });

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
