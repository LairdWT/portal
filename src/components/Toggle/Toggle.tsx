import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EInputInteraction } from '../../input';
import { type EmitBinding, useEmitBinding } from '../../react/hooks/useEmitBinding';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
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
    enabled,
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

    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isChecked: boolean = currentChecked === ECheckedState.Checked;
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const { emitDigital }: EmitBinding = useEmitBinding(descriptor, onSignal);

    function handleClick(): void {
        switch (resolvedEnabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled: {
                const next: ECheckedState = nextCheckedState(currentChecked);
                if (!isControlled) {
                    setInternalChecked(next);
                }
                onChange?.(next);
                const pressed: boolean = next === ECheckedState.Checked;
                const interaction: EInputInteraction = pressed
                    ? EInputInteraction.Press
                    : EInputInteraction.Release;
                emitDigital(pressed, interaction);
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
