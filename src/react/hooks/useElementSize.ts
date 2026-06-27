// Generic, dependency-free element-size hook: attach the returned ref's target
// to any element and read its measured content-box size in logical pixels
// (inlineSize / blockSize). The consumer compares or derives layout from a live
// measurement instead of guessing - Marquee, for example, measures the track and
// the strip to decide fits-vs-overflow and to compute a constant-speed scroll
// duration.
//
// React-only and dependency-free. Implemented with useState + a single
// useLayoutEffect that observes the target through one ResizeObserver, seeds the
// first measurement synchronously from the live element (so the first client
// paint already has a real size), and DISCONNECTS the observer on cleanup.
//
// Side effects (the ResizeObserver) live entirely inside the layout effect and
// are torn down on unmount. Negative-first guards; SSR-safe: the initial snapshot
// is the zero size, ResizeObserver is feature-guarded, and the layout effect
// (which never runs on the server) is the only place the live element is read.
// Measurements are coalesced - ResizeObserver delivers one frame-batched callback
// per layout pass and a value-equality short-circuit drops no-op updates so an
// unchanged size never forces a re-render.

import {
    type Dispatch,
    type RefObject,
    type SetStateAction,
    useLayoutEffect,
    useState,
} from 'react';

// Measured content-box size of the observed element, in logical CSS pixels.
// inlineSize is the size along the inline axis (width in horizontal writing
// modes); blockSize is the size along the block axis (height).
export type ElementSize = Readonly<{ inlineSize: number; blockSize: number }>;

// First-paint / SSR snapshot, returned before the live element is measured and
// whenever the ref is null. A frozen shared reference so an unmeasured hook keeps
// a stable identity across renders.
const ZERO_SIZE: ElementSize = { inlineSize: 0, blockSize: 0 };

// Synchronous content-box read used to seed the first measurement from the live
// element. clientWidth/clientHeight are the padding-box dimensions (transform
// immune, scrollbar excluded); subtracting the computed padding yields the
// content box. Logical inline/block coincide with width/height in horizontal
// writing modes; the ResizeObserver supplies the true logical sizes thereafter.
function readContentBoxSize(element: HTMLElement): ElementSize {
    const style: CSSStyleDeclaration = window.getComputedStyle(element);
    const paddingInline: number =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingBlock: number =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    return {
        inlineSize: Math.max(0, element.clientWidth - paddingInline),
        blockSize: Math.max(0, element.clientHeight - paddingBlock),
    };
}

// Extracts the content-box size from a ResizeObserver entry, preferring the
// logical contentBoxSize and falling back to contentRect for engines that only
// populate the legacy rectangle.
function readEntryContentBox(entry: ResizeObserverEntry): ElementSize {
    const [box]: readonly ResizeObserverSize[] = entry.contentBoxSize;
    if (box === undefined) {
        return {
            inlineSize: entry.contentRect.width,
            blockSize: entry.contentRect.height,
        };
    }
    return { inlineSize: box.inlineSize, blockSize: box.blockSize };
}

export function useElementSize(
    targetRef: RefObject<HTMLElement | null>,
): ElementSize {
    const [size, setSize]: [ElementSize, Dispatch<SetStateAction<ElementSize>>] =
        useState<ElementSize>(ZERO_SIZE);

    useLayoutEffect((): (() => void) | undefined => {
        const element: HTMLElement | null = targetRef.current;
        if (element === null) {
            return undefined;
        }

        // Seed from the live element now that it is in the DOM, replacing the
        // zero snapshot with the real first measurement before paint.
        setSize(readContentBoxSize(element));

        if (typeof ResizeObserver === 'undefined') {
            return undefined;
        }

        const observer: ResizeObserver = new ResizeObserver(
            (entries: readonly ResizeObserverEntry[]): void => {
                const entry: ResizeObserverEntry | undefined = entries[0];
                if (entry === undefined) {
                    return;
                }
                const next: ElementSize = readEntryContentBox(entry);
                setSize((prev: ElementSize): ElementSize => {
                    if (
                        prev.inlineSize === next.inlineSize &&
                        prev.blockSize === next.blockSize
                    ) {
                        return prev;
                    }
                    return next;
                });
            },
        );
        observer.observe(element);

        return (): void => {
            observer.disconnect();
        };
    }, [targetRef]);

    return size;
}
