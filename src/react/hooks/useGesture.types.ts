// Exported types for the useGesture hook.
//
// EGesture is an E-prefixed const-object enum (no TS enum) so it survives
// erasable-only syntax and stays a plain runtime value. The hook reports a
// single resolved gesture per recognized interaction; None exists as the
// neutral resting value for consumers that want to model "no gesture yet".

import type { PointerEvent as ReactPointerEvent } from 'react';

// Recognized gesture kinds. Swipes are resolved by dominant-axis displacement;
// DoubleTap is resolved by two quick taps inside the configured window.
export const EGesture: {
    readonly None: 'none';
    readonly SwipeUp: 'swipe-up';
    readonly SwipeDown: 'swipe-down';
    readonly SwipeLeft: 'swipe-left';
    readonly SwipeRight: 'swipe-right';
    readonly DoubleTap: 'double-tap';
} = {
    None: 'none',
    SwipeUp: 'swipe-up',
    SwipeDown: 'swipe-down',
    SwipeLeft: 'swipe-left',
    SwipeRight: 'swipe-right',
    DoubleTap: 'double-tap',
};
export type EGesture = (typeof EGesture)[keyof typeof EGesture];

// Listener invoked once per recognized gesture. None is never emitted; it is a
// resting value for consumer state only.
export type GestureListener = (gesture: EGesture) => void;

export type GestureOptions = Readonly<{
    onGesture: GestureListener;
    swipeThresholdPx?: number;
    doubleTapWindowMs?: number;
}>;

// Pointer handlers the consumer spreads onto the gesture surface. Only down and
// up are needed: swipe is the down-to-up displacement and double-tap is the gap
// between two ups, so no move sampling is required.
export type GestureBinding<ElementType extends HTMLElement> = Readonly<{
    onPointerDown: (event: ReactPointerEvent<ElementType>) => void;
    onPointerUp: (event: ReactPointerEvent<ElementType>) => void;
    onPointerCancel: (event: ReactPointerEvent<ElementType>) => void;
}>;
