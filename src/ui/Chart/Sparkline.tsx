import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { linePoints, withClass } from './Chart.helpers';
import styles from './Chart.module.css';
import { type SparklineProps } from './Chart.types';

// Derive the role=img summary: caption, count, and endpoints.
function deriveSummary(label: string, values: readonly number[]): string {
    const first: number = values[0] ?? 0;
    const last: number = values[values.length - 1] ?? 0;
    return `${label}: ${String(values.length)} samples, from ${String(first)} to ${String(last)}`;
}

// The compact inline trend line: no frame, no axes - a decorative-scale
// series named for assistive tech through the role=img summary.
export function Sparkline({
    label,
    values,
    filled,
    status,
    tone,
}: SparklineProps): ReactElement {
    const rootClassName: string = withClass(toneStyles.toneScope, styles.sparkline);
    if (values.length === 0) {
        return (
            <span
                className={rootClassName}
                style={toneProperties(tone)}
                role="img"
                aria-label={`${label}: no samples`}
                data-status={status}
            />
        );
    }
    const points: string = linePoints(values);
    return (
        <span
            className={rootClassName}
            style={toneProperties(tone)}
            role="img"
            aria-label={deriveSummary(label, values)}
            data-status={status}
        >
            <svg
                className={styles.sparklineChart}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                {filled === true ? (
                    <polygon
                        className={styles.sparkArea}
                        points={`0,100 ${points} 100,100`}
                    />
                ) : null}
                <polyline className={styles.sparkLine} points={points} />
            </svg>
        </span>
    );
}
