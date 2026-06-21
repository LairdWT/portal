// React binding that recognizes simple touch gestures on a surface.
//
// The hook owns no React state: a render is never forced by a pointer sample.
// The active pointer, its start position, and the last tap time are held in
// refs, so recognition is pure bookkeeping that runs inside the returned
// handlers. There is no effect, no timer, no global listener, and therefore
// nothing to tear down: double-tap is resolved by comparing timestamps on the
// next tap rather than by scheduling a timeout, which keeps the hook free of
// cleanup and free of the set-state-in-effect hazard.
//
// Consumers must set `touch-action: none` on the bound element so the browser
// does not steal the gesture for scrolling or zooming before pointerup fires.
//
// Swipe sign convention follows screen coordinates: y grows downward, so an
// upward swipe is a negative y displacement and a leftward swipe is a negative
// x displacement. The dominant axis (larger absolute displacement) wins.

import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useCallback, useRef } from 'react';

import type { EGesture, GestureBinding, GestureOptions } from './useGesture.types';
import { EGesture as EGestureValue } from './useGesture.types';

const DEFAULT_SWIPE_THRESHOLD_PX: number = 32;
const DEFAULT_DOUBLE_TAP_WINDOW_MS: number = 280;

// Axis the dominant displacement falls on.
const EDominantAxis: {
    readonly Horizontal: 'horizontal';
    readonly Vertical: 'vertical';
} = {
    Horizontal: 'horizontal',
    Vertical: 'vertical',
};
type EDominantAxis = (typeof EDominantAxis)[keyof typeof EDominantAxis];

type GestureStart = Readonly<{
    pointerId: number;
    clientX: number;
    clientY: number;
}>;

// Resolve a swipe from start-to-end displacement, or None when neither axis
// crosses the threshold. The dominant axis is chosen first, then the sign on
// that axis selects the direction.
function resolveSwipe(
    deltaX: number,
    deltaY: number,
    swipeThresholdPx: number,
): EGesture {
    const absoluteX: number = Math.abs(deltaX);
    const absoluteY: number = Math.abs(deltaY);

    const dominantAxis: EDominantAxis =
        absoluteX >= absoluteY ? EDominantAxis.Horizontal : EDominantAxis.Vertical;

    switch (dominantAxis) {
        case EDominantAxis.Horizontal: {
            if (absoluteX < swipeThresholdPx) {
                return EGestureValue.None;
            }
            return deltaX > 0 ? EGestureValue.SwipeRight : EGestureValue.SwipeLeft;
        }
        case EDominantAxis.Vertical: {
            if (absoluteY < swipeThresholdPx) {
                return EGestureValue.None;
            }
            return deltaY > 0 ? EGestureValue.SwipeDown : EGestureValue.SwipeUp;
        }
    }
}

export function useGesture<ElementType extends HTMLElement>({
    onGesture,
    swipeThresholdPx = DEFAULT_SWIPE_THRESHOLD_PX,
    doubleTapWindowMs = DEFAULT_DOUBLE_TAP_WINDOW_MS,
}: GestureOptions): GestureBinding<ElementType> {
    const startRef: RefObject<GestureStart | null> = useRef<GestureStart | null>(
        null,
    );
    const lastTapTimeMsRef: RefObject<number | null> = useRef<number | null>(null);

    const onPointerDown: (event: ReactPointerEvent<ElementType>) => void =
        useCallback((event: ReactPointerEvent<ElementType>): void => {
            if (startRef.current !== null) {
                return;
            }
            startRef.current = {
                pointerId: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY,
            };
        }, []);

    const onPointerUp: (event: ReactPointerEvent<ElementType>) => void =
        useCallback(
            (event: ReactPointerEvent<ElementType>): void => {
                const start: GestureStart | null = startRef.current;
                if (start === null) {
                    return;
                }
                if (start.pointerId !== event.pointerId) {
                    return;
                }
                startRef.current = null;

                const deltaX: number = event.clientX - start.clientX;
                const deltaY: number = event.clientY - start.clientY;
                const swipe: EGesture = resolveSwipe(
                    deltaX,
                    deltaY,
                    swipeThresholdPx,
                );

                if (swipe !== EGestureValue.None) {
                    lastTapTimeMsRef.current = null;
                    onGesture(swipe);
                    return;
                }

                const nowMs: number = performance.now();
                const lastTapTimeMs: number | null = lastTapTimeMsRef.current;
                const isDoubleTap: boolean =
                    lastTapTimeMs !== null &&
                    nowMs - lastTapTimeMs <= doubleTapWindowMs;

                if (isDoubleTap) {
                    lastTapTimeMsRef.current = null;
                    onGesture(EGestureValue.DoubleTap);
                    return;
                }

                lastTapTimeMsRef.current = nowMs;
            },
            [onGesture, swipeThresholdPx, doubleTapWindowMs],
        );

    // A cancelled gesture (browser took over, palm rejection, lost capture)
    // never produces a pointerup, so the start must be cleared here or the next
    // pointerdown is ignored and recognition stalls permanently. No gesture is
    // emitted on cancel.
    const onPointerCancel: (event: ReactPointerEvent<ElementType>) => void =
        useCallback((event: ReactPointerEvent<ElementType>): void => {
            const start: GestureStart | null = startRef.current;
            if (start === null) {
                return;
            }
            if (start.pointerId !== event.pointerId) {
                return;
            }
            startRef.current = null;
        }, []);

    return {
        onPointerDown,
        onPointerUp,
        onPointerCancel,
    };
}
