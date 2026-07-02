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

type CaptureStubs = Readonly<{
    setPointerCapture: Mock<(pointerId: number) => void>;
    releasePointerCapture: Mock<(pointerId: number) => void>;
    hasPointerCapture: Mock<(pointerId: number) => boolean>;
}>;

function mount(options: RelativePointerControlOptions): {
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
    return { view, element, stubs };
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

describe('useRelativePointerControl unmount capture release', (): void => {
    it('releases a still-held capture on unmount mid-gesture', (): void => {
        const {
            view,
            element,
            stubs,
        }: { view: RenderResult; element: HTMLElement; stubs: CaptureStubs } =
            mount({
                onDelta: vi.fn<(delta: { x: number; y: number }) => void>(),
            });

        fireEvent.pointerDown(element, { pointerId: 8, button: 0 });
        expect(stubs.setPointerCapture).toHaveBeenCalledWith(8);

        // No pointerup/pointercancel arrives; the component unmounts mid-gesture.
        view.unmount();

        expect(stubs.releasePointerCapture).toHaveBeenCalledWith(8);
    });

    it('does not release when no gesture is active at unmount', (): void => {
        const {
            view,
            stubs,
        }: { view: RenderResult; element: HTMLElement; stubs: CaptureStubs } =
            mount({
                onDelta: vi.fn<(delta: { x: number; y: number }) => void>(),
            });

        view.unmount();

        expect(stubs.releasePointerCapture).not.toHaveBeenCalled();
    });
});
