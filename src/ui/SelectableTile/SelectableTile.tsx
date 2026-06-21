import { type ReactElement, useId } from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { useSelectionContext } from '../../react/SelectionContext';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './SelectableTile.module.css';
import { ESelectionState, type SelectableTileProps } from './SelectableTile.types';

// Hint text announced to assistive technology when a tile is targetable, so the
// valid-target highlight is not conveyed by tone color alone.
const TARGETABLE_HINT: string = 'Targetable';

export function SelectableTile({
    id,
    state = ESelectionState.Default,
    enabled,
    onSelect,
    selectionLabel,
    children,
    tone,
}: SelectableTileProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const isSelected: boolean = state === ESelectionState.Selected;
    const isTargetable: boolean = state === ESelectionState.Targetable;
    const ambient: { onSelect?: ((id: string) => void) | undefined } =
        useSelectionContext();
    const hintId: string = useId();
    const className: string = [toneStyles.toneScope, styles.tile]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function handleClick(): void {
        switch (resolvedEnabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled: {
                if (onSelect !== undefined) {
                    onSelect();
                    return;
                }
                ambient.onSelect?.(id);
            }
        }
    }

    return (
        <button
            type="button"
            className={className}
            style={toneProperties(tone)}
            disabled={isDisabled}
            aria-pressed={isSelected}
            aria-label={selectionLabel}
            aria-describedby={isTargetable ? hintId : undefined}
            data-status={EUiStatus.None}
            data-state={state}
            data-enabled={resolvedEnabled}
            onClick={handleClick}
        >
            <span className={styles.content}>{children}</span>
            {isTargetable ? (
                <span id={hintId} className={styles.srOnly}>
                    {TARGETABLE_HINT}
                </span>
            ) : null}
        </button>
    );
}
