import type { ReactElement, RefObject } from 'react';

import { pulse } from '../../react/motion/motionPresets';
import { useChangeMotion } from '../../react/motion/useChangeMotion';
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
    // A changed value pulses the readout to draw the eye (reduced-motion gated
    // and reverted on unmount inside the hook); first render never animates.
    const valueRef: RefObject<HTMLSpanElement | null> =
        useChangeMotion<HTMLSpanElement>(value, pulse);
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
            <span ref={valueRef} className={styles.value}>
                {valueText}
            </span>
        </span>
    );
}
