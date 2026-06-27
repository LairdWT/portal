import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    FALLBACK_VIEWPORT_ROWS,
    OVERSCAN_DEFAULT,
    useVirtualWindow,
    type VirtualWindowOptions,
    type VirtualWindowState,
} from './useVirtualWindow';

// jsdom neither lays out nor implements ResizeObserver, so the measurement
// surface is stubbed: a controllable ResizeObserver mock, a queue-backed
// requestAnimationFrame the test flushes by hand, and a detached element whose
// clientHeight/scrollTop are defined so the windowing math has real inputs.

class MockResizeObserver {
    public static instances: MockResizeObserver[] = [];
    public observeCount: number = 0;
    public disconnected: boolean = false;
    public constructor() {
        MockResizeObserver.instances.push(this);
    }
    public observe(): void {
        this.observeCount += 1;
    }
    public unobserve(): void {
        // No-op: the hook only observes and disconnects.
    }
    public disconnect(): void {
        this.disconnected = true;
    }
}

let rafQueue: FrameRequestCallback[] = [];

function flushRaf(): void {
    const pending: FrameRequestCallback[] = rafQueue;
    rafQueue = [];
    for (const callback of pending) {
        callback(0);
    }
}

type ScrollHarness = Readonly<{
    element: HTMLDivElement;
    setClientHeight: (next: number) => void;
    setScrollTop: (next: number) => void;
}>;

function createScrollHarness(clientHeight: number): ScrollHarness {
    const element: HTMLDivElement = document.createElement('div');
    let clientHeightValue: number = clientHeight;
    let scrollTopValue: number = 0;
    Object.defineProperty(element, 'clientHeight', {
        configurable: true,
        get: (): number => clientHeightValue,
    });
    Object.defineProperty(element, 'scrollTop', {
        configurable: true,
        get: (): number => scrollTopValue,
        set: (next: number): void => {
            scrollTopValue = next;
        },
    });
    document.body.appendChild(element);
    return {
        element,
        setClientHeight: (next: number): void => {
            clientHeightValue = next;
        },
        setScrollTop: (next: number): void => {
            scrollTopValue = next;
        },
    };
}

function renderWindow(
    options: VirtualWindowOptions,
): RenderHookResult<VirtualWindowState, VirtualWindowOptions> {
    return renderHook(
        (props: VirtualWindowOptions): VirtualWindowState =>
            useVirtualWindow(props),
        { initialProps: options },
    );
}

beforeEach((): void => {
    MockResizeObserver.instances = [];
    rafQueue = [];
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal(
        'requestAnimationFrame',
        (callback: FrameRequestCallback): number => {
            rafQueue.push(callback);
            return rafQueue.length;
        },
    );
    vi.stubGlobal('cancelAnimationFrame', (): void => {
        // The cleanup path calls this; the queue flush model ignores ids.
    });
});

afterEach((): void => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
});

describe('useVirtualWindow', (): void => {
    it('returns an all-zero window for an empty list', (): void => {
        const harness: ScrollHarness = createScrollHarness(480);
        const view: RenderHookResult<VirtualWindowState, VirtualWindowOptions> =
            renderWindow({
                rowCount: 0,
                rowHeight: 48,
                scrollRef: { current: harness.element },
            });

        expect(view.result.current).toEqual({
            startIndex: 0,
            endIndex: 0,
            offsetStart: 0,
            totalSize: 0,
        });
    });

    it('returns the degenerate window when rowHeight is not positive', (): void => {
        const harness: ScrollHarness = createScrollHarness(480);
        const view: RenderHookResult<VirtualWindowState, VirtualWindowOptions> =
            renderWindow({
                rowCount: 100,
                rowHeight: 0,
                scrollRef: { current: harness.element },
            });

        expect(view.result.current.startIndex).toBe(0);
        expect(view.result.current.endIndex).toBe(0);
        expect(view.result.current.totalSize).toBe(0);
    });

    it('uses a fallback window before the element is measured', (): void => {
        const view: RenderHookResult<VirtualWindowState, VirtualWindowOptions> =
            renderWindow({
                rowCount: 1000,
                rowHeight: 48,
                scrollRef: createRef<HTMLElement>(),
            });

        // With a null ref the seed effect bails, so the fallback height drives the
        // first window: ceil(FALLBACK_VIEWPORT_ROWS) visible rows plus overscan.
        expect(view.result.current.startIndex).toBe(0);
        expect(view.result.current.endIndex).toBe(
            FALLBACK_VIEWPORT_ROWS + OVERSCAN_DEFAULT,
        );
        expect(view.result.current.totalSize).toBe(1000 * 48);
    });

    it('windows from the live element at the top of the scroll range', (): void => {
        const harness: ScrollHarness = createScrollHarness(480);
        const view: RenderHookResult<VirtualWindowState, VirtualWindowOptions> =
            renderWindow({
                rowCount: 1000,
                rowHeight: 48,
                scrollRef: { current: harness.element },
            });

        // 480 / 48 = 10 visible rows; at scrollTop 0 the overscan clamps the start
        // to 0 and the end to 10 + overscan.
        expect(view.result.current.startIndex).toBe(0);
        expect(view.result.current.endIndex).toBe(10 + OVERSCAN_DEFAULT);
        expect(view.result.current.offsetStart).toBe(0);
        expect(view.result.current.totalSize).toBe(1000 * 48);
    });

    it('shifts the window and offset on scroll', (): void => {
        const harness: ScrollHarness = createScrollHarness(480);
        const view: RenderHookResult<VirtualWindowState, VirtualWindowOptions> =
            renderWindow({
                rowCount: 1000,
                rowHeight: 48,
                scrollRef: { current: harness.element },
            });

        act((): void => {
            harness.setScrollTop(4800);
            harness.element.dispatchEvent(new Event('scroll'));
        });
        act((): void => {
            flushRaf();
        });

        // 4800 / 48 = row 100 at the top; start backs off by overscan, the offset
        // tracks the start, and the block end advances past 100 + visible.
        expect(view.result.current.startIndex).toBe(100 - OVERSCAN_DEFAULT);
        expect(view.result.current.endIndex).toBe(100 + 10 + OVERSCAN_DEFAULT);
        expect(view.result.current.offsetStart).toBe((100 - OVERSCAN_DEFAULT) * 48);
    });

    it('clamps the window to the list bounds at the end', (): void => {
        const harness: ScrollHarness = createScrollHarness(480);
        const view: RenderHookResult<VirtualWindowState, VirtualWindowOptions> =
            renderWindow({
                rowCount: 20,
                rowHeight: 48,
                scrollRef: { current: harness.element },
            });

        act((): void => {
            harness.setScrollTop(20 * 48);
            harness.element.dispatchEvent(new Event('scroll'));
        });
        act((): void => {
            flushRaf();
        });

        expect(view.result.current.startIndex).toBeGreaterThanOrEqual(0);
        expect(view.result.current.endIndex).toBe(20);
    });

    it('observes the viewport and tears down its observer on unmount', (): void => {
        const harness: ScrollHarness = createScrollHarness(480);
        const view: RenderHookResult<VirtualWindowState, VirtualWindowOptions> =
            renderWindow({
                rowCount: 1000,
                rowHeight: 48,
                scrollRef: { current: harness.element },
            });

        const observer: MockResizeObserver | undefined =
            MockResizeObserver.instances.at(-1);
        expect(observer).toBeDefined();
        expect(observer?.observeCount).toBe(1);
        expect(observer?.disconnected).toBe(false);

        view.unmount();

        // The cleanup block removes the scroll listener, cancels any pending
        // frame, and disconnects the observer in one pass; a disconnected
        // observer proves that teardown ran on unmount.
        expect(observer?.disconnected).toBe(true);
    });
});
