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
import styles from './RadioGroup.module.css';
import {
    ERadioOrientation,
    ERadioState,
    type RadioGroupProps,
    type UiRadioItem,
} from './RadioGroup.types';

// Resolves the index of the currently selected option, falling back to the
// first option when the controlled value matches no item, so focus and roving
// tabindex always have a valid target. The fallback may point at a disabled
// item; resolveRovingIndex corrects that for the actual focus entry point.
function resolveSelectedIndex(
    items: readonly UiRadioItem[],
    value: string,
): number {
    const index: number = items.findIndex(
        (item: UiRadioItem): boolean => item.id === value,
    );
    return index === -1 ? 0 : index;
}

// Resolves the single tabIndex={0} entry point so Tab never lands focus on a
// disabled radio. Returns the selected index if that item is enabled; otherwise
// the first enabled item; otherwise the selected index (all-disabled degenerate
// case). Negative-first guard style.
function resolveRovingIndex(
    items: readonly UiRadioItem[],
    selectedIndex: number,
): number {
    const selected: UiRadioItem | undefined = items[selectedIndex];
    if (selected !== undefined && selected.disabled !== true) {
        return selectedIndex;
    }
    const firstEnabled: number = items.findIndex(
        (item: UiRadioItem): boolean => item.disabled !== true,
    );
    return firstEnabled === -1 ? selectedIndex : firstEnabled;
}

// Walks the option ring from `from` by `step` (+1 or -1), wrapping with modulo,
// skipping disabled items, stopping after at most items.length hops so an
// all-disabled set returns `from` rather than looping forever. Home reuses this
// as findNextEnabledIndex(items, count - 1, 1) (first hop lands on index 0) and
// End as findNextEnabledIndex(items, 0, -1) (first hop lands on the last index).
function findNextEnabledIndex(
    items: readonly UiRadioItem[],
    from: number,
    step: number,
): number {
    const count: number = items.length;
    if (count === 0) {
        return from;
    }
    let index: number = from;
    for (let hop: number = 0; hop < count; hop = hop + 1) {
        index = (index + step + count) % count;
        const candidate: UiRadioItem | undefined = items[index];
        if (candidate !== undefined && candidate.disabled !== true) {
            return index;
        }
    }
    return from;
}

export function RadioGroup({
    items,
    value,
    onChange,
    label,
    labelledBy,
    enabled,
    orientation,
    tone,
}: RadioGroupProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const groupDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const resolvedOrientation: ERadioOrientation =
        orientation ?? ERadioOrientation.Vertical;
    const selectedIndex: number = resolveSelectedIndex(items, value);
    const rovingIndex: number = resolveRovingIndex(items, selectedIndex);
    // A fixed-index ref array: the ref callback writes refs.current[index] = el
    // (no per-call spread that would accumulate stale entries). An effect keyed
    // on items keeps the array length in sync so a shrinking item set prunes the
    // trailing refs.
    const radioRefs: RefObject<(HTMLButtonElement | null)[]> = useRef<
        (HTMLButtonElement | null)[]
    >([]);
    const className: string = [toneStyles.toneScope, styles.group]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    useEffect((): void => {
        radioRefs.current.length = items.length;
    }, [items]);

    function select(index: number): void {
        if (resolvedEnabled === EEnabledState.Disabled) {
            return;
        }
        const nextItem: UiRadioItem | undefined = items[index];
        if (nextItem === undefined) {
            return;
        }
        if (nextItem.disabled === true) {
            return;
        }
        radioRefs.current[index]?.focus();
        onChange?.(nextItem.id);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
        if (resolvedEnabled === EEnabledState.Disabled) {
            return;
        }
        if (items.length === 0) {
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight': {
                event.preventDefault();
                select(findNextEnabledIndex(items, rovingIndex, 1));
                return;
            }
            case 'ArrowUp':
            case 'ArrowLeft': {
                event.preventDefault();
                select(findNextEnabledIndex(items, rovingIndex, -1));
                return;
            }
            case 'Home': {
                event.preventDefault();
                select(findNextEnabledIndex(items, items.length - 1, 1));
                return;
            }
            case 'End': {
                event.preventDefault();
                select(findNextEnabledIndex(items, 0, -1));
                return;
            }
            case 'Enter':
            case ' ': {
                event.preventDefault();
                select(rovingIndex);
                return;
            }
            default:
                return;
        }
    }

    return (
        <div
            role="radiogroup"
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
            data-orientation={resolvedOrientation}
            aria-orientation={resolvedOrientation}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
        >
            {items.map((item: UiRadioItem, index: number): ReactElement => {
                const isSelected: boolean = item.id === value;
                const radioState: ERadioState = isSelected
                    ? ERadioState.Selected
                    : ERadioState.Idle;
                return (
                    <button
                        key={item.id}
                        ref={(element: HTMLButtonElement | null): void => {
                            radioRefs.current[index] = element;
                        }}
                        type="button"
                        role="radio"
                        className={styles.option}
                        aria-checked={isSelected}
                        {...(item.disabled === true
                            ? { 'aria-disabled': true }
                            : {})}
                        tabIndex={index === rovingIndex ? 0 : -1}
                        disabled={groupDisabled || item.disabled === true}
                        data-state={radioState}
                        data-enabled={resolvedEnabled}
                        onClick={(): void => {
                            select(index);
                        }}
                        onKeyDown={handleKeyDown}
                    >
                        <span className={styles.marker} aria-hidden="true" />
                        <span className={styles.label}>{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
