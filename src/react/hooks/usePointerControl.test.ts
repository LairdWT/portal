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

type CaptureStubs = Readonly<{
    setPointerCapture: Mock<(pointerId: number) => void>;
    releasePointerCapture: Mock<(pointerId: number) => void>;
    hasPointerCapture: Mock<(pointerId: number) => boolean>;
}>;

function mount(options: PointerControlOptions): {
    view: RenderResult;
    element: HTMLElement;
    stubs: CaptureStubs;
} {
    const view: RenderResult = render(createElement(Surface, { options }));
    const element: HTMLElement = view.getByTestId(SURFACE_TEST_ID);
    const stubs: CaptureStubs = {
        setPointerCapture: vi.fn<(pointerId: number) => void>(),
        releasePointerCapture: vi.fn<(pointerId: number) => void>(),
        hasPointerCapture: vi.fn<(pointerId: number) => boolean>(
            (): boolean => true,
        ),
    };
    element.setPointerCapture = stubs.setPointerCapture;
    element.releasePointerCapture = stubs.releasePointerCapture;
    element.hasPointerCapture = stubs.hasPointerCapture;
    element.getBoundingClientRect = vi.fn((): DOMRect => BOUNDS);
    return { view, element, stubs };
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

describe('usePointerControl unmount capture release', (): void => {
    it('releases a still-held capture on unmount mid-gesture', (): void => {
        const {
            view,
            element,
            stubs,
        }: { view: RenderResult; element: HTMLElement; stubs: CaptureStubs } =
            mount({
                onValue: vi.fn<(value: { x: number; y: number }) => void>(),
            });

        fireEvent.pointerDown(element, { pointerId: 5, button: 0 });
        expect(stubs.setPointerCapture).toHaveBeenCalledWith(5);

        // No pointerup/pointercancel arrives; the component unmounts mid-gesture.
        view.unmount();

        expect(stubs.releasePointerCapture).toHaveBeenCalledWith(5);
    });

    it('does not release when no gesture is active at unmount', (): void => {
        const {
            view,
            stubs,
        }: { view: RenderResult; element: HTMLElement; stubs: CaptureStubs } =
            mount({
                onValue: vi.fn<(value: { x: number; y: number }) => void>(),
            });

        view.unmount();

        expect(stubs.releasePointerCapture).not.toHaveBeenCalled();
    });
});
