import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Spinner.module.css';
import { ESpinnerSize, type SpinnerProps } from './Spinner.types';

// The compact inline busy indicator. role=status announces the label
// politely; the arc itself is decorative.
export function Spinner({ label, size, tone }: SpinnerProps): ReactElement {
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    return (
        <span
            className={className}
            style={toneProperties(tone)}
            role="status"
            aria-label={label ?? 'Loading'}
            data-size={size ?? ESpinnerSize.Md}
        >
            <span className={styles.arc} aria-hidden="true" />
        </span>
    );
}
