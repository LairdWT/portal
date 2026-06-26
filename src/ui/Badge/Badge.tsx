import { type CSSProperties, type ReactElement } from 'react';

import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Badge.module.css';
import { type BadgeProps, EBadgeKind } from './Badge.types';

// Default ceiling for the count badge: values above this render as `${max}+`.
const DEFAULT_COUNT_MAX: number = 99;

// Format a count for display, clamping above `max` to `${max}+`. Negative-first
// guards: a non-finite count reads as zero, and a negative count floors to zero
// so the badge never shows nonsense.
function formatCount(count: number, max: number): string {
    if (!Number.isFinite(count)) {
        return '0';
    }
    const safeCount: number = count < 0 ? 0 : count;
    if (safeCount > max) {
        return `${String(max)}+`;
    }
    return String(safeCount);
}

export function Badge(props: BadgeProps): ReactElement {
    const { tone }: BadgeProps = props;
    // Default the universal status to 'none' so data-status is always present,
    // matching Chip/Section/Progress/SearchBox/SegmentedControl/Banner (X5).
    const status: EUiStatus = props.status ?? EUiStatus.None;
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    const style: CSSProperties = toneProperties(tone);

    // Branch on the discriminant with an exhaustive switch and NO default: each
    // kind returns inside its case, so adding a third kind is a compile error
    // rather than a silent fall-through to the status form.
    switch (props.kind) {
        case EBadgeKind.Count: {
            const max: number = props.max ?? DEFAULT_COUNT_MAX;
            const displayText: string = formatCount(props.count, max);
            const accessibleLabel: string =
                props.label !== undefined
                    ? `${displayText} ${props.label}`
                    : displayText;
            return (
                <span
                    className={className}
                    style={style}
                    data-kind={props.kind}
                    data-status={status}
                    aria-label={accessibleLabel}
                >
                    <span className={styles.count}>{displayText}</span>
                </span>
            );
        }
        case EBadgeKind.Status: {
            const showDot: boolean = props.showDot !== false;
            return (
                <span
                    role="status"
                    className={className}
                    style={style}
                    data-kind={props.kind}
                    data-status={status}
                    aria-label={props.label}
                >
                    {showDot ? (
                        <span className={styles.dot} aria-hidden="true" />
                    ) : null}
                    <span className={styles.label}>{props.label}</span>
                </span>
            );
        }
    }
}
