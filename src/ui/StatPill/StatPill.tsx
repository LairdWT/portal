import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './StatPill.module.css';
import { type StatPillProps } from './StatPill.types';

export function StatPill({
    label,
    value,
    status,
    tone,
}: StatPillProps): ReactElement {
    const valueText: string = String(value);
    const pillLabel: string = `${label} ${valueText}`;
    const className: string = [toneStyles.toneScope, styles.pill]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    return (
        <span
            className={className}
            style={toneProperties(tone)}
            data-status={status}
            aria-label={pillLabel}
        >
            <span className={styles.accent} aria-hidden="true" />
            <span className={styles.label}>{label}</span>
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.value}>{valueText}</span>
        </span>
    );
}
