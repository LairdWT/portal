import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './ReadoutPanel.module.css';
import { type ReadoutPanelProps, type UiReadout } from './ReadoutPanel.types';

export function ReadoutPanel({
    label,
    readouts,
    tone,
}: ReadoutPanelProps): ReactElement {
    const rootClassName: string = [toneStyles.toneScope, styles.panel]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    const readoutClassName: string = [toneStyles.toneScope, styles.readout]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <div
            className={rootClassName}
            style={toneProperties(tone)}
            role="group"
            aria-label={label}
        >
            <span className={styles.accent} aria-hidden="true" />
            <dl className={styles.list}>
                {readouts.map((readout: UiReadout): ReactElement => {
                    const valueText: string = String(readout.value);
                    return (
                        <div
                            key={readout.id}
                            className={readoutClassName}
                            style={toneProperties(readout.tone)}
                        >
                            <dt className={styles.label}>{readout.label}</dt>
                            <dd className={styles.value}>{valueText}</dd>
                        </div>
                    );
                })}
            </dl>
        </div>
    );
}
