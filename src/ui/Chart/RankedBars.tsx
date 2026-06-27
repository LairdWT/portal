import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { Tooltip } from '../Tooltip/Tooltip';
import { svgValue, withClass } from './Chart.helpers';
import styles from './Chart.module.css';
import {
    type ChartRankedEntry,
    EChartA11yDetail,
    type RankedBarsProps,
} from './Chart.types';

// Derive the summary used as the data-table caption: the highest entry leads.
function deriveSummary(entries: readonly ChartRankedEntry[]): string {
    const top: ChartRankedEntry = entries.reduce(
        (best: ChartRankedEntry, entry: ChartRankedEntry): ChartRankedEntry =>
            entry.value > best.value ? entry : best,
        entries[0] ?? { label: '', value: 0 },
    );
    return `${String(entries.length)} ranked items - ${top.label} ${String(top.value)} highest`;
}

export function RankedBars({
    entries,
    summary,
    emptyLabel,
    detail,
    status,
    tone,
}: RankedBarsProps): ReactElement {
    const rootClassName: string = withClass(toneStyles.toneScope, styles.rankRoot);
    const resolvedDetail: EChartA11yDetail = detail ?? EChartA11yDetail.Table;

    if (entries.length === 0) {
        const emptyText: string = emptyLabel ?? 'No items';
        return (
            <div
                className={rootClassName}
                style={toneProperties(tone)}
                data-status={status}
            >
                <p className={styles.empty}>{emptyText}</p>
            </div>
        );
    }

    // The widest value drives the gauge maximum; negatives clamp to an empty
    // gauge so a single negative datum never inverts the scale.
    const maxValue: number = Math.max(
        0,
        ...entries.map((entry: ChartRankedEntry): number => entry.value),
    );
    const summaryText: string = summary ?? deriveSummary(entries);

    return (
        <div
            className={rootClassName}
            style={toneProperties(tone)}
            data-status={status}
        >
            {entries.map((entry: ChartRankedEntry, index: number): ReactElement => {
                const clamped: number = Math.max(0, entry.value);
                const fraction: number = maxValue > 0 ? clamped / maxValue : 0;
                const fillWidth: number = Math.min(100, fraction * 100);
                return (
                    <Tooltip
                        key={index}
                        content={`${entry.label}: ${String(entry.value)}`}
                    >
                        {/* Trigger-only button: it carries no onClick and is not
                            an action. It exists solely as the focusable host the
                            Tooltip needs (keyboard-reachable, not hover-only). The
                            datum is also exposed as the visible label/value text
                            and in the screen-reader data table, so no actionable
                            behavior is being withheld. */}
                        <button type="button" className={styles.rankRow}>
                            <span className={styles.rankLabel}>{entry.label}</span>
                            <svg
                                className={styles.gauge}
                                aria-hidden="true"
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
                                />
                            </svg>
                            <span className={styles.rowValue}>
                                {String(entry.value)}
                            </span>
                        </button>
                    </Tooltip>
                );
            })}
            {resolvedDetail === EChartA11yDetail.Table ? (
                <table className={styles.visuallyHidden}>
                    <caption>{summaryText}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Item</th>
                            <th scope="col">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(
                            (
                                entry: ChartRankedEntry,
                                index: number,
                            ): ReactElement => (
                                <tr key={index}>
                                    <td>{entry.label}</td>
                                    <td>{String(entry.value)}</td>
                                </tr>
                            ),
                        )}
                    </tbody>
                </table>
            ) : null}
        </div>
    );
}
