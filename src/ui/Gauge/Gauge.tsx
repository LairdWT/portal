import { type CSSProperties, type ReactElement } from 'react';

import { type Point } from '../polygonMath';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Gauge.module.css';
import { type GaugeBand, type GaugeProps } from './Gauge.types';
import {
    arcPath,
    GAUGE_END_DEGREES,
    GAUGE_START_DEGREES,
    gaugeAngle,
    gaugeFraction,
    gaugePoint,
} from './gaugeMath';

const DEFAULT_MIN: number = 0;
const DEFAULT_MAX: number = 100;

// Dial geometry in viewBox units: the main track/fill arc and the thinner
// band ring drawn just outside it. The bounds labels hang below the arc
// shoulders; their drop and glyph size are viewBox user units like the
// stroke widths.
const ARC_RADIUS: number = 40;
const BAND_RADIUS: number = 46.5;
const BOUND_DROP_UNITS: number = 11;
const BOUND_FONT_UNITS: number = 7;

// The fill fraction custom property the CSS dash math reads (the
// --portal-slider-fill pattern), and the normalized path length that makes
// the dash arithmetic a plain 0..100 percentage.
const FILL_PROPERTY: string = '--portal-gauge-fill';
const NORMALIZED_PATH_LENGTH: number = 100;

// The Gauge: a non-interactive machined-HUD radial arc meter. The frame and
// caption follow the Chart family; the readout in the dial center carries the
// ARIA meter semantics (the SVG itself is decorative). The fill arc shares the
// track's path and is revealed by a normalized stroke dash driven from the
// --portal-gauge-fill custom property, so a value change sweeps the needle-arc
// through a CSS transition instead of a JS animation.
export function Gauge({
    label,
    value,
    min,
    max,
    bands,
    units,
    formatValue,
    centerContent,
    amountLabel,
    showBounds,
    status,
    tone,
}: GaugeProps): ReactElement {
    const resolvedMin: number = min ?? DEFAULT_MIN;
    const resolvedMax: number = Math.max(max ?? DEFAULT_MAX, resolvedMin);
    // Defensive value clamp: a non-finite value reads as the floor so the
    // meter never emits NaN into ARIA or the dash math.
    const safeValue: number = Number.isFinite(value)
        ? Math.min(Math.max(value, resolvedMin), resolvedMax)
        : resolvedMin;
    const fraction: number = gaugeFraction(safeValue, resolvedMin, resolvedMax);
    const trackPath: string = arcPath(
        GAUGE_START_DEGREES,
        GAUGE_END_DEGREES,
        ARC_RADIUS,
    );
    const displayValue: string = formatValue?.(safeValue) ?? String(safeValue);
    // Spoken value: the unit suffix always speaks; a bare formatted value
    // speaks only when it differs from the numeric aria-valuenow; the amount
    // line, when present, speaks after the value.
    const spokenBase: string | undefined =
        units !== undefined
            ? `${displayValue} ${units}`
            : formatValue !== undefined
              ? displayValue
              : undefined;
    const spokenValue: string | undefined =
        amountLabel !== undefined
            ? `${spokenBase ?? displayValue}, ${amountLabel}`
            : spokenBase;
    const boundStart: Point = gaugePoint(ARC_RADIUS, GAUGE_START_DEGREES);
    const boundEnd: Point = gaugePoint(ARC_RADIUS, GAUGE_END_DEGREES);

    const rootStyle: CSSProperties = {
        ...toneProperties(tone),
        [FILL_PROPERTY]: String(fraction),
    };
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <figure className={className} style={rootStyle} data-status={status}>
            <figcaption className={styles.caption}>{label}</figcaption>
            <div className={styles.body}>
                <svg
                    className={styles.dial}
                    viewBox="0 0 100 100"
                    aria-hidden="true"
                >
                    {(bands ?? []).map(
                        (band: GaugeBand, index: number): ReactElement | null => {
                            const lower: number = Math.min(band.from, band.to);
                            const upper: number = Math.max(band.from, band.to);
                            const path: string = arcPath(
                                gaugeAngle(
                                    gaugeFraction(lower, resolvedMin, resolvedMax),
                                ),
                                gaugeAngle(
                                    gaugeFraction(upper, resolvedMin, resolvedMax),
                                ),
                                BAND_RADIUS,
                            );
                            if (path === '') {
                                return null;
                            }
                            return (
                                <path
                                    key={index}
                                    className={styles.band}
                                    data-status={band.status}
                                    d={path}
                                />
                            );
                        },
                    )}
                    <path
                        className={styles.track}
                        d={trackPath}
                        pathLength={NORMALIZED_PATH_LENGTH}
                    />
                    <path
                        className={styles.arcFill}
                        d={trackPath}
                        pathLength={NORMALIZED_PATH_LENGTH}
                    />
                    {showBounds === true ? (
                        <>
                            <text
                                className={styles.boundLabel}
                                x={boundStart.x}
                                y={boundStart.y + BOUND_DROP_UNITS}
                                textAnchor="middle"
                                fontSize={BOUND_FONT_UNITS}
                            >
                                {String(resolvedMin)}
                            </text>
                            <text
                                className={styles.boundLabel}
                                x={boundEnd.x}
                                y={boundEnd.y + BOUND_DROP_UNITS}
                                textAnchor="middle"
                                fontSize={BOUND_FONT_UNITS}
                            >
                                {String(resolvedMax)}
                            </text>
                        </>
                    ) : null}
                </svg>
                <span
                    className={styles.readout}
                    role="meter"
                    aria-label={label}
                    aria-valuemin={resolvedMin}
                    aria-valuemax={resolvedMax}
                    aria-valuenow={safeValue}
                    aria-valuetext={spokenValue}
                >
                    {centerContent !== undefined ? (
                        <span className={styles.centerContent} aria-hidden="true">
                            {centerContent}
                        </span>
                    ) : null}
                    <span className={styles.value} aria-hidden="true">
                        {displayValue}
                        {units !== undefined ? (
                            <span className={styles.unit}> {units}</span>
                        ) : null}
                    </span>
                    {amountLabel !== undefined ? (
                        <span className={styles.amount} aria-hidden="true">
                            {amountLabel}
                        </span>
                    ) : null}
                </span>
            </div>
        </figure>
    );
}
