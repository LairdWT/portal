import { type CSSProperties, type ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Compass.module.css';
import { type CompassProps } from './Compass.types';
import {
    type CompassTick,
    compassTicks,
    nearestCardinal,
    normalizeHeading,
} from './compassMath';

const DEFAULT_SPAN_DEGREES: number = 90;
const TICK_STEP_DEGREES: number = 15;

function defaultFormatHeading(degrees: number): string {
    return `${String(Math.round(degrees)).padStart(3, '0')} ${nearestCardinal(degrees)}`;
}

// The Compass: a non-interactive machined-HUD heading strip. The frame and
// caption follow the Chart family; the strip drawing is decorative and the
// role=img readout carries the accessible surface. Ticks are keyed by their
// rose degrees, so a tick that stays inside the sliding window keeps its DOM
// node and its position transitions smoothly (reduced-motion gated).
export function Compass({
    label,
    heading,
    span,
    formatHeading,
    tone,
}: CompassProps): ReactElement {
    const resolvedSpan: number =
        span !== undefined && span > 0 ? span : DEFAULT_SPAN_DEGREES;
    const normalized: number = normalizeHeading(heading);
    const ticks: readonly CompassTick[] = compassTicks(
        normalized,
        resolvedSpan,
        TICK_STEP_DEGREES,
    );
    const readout: string =
        formatHeading?.(normalized) ?? defaultFormatHeading(normalized);

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <figure className={className} style={toneProperties(tone)}>
            <figcaption className={styles.caption}>{label}</figcaption>
            <div
                className={styles.body}
                role="img"
                aria-label={`${label}: heading ${readout}`}
            >
                <div className={styles.strip} aria-hidden="true">
                    {ticks.map((tick: CompassTick): ReactElement => {
                        // Physical `left`: the rose is chirality-fixed, so
                        // bearings increase to the visual right in every
                        // writing direction (the Dial convention).
                        const tickStyle: CSSProperties = {
                            left: `${String((tick.offsetFraction + 0.5) * 100)}%`,
                        };
                        return (
                            <span
                                key={tick.degrees}
                                className={styles.tick}
                                style={tickStyle}
                                data-major={tick.major ? 'true' : undefined}
                            >
                                {tick.label !== undefined ? (
                                    <span className={styles.cardinal}>
                                        {tick.label}
                                    </span>
                                ) : null}
                            </span>
                        );
                    })}
                    <span className={styles.index} />
                </div>
                <span className={styles.readout} aria-hidden="true">
                    {readout}
                </span>
            </div>
        </figure>
    );
}
