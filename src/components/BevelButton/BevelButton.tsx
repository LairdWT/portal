import {
    type Dispatch,
    type PointerEvent,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EInputInteraction, type InputSource } from '../../input';
import { useInputSource } from '../../react/hooks/useInputSource';
import { EEnabledState, EPressState } from '../../state/state';
import styles from './BevelButton.module.css';
import { type BevelButtonProps } from './BevelButton.types';

export function BevelButton({
    children,
    enabled = EEnabledState.Enabled,
    onPress,
    onRelease,
    onSignal,
    descriptor,
}: BevelButtonProps): ReactElement {
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

    function handlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
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

    function handlePointerUp(): void {
        switch (enabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled:
                setPressState(EPressState.Released);
                onRelease?.();
                emitDigital(false, EInputInteraction.Release);
        }
    }

    function handlePointerCancel(): void {
        switch (enabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled:
                setPressState(EPressState.Released);
                onRelease?.();
                emitDigital(false, EInputInteraction.Cancel);
        }
    }

    return (
        <button
            type="button"
            className={styles.bevel}
            data-pressed={pressState}
            disabled={enabled === EEnabledState.Disabled}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
        >
            {children}
        </button>
    );
}
