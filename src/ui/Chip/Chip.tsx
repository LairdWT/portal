import { type ReactElement } from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Chip.module.css';
import { type ChipProps, EChipState } from './Chip.types';

export function Chip({
    children,
    label,
    selected,
    onRemove,
    status,
    enabled,
    tone,
}: ChipProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const isRemovable: boolean = onRemove !== undefined;
    // Derive the selected boolean once so the marker and the data-state attribute
    // read the same predicate (no mix of `selected === true` and `selected ?`).
    const isSelected: boolean = selected === true;
    const chipState: EChipState = isSelected
        ? EChipState.Selected
        : EChipState.Idle;
    const removeLabel: string = label !== undefined ? `Remove ${label}` : 'Remove';
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function remove(): void {
        if (isDisabled) {
            return;
        }
        if (onRemove === undefined) {
            return;
        }
        onRemove();
    }

    // The chip root keeps aria-disabled even though it is a role="group", not a
    // native control: it is the canonical inactive signal, and axe's color-contrast
    // rule exempts the dimmed (opacity) disabled label only while it is present
    // (WCAG 1.4.3 exempts inactive components). Dropping it reintroduces a contrast
    // violation on the disabled chip.
    const ariaDisabled: true | undefined = isDisabled ? true : undefined;

    return (
        <span
            className={className}
            style={toneProperties(tone)}
            role={label !== undefined ? 'group' : undefined}
            data-status={status ?? EUiStatus.None}
            data-state={chipState}
            data-enabled={resolvedEnabled}
            aria-disabled={ariaDisabled}
            aria-label={label}
        >
            {isSelected ? (
                <span className={styles.marker} aria-hidden="true" />
            ) : null}
            <span className={styles.label}>{children}</span>
            {isRemovable ? (
                <button
                    type="button"
                    className={styles.remove}
                    aria-label={removeLabel}
                    disabled={isDisabled}
                    data-enabled={resolvedEnabled}
                    onClick={(): void => {
                        remove();
                    }}
                >
                    <span className={styles.removeGlyph} aria-hidden="true" />
                </button>
            ) : null}
        </span>
    );
}
