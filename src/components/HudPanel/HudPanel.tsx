import type { CSSProperties, ReactElement } from 'react';

import styles from './HudPanel.module.css';
import { type HudPanelProps, type HudReadout } from './HudPanel.types';

const FILL_PROPERTY: string = '--portal-bar-fill';

function clamp01(value: number): number {
    if (Number.isNaN(value)) {
        return 0;
    }
    if (value < 0) {
        return 0;
    }
    if (value > 1) {
        return 1;
    }
    return value;
}

function formatFillPercent(value01: number): string {
    const clamped: number = clamp01(value01);
    return `${String(Math.round(clamped * 100))}%`;
}

export function HudPanel({ label, readouts }: HudPanelProps): ReactElement {
    return (
        <div className={styles.panel} role="group" aria-label={label}>
            {readouts.map((readout: HudReadout): ReactElement => {
                const fill: string = formatFillPercent(readout.value01);
                const barStyle: CSSProperties = {
                    [FILL_PROPERTY]: fill,
                };
                return (
                    <div key={readout.id} className={styles.readout}>
                        <span className={styles.label}>{readout.label}</span>
                        <span className={styles.track} aria-hidden="true">
                            <span className={styles.fill} style={barStyle} />
                        </span>
                        <span className={styles.value}>{fill}</span>
                    </div>
                );
            })}
        </div>
    );
}
