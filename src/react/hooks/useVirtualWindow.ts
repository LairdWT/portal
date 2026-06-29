// Domain-agnostic vertical row-windowing hook: the React equivalent of egui's
// ScrollArea::show_rows. Given a fixed, uniform row height and a scrollable
// viewport element, it reports only the slice of rows currently scrolled into
// view (plus an overscan band), the pixel offset of that slice, and the full
// scrollable height that gives the viewport its scrollbar. The consumer renders
// only the windowed rows, so a list of 10,000 rows mounts a handful of DOM nodes.
//
// React-only and dependency-free. Reused by DataTable and (per the parity ledger)
// the future List / VirtualList. Uniform row height is the windowing precondition
// (the same constraint egui's show_rows imposes); variable/measured heights are a
// deliberate out-of-scope follow-up, not handled here.
//
// Side effects (a passive scroll listener, a ResizeObserver, and a coalescing
// requestAnimationFrame) live entirely inside the single layout effect and are
// each torn down on cleanup. Negative-first guards; SSR-safe (ResizeObserver is
// feature-guarded and the first window comes from a fallback height).

import {
    type Dispatch,
    type RefObject,
    type SetStateAction,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

// Extra rows rendered above and below the visible range to mask fast-scroll
// blanking before the next frame's window settles.
export const OVERSCAN_DEFAULT: number = 4;

// First-paint / SSR window height (in rows) used before the live element is
// measured, so the initial render shows a sensible slice instead of nothing.
export const FALLBACK_VIEWPORT_ROWS: number = 12;

export type VirtualWindowOptions = Readonly<{
    // Total number of rows in the virtual list. Non-negative.
    rowCount: number;
    // Fixed row height in CSS pixels. Must be > 0; a non-positive height yields
    // the degenerate empty window rather than dividing by zero.
    rowHeight: number;
    // Extra rows above and below the visible range. Default OVERSCAN_DEFAULT.
    overscan?: number;
    // The scrollable viewport element. The consumer attaches this ref to the
    // element whose overflow is scrolled.
    scrollRef: RefObject<HTMLElement | null>;
}>;

export type VirtualWindowState = Readonly<{
    // First rendered row index (inclusive), overscan applied, clamped to >= 0.
    startIndex: number;
    // One past the last rendered row index (exclusive), clamped to <= rowCount.
    endIndex: number;
    // Translate offset, in px, of the rendered block from the top of the sizer
    // (startIndex * rowHeight).
    offsetStart: number;
    // Full scrollable height, in px (rowCount * rowHeight); drives the spacer
    // that gives the viewport its scrollbar.
    totalSize: number;
}>;

// Live viewport measurements. Held as one state object so a scroll and a resize
// never race two separate setState calls into an inconsistent pair.
type ViewportMetrics = Readonly<{
    scrollTop: number;
    viewportHeight: number;
}>;

// Shared frozen result for the degenerate (empty or zero-height) case, so the
// memo returns a stable reference instead of allocating each render.
const EMPTY_WINDOW: VirtualWindowState = {
    startIndex: 0,
    endIndex: 0,
    offsetStart: 0,
    totalSize: 0,
};

export function useVirtualWindow(
    options: VirtualWindowOptions,
): VirtualWindowState {
    const { rowCount, rowHeight, overscan, scrollRef }: VirtualWindowOptions =
        options;

    // Pending rAF id for scroll coalescing: one frame is scheduled per burst of
    // scroll events, so the hook does not setState on every scroll tick.
    const frameRef: RefObject<number | null> = useRef<number | null>(null);

    const [metrics, setMetrics]: [
        ViewportMetrics,
        Dispatch<SetStateAction<ViewportMetrics>>,
    ] = useState<ViewportMetrics>(
        (): ViewportMetrics => ({
            scrollTop: 0,
            viewportHeight: rowHeight * FALLBACK_VIEWPORT_ROWS,
        }),
    );

    useLayoutEffect((): (() => void) | undefined => {
        const element: HTMLElement | null = scrollRef.current;
        if (element === null) {
            return undefined;
        }

        // Seed from the live element now that it is in the DOM, replacing the
        // fallback window with the real first measurement.
        setMetrics({
            scrollTop: element.scrollTop,
            viewportHeight: element.clientHeight,
        });

        function handleScroll(): void {
            if (frameRef.current !== null) {
                return;
            }
            frameRef.current = requestAnimationFrame((): void => {
                frameRef.current = null;
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

        let observer: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver((): void => {
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
            observer.observe(element);
        }

        return (): void => {
            element.removeEventListener('scroll', handleScroll);
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
            if (observer !== null) {
                observer.disconnect();
            }
        };
    }, [scrollRef, rowHeight]);

    return useMemo((): VirtualWindowState => {
        if (rowCount <= 0 || rowHeight <= 0) {
            return EMPTY_WINDOW;
        }
        const over: number = overscan ?? OVERSCAN_DEFAULT;
        const first: number = Math.floor(metrics.scrollTop / rowHeight);
        const startIndex: number = Math.max(0, first - over);
        // Base the end on the exposed pixel band (scrollTop + viewportHeight),
        // not floor(scrollTop) + ceil(viewportHeight). At a fractional scrollTop
        // the floor+ceil form undercounts by one row and leaves a sub-row blank
        // strip at the viewport bottom; ceil of the band edge keeps the
        // partially scrolled bottom row in the window. Identical at aligned
        // offsets (scrollTop a multiple of rowHeight).
        const endIndex: number = Math.min(
            rowCount,
            Math.ceil((metrics.scrollTop + metrics.viewportHeight) / rowHeight) +
                over,
        );
        return {
            startIndex,
            endIndex,
            offsetStart: startIndex * rowHeight,
            totalSize: rowCount * rowHeight,
        };
    }, [metrics, rowCount, rowHeight, overscan]);
}
