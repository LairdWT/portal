import { type CSSProperties, type ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Odometer.module.css';
import { type OdometerProps } from './Odometer.types';

const DIGIT_PROPERTY: string = '--portal-odometer-digit';

const REEL_FACES: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// The Odometer: a machined rolling counter. Each column is a 0-9 reel
// translated to its current face through one custom property, so a value
// change rolls the digits via a CSS transform transition (instant under
// reduced motion). Columns are KEYED BY PLACE VALUE from the ones column
// up: when the count gains a digit (99 -> 100) the existing reels keep
// their DOM identity and only the new leading column mounts. The reels are
// decorative; the role=img label speaks the true (unpadded) value.
export function Odometer({
    label,
    value,
    minDigits,
    announce = false,
    tone,
}: OdometerProps): ReactElement {
    const safeValue: number = Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0;
    const pad: number = Math.max(1, Math.floor(minDigits ?? 1));
    const text: string = String(safeValue).padStart(pad, '0');
    const digits: number[] = [];
    for (const character of text) {
        digits.push(Number(character));
    }

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <span
            className={className}
            style={toneProperties(tone)}
            role="img"
            aria-label={`${label}: ${String(safeValue)}`}
        >
            <span className={styles.window} aria-hidden="true">
                {digits.map((digit: number, index: number): ReactElement => {
                    const placeFromOnes: number = digits.length - 1 - index;
                    const columnStyle: CSSProperties = {
                        [DIGIT_PROPERTY]: String(digit),
                    };
                    return (
                        <span
                            key={placeFromOnes}
                            className={styles.column}
                            style={columnStyle}
                            data-digit={digit}
                        >
                            <span className={styles.reel}>
                                {REEL_FACES.map(
                                    (face: number): ReactElement => (
                                        <span key={face} className={styles.face}>
                                            {face}
                                        </span>
                                    ),
                                )}
                            </span>
                        </span>
                    );
                })}
            </span>
            {announce ? (
                <span className={styles.srOnly} aria-live="polite">
                    {`${label}: ${String(safeValue)}`}
                </span>
            ) : null}
        </span>
    );
}
