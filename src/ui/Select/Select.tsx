import {
    type CSSProperties,
    type Dispatch,
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { Popover } from '../Popover/Popover';
import { EPopoverPlacement, EPopoverRole } from '../Popover/Popover.types';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Select.module.css';
import { type SelectOption, type SelectProps } from './Select.types';

const TYPEAHEAD_RESET_MS: number = 500;

// Type-ahead matches only plain-string labels; non-string ReactNode labels have
// no searchable text and are simply skipped by the prefix match.
function optionText(option: SelectOption): string {
    return typeof option.label === 'string' ? option.label : '';
}

// The next enabled index in a direction without wrapping (a listbox cursor stops
// at the first/last enabled option). Returns `from` when there is no further
// enabled option in that direction.
function nextEnabledIndex(
    options: readonly SelectOption[],
    from: number,
    direction: 1 | -1,
): number {
    let candidate: number = from + direction;
    while (candidate >= 0 && candidate < options.length) {
        const option: SelectOption | undefined = options[candidate];
        if (option !== undefined && option.disabled !== true) {
            return candidate;
        }
        candidate += direction;
    }
    return from;
}

function firstEnabledIndex(options: readonly SelectOption[]): number {
    for (let index: number = 0; index < options.length; index += 1) {
        const option: SelectOption | undefined = options[index];
        if (option !== undefined && option.disabled !== true) {
            return index;
        }
    }
    return -1;
}

function lastEnabledIndex(options: readonly SelectOption[]): number {
    for (let index: number = options.length - 1; index >= 0; index -= 1) {
        const option: SelectOption | undefined = options[index];
        if (option !== undefined && option.disabled !== true) {
            return index;
        }
    }
    return -1;
}

// First enabled option (after `fromIndex`, wrapping) whose text starts with the
// type-ahead query, case-insensitively. Returns -1 when nothing matches.
function findTypeAheadIndex(
    options: readonly SelectOption[],
    query: string,
    fromIndex: number,
): number {
    const count: number = options.length;
    if (count === 0) {
        return -1;
    }
    const lower: string = query.toLowerCase();
    for (let offset: number = 1; offset <= count; offset += 1) {
        const index: number = (((fromIndex + offset) % count) + count) % count;
        const option: SelectOption | undefined = options[index];
        if (option === undefined || option.disabled === true) {
            continue;
        }
        if (optionText(option).toLowerCase().startsWith(lower)) {
            return index;
        }
    }
    return -1;
}

export function Select({
    label,
    options,
    value,
    onChange,
    id,
    placeholder,
    enabled,
    clearable = false,
    placement = EPopoverPlacement.Bottom,
    status = EUiStatus.None,
    tone,
}: SelectProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const hasOptions: boolean = options.length > 0;
    const isControlDisabled: boolean = isDisabled || !hasOptions;

    const generatedId: string = useId();
    const triggerId: string = id ?? generatedId;
    const labelId: string = useId();
    const listboxId: string = useId();

    const triggerRef: RefObject<HTMLButtonElement | null> =
        useRef<HTMLButtonElement | null>(null);
    const bufferRef: RefObject<string> = useRef<string>('');
    const typeaheadTimerRef: RefObject<number | null> = useRef<number | null>(null);

    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [activeIndex, setActiveIndex]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(-1);
    const [triggerWidth, setTriggerWidth]: [
        number | null,
        Dispatch<SetStateAction<number | null>>,
    ] = useState<number | null>(null);

    const selectedIndex: number = options.findIndex(
        (option: SelectOption): boolean => option.id === value,
    );
    const selectedOption: SelectOption | undefined =
        selectedIndex >= 0 ? options[selectedIndex] : undefined;
    const activeOption: SelectOption | undefined =
        activeIndex >= 0 ? options[activeIndex] : undefined;

    const clearTypeaheadTimer: () => void = useCallback((): void => {
        if (typeaheadTimerRef.current !== null) {
            window.clearTimeout(typeaheadTimerRef.current);
            typeaheadTimerRef.current = null;
        }
    }, []);

    function optionDomId(optionId: string): string {
        return `${listboxId}-option-${optionId}`;
    }

    const activeOptionId: string | undefined =
        open && activeOption !== undefined
            ? optionDomId(activeOption.id)
            : undefined;

    // Measure the trigger when the listbox opens so the menu can match its width
    // (Popover positions but does not size to the anchor).
    useLayoutEffect((): void => {
        if (!open) {
            return;
        }
        const node: HTMLButtonElement | null = triggerRef.current;
        if (node === null) {
            return;
        }
        setTriggerWidth(node.getBoundingClientRect().width);
    }, [open]);

    // Keep the active option scrolled into view when navigating. jsdom has no
    // scrollIntoView, so the call is feature-guarded and is a no-op there.
    useEffect((): void => {
        if (!open || activeOptionId === undefined) {
            return;
        }
        const node: HTMLElement | null = document.getElementById(activeOptionId);
        if (node === null) {
            return;
        }
        if (typeof node.scrollIntoView === 'function') {
            node.scrollIntoView({ block: 'nearest' });
        }
    }, [open, activeOptionId]);

    // Clear a pending type-ahead reset timer on unmount. clearTypeaheadTimer is
    // stable, so this runs its cleanup exactly once on unmount.
    useEffect((): (() => void) => clearTypeaheadTimer, [clearTypeaheadTimer]);

    function clearBuffer(): void {
        bufferRef.current = '';
        clearTypeaheadTimer();
    }

    function openListbox(): void {
        setOpen(true);
        const preferred: number =
            selectedIndex >= 0 && options[selectedIndex]?.disabled !== true
                ? selectedIndex
                : firstEnabledIndex(options);
        setActiveIndex(preferred);
    }

    function closeListbox(): void {
        setOpen(false);
        clearBuffer();
    }

    function selectIndex(index: number): void {
        const option: SelectOption | undefined = options[index];
        if (option === undefined || option.disabled === true) {
            return;
        }
        onChange(option.id);
        setOpen(false);
        clearBuffer();
        triggerRef.current?.focus();
    }

    function handleClear(): void {
        onChange(null);
        triggerRef.current?.focus();
    }

    function handleTrigger(): void {
        if (open) {
            closeListbox();
            return;
        }
        openListbox();
    }

    function handleTypeAhead(key: string): void {
        clearTypeaheadTimer();
        const wasEmpty: boolean = bufferRef.current.length === 0;
        const query: string = bufferRef.current + key;
        bufferRef.current = query;
        typeaheadTimerRef.current = window.setTimeout((): void => {
            bufferRef.current = '';
            typeaheadTimerRef.current = null;
        }, TYPEAHEAD_RESET_MS);
        const fromIndex: number = wasEmpty ? activeIndex : activeIndex - 1;
        const match: number = findTypeAheadIndex(options, query, fromIndex);
        if (match >= 0) {
            setActiveIndex(match);
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
        if (isControlDisabled) {
            return;
        }
        const key: string = event.key;
        if (!open) {
            if (
                key === 'Enter' ||
                key === ' ' ||
                key === 'ArrowDown' ||
                key === 'ArrowUp'
            ) {
                event.preventDefault();
                openListbox();
            }
            return;
        }
        switch (key) {
            case 'ArrowDown': {
                event.preventDefault();
                setActiveIndex((previous: number): number =>
                    nextEnabledIndex(options, previous, 1),
                );
                return;
            }
            case 'ArrowUp': {
                event.preventDefault();
                setActiveIndex((previous: number): number =>
                    nextEnabledIndex(options, previous, -1),
                );
                return;
            }
            case 'Home': {
                event.preventDefault();
                setActiveIndex(firstEnabledIndex(options));
                return;
            }
            case 'End': {
                event.preventDefault();
                setActiveIndex(lastEnabledIndex(options));
                return;
            }
            case 'Enter':
            case ' ': {
                event.preventDefault();
                if (activeIndex >= 0) {
                    selectIndex(activeIndex);
                }
                return;
            }
            case 'Escape': {
                event.preventDefault();
                closeListbox();
                return;
            }
            case 'Tab': {
                closeListbox();
                return;
            }
            default: {
                if (
                    key.length === 1 &&
                    key !== ' ' &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.altKey
                ) {
                    event.preventDefault();
                    handleTypeAhead(key);
                }
                return;
            }
        }
    }

    function handlePopoverClose(): void {
        closeListbox();
    }

    const rootClassName: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    const displayLabel: string = `${labelId} ${triggerId}`;
    const optionStyle: CSSProperties =
        triggerWidth !== null ? { minInlineSize: `${String(triggerWidth)}px` } : {};

    return (
        <div
            className={rootClassName}
            style={toneProperties(tone)}
            data-status={status}
            data-enabled={resolvedEnabled}
        >
            <label id={labelId} className={styles.label} htmlFor={triggerId}>
                {label}
            </label>
            <div className={styles.control}>
                <button
                    ref={triggerRef}
                    type="button"
                    id={triggerId}
                    role="combobox"
                    className={styles.trigger}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-controls={listboxId}
                    aria-labelledby={displayLabel}
                    {...(activeOptionId !== undefined
                        ? { 'aria-activedescendant': activeOptionId }
                        : {})}
                    disabled={isControlDisabled}
                    data-enabled={resolvedEnabled}
                    data-open={open ? 'true' : 'false'}
                    onClick={handleTrigger}
                    onKeyDown={handleKeyDown}
                >
                    <span
                        className={styles.value}
                        data-placeholder={
                            selectedOption === undefined ? 'true' : 'false'
                        }
                    >
                        {selectedOption !== undefined
                            ? selectedOption.label
                            : (placeholder ?? '')}
                    </span>
                    <span className={styles.arrow} aria-hidden="true" />
                </button>
                {clearable && value !== null && !isControlDisabled ? (
                    <button
                        type="button"
                        className={styles.clear}
                        aria-label="Clear selection"
                        onClick={handleClear}
                    >
                        <span className={styles.clearGlyph} aria-hidden="true" />
                    </button>
                ) : null}
            </div>
            <Popover
                open={open}
                onClose={handlePopoverClose}
                anchorRef={triggerRef}
                role={EPopoverRole.Listbox}
                id={listboxId}
                labelledBy={labelId}
                placement={placement}
                trapFocus={false}
                restoreFocus={false}
                {...(tone !== undefined ? { tone } : {})}
            >
                {options.map(
                    (option: SelectOption, index: number): ReactElement => {
                        const isSelected: boolean = option.id === value;
                        const isActive: boolean = index === activeIndex;
                        return (
                            <div
                                key={option.id}
                                id={optionDomId(option.id)}
                                role="option"
                                className={styles.option}
                                aria-selected={isSelected}
                                style={optionStyle}
                                data-active={isActive ? 'true' : 'false'}
                                data-selected={isSelected ? 'true' : 'false'}
                                data-disabled={
                                    option.disabled === true ? 'true' : 'false'
                                }
                                {...(option.disabled === true
                                    ? { 'aria-disabled': true }
                                    : {})}
                                onPointerDown={(): void => {
                                    selectIndex(index);
                                }}
                            >
                                {option.label}
                            </div>
                        );
                    },
                )}
            </Popover>
        </div>
    );
}
