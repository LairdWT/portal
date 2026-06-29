import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { createRef, type RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ElementSize, useElementSize } from './useElementSize';

// jsdom neither lays out nor implements ResizeObserver, so the measurement
// surface is stubbed: a controllable ResizeObserver mock whose callback the test
// fires by hand, and detached elements whose clientWidth/clientHeight (and inline
// padding, which getComputedStyle reflects) are defined so the content-box math
// has real inputs.

type ResizeObserverInit = ResizeObserverCallback;

class MockResizeObserver {
    public static instances: MockResizeObserver[] = [];
    public readonly callback: ResizeObserverCallback;
    public readonly observed: Element[] = [];
    public disconnected: boolean = false;

    public constructor(callback: ResizeObserverInit) {
        this.callback = callback;
        MockResizeObserver.instances.push(this);
    }

    public observe(target: Element): void {
        this.observed.push(target);
    }

    public unobserve(): void {
        // No-op: the hook only observes and disconnects.
    }

    public disconnect(): void {
        this.disconnected = true;
    }

    public trigger(entries: ResizeObserverEntry[]): void {
        this.callback(entries, this);
    }
}

function createSizeHarness(
    paddingBoxInline: number,
    paddingBoxBlock: number,
    padding: number,
): HTMLDivElement {
    const element: HTMLDivElement = document.createElement('div');
    element.style.padding = `${String(padding)}px`;
    Object.defineProperty(element, 'clientWidth', {
        configurable: true,
        get: (): number => paddingBoxInline,
    });
    Object.defineProperty(element, 'clientHeight', {
        configurable: true,
        get: (): number => paddingBoxBlock,
    });
    document.body.appendChild(element);
    return element;
}

function makeEntry(
    target: Element,
    contentBox: ElementSize | null,
    rect: ElementSize,
): ResizeObserverEntry {
    const contentBoxSize: readonly ResizeObserverSize[] =
        contentBox === null
            ? []
            : [
                  {
                      inlineSize: contentBox.inlineSize,
                      blockSize: contentBox.blockSize,
                  },
              ];
    return {
        target,
        contentRect: new DOMRect(0, 0, rect.inlineSize, rect.blockSize),
        borderBoxSize: [],
        contentBoxSize,
        devicePixelContentBoxSize: [],
    };
}

function renderSize(
    ref: RefObject<HTMLElement | null>,
): RenderHookResult<ElementSize, RefObject<HTMLElement | null>> {
    return renderHook(
        (props: RefObject<HTMLElement | null>): ElementSize =>
            useElementSize(props),
        { initialProps: ref },
    );
}

beforeEach((): void => {
    MockResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach((): void => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
});

describe('useElementSize', (): void => {
    it('returns the zero snapshot before the element is measured', (): void => {
        const view: RenderHookResult<
            ElementSize,
            RefObject<HTMLElement | null>
        > = renderSize(createRef<HTMLElement>());

        expect(view.result.current).toEqual({ inlineSize: 0, blockSize: 0 });
    });

    it('seeds the measured content box from the live element', (): void => {
        const element: HTMLDivElement = createSizeHarness(200, 48, 0);
        const view: RenderHookResult<
            ElementSize,
            RefObject<HTMLElement | null>
        > = renderSize({ current: element });

        expect(view.result.current).toEqual({ inlineSize: 200, blockSize: 48 });
    });

    it('subtracts padding so the seed is the content box, not the padding box', (): void => {
        // 220 padding-box - 2 * 10 padding = 200 content-box inline.
        const element: HTMLDivElement = createSizeHarness(220, 68, 10);
        const view: RenderHookResult<
            ElementSize,
            RefObject<HTMLElement | null>
        > = renderSize({ current: element });

        expect(view.result.current).toEqual({ inlineSize: 200, blockSize: 48 });
    });

    it('updates from the observer contentBoxSize on resize', (): void => {
        const element: HTMLDivElement = createSizeHarness(200, 48, 0);
        const view: RenderHookResult<
            ElementSize,
            RefObject<HTMLElement | null>
        > = renderSize({ current: element });

        const observer: MockResizeObserver | undefined =
            MockResizeObserver.instances.at(-1);
        expect(observer?.observed).toContain(element);

        act((): void => {
            observer?.trigger([
                makeEntry(
                    element,
                    { inlineSize: 640, blockSize: 72 },
                    { inlineSize: 0, blockSize: 0 },
                ),
            ]);
        });

        expect(view.result.current).toEqual({ inlineSize: 640, blockSize: 72 });
    });

    it('falls back to contentRect when contentBoxSize is empty', (): void => {
        const element: HTMLDivElement = createSizeHarness(200, 48, 0);
        const view: RenderHookResult<
            ElementSize,
            RefObject<HTMLElement | null>
        > = renderSize({ current: element });

        const observer: MockResizeObserver | undefined =
            MockResizeObserver.instances.at(-1);

        act((): void => {
            observer?.trigger([
                makeEntry(element, null, { inlineSize: 333, blockSize: 21 }),
            ]);
        });

        expect(view.result.current).toEqual({ inlineSize: 333, blockSize: 21 });
    });

    it('coalesces a redundant resize into a stable reference', (): void => {
        const element: HTMLDivElement = createSizeHarness(200, 48, 0);
        const view: RenderHookResult<
            ElementSize,
            RefObject<HTMLElement | null>
        > = renderSize({ current: element });

        const before: ElementSize = view.result.current;
        const observer: MockResizeObserver | undefined =
            MockResizeObserver.instances.at(-1);

        act((): void => {
            observer?.trigger([
                makeEntry(
                    element,
                    { inlineSize: 200, blockSize: 48 },
                    { inlineSize: 0, blockSize: 0 },
                ),
            ]);
        });

        // The equality short-circuit returns the previous state object, so an
        // unchanged size keeps a stable identity and forces no re-render.
        expect(view.result.current).toBe(before);
    });

    it('disconnects the observer on unmount', (): void => {
        const element: HTMLDivElement = createSizeHarness(200, 48, 0);
        const view: RenderHookResult<
            ElementSize,
            RefObject<HTMLElement | null>
        > = renderSize({ current: element });

        const observer: MockResizeObserver | undefined =
            MockResizeObserver.instances.at(-1);
        expect(observer?.disconnected).toBe(false);

        view.unmount();

        expect(observer?.disconnected).toBe(true);
    });

    it('is feature-guarded when ResizeObserver is unavailable', (): void => {
        vi.stubGlobal('ResizeObserver', undefined);
        const element: HTMLDivElement = createSizeHarness(120, 30, 0);

        const view: RenderHookResult<
            ElementSize,
            RefObject<HTMLElement | null>
        > = renderSize({ current: element });

        // No observer is constructed, yet the synchronous seed still measures the
        // live element so the first paint has a sensible fallback size.
        expect(MockResizeObserver.instances).toHaveLength(0);
        expect(view.result.current).toEqual({ inlineSize: 120, blockSize: 30 });
    });
});
