import { type ReactElement } from 'react';

import {
    type DigitalPressBinding,
    useDigitalPress,
} from '../../react/hooks/useDigitalPress';
import { EEnabledState } from '../../state/state';
import styles from './ActionButton.module.css';
import { type ActionButtonProps, EBevelCorners } from './ActionButton.types';

export function ActionButton({
    label,
    bevelCorners = EBevelCorners.None,
    enabled = EEnabledState.Enabled,
    onPress,
    onRelease,
    onSignal,
    descriptor,
}: ActionButtonProps): ReactElement {
    const press: DigitalPressBinding = useDigitalPress({
        enabled,
        onPress,
        onRelease,
        onSignal,
        descriptor,
    });

    return (
        <button
            type="button"
            className={styles.action}
            data-pressed={press.pressState}
            data-bevel-corners={bevelCorners}
            disabled={enabled === EEnabledState.Disabled}
            onPointerDown={press.onPointerDown}
            onPointerUp={press.onPointerUp}
            onPointerCancel={press.onPointerCancel}
        >
            <span className={styles.label}>{label}</span>
        </button>
    );
}
