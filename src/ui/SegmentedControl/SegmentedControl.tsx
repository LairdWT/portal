import {
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    useEffect,
    useRef,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './SegmentedControl.module.css';
import {
    ESegmentState,
    type SegmentedControlProps,
    type UiSegmentItem,
} from './SegmentedControl.types';

// Dev-only diagnostic emitted when the radiogroup has no accessible name. The
// `label` prop stays optional (making it required would be a breaking change), so
// a runtime guard - gated on import.meta.env.DEV and stripped from production
// builds - surfaces the missing name during development instead of letting an
// unnamed radiogroup ship.
const MISSING_NAME_MESSAGE: string =
    'SegmentedControl: a radiogroup needs an accessible name; pass a non-empty `label`.';

// Resolves the index of the currently selected segment, falling back to the
// first segment when the controlled value matches no item, so focus and roving
// tabindex always have a valid target.
function resolveSelectedIndex(
    items: readonly UiSegmentItem[],
    value: string,
): number {
    const index: number = items.findIndex(
        (item: UiSegmentItem): boolean => item.id === value,
    );
    return index === -1 ? 0 : index;
}

export function SegmentedControl({
    items,
    value,
    onChange,
    label,
    enabled,
    tone,
}: SegmentedControlProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const selectedIndex: number = resolveSelectedIndex(items, value);
    // A fixed-index ref array: the ref callback writes refs.current[index] = el
    // (no per-call spread that would accumulate stale entries). An effect keyed on
    // items keeps the array length in sync so a shrinking item set prunes the
    // trailing refs.
    const segmentRefs: RefObject<(HTMLButtonElement | null)[]> = useRef<
        (HTMLButtonElement | null)[]
    >([]);
    const className: string = [toneStyles.toneScope, styles.group]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    useEffect((): void => {
        if (!import.meta.env.DEV) {
            return;
        }
        if (label !== undefined && label.length > 0) {
            return;
        }
        console.error(MISSING_NAME_MESSAGE);
    }, [label]);

    useEffect((): void => {
        segmentRefs.current.length = items.length;
    }, [items]);

    function select(index: number): void {
        switch (resolvedEnabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled: {
                const nextItem: UiSegmentItem | undefined = items[index];
                if (nextItem === undefined) {
                    return;
                }
                segmentRefs.current[index]?.focus();
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
            case 'ArrowRight':
            case 'ArrowDown': {
                event.preventDefault();
                const nextIndex: number =
                    selectedIndex === lastIndex ? 0 : selectedIndex + 1;
                select(nextIndex);
                return;
            }
            case 'ArrowLeft':
            case 'ArrowUp': {
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
            role="radiogroup"
            aria-label={label}
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
        >
            {items.map((item: UiSegmentItem, index: number): ReactElement => {
                const isSelected: boolean = item.id === value;
                const segmentState: ESegmentState = isSelected
                    ? ESegmentState.Selected
                    : ESegmentState.Idle;
                return (
                    <button
                        key={item.id}
                        ref={(element: HTMLButtonElement | null): void => {
                            segmentRefs.current[index] = element;
                        }}
                        type="button"
                        role="radio"
                        className={styles.segment}
                        aria-checked={isSelected}
                        tabIndex={index === selectedIndex ? 0 : -1}
                        disabled={isDisabled}
                        data-state={segmentState}
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
