import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { svgValue, withClass } from './Chart.helpers';
import styles from './Chart.module.css';
import { type BarChartProps, EChartA11yDetail } from './Chart.types';

// Slot fraction a bar occupies within its column; the remainder is the gap.
const BAR_FILL: number = 0.72;

// Derive the role=img summary: caption, count, value range, and peak.
function deriveSummary(label: string, values: readonly number[]): string {
    const peak: number = Math.max(...values);
    const low: number = Math.min(...values);
    return `${label}: ${String(values.length)} values, range ${String(low)} to ${String(peak)}, peak ${String(peak)}`;
}

export function BarChart({
    label,
    values,
    summary,
    emptyLabel,
    detail,
    status,
    tone,
}: BarChartProps): ReactElement {
    const rootClassName: string = withClass(toneStyles.toneScope, styles.barChart);
    const isEmpty: boolean = values.length === 0;
    const resolvedDetail: EChartA11yDetail = detail ?? EChartA11yDetail.Summary;

    if (isEmpty) {
        const emptyText: string = emptyLabel ?? 'No samples';
        return (
            <figure
                className={rootClassName}
                style={toneProperties(tone)}
                data-status={status}
            >
                <figcaption className={styles.caption}>{label}</figcaption>
                <p className={styles.empty}>{emptyText}</p>
            </figure>
        );
    }

    const peak: number = Math.max(...values);
    // Sanitize the divisor at the boundary: a non-finite peak (an Infinity in the
    // series) or a non-positive peak yields zero-height bars rather than a NaN
    // attribute. Per-value finiteness is checked again below.
    const safePeak: number = Number.isFinite(peak) && peak > 0 ? peak : 0;
    const slot: number = 100 / values.length;
    const barWidth: number = slot * BAR_FILL;
    const inset: number = (slot - barWidth) / 2;
    const summaryText: string = summary ?? deriveSummary(label, values);

    return (
        <figure
            className={rootClassName}
            style={toneProperties(tone)}
            data-status={status}
        >
            <figcaption className={styles.caption}>{label}</figcaption>
            <svg
                className={styles.chart}
                role="img"
                aria-label={summaryText}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                shapeRendering="crispEdges"
            >
                {values.map((value: number, index: number): ReactElement => {
                    const fraction: number =
                        Number.isFinite(value) && safePeak > 0
                            ? value / safePeak
                            : 0;
                    const height: number = Math.min(
                        100,
                        Math.max(0, fraction * 100),
                    );
                    const x: number = index * slot + inset;
                    const y: number = 100 - height;
                    return (
                        <rect
                            key={index}
                            className={styles.bar}
                            x={svgValue(x)}
                            y={svgValue(y)}
                            width={svgValue(barWidth)}
                            height={svgValue(height)}
                        >
                            <title>{String(value)}</title>
                        </rect>
                    );
                })}
            </svg>
            {resolvedDetail === EChartA11yDetail.Table ? (
                <table className={styles.visuallyHidden}>
                    <caption>{summaryText}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Sample</th>
                            <th scope="col">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {values.map(
                            (value: number, index: number): ReactElement => (
                                <tr key={index}>
                                    <td>{String(index + 1)}</td>
                                    <td>{String(value)}</td>
                                </tr>
                            ),
                        )}
                    </tbody>
                </table>
            ) : null}
        </figure>
    );
}
