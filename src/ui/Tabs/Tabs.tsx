import {
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    useId,
    useRef,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Tabs.module.css';
import { ETabState, type TabItem, type TabsProps } from './Tabs.types';

// Resolves the index of the currently selected tab, falling back to the first
// tab when the controlled value matches no item, so focus and roving tabindex
// always have a valid target.
function resolveSelectedIndex(items: readonly TabItem[], value: string): number {
    const index: number = items.findIndex(
        (item: TabItem): boolean => item.id === value,
    );
    return index === -1 ? 0 : index;
}

export function Tabs({
    items,
    value,
    onChange,
    enabled,
    label,
    labelledBy,
    tone,
}: TabsProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const selectedIndex: number = resolveSelectedIndex(items, value);
    // A per-instance base id seeds the deterministic per-tab DOM id, so a tabpanel
    // can point its aria-labelledby back at the owning tab without colliding with a
    // second Tabs instance on the page.
    const baseId: string = useId();
    const tabRefs: RefObject<readonly (HTMLButtonElement | null)[]> = useRef<
        readonly (HTMLButtonElement | null)[]
    >([]);
    const className: string = [toneStyles.toneScope, styles.tablist]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function select(index: number): void {
        switch (resolvedEnabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled: {
                const nextItem: TabItem | undefined = items[index];
                if (nextItem === undefined) {
                    return;
                }
                tabRefs.current[index]?.focus();
                onChange?.(nextItem.id);
            }
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
        if (resolvedEnabled === EEnabledState.Disabled) {
            return;
        }
        if (items.length === 0) {
            return;
        }

        const lastIndex: number = items.length - 1;
        switch (event.key) {
            case 'ArrowRight': {
                event.preventDefault();
                const nextIndex: number =
                    selectedIndex === lastIndex ? 0 : selectedIndex + 1;
                select(nextIndex);
                return;
            }
            case 'ArrowLeft': {
                event.preventDefault();
                const previousIndex: number =
                    selectedIndex === 0 ? lastIndex : selectedIndex - 1;
                select(previousIndex);
                return;
            }
            case 'Home': {
                event.preventDefault();
                select(0);
                return;
            }
            case 'End': {
                event.preventDefault();
                select(lastIndex);
                return;
            }
            case 'Enter':
            case ' ': {
                event.preventDefault();
                select(selectedIndex);
                return;
            }
            default:
                return;
        }
    }

    return (
        <div
            role="tablist"
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
        >
            {items.map((item: TabItem, index: number): ReactElement => {
                const isSelected: boolean = item.id === value;
                const tabState: ETabState = isSelected
                    ? ETabState.Selected
                    : ETabState.Idle;
                // Deterministic per-tab id derived from item.id so the consumer's
                // tabpanel can label itself from this tab (APG tab/tabpanel link).
                const tabId: string = `${baseId}-tab-${item.id}`;
                return (
                    <button
                        key={item.id}
                        id={tabId}
                        ref={(element: HTMLButtonElement | null): void => {
                            const next: (HTMLButtonElement | null)[] = [
                                ...tabRefs.current,
                            ];
                            next[index] = element;
                            tabRefs.current = next;
                        }}
                        type="button"
                        role="tab"
                        className={styles.tab}
                        aria-selected={isSelected}
                        {...(item.controls !== undefined
                            ? { 'aria-controls': item.controls }
                            : {})}
                        tabIndex={index === selectedIndex ? 0 : -1}
                        disabled={isDisabled}
                        data-state={tabState}
                        data-enabled={resolvedEnabled}
                        onClick={(): void => {
                            select(index);
                        }}
                        onKeyDown={handleKeyDown}
                    >
                        <span className={styles.label}>{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
