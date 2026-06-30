// Behavior tests for the optional primaryButtonOnly gate on usePointerControl.
// jsdom implements no real pointer capture, so setPointerCapture is stubbed on
// the bound element and getBoundingClientRect is fixed so a pointerdown can
// resolve a sample. The default-off path is asserted to remain unchanged.

import { fireEvent, render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
    type PointerControlBinding,
    type PointerControlOptions,
    usePointerControl,
} from './usePointerControl';

const SURFACE_TEST_ID: string = 'pointer-control-surface';

const BOUNDS: DOMRect = new DOMRect(0, 0, 200, 200);

type SurfaceProps = Readonly<{ options: PointerControlOptions }>;

function Surface({ options }: SurfaceProps): ReactElement {
    const binding: PointerControlBinding<HTMLDivElement> =
        usePointerControl<HTMLDivElement>(options);
    return createElement('div', {
        ref: binding.ref,
        'data-testid': SURFACE_TEST_ID,
        onPointerDown: binding.onPointerDown,
    });
}

function mount(options: PointerControlOptions): { element: HTMLElement } {
    const view: RenderResult = render(createElement(Surface, { options }));
    const element: HTMLElement = view.getByTestId(SURFACE_TEST_ID);
    element.setPointerCapture = vi.fn<(pointerId: number) => void>();
    element.getBoundingClientRect = vi.fn((): DOMRect => BOUNDS);
    return { element };
}

afterEach((): void => {
    vi.restoreAllMocks();
});

describe('usePointerControl primaryButtonOnly gate', (): void => {
    it('ignores a secondary button when primaryButtonOnly is true', (): void => {
        const onActiveChange: Mock<(active: boolean) => void> =
            vi.fn<(active: boolean) => void>();
        const { element }: { element: HTMLElement } = mount({
            onValue: vi.fn<(value: { x: number; y: number }) => void>(),
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
            onValue: vi.fn<(value: { x: number; y: number }) => void>(),
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
            onValue: vi.fn<(value: { x: number; y: number }) => void>(),
            onActiveChange,
        });

        fireEvent.pointerDown(element, { pointerId: 1, button: 2 });

        expect(onActiveChange).toHaveBeenCalledWith(true);
    });
});
