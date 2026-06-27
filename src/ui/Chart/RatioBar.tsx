import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { svgValue, withClass } from './Chart.helpers';
import styles from './Chart.module.css';
import { type RatioBarProps } from './Chart.types';

export function RatioBar({
    label,
    value,
    max,
    summary,
    status,
    tone,
}: RatioBarProps): ReactElement {
    const rootClassName: string = withClass(toneStyles.toneScope, styles.ratio);
    const resolvedMax: number = max ?? 1;
    // clamp(value / max, 0, 1); a non-finite value or a non-positive max paints
    // an empty fill rather than dividing by zero or emitting a NaN width.
    const fraction: number =
        Number.isFinite(value) && resolvedMax > 0
            ? Math.min(1, Math.max(0, value / resolvedMax))
            : 0;
    const fillWidth: number = fraction * 100;
    const percent: number = Math.round(fraction * 100);
    const summaryText: string =
        summary ??
        `${label}: ${String(value)} of ${String(resolvedMax)} (${String(percent)}%)`;

    return (
        <figure
            className={rootClassName}
            style={toneProperties(tone)}
            data-status={status}
        >
            <span className={styles.ratioLabel} aria-hidden="true">
                {label}
            </span>
            <svg
                className={styles.ratioTrack}
                role="img"
                aria-label={summaryText}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                shapeRendering="crispEdges"
            >
                <rect
                    className={styles.gaugeTrack}
                    x={0}
                    y={0}
                    width={100}
                    height={100}
                />
                <rect
                    className={styles.gaugeFill}
                    x={0}
                    y={0}
                    width={svgValue(fillWidth)}
                    height={100}
                >
                    <title>{`${label}: ${String(percent)}%`}</title>
                </rect>
            </svg>
            <span className={styles.ratioValue} aria-hidden="true">
                {`${String(percent)}%`}
            </span>
        </figure>
    );
}
