import { type ReactElement } from 'react';

import {
    type DigitalPressBinding,
    useDigitalPress,
} from '../../react/hooks/useDigitalPress';
import { EEnabledState } from '../../state/state';
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
    const {
        pressState,
        onPointerDown,
        onPointerUp,
        onPointerCancel,
    }: DigitalPressBinding = useDigitalPress({
        enabled,
        onPress,
        onRelease,
        onSignal,
        descriptor,
    });

    return (
        <button
            type="button"
            className={styles.bevel}
            data-pressed={pressState}
            disabled={enabled === EEnabledState.Disabled}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
        >
            {children}
        </button>
    );
}
