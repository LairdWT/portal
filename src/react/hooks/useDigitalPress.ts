import {
    type Dispatch,
    type PointerEvent,
    type SetStateAction,
    useCallback,
    useMemo,
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
}>;

export type DigitalPressBinding = Readonly<{
    pressState: EPressState;
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
}>;

export function useDigitalPress({
    enabled,
    onPress,
    onRelease,
    onSignal,
    descriptor,
}: DigitalPressOptions): DigitalPressBinding {
    const [pressState, setPressState]: [
        EPressState,
        Dispatch<SetStateAction<EPressState>>,
    ] = useState<EPressState>(EPressState.Released);

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
                switch (enabled) {
                    case EEnabledState.Disabled:
                        return;
                    case EEnabledState.Enabled:
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setPressState(EPressState.Pressed);
                        onPress?.();
                        emitDigital(true, EInputInteraction.Press);
                }
            },
            [enabled, onPress, emitDigital],
        );

    const onPointerUp: () => void = useCallback((): void => {
        switch (enabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled:
                setPressState(EPressState.Released);
                onRelease?.();
                emitDigital(false, EInputInteraction.Release);
        }
    }, [enabled, onRelease, emitDigital]);

    const onPointerCancel: () => void = useCallback((): void => {
        switch (enabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled:
                setPressState(EPressState.Released);
                onRelease?.();
                emitDigital(false, EInputInteraction.Cancel);
        }
    }, [enabled, onRelease, emitDigital]);

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
