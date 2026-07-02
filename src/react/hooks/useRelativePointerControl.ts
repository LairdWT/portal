// React binding that drives the pure resolveDelta math from React pointer
// events for a RELATIVE (trackpad / camera-look) surface. The hook owns no axis
// state in React: per-sample deltas are pushed straight to a caller callback so
// renders are not forced on every pointer sample. A single active pointer is
// tracked and released on up or cancel. Unlike usePointerControl this hook does
// NOT emit a reset value when the gesture ends: a relative surface has no
// fixed origin to spring back to. onActiveChange fires once at gesture start and
// once at gesture end so a consumer can drive a data-attribute and gate
// transitions.
//
// Consumers must set `touch-action: none` on the bound element so the browser
// does not steal the gesture for scrolling or zooming; without it pointermove
// delivery is throttled and capture is lost.

import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import type { Axis2D } from '../../input/InputContract';
import { resolveDelta } from '../../input/PointerSpine';

export type RelativePointerControlDeltaListener = (delta: Axis2D) => void;

export type RelativePointerControlOptions = Readonly<{
    onDelta: RelativePointerControlDeltaListener;
    disabled?: boolean;
    onActiveChange?: (active: boolean) => void;
    // Opt-in (default false): when true the gesture only starts on the primary
    // (left/touch) button, mirroring usePointerDrag. When false/unset the
    // pointerdown handler is unchanged and starts on any button.
    primaryButtonOnly?: boolean;
}>;

export type RelativePointerControlBinding<ElementType extends HTMLElement> =
    Readonly<{
        ref: RefObject<ElementType | null>;
        onPointerDown: (event: ReactPointerEvent<ElementType>) => void;
        onPointerMove: (event: ReactPointerEvent<ElementType>) => void;
        onPointerUp: (event: ReactPointerEvent<ElementType>) => void;
        onPointerCancel: (event: ReactPointerEvent<ElementType>) => void;
    }>;

type PointerSample = Readonly<{
    clientX: number;
    clientY: number;
}>;

// Primary pointer button index, matching usePointerDrag.ts. Touch pointers
// always report 0, so the opt-in gate never affects touch.
const PRIMARY_BUTTON: number = 0;

export function useRelativePointerControl<ElementType extends HTMLElement>({
    onDelta,
    disabled = false,
    onActiveChange,
    primaryButtonOnly = false,
}: RelativePointerControlOptions): RelativePointerControlBinding<ElementType> {
    const elementRef: RefObject<ElementType | null> = useRef<ElementType | null>(
        null,
    );
    const activePointerIdRef: RefObject<number | null> = useRef<number | null>(
        null,
    );
    const previousSampleRef: RefObject<PointerSample | null> =
        useRef<PointerSample | null>(null);
    // The element that took the capture, tracked separately from elementRef so an
    // unmount-mid-gesture cleanup can still release it even after React has
    // detached the DOM ref.
    const capturedElementRef: RefObject<ElementType | null> =
        useRef<ElementType | null>(null);

    const onPointerDown: (event: ReactPointerEvent<ElementType>) => void =
        useCallback(
            (event: ReactPointerEvent<ElementType>): void => {
                if (disabled) {
                    return;
                }
                if (primaryButtonOnly && event.button !== PRIMARY_BUTTON) {
                    return;
                }
                if (activePointerIdRef.current !== null) {
                    return;
                }
                activePointerIdRef.current = event.pointerId;
                previousSampleRef.current = {
                    clientX: event.clientX,
                    clientY: event.clientY,
                };
                capturedElementRef.current = event.currentTarget;
                event.currentTarget.setPointerCapture(event.pointerId);
                onActiveChange?.(true);
            },
            [disabled, onActiveChange, primaryButtonOnly],
        );

    const onPointerMove: (event: ReactPointerEvent<ElementType>) => void =
        useCallback(
            (event: ReactPointerEvent<ElementType>): void => {
                if (activePointerIdRef.current !== event.pointerId) {
                    return;
                }
                const element: ElementType | null = elementRef.current;
                if (element === null) {
                    return;
                }
                const previousSample: PointerSample | null =
                    previousSampleRef.current;
                if (previousSample === null) {
                    return;
                }
                const bounds: DOMRect = element.getBoundingClientRect();
                const delta: Axis2D = resolveDelta(
                    bounds,
                    previousSample.clientX,
                    previousSample.clientY,
                    event.clientX,
                    event.clientY,
                );
                previousSampleRef.current = {
                    clientX: event.clientX,
                    clientY: event.clientY,
                };
                onDelta(delta);
            },
            [onDelta],
        );

    const endGesture: (event: ReactPointerEvent<ElementType>) => void = useCallback(
        (event: ReactPointerEvent<ElementType>): void => {
            if (activePointerIdRef.current !== event.pointerId) {
                return;
            }
            activePointerIdRef.current = null;
            previousSampleRef.current = null;
            capturedElementRef.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }
            onActiveChange?.(false);
        },
        [onActiveChange],
    );

    // Defense-in-depth cleanup, mirroring usePointerDrag's unmount teardown: if
    // the component unmounts mid-gesture the pointerup/pointercancel that would
    // release the capture never arrives, so release any still-held capture here
    // and reset the active-pointer state. onActiveChange is intentionally NOT
    // fired (the consumer is gone). No behavior change outside this path.
    useEffect((): (() => void) => {
        return (): void => {
            const activePointerId: number | null = activePointerIdRef.current;
            if (activePointerId === null) {
                return;
            }
            activePointerIdRef.current = null;
            previousSampleRef.current = null;
            const capturedElement: ElementType | null = capturedElementRef.current;
            capturedElementRef.current = null;
            if (capturedElement === null) {
                return;
            }
            if (!capturedElement.hasPointerCapture(activePointerId)) {
                return;
            }
            capturedElement.releasePointerCapture(activePointerId);
        };
    }, []);

    return {
        ref: elementRef,
        onPointerDown,
        onPointerMove,
        onPointerUp: endGesture,
        onPointerCancel: endGesture,
    };
}
