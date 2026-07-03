// Variable-height sibling of useVirtualWindow: vertical row windowing where
// row heights are MEASURED from the rendered rows instead of fixed. The
// consumer attaches the returned measureRow(index) callback ref to each
// rendered row; heights are read on attach and re-read through a shared
// ResizeObserver, applied in a coalesced requestAnimationFrame flush, and fed
// into a prefix-sum offset table (measuredWindowMath). Rows never rendered
// keep the estimated height, so the spacer and scrollbar are always defined.
//
// Scroll anchoring: when a flush changes the height of rows ABOVE the current
// scroll position (scrolling up through never-measured rows), the viewport's
// scrollTop is corrected by the same delta in the same flush, so the content
// under the viewport does not visibly jump.
//
// jsdom (and display:none) report zero heights; zero measurements are ignored
// so the estimate keeps driving the window - the estimate-driven counterpart
// of useVirtualWindow's documented fallback behavior. Side effects (scroll
// listener, viewport ResizeObserver, row ResizeObserver, coalescing frames)
// are all torn down on cleanup. Uniform-height lists should keep using
// useVirtualWindow - it is O(1) per scroll where this hook pays a binary
// search and a per-measurement flush.

import {
    type Dispatch,
    type RefCallback,
    type RefObject,
    type SetStateAction,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    anchorScrollDelta,
    buildRowOffsets,
    EMPTY_SLICE,
    type MeasuredWindowSlice,
    measuredWindowSlice,
    rowIndexAtOffset,
} from './measuredWindowMath';
import { FALLBACK_VIEWPORT_ROWS, OVERSCAN_DEFAULT } from './useVirtualWindow';

export type MeasuredWindowOptions = Readonly<{
    // Total number of rows in the virtual list. Non-negative. Measurements
    // are keyed by row INDEX: consumers whose earlier rows change identity
    // under the same indices get a one-frame estimate until the re-rendered
    // rows re-measure (append-only lists are unaffected).
    rowCount: number;
    // Height assumed, in CSS px, for rows not yet measured. Must be > 0; a
    // non-positive estimate yields the degenerate empty window.
    estimatedRowHeight: number;
    // Extra rows above and below the visible range. Default OVERSCAN_DEFAULT.
    overscan?: number;
    // The scrollable viewport element, as in useVirtualWindow.
    scrollRef: RefObject<HTMLElement | null>;
}>;

export type MeasuredWindowState = Readonly<{
    // First rendered row index (inclusive), overscan applied.
    startIndex: number;
    // One past the last rendered row index (exclusive).
    endIndex: number;
    // Translate offset, in px, of the rendered block from the top of the
    // sizer (the measured offset of startIndex).
    offsetStart: number;
    // Full scrollable height in px; changes as measurements replace
    // estimates, so effects that keep the viewport pinned (follow-tail) can
    // re-land on it.
    totalSize: number;
    // Callback-ref factory: attach measureRow(absoluteRowIndex) to each
    // rendered row element. Refs are cached per index, so the same index
    // always receives the same callback identity.
    measureRow: (index: number) => RefCallback<HTMLElement>;
}>;

// Live viewport measurements, held as one state object so a scroll and a
// resize never race two setState calls into an inconsistent pair.
type ViewportMetrics = Readonly<{
    scrollTop: number;
    viewportHeight: number;
}>;

export function useMeasuredWindow(
    options: MeasuredWindowOptions,
): MeasuredWindowState {
    const {
        rowCount,
        estimatedRowHeight,
        overscan,
        scrollRef,
    }: MeasuredWindowOptions = options;

    // Mutable working copy of the per-index heights; flushes snapshot it into
    // the measuredHeights state the offset memo depends on.
    const heightsRef: RefObject<(number | undefined)[]> = useRef<
        (number | undefined)[]
    >([]);
    // The offsets from the LAST commit, for synchronous anchor math inside a
    // flush (the freshly building table is not committed yet).
    const offsetsRef: RefObject<readonly number[]> = useRef<readonly number[]>([0]);
    // Measurements recorded since the last flush.
    const pendingRef: RefObject<Map<number, number>> = useRef<Map<number, number>>(
        new Map<number, number>(),
    );
    const flushFrameRef: RefObject<number | null> = useRef<number | null>(null);
    const scrollFrameRef: RefObject<number | null> = useRef<number | null>(null);
    const rowObserverRef: RefObject<ResizeObserver | null> =
        useRef<ResizeObserver | null>(null);
    // Which row index each observed element measures for.
    const elementIndexRef: RefObject<Map<Element, number>> = useRef<
        Map<Element, number>
    >(new Map<Element, number>());
    // Per-index ref callbacks, cached so a re-render never detaches and
    // re-attaches an unchanged row's ref.
    const rowRefsRef: RefObject<Map<number, RefCallback<HTMLElement>>> = useRef<
        Map<number, RefCallback<HTMLElement>>
    >(new Map<number, RefCallback<HTMLElement>>());
    // Option mirrors for the stable flush worker (rAF callbacks must not
    // close over per-render values).
    const estimateRef: RefObject<number> = useRef<number>(estimatedRowHeight);
    const rowCountRef: RefObject<number> = useRef<number>(rowCount);

    const [measuredHeights, setMeasuredHeights]: [
        readonly (number | undefined)[],
        Dispatch<SetStateAction<readonly (number | undefined)[]>>,
    ] = useState<readonly (number | undefined)[]>([]);
    const [metrics, setMetrics]: [
        ViewportMetrics,
        Dispatch<SetStateAction<ViewportMetrics>>,
    ] = useState<ViewportMetrics>(
        (): ViewportMetrics => ({
            scrollTop: 0,
            viewportHeight: estimatedRowHeight * FALLBACK_VIEWPORT_ROWS,
        }),
    );

    useLayoutEffect((): void => {
        estimateRef.current = estimatedRowHeight;
        rowCountRef.current = rowCount;
        if (heightsRef.current.length > rowCount) {
            heightsRef.current.length = rowCount;
        }
    }, [estimatedRowHeight, rowCount]);

    // Applies pending measurements: anchor-corrects the viewport, mutates the
    // working heights, and publishes an immutable snapshot for the memo.
    const flushMeasurements: () => void = useCallback((): void => {
        flushFrameRef.current = null;
        const pending: Map<number, number> = pendingRef.current;
        if (pending.size === 0) {
            return;
        }
        const heights: (number | undefined)[] = heightsRef.current;
        const element: HTMLElement | null = scrollRef.current;

        // Anchor BEFORE applying: the delta needs the previous heights.
        let delta: number = 0;
        if (element !== null) {
            const anchorIndex: number = rowIndexAtOffset(
                offsetsRef.current,
                element.scrollTop,
            );
            delta = anchorScrollDelta(
                pending,
                heights,
                estimateRef.current,
                anchorIndex,
            );
        }

        let changed: boolean = false;
        for (const [index, height] of pending) {
            if (index >= rowCountRef.current) {
                continue;
            }
            if (heights[index] === height) {
                continue;
            }
            heights[index] = height;
            changed = true;
        }
        pending.clear();
        if (!changed) {
            return;
        }
        if (element !== null && delta !== 0) {
            element.scrollTop += delta;
            const corrected: number = element.scrollTop;
            setMetrics((prev: ViewportMetrics): ViewportMetrics => {
                if (prev.scrollTop === corrected) {
                    return prev;
                }
                return {
                    scrollTop: corrected,
                    viewportHeight: prev.viewportHeight,
                };
            });
        }
        setMeasuredHeights(heights.slice());
    }, [scrollRef]);

    const scheduleFlush: () => void = useCallback((): void => {
        if (flushFrameRef.current !== null) {
            return;
        }
        flushFrameRef.current = requestAnimationFrame((): void => {
            flushMeasurements();
        });
    }, [flushMeasurements]);

    const recordMeasurement: (index: number, height: number) => void = useCallback(
        (index: number, height: number): void => {
            if (!Number.isFinite(height) || height <= 0) {
                // jsdom and display:none report zero; keep the estimate.
                return;
            }
            if (heightsRef.current[index] === height) {
                // Back to the stored value: drop any stale pending entry so a
                // flush cannot resurrect an intermediate measurement.
                pendingRef.current.delete(index);
                return;
            }
            pendingRef.current.set(index, height);
        },
        [],
    );

    // The shared row observer, created on first attach (feature-guarded).
    const ensureRowObserver: () => ResizeObserver | null =
        useCallback((): ResizeObserver | null => {
            if (rowObserverRef.current !== null) {
                return rowObserverRef.current;
            }
            if (typeof ResizeObserver === 'undefined') {
                return null;
            }
            rowObserverRef.current = new ResizeObserver(
                (entries: readonly ResizeObserverEntry[]): void => {
                    for (const entry of entries) {
                        const index: number | undefined =
                            elementIndexRef.current.get(entry.target);
                        if (index === undefined) {
                            continue;
                        }
                        if (!(entry.target instanceof HTMLElement)) {
                            continue;
                        }
                        recordMeasurement(index, entry.target.offsetHeight);
                    }
                    scheduleFlush();
                },
            );
            return rowObserverRef.current;
        }, [recordMeasurement, scheduleFlush]);

    const measureRow: (index: number) => RefCallback<HTMLElement> = useCallback(
        (index: number): RefCallback<HTMLElement> => {
            const existing: RefCallback<HTMLElement> | undefined =
                rowRefsRef.current.get(index);
            if (existing !== undefined) {
                return existing;
            }
            // Track the attached element per callback so the null (detach)
            // call can unobserve it without React 19-only ref cleanups.
            let attached: HTMLElement | null = null;
            const bind: RefCallback<HTMLElement> = (
                element: HTMLElement | null,
            ): void => {
                if (element === null) {
                    if (attached === null) {
                        return;
                    }
                    elementIndexRef.current.delete(attached);
                    const observer: ResizeObserver | null = rowObserverRef.current;
                    if (observer !== null) {
                        observer.unobserve(attached);
                    }
                    attached = null;
                    return;
                }
                attached = element;
                elementIndexRef.current.set(element, index);
                recordMeasurement(index, element.offsetHeight);
                const observer: ResizeObserver | null = ensureRowObserver();
                if (observer !== null) {
                    observer.observe(element);
                }
                scheduleFlush();
            };
            rowRefsRef.current.set(index, bind);
            return bind;
        },
        [ensureRowObserver, recordMeasurement, scheduleFlush],
    );

    // Viewport tracking: identical shape to useVirtualWindow (seed on mount,
    // rAF-coalesced scroll, ResizeObserver for the viewport height).
    useLayoutEffect((): (() => void) | undefined => {
        const element: HTMLElement | null = scrollRef.current;
        if (element === null) {
            return undefined;
        }

        setMetrics({
            scrollTop: element.scrollTop,
            viewportHeight: element.clientHeight,
        });

        function handleScroll(): void {
            if (scrollFrameRef.current !== null) {
                return;
            }
            scrollFrameRef.current = requestAnimationFrame((): void => {
                scrollFrameRef.current = null;
                const live: HTMLElement | null = scrollRef.current;
                if (live === null) {
                    return;
                }
                const nextScrollTop: number = live.scrollTop;
                setMetrics((prev: ViewportMetrics): ViewportMetrics => {
                    if (prev.scrollTop === nextScrollTop) {
                        return prev;
                    }
                    return {
                        scrollTop: nextScrollTop,
                        viewportHeight: prev.viewportHeight,
                    };
                });
            });
        }

        element.addEventListener('scroll', handleScroll, { passive: true });

        let viewportObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            viewportObserver = new ResizeObserver((): void => {
                const live: HTMLElement | null = scrollRef.current;
                if (live === null) {
                    return;
                }
                const nextHeight: number = live.clientHeight;
                setMetrics((prev: ViewportMetrics): ViewportMetrics => {
                    if (prev.viewportHeight === nextHeight) {
                        return prev;
                    }
                    return {
                        scrollTop: prev.scrollTop,
                        viewportHeight: nextHeight,
                    };
                });
            });
            viewportObserver.observe(element);
        }

        return (): void => {
            element.removeEventListener('scroll', handleScroll);
            if (scrollFrameRef.current !== null) {
                cancelAnimationFrame(scrollFrameRef.current);
                scrollFrameRef.current = null;
            }
            if (viewportObserver !== null) {
                viewportObserver.disconnect();
            }
        };
    }, [scrollRef]);

    // Unmount teardown for the measurement side: the pending flush frame and
    // the shared row observer.
    useLayoutEffect((): (() => void) => {
        return (): void => {
            if (flushFrameRef.current !== null) {
                cancelAnimationFrame(flushFrameRef.current);
                flushFrameRef.current = null;
            }
            if (rowObserverRef.current !== null) {
                rowObserverRef.current.disconnect();
                rowObserverRef.current = null;
            }
        };
    }, []);

    // The offset table rebuilds only when measurements or the row set change;
    // scrolling pays a binary search over it, not a rebuild.
    const offsets: readonly number[] = useMemo(
        (): readonly number[] =>
            buildRowOffsets(rowCount, estimatedRowHeight, measuredHeights),
        [rowCount, estimatedRowHeight, measuredHeights],
    );

    useLayoutEffect((): void => {
        offsetsRef.current = offsets;
    }, [offsets]);

    const slice: MeasuredWindowSlice = useMemo((): MeasuredWindowSlice => {
        if (rowCount <= 0 || estimatedRowHeight <= 0) {
            return EMPTY_SLICE;
        }
        return measuredWindowSlice(
            offsets,
            metrics.scrollTop,
            metrics.viewportHeight,
            overscan ?? OVERSCAN_DEFAULT,
        );
    }, [rowCount, estimatedRowHeight, offsets, metrics, overscan]);

    return useMemo(
        (): MeasuredWindowState => ({
            startIndex: slice.startIndex,
            endIndex: slice.endIndex,
            offsetStart: slice.offsetStart,
            totalSize: slice.totalSize,
            measureRow,
        }),
        [slice, measureRow],
    );
}
