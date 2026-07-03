import { act, render, type RenderResult, screen } from '@testing-library/react';
import { type ReactElement, type RefObject, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type MeasuredWindowState, useMeasuredWindow } from './useMeasuredWindow';

// jsdom neither lays out nor implements ResizeObserver, so the measurement
// surface is stubbed at the prototype level: offsetHeight reads the row's
// data-mh attribute (absent -> 0, which the hook ignores as unmeasured),
// clientHeight reads data-ch, and scrollTop is a WeakMap-backed accessor
// (jsdom's own scrollTop silently stays 0 without a layout box). A
// controllable ResizeObserver mock and a queue-backed requestAnimationFrame
// complete the harness, following useVirtualWindow.test / useElementSize.test.

class MockResizeObserver {
    public static instances: MockResizeObserver[] = [];
    public readonly callback: ResizeObserverCallback;
    public readonly observed: Element[] = [];
    public disconnected: boolean = false;

    public constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        MockResizeObserver.instances.push(this);
    }

    public observe(target: Element): void {
        this.observed.push(target);
    }

    public unobserve(): void {
        // No-op: tests only assert observe targeting and disconnection.
    }

    public disconnect(): void {
        this.disconnected = true;
    }

    public trigger(entries: ResizeObserverEntry[]): void {
        this.callback(entries, this);
    }
}

function makeRowEntry(target: Element): ResizeObserverEntry {
    return {
        target,
        contentRect: new DOMRect(0, 0, 0, 0),
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
    };
}

// Finds the shared ROW observer (the instance observing the given element);
// the hook also creates a separate viewport observer.
function rowObserverFor(element: Element): MockResizeObserver | undefined {
    return MockResizeObserver.instances.find(
        (instance: MockResizeObserver): boolean =>
            instance.observed.includes(element),
    );
}

let rafQueue: FrameRequestCallback[] = [];

function flushRaf(): void {
    const pending: FrameRequestCallback[] = rafQueue;
    rafQueue = [];
    for (const callback of pending) {
        callback(0);
    }
}

let scrollTopStore: WeakMap<HTMLElement, number> = new WeakMap<
    HTMLElement,
    number
>();

const ORIGINAL_OFFSET_HEIGHT: PropertyDescriptor | undefined =
    Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

function installPrototypeStubs(): void {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get(this: HTMLElement): number {
            return Number(this.getAttribute('data-mh') ?? '0');
        },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get(this: HTMLElement): number {
            return Number(this.getAttribute('data-ch') ?? '0');
        },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
        configurable: true,
        get(this: HTMLElement): number {
            return scrollTopStore.get(this) ?? 0;
        },
        set(this: HTMLElement, next: number): void {
            scrollTopStore.set(this, next);
        },
    });
}

function removePrototypeStubs(): void {
    if (ORIGINAL_OFFSET_HEIGHT !== undefined) {
        Object.defineProperty(
            HTMLElement.prototype,
            'offsetHeight',
            ORIGINAL_OFFSET_HEIGHT,
        );
    } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight');
    }
    // clientHeight and scrollTop live on Element.prototype in jsdom; the
    // shadows were added to HTMLElement.prototype, so deleting them restores
    // the originals through inheritance.
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollTop');
}

type HarnessProps = Readonly<{
    rowCount: number;
    estimatedRowHeight?: number | undefined;
    // Initial row heights by absolute index, rendered as data-mh.
    rowHeights?: readonly (number | undefined)[] | undefined;
    // Viewport height, rendered as data-ch (absent -> jsdom's zero).
    viewportHeight?: number | undefined;
}>;

function Harness({
    rowCount,
    estimatedRowHeight,
    rowHeights,
    viewportHeight,
}: HarnessProps): ReactElement {
    const scrollRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const virtualWindow: MeasuredWindowState = useMeasuredWindow({
        rowCount,
        estimatedRowHeight: estimatedRowHeight ?? 24,
        scrollRef,
    });
    const indices: number[] = [];
    for (
        let index: number = virtualWindow.startIndex;
        index < virtualWindow.endIndex;
        index += 1
    ) {
        indices.push(index);
    }
    return (
        <div
            ref={scrollRef}
            data-testid="viewport"
            {...(viewportHeight !== undefined
                ? { 'data-ch': String(viewportHeight) }
                : {})}
        >
            <div
                data-testid="spacer"
                data-total={String(virtualWindow.totalSize)}
                data-offset={String(virtualWindow.offsetStart)}
            >
                {indices.map((index: number): ReactElement => {
                    const height: number | undefined = rowHeights?.[index];
                    return (
                        <div
                            key={index}
                            ref={virtualWindow.measureRow(index)}
                            data-testid={`row-${String(index)}`}
                            {...(height !== undefined
                                ? { 'data-mh': String(height) }
                                : {})}
                        >
                            {`Row ${String(index)}`}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

beforeEach((): void => {
    MockResizeObserver.instances = [];
    rafQueue = [];
    scrollTopStore = new WeakMap<HTMLElement, number>();
    installPrototypeStubs();
    vi.stubGlobal(
        'requestAnimationFrame',
        (callback: FrameRequestCallback): number => {
            rafQueue.push(callback);
            return rafQueue.length;
        },
    );
    vi.stubGlobal('cancelAnimationFrame', (): void => {
        // The queue flush model ignores ids.
    });
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach((): void => {
    vi.unstubAllGlobals();
    removePrototypeStubs();
});

describe('useMeasuredWindow', (): void => {
    it('renders nothing for an empty list', (): void => {
        render(<Harness rowCount={0} />);
        expect(screen.queryByTestId('row-0')).toBeNull();
        expect(screen.getByTestId('spacer').getAttribute('data-total')).toBe('0');
    });

    it('stays estimate-driven under jsdom zero measurements', (): void => {
        // No data-mh and a zero-height viewport: the window is the bare
        // overscan band and the spacer is rowCount * estimate (the documented
        // jsdom fallback, matching useVirtualWindow).
        render(<Harness rowCount={100} />);
        act((): void => {
            flushRaf();
        });
        expect(screen.getByTestId('row-0')).toBeInTheDocument();
        expect(screen.getByTestId('row-3')).toBeInTheDocument();
        expect(screen.queryByTestId('row-4')).toBeNull();
        expect(screen.getByTestId('spacer').getAttribute('data-total')).toBe(
            '2400',
        );
    });

    it('replaces estimates with attach-time measurements after a flush', (): void => {
        render(<Harness rowCount={10} rowHeights={[40, 40, 40, 40]} />);
        act((): void => {
            flushRaf();
        });
        // Rows 0-3 measured at 40, rows 4-9 keep the 24 estimate.
        expect(screen.getByTestId('spacer').getAttribute('data-total')).toBe(
            String(4 * 40 + 6 * 24),
        );
    });

    it('re-measures a row when its ResizeObserver fires', (): void => {
        render(<Harness rowCount={10} />);
        act((): void => {
            flushRaf();
        });
        const row: HTMLElement = screen.getByTestId('row-1');
        row.setAttribute('data-mh', '60');
        const observer: MockResizeObserver | undefined = rowObserverFor(row);
        expect(observer).toBeDefined();
        act((): void => {
            observer?.trigger([makeRowEntry(row)]);
            flushRaf();
        });
        expect(screen.getByTestId('spacer').getAttribute('data-total')).toBe(
            String(9 * 24 + 60),
        );
    });

    it('anchor-corrects the scroll position when a row above grows', (): void => {
        render(<Harness rowCount={50} viewportHeight={480} />);
        const viewport: HTMLElement = screen.getByTestId('viewport');

        // Scroll to row 10 (240px at the 24px estimate).
        act((): void => {
            viewport.scrollTop = 240;
            viewport.dispatchEvent(new Event('scroll'));
        });
        act((): void => {
            flushRaf();
        });
        expect(screen.getByTestId('spacer').getAttribute('data-offset')).toBe(
            String(6 * 24),
        );

        // Row 6 (above the anchor row 10) measures at 60 instead of the 24
        // estimate: the viewport must shift by the same +36 so row 10 stays
        // under the top edge.
        const row: HTMLElement = screen.getByTestId('row-6');
        row.setAttribute('data-mh', '60');
        const observer: MockResizeObserver | undefined = rowObserverFor(row);
        expect(observer).toBeDefined();
        act((): void => {
            observer?.trigger([makeRowEntry(row)]);
            flushRaf();
        });

        expect(viewport.scrollTop).toBe(276);
        expect(screen.getByTestId('spacer').getAttribute('data-total')).toBe(
            String(49 * 24 + 60),
        );
        // The window still starts at row 6, whose measured offset is
        // unchanged (all rows above it kept the estimate).
        expect(screen.getByTestId('spacer').getAttribute('data-offset')).toBe(
            String(6 * 24),
        );
        expect(screen.getByTestId('row-6')).toBeInTheDocument();
    });

    it('drops measurements beyond a shrunken row count', (): void => {
        const view: RenderResult = render(
            <Harness
                rowCount={10}
                rowHeights={[40, 40, 40, 40, 40, 40, 40, 40, 40, 40]}
            />,
        );
        act((): void => {
            flushRaf();
        });
        expect(screen.getByTestId('spacer').getAttribute('data-total')).toBe('400');

        view.rerender(
            <Harness
                rowCount={2}
                rowHeights={[40, 40, 40, 40, 40, 40, 40, 40, 40, 40]}
            />,
        );
        act((): void => {
            flushRaf();
        });
        expect(screen.getByTestId('spacer').getAttribute('data-total')).toBe('80');
    });

    it('disconnects both observers on unmount', (): void => {
        const view: RenderResult = render(
            <Harness rowCount={10} rowHeights={[40]} />,
        );
        act((): void => {
            flushRaf();
        });
        // One row observer plus one viewport observer.
        expect(MockResizeObserver.instances.length).toBe(2);

        view.unmount();
        for (const instance of MockResizeObserver.instances) {
            expect(instance.disconnected).toBe(true);
        }
    });
});
