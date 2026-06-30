// React binding that drives the pure PointerSpine math from React pointer
// events. The hook owns no axis state in React: high-frequency values are pushed
// straight to a caller callback so renders are not forced on every pointer
// sample. A single active pointer is tracked and released on up or cancel, and
// the value is reset to centre when the gesture ends. onActiveChange fires once
// at gesture start and once at gesture end (low frequency) so a consumer can
// drive a data-attribute and gate transitions.
//
// Consumers must set `touch-action: none` on the bound element so the browser
// does not steal the gesture for scrolling or zooming; without it pointermove
// delivery is throttled and capture is lost.

import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useCallback, useRef } from 'react';

import type { Axis2D } from '../../input/InputContract';
import { resolveAxis2D } from '../../input/PointerSpine';

export type PointerControlValueListener = (value: Axis2D) => void;

export type PointerControlOptions = Readonly<{
    onValue: PointerControlValueListener;
    deadZone?: number;
    disabled?: boolean;
    onActiveChange?: (active: boolean) => void;
    // Opt-in (default false): when true the gesture only starts on the primary
    // (left/touch) button, mirroring usePointerDrag. When false/unset the
    // pointerdown handler is unchanged and starts on any button.
    primaryButtonOnly?: boolean;
}>;

export type PointerControlBinding<ElementType extends HTMLElement> = Readonly<{
    ref: RefObject<ElementType | null>;
    onPointerDown: (event: ReactPointerEvent<ElementType>) => void;
    onPointerMove: (event: ReactPointerEvent<ElementType>) => void;
    onPointerUp: (event: ReactPointerEvent<ElementType>) => void;
    onPointerCancel: (event: ReactPointerEvent<ElementType>) => void;
}>;

const CENTERED_AXIS: Axis2D = { x: 0, y: 0 };

// Primary pointer button index, matching usePointerDrag.ts. Touch pointers
// always report 0, so the opt-in gate never affects touch.
const PRIMARY_BUTTON: number = 0;

export function usePointerControl<ElementType extends HTMLElement>({
    onValue,
    deadZone = 0,
    disabled = false,
    onActiveChange,
    primaryButtonOnly = false,
}: PointerControlOptions): PointerControlBinding<ElementType> {
    const elementRef: RefObject<ElementType | null> = useRef<ElementType | null>(
        null,
    );
    const activePointerIdRef: RefObject<number | null> = useRef<number | null>(
        null,
    );

    const sample: (event: ReactPointerEvent<ElementType>) => void = useCallback(
        (event: ReactPointerEvent<ElementType>): void => {
            const element: ElementType | null = elementRef.current;
            if (element === null) {
                return;
            }
            const bounds: DOMRect = element.getBoundingClientRect();
            const value: Axis2D = resolveAxis2D(
                bounds,
                event.clientX,
                event.clientY,
                deadZone,
            );
            onValue(value);
        },
        [onValue, deadZone],
    );

    const reset: () => void = useCallback((): void => {
        onValue(CENTERED_AXIS);
    }, [onValue]);

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
                event.currentTarget.setPointerCapture(event.pointerId);
                onActiveChange?.(true);
                sample(event);
            },
            [disabled, sample, onActiveChange, primaryButtonOnly],
        );

    const onPointerMove: (event: ReactPointerEvent<ElementType>) => void =
        useCallback(
            (event: ReactPointerEvent<ElementType>): void => {
                if (activePointerIdRef.current !== event.pointerId) {
                    return;
                }
                sample(event);
            },
            [sample],
        );

    const endGesture: (event: ReactPointerEvent<ElementType>) => void = useCallback(
        (event: ReactPointerEvent<ElementType>): void => {
            if (activePointerIdRef.current !== event.pointerId) {
                return;
            }
            activePointerIdRef.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }
            reset();
            onActiveChange?.(false);
        },
        [reset, onActiveChange],
    );

    return {
        ref: elementRef,
        onPointerDown,
        onPointerMove,
        onPointerUp: endGesture,
        onPointerCancel: endGesture,
    };
}
