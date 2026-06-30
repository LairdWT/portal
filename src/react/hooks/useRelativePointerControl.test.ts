// Behavior tests for the optional primaryButtonOnly gate on
// useRelativePointerControl. jsdom implements no real pointer capture, so
// setPointerCapture is stubbed on the bound element. onActiveChange fires at
// gesture start, so it is the observable for whether a pointerdown started a
// gesture. The default-off path is asserted to remain unchanged.

import { fireEvent, render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
    type RelativePointerControlBinding,
    type RelativePointerControlOptions,
    useRelativePointerControl,
} from './useRelativePointerControl';

const SURFACE_TEST_ID: string = 'relative-pointer-control-surface';

type SurfaceProps = Readonly<{ options: RelativePointerControlOptions }>;

function Surface({ options }: SurfaceProps): ReactElement {
    const binding: RelativePointerControlBinding<HTMLDivElement> =
        useRelativePointerControl<HTMLDivElement>(options);
    return createElement('div', {
        ref: binding.ref,
        'data-testid': SURFACE_TEST_ID,
        onPointerDown: binding.onPointerDown,
    });
}

function mount(options: RelativePointerControlOptions): { element: HTMLElement } {
    const view: RenderResult = render(createElement(Surface, { options }));
    const element: HTMLElement = view.getByTestId(SURFACE_TEST_ID);
    element.setPointerCapture = vi.fn<(pointerId: number) => void>();
    return { element };
}

afterEach((): void => {
    vi.restoreAllMocks();
});

describe('useRelativePointerControl primaryButtonOnly gate', (): void => {
    it('ignores a secondary button when primaryButtonOnly is true', (): void => {
        const onActiveChange: Mock<(active: boolean) => void> =
            vi.fn<(active: boolean) => void>();
        const { element }: { element: HTMLElement } = mount({
            onDelta: vi.fn<(delta: { x: number; y: number }) => void>(),
            onActiveChange,
            primaryButtonOnly: true,
        });

        fireEvent.pointerDown(element, { pointerId: 1, button: 2 });

        expect(onActiveChange).not.toHaveBeenCalled();
    });

    it('starts the gesture on a primary button when primaryButtonOnly is true', (): void => {
        const onActiveChange: Mock<(active: boolean) => void> =
            vi.fn<(active: boolean) => void>();
        const { element }: { element: HTMLElement } = mount({
            onDelta: vi.fn<(delta: { x: number; y: number }) => void>(),
            onActiveChange,
            primaryButtonOnly: true,
        });

        fireEvent.pointerDown(element, { pointerId: 1, button: 0 });

        expect(onActiveChange).toHaveBeenCalledWith(true);
    });

    it('starts the gesture on any button by default (primaryButtonOnly unset)', (): void => {
        const onActiveChange: Mock<(active: boolean) => void> =
            vi.fn<(active: boolean) => void>();
        const { element }: { element: HTMLElement } = mount({
            onDelta: vi.fn<(delta: { x: number; y: number }) => void>(),
            onActiveChange,
        });

        fireEvent.pointerDown(element, { pointerId: 1, button: 2 });

        expect(onActiveChange).toHaveBeenCalledWith(true);
    });
});
