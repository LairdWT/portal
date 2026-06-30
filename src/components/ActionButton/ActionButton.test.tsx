import { fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { ActionButton } from './ActionButton';
import { EBevelCorners } from './ActionButton.types';

const BUTTON_LABEL: string = 'A';

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

describe('ActionButton', (): void => {
    it('exposes an accessible button carrying the label', (): void => {
        render(<ActionButton label={BUTTON_LABEL} />);

        expect(
            screen.getByRole('button', { name: BUTTON_LABEL }),
        ).toBeInTheDocument();
    });

    it('fires onPress when enabled and pressed', async (): Promise<void> => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <ActionButton
                label={BUTTON_LABEL}
                enabled={EEnabledState.Enabled}
                onPress={onPress}
            />,
        );

        await user.click(screen.getByRole('button', { name: BUTTON_LABEL }));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('disables the button and suppresses onPress when disabled', async (): Promise<void> => {
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

    it('reflects the requested bevel corners as a data attribute', (): void => {
        render(
            <ActionButton
                label={BUTTON_LABEL}
                bevelCorners={EBevelCorners.TopRightBottomLeft}
            />,
        );

        expect(screen.getByRole('button', { name: BUTTON_LABEL })).toHaveAttribute(
            'data-bevel-corners',
            'top-right-bottom-left',
        );
    });

    it('defaults to all-squircle corners', (): void => {
        render(<ActionButton label={BUTTON_LABEL} />);

        expect(screen.getByRole('button', { name: BUTTON_LABEL })).toHaveAttribute(
            'data-bevel-corners',
            'none',
        );
    });

    it('ignores a secondary-button press when primaryButtonOnly is set', (): void => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        render(
            <ActionButton
                label={BUTTON_LABEL}
                enabled={EEnabledState.Enabled}
                onPress={onPress}
                primaryButtonOnly
            />,
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
            <ActionButton
                label={BUTTON_LABEL}
                enabled={EEnabledState.Enabled}
                onPress={onPress}
            />,
        );

        fireEvent.pointerDown(screen.getByRole('button', { name: BUTTON_LABEL }), {
            pointerId: 1,
            button: 2,
        });

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
