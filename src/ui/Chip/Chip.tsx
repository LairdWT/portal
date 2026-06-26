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
    const chipState: EChipState = selected ? EChipState.Selected : EChipState.Idle;
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

    return (
        <span
            className={className}
            style={toneProperties(tone)}
            role={label !== undefined ? 'group' : undefined}
            data-status={status ?? EUiStatus.None}
            data-state={chipState}
            data-enabled={resolvedEnabled}
            aria-disabled={isDisabled ? true : undefined}
            aria-label={label}
        >
            {selected === true ? (
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
                    <span className={styles.removeGlyph} aria-hidden="true">
                        x
                    </span>
                </button>
            ) : null}
        </span>
    );
}
