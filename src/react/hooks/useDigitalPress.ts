import {
    type Dispatch,
    type PointerEvent,
    type SetStateAction,
    useState,
} from 'react';

import {
    EInputInteraction,
    type InputDescriptor,
    type InputSignal,
    type InputSource,
} from '../../input';
import { EEnabledState, EPressState } from '../../state/state';
import { useInputSource } from './useInputSource';

// Shared digital-press behavior for button-like controls: pointer-captured
// press/release state plus optional typed InputSignal emission. Extracted so
// any skin (BevelButton, ActionTile, ...) reuses one implementation rather than
// duplicating the pointer handling.

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

    const inputSource: InputSource | null = useInputSource(descriptor, onSignal);

    function emitDigital(pressed: boolean, interaction: EInputInteraction): void {
        if (inputSource === null) {
            return;
        }
        inputSource.emitDigital(pressed, interaction, performance.now());
    }

    function onPointerDown(event: PointerEvent<HTMLButtonElement>): void {
        switch (enabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled:
                event.currentTarget.setPointerCapture(event.pointerId);
                setPressState(EPressState.Pressed);
                onPress?.();
                emitDigital(true, EInputInteraction.Press);
        }
    }

    function onPointerUp(): void {
        switch (enabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled:
                setPressState(EPressState.Released);
                onRelease?.();
                emitDigital(false, EInputInteraction.Release);
        }
    }

    function onPointerCancel(): void {
        switch (enabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled:
                setPressState(EPressState.Released);
                onRelease?.();
                emitDigital(false, EInputInteraction.Cancel);
        }
    }

    return { pressState, onPointerDown, onPointerUp, onPointerCancel };
}
