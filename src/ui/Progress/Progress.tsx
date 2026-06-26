import { type CSSProperties, type ReactElement } from 'react';

import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Progress.module.css';
import {
    EProgressMode,
    EProgressMotion,
    type ProgressProps,
} from './Progress.types';

// String-typed (not a string literal) so the computed key satisfies the
// CSSProperties type, matching the existing --portal-slider-fill pattern.
const FILL_PROPERTY: string = '--portal-progress-fill';

// Clamp value/max to a 0..1 fill ratio, guarding a non-positive span so a bad
// max never divides by zero or produces a negative width.
function computeFillRatio(value: number, max: number): number {
    if (max <= 0) {
        return 0;
    }
    const ratio: number = value / max;
    return Math.min(Math.max(ratio, 0), 1);
}

export function Progress(props: ProgressProps): ReactElement {
    const reducedMotion: boolean = useReducedMotion();
    const status: EUiStatus = props.status ?? EUiStatus.None;
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    if (props.mode === EProgressMode.Determinate) {
        const max: number = props.max ?? 1;
        const ratio: number = computeFillRatio(props.value, max);
        const valueNow: number = Math.min(Math.max(props.value, 0), max);
        const percent: number = Math.round(ratio * 100);
        const rootStyle: CSSProperties = {
            ...toneProperties(props.tone),
            [FILL_PROPERTY]: String(ratio),
        };
        return (
            <div
                className={className}
                style={rootStyle}
                data-status={status}
                data-mode={EProgressMode.Determinate}
                role="progressbar"
                aria-label={props.label}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={valueNow}
                aria-valuetext={`${String(percent)}%`}
            >
                <span className={styles.track}>
                    <span className={styles.fill} />
                </span>
            </div>
        );
    }

    // The data-motion attribute the CSS keys off: the indicator only animates
    // when this reads 'animate' AND the prefers-reduced-motion: no-preference
    // query holds, so motion is gated twice - here via useReducedMotion and
    // again in the stylesheet.
    const motion: EProgressMotion = reducedMotion
        ? EProgressMotion.Static
        : EProgressMotion.Animate;
    return (
        <div
            className={className}
            style={toneProperties(props.tone)}
            data-status={status}
            data-mode={EProgressMode.Indeterminate}
            data-motion={motion}
            role="progressbar"
            aria-label={props.label}
        >
            <span className={styles.track}>
                <span className={styles.indicator} />
            </span>
        </div>
    );
}
