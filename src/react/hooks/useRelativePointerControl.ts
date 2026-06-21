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
import { useCallback, useRef } from 'react';

import type { Axis2D } from '../../input/InputContract';
import { resolveDelta } from '../../input/PointerSpine';

export type RelativePointerControlDeltaListener = (delta: Axis2D) => void;

export type RelativePointerControlOptions = Readonly<{
    onDelta: RelativePointerControlDeltaListener;
    disabled?: boolean;
    onActiveChange?: (active: boolean) => void;
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

export function useRelativePointerControl<ElementType extends HTMLElement>({
    onDelta,
    disabled = false,
    onActiveChange,
}: RelativePointerControlOptions): RelativePointerControlBinding<ElementType> {
    const elementRef: RefObject<ElementType | null> = useRef<ElementType | null>(
        null,
    );
    const activePointerIdRef: RefObject<number | null> = useRef<number | null>(
        null,
    );
    const previousSampleRef: RefObject<PointerSample | null> =
        useRef<PointerSample | null>(null);

    const onPointerDown: (event: ReactPointerEvent<ElementType>) => void =
        useCallback(
            (event: ReactPointerEvent<ElementType>): void => {
                if (disabled) {
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
                event.currentTarget.setPointerCapture(event.pointerId);
                onActiveChange?.(true);
            },
            [disabled, onActiveChange],
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
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }
            onActiveChange?.(false);
        },
        [onActiveChange],
    );

    return {
        ref: elementRef,
        onPointerDown,
        onPointerMove,
        onPointerUp: endGesture,
        onPointerCancel: endGesture,
    };
}
