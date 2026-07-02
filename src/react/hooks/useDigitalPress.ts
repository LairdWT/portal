import {
    type Dispatch,
    type PointerEvent,
    type RefObject,
    type SetStateAction,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    EInputInteraction,
    type InputDescriptor,
    type InputSignal,
    type InputSource,
    type TimeProvider,
} from '../../input';
import { EEnabledState, EPressState } from '../../state/state';
import { useTimeProvider } from '../TimeProviderContext';
import { useInputSource } from './useInputSource';

// Shared digital-press behavior for button-like controls: pointer-captured
// press/release state plus optional typed InputSignal emission. Extracted so any
// skin (BevelButton, ActionButton, ...) reuses one implementation rather than
// duplicating the pointer handling. Handlers and the returned binding are
// referentially stable across renders whose inputs are unchanged, so the
// producer is not torn down on cosmetic re-renders. The wire timestamp comes
// from the ambient TimeProvider (default performance.now), kept injectable.

export type DigitalPressOptions = Readonly<{
    enabled: EEnabledState;
    onPress?: (() => void) | undefined;
    onRelease?: (() => void) | undefined;
    onSignal?: ((signal: InputSignal) => void) | undefined;
    descriptor?: InputDescriptor | undefined;
    // Opt-in (default false): when true the press only starts on the primary
    // (left/touch) button, mirroring usePointerDrag. When false/unset the
    // pointerdown handler is unchanged and starts a press on any button.
    primaryButtonOnly?: boolean | undefined;
}>;

// Primary pointer button index, matching usePointerDrag.ts. Touch pointers
// always report 0, so the opt-in gate never affects touch.
const PRIMARY_BUTTON: number = 0;

export type DigitalPressBinding = Readonly<{
    pressState: EPressState;
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
    // The event parameter is optional so pre-1.2.1 call sites that invoke the
    // release handlers bare stay valid; with an event, the release is scoped to
    // the pointer that started the press, so a second touch on the same control
    // can neither double-start nor end another finger's held press.
    onPointerUp: (event?: PointerEvent<HTMLButtonElement>) => void;
    onPointerCancel: (event?: PointerEvent<HTMLButtonElement>) => void;
}>;

export function useDigitalPress({
    enabled,
    onPress,
    onRelease,
    onSignal,
    descriptor,
    primaryButtonOnly = false,
}: DigitalPressOptions): DigitalPressBinding {
    const [pressState, setPressState]: [
        EPressState,
        Dispatch<SetStateAction<EPressState>>,
    ] = useState<EPressState>(EPressState.Released);

    // The single active pointer. A press is owned by the pointer that started
    // it: later pointerdowns are ignored while it is held, and a release only
    // counts when it comes from the owning pointer (or from a bare legacy call
    // with no event to compare).
    const activePointerRef: RefObject<number | null> = useRef<number | null>(null);

    const timeProvider: TimeProvider = useTimeProvider();
    const inputSource: InputSource | null = useInputSource(
        descriptor,
        onSignal,
        timeProvider,
    );

    const emitDigital: (pressed: boolean, interaction: EInputInteraction) => void =
        useCallback(
            (pressed: boolean, interaction: EInputInteraction): void => {
                if (inputSource === null) {
                    return;
                }
                inputSource.emitDigital(pressed, interaction);
            },
            [inputSource],
        );

    const onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void =
        useCallback(
            (event: PointerEvent<HTMLButtonElement>): void => {
                if (primaryButtonOnly && event.button !== PRIMARY_BUTTON) {
                    return;
                }
                if (activePointerRef.current !== null) {
                    return;
                }
                switch (enabled) {
                    case EEnabledState.Disabled:
                        return;
                    case EEnabledState.Enabled:
                        activePointerRef.current = event.pointerId;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setPressState(EPressState.Pressed);
                        onPress?.();
                        emitDigital(true, EInputInteraction.Press);
                }
            },
            [enabled, onPress, emitDigital, primaryButtonOnly],
        );

    const onPointerUp: (event?: PointerEvent<HTMLButtonElement>) => void =
        useCallback(
            (event?: PointerEvent<HTMLButtonElement>): void => {
                if (activePointerRef.current === null) {
                    return;
                }
                if (
                    event !== undefined &&
                    event.pointerId !== activePointerRef.current
                ) {
                    return;
                }
                switch (enabled) {
                    case EEnabledState.Disabled:
                        // Release the ownership even though the disabled control
                        // emits nothing, so a press interrupted by disablement
                        // cannot latch the pointer and dead-lock future presses.
                        activePointerRef.current = null;
                        return;
                    case EEnabledState.Enabled:
                        activePointerRef.current = null;
                        setPressState(EPressState.Released);
                        onRelease?.();
                        emitDigital(false, EInputInteraction.Release);
                }
            },
            [enabled, onRelease, emitDigital],
        );

    const onPointerCancel: (event?: PointerEvent<HTMLButtonElement>) => void =
        useCallback(
            (event?: PointerEvent<HTMLButtonElement>): void => {
                if (activePointerRef.current === null) {
                    return;
                }
                if (
                    event !== undefined &&
                    event.pointerId !== activePointerRef.current
                ) {
                    return;
                }
                switch (enabled) {
                    case EEnabledState.Disabled:
                        // Same dead-lock guard as onPointerUp: ownership must not
                        // outlive a press the disabled control will never finish.
                        activePointerRef.current = null;
                        return;
                    case EEnabledState.Enabled:
                        activePointerRef.current = null;
                        setPressState(EPressState.Released);
                        onRelease?.();
                        emitDigital(false, EInputInteraction.Cancel);
                }
            },
            [enabled, onRelease, emitDigital],
        );

    return useMemo<DigitalPressBinding>(
        (): DigitalPressBinding => ({
            pressState,
            onPointerDown,
            onPointerUp,
            onPointerCancel,
        }),
        [pressState, onPointerDown, onPointerUp, onPointerCancel],
    );
}
