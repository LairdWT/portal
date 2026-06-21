import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EInputInteraction, type InputSource } from '../../input';
import { useInputSource } from '../../react/hooks/useInputSource';
import { EEnabledState } from '../../state/state';
import styles from './Toggle.module.css';
import { ECheckedState, type ToggleProps } from './Toggle.types';

function nextCheckedState(current: ECheckedState): ECheckedState {
    switch (current) {
        case ECheckedState.Checked:
            return ECheckedState.Unchecked;
        case ECheckedState.Unchecked:
            return ECheckedState.Checked;
    }
}

export function Toggle({
    label,
    checked,
    defaultChecked = ECheckedState.Unchecked,
    enabled = EEnabledState.Enabled,
    onChange,
    onSignal,
    descriptor,
}: ToggleProps): ReactElement {
    // Controlled when the consumer supplies `checked`; otherwise the component
    // owns its state, seeded once from `defaultChecked`. currentChecked drives
    // the ARIA and data-attribute the CSS reads, so the knob now moves on click
    // in both modes.
    const isControlled: boolean = checked !== undefined;
    const [internalChecked, setInternalChecked]: [
        ECheckedState,
        Dispatch<SetStateAction<ECheckedState>>,
    ] = useState<ECheckedState>(defaultChecked);
    const currentChecked: ECheckedState = checked ?? internalChecked;

    const isChecked: boolean = currentChecked === ECheckedState.Checked;
    const isDisabled: boolean = enabled === EEnabledState.Disabled;
    const inputSource: InputSource | null = useInputSource(descriptor, onSignal);

    function emitDigital(pressed: boolean): void {
        if (inputSource === null) {
            return;
        }
        const interaction: EInputInteraction = pressed
            ? EInputInteraction.Press
            : EInputInteraction.Release;
        inputSource.emitDigital(pressed, interaction, performance.now());
    }

    function handleClick(): void {
        switch (enabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled: {
                const next: ECheckedState = nextCheckedState(currentChecked);
                if (!isControlled) {
                    setInternalChecked(next);
                }
                onChange?.(next);
                emitDigital(next === ECheckedState.Checked);
            }
        }
    }

    return (
        <button
            type="button"
            role="switch"
            className={styles.toggle}
            disabled={isDisabled}
            aria-checked={isChecked}
            aria-label={label}
            data-checked={currentChecked}
            onClick={handleClick}
        >
            <span className={styles.track} aria-hidden="true">
                <span className={styles.knob} />
            </span>
            <span className={styles.label}>{label}</span>
        </button>
    );
}
