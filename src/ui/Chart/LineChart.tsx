import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { linePoints, withClass } from './Chart.helpers';
import styles from './Chart.module.css';
import { EChartA11yDetail, type LineChartProps } from './Chart.types';

// The horizontal gridlines' viewBox heights.
const GRIDLINES: readonly number[] = [25, 50, 75];

// Derive the role=img summary: caption, count, value range, and endpoints.
function deriveSummary(label: string, values: readonly number[]): string {
    const peak: number = Math.max(...values);
    const low: number = Math.min(...values);
    const last: number = values[values.length - 1] ?? 0;
    return `${label}: ${String(values.length)} values, range ${String(low)} to ${String(peak)}, latest ${String(last)}`;
}

// The framed trend line of the Chart family: caption, baseline, gridlines,
// toned line, optional area wash, and the family's hidden-table fallback.
export function LineChart({
    label,
    values,
    summary,
    emptyLabel,
    detail,
    filled,
    status,
    tone,
}: LineChartProps): ReactElement {
    const rootClassName: string = withClass(toneStyles.toneScope, styles.lineChart);
    const resolvedDetail: EChartA11yDetail = detail ?? EChartA11yDetail.Table;

    if (values.length === 0) {
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

    const summaryText: string = summary ?? deriveSummary(label, values);
    const points: string = linePoints(values);

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
            >
                {GRIDLINES.map(
                    (height: number): ReactElement => (
                        <line
                            key={height}
                            className={styles.gridline}
                            x1="0"
                            y1={height}
                            x2="100"
                            y2={height}
                        />
                    ),
                )}
                {filled === true ? (
                    <polygon
                        className={styles.sparkArea}
                        points={`0,100 ${points} 100,100`}
                    />
                ) : null}
                <polyline className={styles.sparkLine} points={points} />
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
