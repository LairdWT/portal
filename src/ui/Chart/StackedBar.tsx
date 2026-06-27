import type { CSSProperties, ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { svgValue, withClass } from './Chart.helpers';
import styles from './Chart.module.css';
import {
    type ChartSegment,
    EChartA11yDetail,
    type StackedBarProps,
} from './Chart.types';

// Untoned slices step their fill opacity down by index so adjacent slices stay
// distinct while sharing the one instance tone. The ramp starts opaque and steps
// down by SEGMENT_OPACITY_STEP per slice, floored at SEGMENT_MIN_OPACITY so a
// long series never fades a slice to invisibility.
const SEGMENT_FULL_OPACITY: number = 1;
const SEGMENT_MIN_OPACITY: number = 0.55;
const SEGMENT_OPACITY_STEP: number = 0.18;

// A laid-out slice: its origin, width (as a percent of the 0..100 viewBox), and
// the rounded share for the summary and the data table.
type PlacedSegment = Readonly<{
    segment: ChartSegment;
    index: number;
    x: number;
    width: number;
    share: number;
}>;

// Lay the clamped slices left to right. Each width is value / sum(values); a
// non-positive total yields an empty list so the caller paints the empty frame.
function placeSegments(
    segments: readonly ChartSegment[],
): readonly PlacedSegment[] {
    // Finite-non-negative coercion at the boundary: a non-finite slice (Infinity
    // or NaN) or a negative slice contributes zero weight, so it never corrupts
    // the running total or the cumulative x of every following slice.
    const weights: readonly number[] = segments.map(
        (segment: ChartSegment): number =>
            Number.isFinite(segment.value) && segment.value > 0 ? segment.value : 0,
    );
    const total: number = weights.reduce(
        (sum: number, weight: number): number => sum + weight,
        0,
    );
    if (total <= 0) {
        return [];
    }
    let cumulative: number = 0;
    return segments.map((segment: ChartSegment, index: number): PlacedSegment => {
        const weight: number = weights[index] ?? 0;
        const width: number = (weight / total) * 100;
        const x: number = cumulative;
        cumulative += width;
        return { segment, index, x, width, share: Math.round(width) };
    });
}

export function StackedBar({
    label,
    segments,
    summary,
    emptyLabel,
    detail,
    status,
    tone,
}: StackedBarProps): ReactElement {
    const rootClassName: string = withClass(toneStyles.toneScope, styles.stacked);
    const placed: readonly PlacedSegment[] = placeSegments(segments);
    const resolvedDetail: EChartA11yDetail = detail ?? EChartA11yDetail.Table;

    if (placed.length === 0) {
        const emptyText: string = emptyLabel ?? 'No data';
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

    const parts: string = placed
        .map(
            (entry: PlacedSegment): string =>
                `${entry.segment.label} ${String(entry.share)}%`,
        )
        .join(', ');
    const summaryText: string =
        summary ?? `${label}: ${String(placed.length)} segments - ${parts}`;

    return (
        <figure
            className={rootClassName}
            style={toneProperties(tone)}
            data-status={status}
        >
            <figcaption className={styles.caption}>{label}</figcaption>
            <svg
                className={styles.stackedTrack}
                role="img"
                aria-label={summaryText}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                shapeRendering="crispEdges"
            >
                {placed.map((entry: PlacedSegment): ReactElement => {
                    const isToned: boolean = entry.segment.tone !== undefined;
                    const fillStyle: CSSProperties = {
                        fillOpacity: isToned
                            ? SEGMENT_FULL_OPACITY
                            : Math.max(
                                  SEGMENT_MIN_OPACITY,
                                  SEGMENT_FULL_OPACITY -
                                      entry.index * SEGMENT_OPACITY_STEP,
                              ),
                    };
                    const rect: ReactElement = (
                        <rect
                            className={styles.segment}
                            x={svgValue(entry.x)}
                            y={0}
                            width={svgValue(entry.width)}
                            height={100}
                            style={fillStyle}
                        >
                            <title>{`${entry.segment.label}: ${String(entry.segment.value)}`}</title>
                        </rect>
                    );
                    if (entry.segment.tone === undefined) {
                        return <g key={entry.index}>{rect}</g>;
                    }
                    return (
                        <g
                            key={entry.index}
                            className={toneStyles.toneScope}
                            style={toneProperties(entry.segment.tone)}
                        >
                            {rect}
                        </g>
                    );
                })}
                {placed.map((entry: PlacedSegment): ReactElement | null =>
                    entry.index === 0 ? null : (
                        <line
                            key={`divider-${String(entry.index)}`}
                            className={styles.divider}
                            x1={svgValue(entry.x)}
                            y1={0}
                            x2={svgValue(entry.x)}
                            y2={100}
                        />
                    ),
                )}
            </svg>
            {resolvedDetail === EChartA11yDetail.Table ? (
                <table className={styles.visuallyHidden}>
                    <caption>{summaryText}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Segment</th>
                            <th scope="col">Value</th>
                            <th scope="col">Share</th>
                        </tr>
                    </thead>
                    <tbody>
                        {placed.map(
                            (entry: PlacedSegment): ReactElement => (
                                <tr key={entry.index}>
                                    <td>{entry.segment.label}</td>
                                    <td>{String(entry.segment.value)}</td>
                                    <td>{`${String(entry.share)}%`}</td>
                                </tr>
                            ),
                        )}
                    </tbody>
                </table>
            ) : null}
        </figure>
    );
}
