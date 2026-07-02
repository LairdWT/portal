import {
    type ChangeEvent,
    type CSSProperties,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode,
    type RefObject,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { type FuzzyMatch, fuzzyMatch } from '../CommandPalette/fuzzyMatch';
import { Popover } from '../Popover/Popover';
import { EPopoverPlacement, EPopoverRole } from '../Popover/Popover.types';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Combobox.module.css';
import type { ComboboxOption, ComboboxProps } from './Combobox.types';

// One ranked row: the option plus its match (for highlight ranges).
type RankedOption = Readonly<{
    option: ComboboxOption;
    match: FuzzyMatch;
}>;

// Fuzzy-filter and rank the options against the query. Ties keep the caller's
// option order (the sort is stable), and an empty query matches everything in
// the given order - fuzzyMatch's "match all" convention.
function rankOptions(
    options: readonly ComboboxOption[],
    query: string,
): readonly RankedOption[] {
    const ranked: RankedOption[] = [];
    for (const option of options) {
        const match: FuzzyMatch | null = fuzzyMatch(query, option.label);
        if (match === null) {
            continue;
        }
        ranked.push({ option, match });
    }
    return ranked.toSorted(
        (a: RankedOption, b: RankedOption): number => b.match.score - a.match.score,
    );
}

// Split a label into plain and emphasized segments from the match ranges.
function renderHighlighted(
    label: string,
    ranges: readonly (readonly [number, number])[],
): readonly ReactNode[] {
    const segments: ReactNode[] = [];
    let cursor: number = 0;
    for (const [start, end] of ranges) {
        if (start > cursor) {
            segments.push(label.slice(cursor, start));
        }
        segments.push(
            <span key={`${String(start)}-${String(end)}`} className={styles.hit}>
                {label.slice(start, end)}
            </span>,
        );
        cursor = end;
    }
    if (cursor < label.length) {
        segments.push(label.slice(cursor));
    }
    return segments;
}

export function Combobox({
    label,
    options,
    value,
    onValueChange,
    onSelect,
    placeholder,
    emptyMessage,
    id,
    enabled,
    error,
    tone,
}: ComboboxProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const hasError: boolean = error !== undefined;

    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const labelId: string = useId();
    const listboxId: string = useId();
    const errorId: string = useId();

    const anchorRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);

    const [open, setOpen]: [boolean, (open: boolean) => void] =
        useState<boolean>(false);
    const [activeIndex, setActiveIndex]: [number, (index: number) => void] =
        useState<number>(0);
    const [prevValue, setPrevValue]: [string, (value: string) => void] =
        useState<string>(value);
    const [anchorWidth, setAnchorWidth]: [number, (width: number) => void] =
        useState<number>(0);

    // Render-phase derived-state: every query edit resets the cursor to the
    // best-ranked row.
    if (value !== prevValue) {
        setPrevValue(value);
        setActiveIndex(0);
    }

    const ranked: readonly RankedOption[] = rankOptions(options, value);
    const clampedIndex: number = Math.min(
        activeIndex,
        Math.max(0, ranked.length - 1),
    );
    const activeRow: RankedOption | undefined = ranked[clampedIndex];

    // Match the listbox to the field width (Popover positions but does not
    // size to the anchor), re-measured whenever the listbox opens.
    useLayoutEffect((): void => {
        if (!open) {
            return;
        }
        const anchor: HTMLDivElement | null = anchorRef.current;
        if (anchor === null) {
            return;
        }
        setAnchorWidth(anchor.getBoundingClientRect().width);
    }, [open]);

    function optionDomId(optionId: string): string {
        return `${listboxId}-option-${optionId}`;
    }

    function commit(option: ComboboxOption): void {
        if (option.disabled === true) {
            return;
        }
        onValueChange(option.label);
        onSelect?.(option.id);
        setOpen(false);
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        onValueChange(event.currentTarget.value);
        setOpen(true);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!open) {
                    setOpen(true);
                    return;
                }
                setActiveIndex(Math.min(clampedIndex + 1, ranked.length - 1));
                return;
            case 'ArrowUp':
                event.preventDefault();
                setActiveIndex(Math.max(clampedIndex - 1, 0));
                return;
            case 'Enter':
                if (!open || activeRow === undefined) {
                    return;
                }
                event.preventDefault();
                commit(activeRow.option);
                return;
            case 'Escape':
                if (!open) {
                    return;
                }
                event.preventDefault();
                setOpen(false);
                return;
            default:
                return;
        }
    }

    const activeOptionId: string | undefined =
        open && activeRow !== undefined
            ? optionDomId(activeRow.option.id)
            : undefined;

    const panelStyle: CSSProperties = { minInlineSize: anchorWidth };

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-enabled={resolvedEnabled}
        >
            <label id={labelId} className={styles.label} htmlFor={inputId}>
                {label}
            </label>
            <div ref={anchorRef} className={styles.control}>
                <input
                    id={inputId}
                    className={styles.input}
                    type="text"
                    role="combobox"
                    value={value}
                    {...(placeholder !== undefined ? { placeholder } : {})}
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-controls={listboxId}
                    {...(activeOptionId !== undefined
                        ? { 'aria-activedescendant': activeOptionId }
                        : {})}
                    aria-invalid={hasError ? true : undefined}
                    aria-describedby={hasError ? errorId : undefined}
                    disabled={isDisabled}
                    data-open={open ? 'true' : 'false'}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onClick={(): void => {
                        setOpen(true);
                    }}
                />
            </div>
            {hasError ? (
                <span id={errorId} className={styles.error}>
                    {error}
                </span>
            ) : null}
            <Popover
                open={open && !isDisabled}
                onClose={(): void => {
                    setOpen(false);
                }}
                anchorRef={anchorRef}
                role={EPopoverRole.Listbox}
                id={listboxId}
                labelledBy={labelId}
                placement={EPopoverPlacement.Bottom}
                trapFocus={false}
                restoreFocus={false}
                tone={tone}
            >
                <div className={styles.listbox} style={panelStyle}>
                    {ranked.map(
                        (row: RankedOption, index: number): ReactElement => (
                            <div
                                key={row.option.id}
                                id={optionDomId(row.option.id)}
                                role="option"
                                className={styles.option}
                                aria-selected={index === clampedIndex}
                                aria-disabled={
                                    row.option.disabled === true ? true : undefined
                                }
                                data-active={
                                    index === clampedIndex ? 'true' : 'false'
                                }
                                data-disabled={
                                    row.option.disabled === true ? 'true' : 'false'
                                }
                                onPointerDown={(): void => {
                                    // Pointer-down (the Select precedent)
                                    // commits before any blur can close the
                                    // listbox; keyboard selection lives on
                                    // the input via aria-activedescendant.
                                    commit(row.option);
                                }}
                            >
                                {renderHighlighted(
                                    row.option.label,
                                    row.match.ranges,
                                )}
                            </div>
                        ),
                    )}
                    {ranked.length === 0 ? (
                        <div className={styles.empty}>
                            {emptyMessage ?? 'No matches.'}
                        </div>
                    ) : null}
                </div>
            </Popover>
        </div>
    );
}
