import { type ReactElement } from 'react';

import {
    type DigitalPressBinding,
    useDigitalPress,
} from '../../react/hooks/useDigitalPress';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import styles from './ActionButton.module.css';
import { type ActionButtonProps, EBevelCorners } from './ActionButton.types';

export function ActionButton({
    label = 'A',
    bevelCorners = EBevelCorners.None,
    enabled,
    onPress,
    onRelease,
    onSignal,
    descriptor,
    primaryButtonOnly = false,
}: ActionButtonProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const press: DigitalPressBinding = useDigitalPress({
        enabled: resolvedEnabled,
        onPress,
        onRelease,
        onSignal,
        descriptor,
        primaryButtonOnly,
    });

    return (
        <button
            type="button"
            className={styles.action}
            data-pressed={press.pressState}
            data-bevel-corners={bevelCorners}
            disabled={resolvedEnabled === EEnabledState.Disabled}
            onPointerDown={press.onPointerDown}
            onPointerUp={press.onPointerUp}
            onPointerCancel={press.onPointerCancel}
        >
            <span className={styles.label}>{label}</span>
        </button>
    );
}
