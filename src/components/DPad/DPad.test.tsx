import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { DPad } from './DPad';
import { EDpadDirection, EDpadMode } from './DPad.types';

const PAD_LABEL: string = 'Direction';
const ACTIVE_POINTER_ID: number = 11;

const PAD_RECT: DOMRect = {
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    left: 0,
    top: 0,
    right: 200,
    bottom: 200,
    toJSON: (): Record<string, never> => ({}),
};

// jsdom does not define the pointer-capture methods; the pointer hook calls
// them on down and up. Define no-op stubs as configurable own properties so
// they can be removed after the suite.
function definePointerCaptureStubs(): void {
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
        configurable: true,
        value: (): void => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
        configurable: true,
        value: (): void => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
        configurable: true,
        value: (): boolean => true,
    });
}

function removePointerCaptureStubs(): void {
    delete (HTMLElement.prototype as Partial<HTMLElement>).setPointerCapture;
    delete (HTMLElement.prototype as Partial<HTMLElement>).releasePointerCapture;
    delete (HTMLElement.prototype as Partial<HTMLElement>).hasPointerCapture;
}

beforeEach((): void => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
        (): DOMRect => PAD_RECT,
    );
    definePointerCaptureStubs();
});

afterEach((): void => {
    vi.restoreAllMocks();
    removePointerCaptureStubs();
});

describe('DPad', () => {
    it('exposes a labelled group of direction buttons', () => {
        render(<DPad label={PAD_LABEL} mode={EDpadMode.EightWay} />);

        const group: HTMLElement = screen.getByRole('group', {
            name: PAD_LABEL,
        });
        expect(group).toBeInTheDocument();

        const buttons: HTMLElement[] = screen.getAllByRole('button');
        expect(buttons).toHaveLength(8);
    });

    it('renders only the four cardinals in FourWay mode', () => {
        render(<DPad label={PAD_LABEL} mode={EDpadMode.FourWay} />);

        const buttons: HTMLElement[] = screen.getAllByRole('button');
        expect(buttons).toHaveLength(4);
        expect(
            screen.queryByRole('button', { name: 'Up and left' }),
        ).not.toBeInTheDocument();
    });

    it('momentarily presses a direction on Enter and releases on key up', async () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.FourWay}
                onDirectionChange={onDirectionChange}
            />,
        );

        const upButton: HTMLElement = screen.getByRole('button', { name: 'Up' });
        expect(upButton).toHaveAttribute('aria-pressed', 'false');

        upButton.focus();
        await user.keyboard('{Enter>}');
        expect(upButton).toHaveAttribute('aria-pressed', 'true');
        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.Up);

        await user.keyboard('{/Enter}');
        expect(upButton).toHaveAttribute('aria-pressed', 'false');
        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.None);
    });

    it('returns to None when focus leaves the group', async () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <>
                <DPad
                    label={PAD_LABEL}
                    mode={EDpadMode.FourWay}
                    onDirectionChange={onDirectionChange}
                />
                <button type="button">Outside</button>
            </>,
        );

        const rightButton: HTMLElement = screen.getByRole('button', {
            name: 'Right',
        });
        rightButton.focus();
        await user.keyboard('{Enter>}');
        expect(rightButton).toHaveAttribute('aria-pressed', 'true');

        const outside: HTMLElement = screen.getByRole('button', {
            name: 'Outside',
        });
        // Moving focus out of the group updates state via the blur handler;
        // wrap the focus change so React flushes the update before asserting.
        act((): void => {
            outside.focus();
        });
        expect(rightButton).toHaveAttribute('aria-pressed', 'false');
        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.None);
    });

    it('still resolves a direction from a pointer gesture on the group', () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                onDirectionChange={onDirectionChange}
            />,
        );

        const group: HTMLElement = screen.getByRole('group', {
            name: PAD_LABEL,
        });

        // Pointer to the right edge centre resolves to Right via the octant math.
        fireEvent.pointerDown(group, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 100,
        });

        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.Right);

        fireEvent.pointerUp(group, { pointerId: ACTIVE_POINTER_ID });
        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.None);
    });

    it('does not resolve a pointer gesture when disabled', () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                enabled={EEnabledState.Disabled}
                onDirectionChange={onDirectionChange}
            />,
        );

        const group: HTMLElement = screen.getByRole('group', {
            name: PAD_LABEL,
        });

        fireEvent.pointerDown(group, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 100,
        });

        expect(onDirectionChange).not.toHaveBeenCalled();
    });
});
