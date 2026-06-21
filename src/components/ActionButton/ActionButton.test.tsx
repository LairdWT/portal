import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { ActionButton } from './ActionButton';

const BUTTON_LABEL: string = 'Fire';

// jsdom does not define the pointer-capture methods; the press primitive calls
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

describe('ActionButton', () => {
    it('exposes an accessible button carrying the label', () => {
        render(<ActionButton label={BUTTON_LABEL} />);

        const button: HTMLElement = screen.getByRole('button', {
            name: BUTTON_LABEL,
        });

        expect(button).toBeInTheDocument();
    });

    it('fires onPress when enabled and pressed', async () => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <ActionButton
                label={BUTTON_LABEL}
                enabled={EEnabledState.Enabled}
                onPress={onPress}
            />,
        );

        const button: HTMLElement = screen.getByRole('button', {
            name: BUTTON_LABEL,
        });
        await user.click(button);

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('disables the button and suppresses onPress when disabled', async () => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <ActionButton
                label={BUTTON_LABEL}
                enabled={EEnabledState.Disabled}
                onPress={onPress}
            />,
        );

        const button: HTMLElement = screen.getByRole('button', {
            name: BUTTON_LABEL,
        });

        expect(button).toBeDisabled();

        await user.click(button);

        expect(onPress).not.toHaveBeenCalled();
    });
});
