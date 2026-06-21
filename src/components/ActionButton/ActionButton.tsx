import { type ReactElement } from 'react';

import { BevelButton } from '../BevelButton/BevelButton';
import styles from './ActionButton.module.css';
import { type ActionButtonProps } from './ActionButton.types';

export function ActionButton({
    label,
    enabled,
    onPress,
    onRelease,
    onSignal,
    descriptor,
}: ActionButtonProps): ReactElement {
    return (
        <BevelButton
            enabled={enabled}
            onPress={onPress}
            onRelease={onRelease}
            onSignal={onSignal}
            descriptor={descriptor}
        >
            <span className={styles.label}>{label}</span>
        </BevelButton>
    );
}
