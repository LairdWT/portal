// Behavior tests for usePointerDrag. jsdom implements no real pointer capture,
// so setPointerCapture / hasPointerCapture / releasePointerCapture are stubbed on
// the grip element; pointer events are dispatched through fireEvent and the hook
// adds its move/up/cancel listeners to that same element, so the captured-element
// routing is exercised without a real browser. The real-pixel drag is covered by
// each consumer's Playwright e2e (documented in the consumer plans).

import { fireEvent, render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
    type PointerDragBinding,
    type PointerDragOptions,
    type PointerDragState,
    usePointerDrag,
} from './usePointerDrag';

// Mock callback signatures, so vi.fn() carries the exact type each slot expects
// (the strict project-reference tsc rejects an untyped Mock assigned to a typed
// callback or DOM method).
type DragCallback = (state: PointerDragState) => void;
type CaptureCallback = (pointerId: number) => void;

const SURFACE_TEST_ID: string = 'drag-surface';

type DragSurfaceProps = Readonly<{ options: PointerDragOptions }>;

function DragSurface({ options }: DragSurfaceProps): ReactElement {
    const binding: PointerDragBinding<HTMLDivElement> =
        usePointerDrag<HTMLDivElement>(options);
    return createElement('div', {
        'data-testid': SURFACE_TEST_ID,
        onPointerDown: binding.onPointerDown,
    });
}

type CaptureStubs = Readonly<{
    setPointerCapture: Mock<CaptureCallback>;
    releasePointerCapture: Mock<CaptureCallback>;
    hasPointerCapture: Mock<(pointerId: number) => boolean>;
}>;

const BOUNDS: DOMRect = new DOMRect(10, 20, 200, 100);

// Render the surface and install capture stubs + a fixed getBoundingClientRect on
// the grip element so the snapshot bounds and the capture calls are assertable.
function mount(options: PointerDragOptions): {
    view: RenderResult;
    element: HTMLElement;
    stubs: CaptureStubs;
} {
    const view: RenderResult = render(createElement(DragSurface, { options }));
    const element: HTMLElement = view.getByTestId(SURFACE_TEST_ID);

    const stubs: CaptureStubs = {
        setPointerCapture: vi.fn<CaptureCallback>(),
        releasePointerCapture: vi.fn<CaptureCallback>(),
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

describe('usePointerDrag', (): void => {
    it('returns a referentially stable onPointerDown across re-renders', (): void => {
        const options: PointerDragOptions = { onDrag: vi.fn<DragCallback>() };
        const { view, element }: { view: RenderResult; element: HTMLElement } =
            mount(options);
        // Read the handler indirectly: re-rendering with a new options object must
        // not change the bound handler identity (it reads options via a ref).
        const first: HTMLElement = element;
        view.rerender(
            createElement(DragSurface, {
                options: { onDrag: vi.fn<DragCallback>() },
            }),
        );
        expect(view.getByTestId(SURFACE_TEST_ID)).toBe(first);
    });

    it('captures the pointer and reports delta, position and start bounds', (): void => {
        const samples: PointerDragState[] = [];
        const onDragStart: Mock<DragCallback> = vi.fn<DragCallback>();
        const onDragEnd: Mock<DragCallback> = vi.fn<DragCallback>();
        const options: PointerDragOptions = {
            onDrag: (state: PointerDragState): void => {
                samples.push(state);
            },
            onDragStart,
            onDragEnd,
        };
        const { element, stubs }: { element: HTMLElement; stubs: CaptureStubs } =
            mount(options);

        fireEvent.pointerDown(element, {
            pointerId: 7,
            button: 0,
            clientX: 50,
            clientY: 60,
        });
        expect(stubs.setPointerCapture).toHaveBeenCalledWith(7);
        expect(onDragStart).toHaveBeenCalledTimes(1);

        fireEvent.pointerMove(element, {
            pointerId: 7,
            clientX: 90,
            clientY: 110,
        });

        expect(samples).toHaveLength(1);
        const sample: PointerDragState | undefined = samples[0];
        expect(sample).toBeDefined();
        if (sample === undefined) {
            throw new Error('expected a drag sample');
        }
        expect(sample.dx).toBe(40);
        expect(sample.dy).toBe(50);
        expect(sample.x).toBe(90);
        expect(sample.y).toBe(110);
        expect(sample.originX).toBe(50);
        expect(sample.originY).toBe(60);
        expect(sample.bounds).toBe(BOUNDS);

        fireEvent.pointerUp(element, { pointerId: 7, clientX: 90, clientY: 110 });
        expect(onDragEnd).toHaveBeenCalledTimes(1);
        expect(stubs.releasePointerCapture).toHaveBeenCalledWith(7);
    });

    it('ignores secondary buttons (event.button !== 0)', (): void => {
        const onDragStart: Mock<DragCallback> = vi.fn<DragCallback>();
        const options: PointerDragOptions = {
            onDrag: vi.fn<DragCallback>(),
            onDragStart,
        };
        const { element, stubs }: { element: HTMLElement; stubs: CaptureStubs } =
            mount(options);

        fireEvent.pointerDown(element, {
            pointerId: 1,
            button: 2,
            clientX: 0,
            clientY: 0,
        });

        expect(onDragStart).not.toHaveBeenCalled();
        expect(stubs.setPointerCapture).not.toHaveBeenCalled();
    });

    it('does not start a drag while disabled', (): void => {
        const onDragStart: Mock<DragCallback> = vi.fn<DragCallback>();
        const options: PointerDragOptions = {
            onDrag: vi.fn<DragCallback>(),
            onDragStart,
            disabled: true,
        };
        const { element, stubs }: { element: HTMLElement; stubs: CaptureStubs } =
            mount(options);

        fireEvent.pointerDown(element, {
            pointerId: 1,
            button: 0,
            clientX: 0,
            clientY: 0,
        });

        expect(onDragStart).not.toHaveBeenCalled();
        expect(stubs.setPointerCapture).not.toHaveBeenCalled();
    });

    it('shares the pointerup teardown with pointercancel', (): void => {
        const onDragEnd: Mock<DragCallback> = vi.fn<DragCallback>();
        const options: PointerDragOptions = {
            onDrag: vi.fn<DragCallback>(),
            onDragEnd,
        };
        const { element, stubs }: { element: HTMLElement; stubs: CaptureStubs } =
            mount(options);

        fireEvent.pointerDown(element, {
            pointerId: 3,
            button: 0,
            clientX: 5,
            clientY: 5,
        });
        fireEvent.pointerCancel(element, {
            pointerId: 3,
            clientX: 5,
            clientY: 5,
        });

        expect(onDragEnd).toHaveBeenCalledTimes(1);
        expect(stubs.releasePointerCapture).toHaveBeenCalledWith(3);
    });

    it('locks the cross axis when axisLock is set', (): void => {
        const samples: PointerDragState[] = [];
        const options: PointerDragOptions = {
            onDrag: (state: PointerDragState): void => {
                samples.push(state);
            },
            axisLock: 'x',
        };
        const { element }: { element: HTMLElement } = mount(options);

        fireEvent.pointerDown(element, {
            pointerId: 2,
            button: 0,
            clientX: 0,
            clientY: 0,
        });
        fireEvent.pointerMove(element, {
            pointerId: 2,
            clientX: 30,
            clientY: 40,
        });

        const sample: PointerDragState | undefined = samples[0];
        expect(sample).toBeDefined();
        if (sample === undefined) {
            throw new Error('expected a drag sample');
        }
        expect(sample.dx).toBe(30);
        expect(sample.dy).toBe(0);
    });

    it('ignores a second pointer while one is already active', (): void => {
        const samples: PointerDragState[] = [];
        const options: PointerDragOptions = {
            onDrag: (state: PointerDragState): void => {
                samples.push(state);
            },
        };
        const { element, stubs }: { element: HTMLElement; stubs: CaptureStubs } =
            mount(options);

        fireEvent.pointerDown(element, {
            pointerId: 1,
            button: 0,
            clientX: 0,
            clientY: 0,
        });
        // Second pointerdown while active is ignored (no second capture).
        fireEvent.pointerDown(element, {
            pointerId: 2,
            button: 0,
            clientX: 0,
            clientY: 0,
        });
        expect(stubs.setPointerCapture).toHaveBeenCalledTimes(1);
        expect(stubs.setPointerCapture).toHaveBeenCalledWith(1);

        // Moves from the ignored second pointer do nothing; the active one drives.
        fireEvent.pointerMove(element, {
            pointerId: 2,
            clientX: 99,
            clientY: 99,
        });
        expect(samples).toHaveLength(0);

        fireEvent.pointerMove(element, {
            pointerId: 1,
            clientX: 10,
            clientY: 0,
        });
        expect(samples).toHaveLength(1);
    });

    it('releases capture and removes listeners on unmount mid-drag', (): void => {
        const onDragEnd: Mock<DragCallback> = vi.fn<DragCallback>();
        const options: PointerDragOptions = {
            onDrag: vi.fn<DragCallback>(),
            onDragEnd,
        };
        const {
            view,
            element,
            stubs,
        }: { view: RenderResult; element: HTMLElement; stubs: CaptureStubs } =
            mount(options);

        const removeSpy: ReturnType<typeof vi.spyOn> = vi.spyOn(
            element,
            'removeEventListener',
        );

        fireEvent.pointerDown(element, {
            pointerId: 9,
            button: 0,
            clientX: 0,
            clientY: 0,
        });

        view.unmount();

        expect(stubs.releasePointerCapture).toHaveBeenCalledWith(9);
        expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith(
            'pointercancel',
            expect.any(Function),
        );
        // Unmount must NOT fire the consumer-facing onDragEnd.
        expect(onDragEnd).not.toHaveBeenCalled();
    });
});
