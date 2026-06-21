import { type ReactElement } from 'react';

import {
    type DigitalPressBinding,
    useDigitalPress,
} from '../../react/hooks/useDigitalPress';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import styles from './BevelButton.module.css';
import { type BevelButtonProps } from './BevelButton.types';

export function BevelButton({
    children,
    enabled,
    onPress,
    onRelease,
    onSignal,
    descriptor,
}: BevelButtonProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const {
        pressState,
        onPointerDown,
        onPointerUp,
        onPointerCancel,
    }: DigitalPressBinding = useDigitalPress({
        enabled: resolvedEnabled,
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
            disabled={resolvedEnabled === EEnabledState.Disabled}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
        >
            {children}
        </button>
    );
}
