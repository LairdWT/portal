// Generic React pointer-drag / resize primitive built directly on the DOM
// Pointer Events API. It is the single shared engine the P3 layout shells reuse:
// SplitPane (divider resize, one axis -> fraction), Drawer (edge resize, one
// axis -> size), and Window (title-bar MOVE on two axes + edge/corner resize).
//
// Design (mirrors the discipline of usePointerControl without importing the
// fenced React-free game-input core in src/input):
//   - A SINGLE active pointer. pointerdown ignores secondary buttons
//     (event.button !== 0) and any pointerdown while a drag is already active.
//   - setPointerCapture is taken on pointerdown so the gesture keeps tracking
//     even when the pointer leaves the grip; move/up/cancel listeners are added
//     to the captured element and torn down on end.
//   - A cumulative-delta CALLBACK model: onDrag receives the live pointer
//     position, the cumulative delta from the gesture origin, the origin, and the
//     element bounds measured at gesture start. The hook holds NO per-move React
//     state - the consumer derives its own value (fraction, size, or position)
//     and owns the single state write per move. No setState lives in here.
//   - pointercancel shares the pointerup teardown so a lifted or interrupted
//     pointer never sticks.
//   - Optional axis lock zeroes the cross-axis delta for single-axis consumers.
//   - A disabled guard short-circuits pointerdown (negative-first).
//   - FULL cleanup: capture released and every listener removed on drag end AND
//     on unmount mid-drag.
//
// Consumers MUST set `touch-action: none` on the bound element so the browser
// does not steal the gesture for scrolling or zooming; without it pointermove
// delivery is throttled and capture is lost.

import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';

// Lock a gesture to a single axis. 'x' keeps horizontal movement (dy forced to
// 0); 'y' keeps vertical movement (dx forced to 0). Omit for a free 2-axis drag.
export type PointerDragAxis = 'x' | 'y';

// The per-move sample handed to every drag callback. dx/dy are the cumulative
// delta from the gesture origin (after any axis lock); x/y are the live pointer
// client coordinates; originX/originY are the pointer client coordinates at
// gesture start; bounds is the bound element's getBoundingClientRect measured
// once at gesture start (it does NOT re-measure mid-drag).
export type PointerDragState = Readonly<{
    dx: number;
    dy: number;
    x: number;
    y: number;
    originX: number;
    originY: number;
    bounds: DOMRect;
}>;

export type PointerDragOptions = Readonly<{
    // Per-move callback. Fired on every pointermove for the active pointer.
    onDrag: (state: PointerDragState) => void;
    // Low-frequency lifecycle hook, fired once on pointerdown after capture.
    onDragStart?: (state: PointerDragState) => void;
    // Low-frequency lifecycle hook, fired once on pointerup/pointercancel after
    // capture release. NOT fired on unmount mid-drag (the consumer is gone).
    onDragEnd?: (state: PointerDragState) => void;
    // Negative-first guard: when true, pointerdown is a no-op.
    disabled?: boolean;
    // Optional single-axis lock for divider/edge resize consumers.
    axisLock?: PointerDragAxis;
}>;

// The stable handler set the consumer attaches. Only onPointerDown is owned by
// the hook; move/up/cancel are managed internally via pointer capture. The
// consumer attaches onPointerDown to the grip element (and may attach its own
// ref to that element independently).
export type PointerDragBinding<ElementType extends HTMLElement> = Readonly<{
    onPointerDown: (event: ReactPointerEvent<ElementType>) => void;
}>;

const PRIMARY_BUTTON: number = 0;

type ActiveDrag = Readonly<{
    pointerId: number;
    element: HTMLElement;
    originX: number;
    originY: number;
    bounds: DOMRect;
    handleMove: (event: PointerEvent) => void;
    handleEnd: (event: PointerEvent) => void;
}>;

export function usePointerDrag<ElementType extends HTMLElement>(
    options: PointerDragOptions,
): PointerDragBinding<ElementType> {
    // Latest options are mirrored into a ref so the internally-added native
    // listeners and the stable onPointerDown always call the current callbacks
    // without re-binding (onPointerDown stays referentially stable).
    const optionsRef: { current: PointerDragOptions } = useRef(options);
    useEffect((): void => {
        optionsRef.current = options;
    });

    const activeDragRef: { current: ActiveDrag | null } = useRef<ActiveDrag | null>(
        null,
    );

    const buildState: (
        drag: ActiveDrag,
        clientX: number,
        clientY: number,
    ) => PointerDragState = useCallback(
        (drag: ActiveDrag, clientX: number, clientY: number): PointerDragState => {
            const axisLock: PointerDragAxis | undefined =
                optionsRef.current.axisLock;
            const rawDx: number = clientX - drag.originX;
            const rawDy: number = clientY - drag.originY;
            return {
                dx: axisLock === 'y' ? 0 : rawDx,
                dy: axisLock === 'x' ? 0 : rawDy,
                x: clientX,
                y: clientY,
                originX: drag.originX,
                originY: drag.originY,
                bounds: drag.bounds,
            };
        },
        [],
    );

    // Release capture + remove every listener. Shared by the end handler and the
    // unmount cleanup so neither path can leak a listener or a held capture.
    const teardown: (drag: ActiveDrag) => void = useCallback(
        (drag: ActiveDrag): void => {
            drag.element.removeEventListener('pointermove', drag.handleMove);
            drag.element.removeEventListener('pointerup', drag.handleEnd);
            drag.element.removeEventListener('pointercancel', drag.handleEnd);
            if (drag.element.hasPointerCapture(drag.pointerId)) {
                drag.element.releasePointerCapture(drag.pointerId);
            }
            activeDragRef.current = null;
        },
        [],
    );

    const onPointerDown: (event: ReactPointerEvent<ElementType>) => void =
        useCallback(
            (event: ReactPointerEvent<ElementType>): void => {
                const current: PointerDragOptions = optionsRef.current;
                if (current.disabled === true) {
                    return;
                }
                if (event.button !== PRIMARY_BUTTON) {
                    return;
                }
                if (activeDragRef.current !== null) {
                    return;
                }

                const element: ElementType = event.currentTarget;
                const pointerId: number = event.pointerId;
                const originX: number = event.clientX;
                const originY: number = event.clientY;
                const bounds: DOMRect = element.getBoundingClientRect();

                const handleMove: (moveEvent: PointerEvent) => void = (
                    moveEvent: PointerEvent,
                ): void => {
                    const drag: ActiveDrag | null = activeDragRef.current;
                    if (drag === null) {
                        return;
                    }
                    if (moveEvent.pointerId !== drag.pointerId) {
                        return;
                    }
                    optionsRef.current.onDrag(
                        buildState(drag, moveEvent.clientX, moveEvent.clientY),
                    );
                };

                const handleEnd: (endEvent: PointerEvent) => void = (
                    endEvent: PointerEvent,
                ): void => {
                    const drag: ActiveDrag | null = activeDragRef.current;
                    if (drag === null) {
                        return;
                    }
                    if (endEvent.pointerId !== drag.pointerId) {
                        return;
                    }
                    const finalState: PointerDragState = buildState(
                        drag,
                        endEvent.clientX,
                        endEvent.clientY,
                    );
                    teardown(drag);
                    optionsRef.current.onDragEnd?.(finalState);
                };

                const drag: ActiveDrag = {
                    pointerId,
                    element,
                    originX,
                    originY,
                    bounds,
                    handleMove,
                    handleEnd,
                };
                // Take the capture BEFORE marking the drag active: if
                // setPointerCapture throws (the pointer is no longer active),
                // activeDragRef stays null and listeners stay unattached, so a
                // failed start cannot permanently lock out every future drag.
                element.setPointerCapture(pointerId);
                activeDragRef.current = drag;
                element.addEventListener('pointermove', handleMove);
                element.addEventListener('pointerup', handleEnd);
                element.addEventListener('pointercancel', handleEnd);

                current.onDragStart?.(buildState(drag, originX, originY));
            },
            [buildState, teardown],
        );

    // Cleanup on unmount mid-drag: release capture and remove listeners. The
    // consumer is unmounting, so onDragEnd is intentionally NOT fired.
    useEffect((): (() => void) => {
        return (): void => {
            const drag: ActiveDrag | null = activeDragRef.current;
            if (drag === null) {
                return;
            }
            teardown(drag);
        };
    }, [teardown]);

    return { onPointerDown };
}
