import { type ReactElement, type RefObject } from 'react';

import { pulse } from '../../react/motion/motionPresets';
import { useChangeMotion } from '../../react/motion/useChangeMotion';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './StatTile.module.css';
import {
    composeStatName,
    EStatTileEmphasis,
    type StatTileProps,
} from './StatTile.types';

export function StatTile({
    label,
    value,
    unit,
    delta,
    emphasis = EStatTileEmphasis.Hero,
    status,
    tone,
}: StatTileProps): ReactElement {
    // A changed value pulses the readout to draw the eye (reduced-motion gated
    // and reverted on unmount inside the hook); first render never animates.
    const valueRef: RefObject<HTMLSpanElement | null> =
        useChangeMotion<HTMLSpanElement>(value, pulse);
    const valueText: string = String(value);
    const accessibleName: string = composeStatName(label, valueText, unit, delta);
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    return (
        <div
            className={className}
            style={toneProperties(tone)}
            role="group"
            aria-label={accessibleName}
            data-emphasis={emphasis}
            data-status={status}
        >
            {emphasis === EStatTileEmphasis.Hero ? (
                <span className={styles.accentRule} aria-hidden="true" />
            ) : null}
            <span ref={valueRef} className={styles.value}>
                {valueText}
                {unit !== undefined ? (
                    <span className={styles.unit}> {unit}</span>
                ) : null}
            </span>
            <span className={styles.label}>{label}</span>
            {delta !== undefined ? (
                <span className={styles.delta} data-trend={delta.trend}>
                    <span className={styles.caret} aria-hidden="true" />
                    <span className={styles.deltaValue}>{delta.value}</span>
                </span>
            ) : null}
        </div>
    );
}
