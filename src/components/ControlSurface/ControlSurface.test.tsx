import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EInputValueType, type InputSignal } from '../../input';
import { ControlSurface } from './ControlSurface';

const PRIMARY_LABEL: string = 'Fire';
const SECONDARY_LABEL: string = 'Jump';

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
    definePointerCaptureStubs();
});

afterEach((): void => {
    vi.restoreAllMocks();
    removePointerCaptureStubs();
});

describe('ControlSurface', () => {
    it('namespaces default preset descriptor ids per instance so two instances do not collide', async () => {
        const onSignal: Mock<(signal: InputSignal) => void> =
            vi.fn<(signal: InputSignal) => void>();
        const user: UserEvent = userEvent.setup();

        render(
            <>
                <ControlSurface
                    instanceId="player-one"
                    primaryLabel={PRIMARY_LABEL}
                    onSignal={onSignal}
                />
                <ControlSurface
                    instanceId="player-two"
                    primaryLabel={PRIMARY_LABEL}
                    onSignal={onSignal}
                />
            </>,
        );

        const primaryButtons: readonly HTMLElement[] = screen.getAllByRole(
            'button',
            { name: PRIMARY_LABEL },
        );
        expect(primaryButtons).toHaveLength(2);

        const firstButton: HTMLElement | undefined = primaryButtons[0];
        const secondButton: HTMLElement | undefined = primaryButtons[1];
        if (firstButton === undefined || secondButton === undefined) {
            throw new Error('Expected two primary action buttons.');
        }

        await user.click(firstButton);
        await user.click(secondButton);

        const emittedIds: readonly string[] = onSignal.mock.calls
            .map((call: [InputSignal]): InputSignal => call[0])
            .filter(
                (signal: InputSignal): boolean =>
                    signal.value.valueType === EInputValueType.Digital,
            )
            .map((signal: InputSignal): string => signal.descriptor.id);

        expect(emittedIds).toContain('player-one.primary');
        expect(emittedIds).toContain('player-two.primary');
        // BevelButton emits a press and a release per click (two signals sharing
        // one id), so assert the set of distinct ids rather than a count.
        expect(new Set<string>(emittedIds)).toEqual(
            new Set<string>(['player-one.primary', 'player-two.primary']),
        );
    });

    it('renders a supplied slot verbatim instead of the default control for that region', () => {
        render(
            <ControlSurface
                instanceId="slotted"
                primaryLabel={PRIMARY_LABEL}
                secondaryLabel={SECONDARY_LABEL}
                primarySlot={<button type="button">Custom primary</button>}
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Custom primary' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: PRIMARY_LABEL })).toBeNull();
        expect(
            screen.getByRole('button', { name: SECONDARY_LABEL }),
        ).toBeInTheDocument();
    });
});
