import {
    fireEvent,
    render,
    renderHook,
    type RenderHookResult,
    type RenderResult,
} from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import {
    type DigitalPressBinding,
    type DigitalPressOptions,
    useDigitalPress,
} from './useDigitalPress';

const SURFACE_TEST_ID: string = 'digital-press-button';

type PressButtonProps = Readonly<{ options: DigitalPressOptions }>;

function PressButton({ options }: PressButtonProps): ReactElement {
    const binding: DigitalPressBinding = useDigitalPress(options);
    return createElement('button', {
        type: 'button',
        'data-testid': SURFACE_TEST_ID,
        onPointerDown: binding.onPointerDown,
        onPointerUp: binding.onPointerUp,
        onPointerCancel: binding.onPointerCancel,
    });
}

// Render the harness and stub setPointerCapture on the button instance, which
// the press hook calls inside its pointerdown handler (jsdom defines no real
// pointer capture).
function mount(options: DigitalPressOptions): {
    view: RenderResult;
    element: HTMLElement;
} {
    const view: RenderResult = render(createElement(PressButton, { options }));
    const element: HTMLElement = view.getByTestId(SURFACE_TEST_ID);
    element.setPointerCapture = vi.fn<(pointerId: number) => void>();
    return { view, element };
}

afterEach((): void => {
    vi.restoreAllMocks();
});

describe('useDigitalPress', (): void => {
    it('returns a referentially stable binding across re-renders with unchanged inputs', (): void => {
        const view: RenderHookResult<DigitalPressBinding, unknown> = renderHook(
            (): DigitalPressBinding =>
                useDigitalPress({ enabled: EEnabledState.Enabled }),
        );

        const first: DigitalPressBinding = view.result.current;
        view.rerender();
        const second: DigitalPressBinding = view.result.current;

        expect(second.onPointerDown).toBe(first.onPointerDown);
        expect(second.onPointerUp).toBe(first.onPointerUp);
        expect(second.onPointerCancel).toBe(first.onPointerCancel);
        expect(second).toBe(first);
    });

    it('ignores a secondary button when primaryButtonOnly is true', (): void => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        const { element }: { element: HTMLElement } = mount({
            enabled: EEnabledState.Enabled,
            onPress,
            primaryButtonOnly: true,
        });

        fireEvent.pointerDown(element, { pointerId: 1, button: 2 });

        expect(onPress).not.toHaveBeenCalled();
    });

    it('starts the press on a primary button when primaryButtonOnly is true', (): void => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        const { element }: { element: HTMLElement } = mount({
            enabled: EEnabledState.Enabled,
            onPress,
            primaryButtonOnly: true,
        });

        fireEvent.pointerDown(element, { pointerId: 1, button: 0 });

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('starts the press on any button by default (primaryButtonOnly unset)', (): void => {
        const onPress: Mock<() => void> = vi.fn<() => void>();
        const { element }: { element: HTMLElement } = mount({
            enabled: EEnabledState.Enabled,
            onPress,
        });

        fireEvent.pointerDown(element, { pointerId: 1, button: 2 });

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    // A press is owned by the pointer that started it: a second finger on the
    // same control must neither double-start the press nor end the first
    // finger's hold when it lifts.
    describe('single active pointer', (): void => {
        it('ignores a second pointerdown while a press is held', (): void => {
            const onPress: Mock<() => void> = vi.fn<() => void>();
            const { element }: { element: HTMLElement } = mount({
                enabled: EEnabledState.Enabled,
                onPress,
            });

            fireEvent.pointerDown(element, { pointerId: 1, button: 0 });
            fireEvent.pointerDown(element, { pointerId: 2, button: 0 });

            expect(onPress).toHaveBeenCalledTimes(1);
        });

        it('releases only for the owning pointer', (): void => {
            const onPress: Mock<() => void> = vi.fn<() => void>();
            const onRelease: Mock<() => void> = vi.fn<() => void>();
            const { element }: { element: HTMLElement } = mount({
                enabled: EEnabledState.Enabled,
                onPress,
                onRelease,
            });

            fireEvent.pointerDown(element, { pointerId: 1, button: 0 });
            fireEvent.pointerDown(element, { pointerId: 2, button: 0 });

            // The non-owning finger lifting must not end the held press.
            fireEvent.pointerUp(element, { pointerId: 2 });
            expect(onRelease).not.toHaveBeenCalled();

            fireEvent.pointerUp(element, { pointerId: 1 });
            expect(onRelease).toHaveBeenCalledTimes(1);
        });

        it('scopes pointercancel to the owning pointer', (): void => {
            const onRelease: Mock<() => void> = vi.fn<() => void>();
            const { element }: { element: HTMLElement } = mount({
                enabled: EEnabledState.Enabled,
                onRelease,
            });

            fireEvent.pointerDown(element, { pointerId: 1, button: 0 });
            fireEvent.pointerCancel(element, { pointerId: 2 });
            expect(onRelease).not.toHaveBeenCalled();

            fireEvent.pointerCancel(element, { pointerId: 1 });
            expect(onRelease).toHaveBeenCalledTimes(1);
        });

        it('allows a fresh press after the owning pointer releases', (): void => {
            const onPress: Mock<() => void> = vi.fn<() => void>();
            const { element }: { element: HTMLElement } = mount({
                enabled: EEnabledState.Enabled,
                onPress,
            });

            fireEvent.pointerDown(element, { pointerId: 1, button: 0 });
            fireEvent.pointerUp(element, { pointerId: 1 });
            fireEvent.pointerDown(element, { pointerId: 2, button: 0 });

            expect(onPress).toHaveBeenCalledTimes(2);
        });

        it('emits no phantom release without a held press', (): void => {
            const onRelease: Mock<() => void> = vi.fn<() => void>();
            const { element }: { element: HTMLElement } = mount({
                enabled: EEnabledState.Enabled,
                onRelease,
            });

            fireEvent.pointerUp(element, { pointerId: 1 });

            expect(onRelease).not.toHaveBeenCalled();
        });
    });
});
