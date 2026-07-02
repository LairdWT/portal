import {
    type ChangeEvent,
    type CSSProperties,
    type InputHTMLAttributes,
    type KeyboardEvent,
    type MouseEvent,
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
import { Chip } from '../Chip/Chip';
import { type FuzzyMatch, fuzzyMatch } from '../CommandPalette/fuzzyMatch';
import { Popover } from '../Popover/Popover';
import { EPopoverPlacement, EPopoverRole } from '../Popover/Popover.types';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './TagInput.module.css';
import type { TagInputProps } from './TagInput.types';

// One ranked suggestion row: the candidate plus its match ranges.
type RankedSuggestion = Readonly<{
    text: string;
    match: FuzzyMatch;
}>;

// Fuzzy-filter the suggestions against the draft, excluding tags already
// committed; stable-sorted by score so ties keep the caller's order.
function rankSuggestions(
    suggestions: readonly string[],
    tags: readonly string[],
    query: string,
): readonly RankedSuggestion[] {
    const committed: ReadonlySet<string> = new Set(tags);
    const ranked: RankedSuggestion[] = [];
    for (const text of suggestions) {
        if (committed.has(text)) {
            continue;
        }
        const match: FuzzyMatch | null = fuzzyMatch(query, text);
        if (match === null) {
            continue;
        }
        ranked.push({ text, match });
    }
    return ranked.toSorted(
        (a: RankedSuggestion, b: RankedSuggestion): number =>
            b.match.score - a.match.score,
    );
}

// Split a suggestion into plain and emphasized segments from match ranges.
function renderHighlighted(
    text: string,
    ranges: readonly (readonly [number, number])[],
): readonly ReactNode[] {
    const segments: ReactNode[] = [];
    let cursor: number = 0;
    for (const [start, end] of ranges) {
        if (start > cursor) {
            segments.push(text.slice(cursor, start));
        }
        segments.push(
            <span key={`${String(start)}-${String(end)}`} className={styles.hit}>
                {text.slice(start, end)}
            </span>,
        );
        cursor = end;
    }
    if (cursor < text.length) {
        segments.push(text.slice(cursor));
    }
    return segments;
}

export function TagInput({
    label,
    tags,
    onTagsChange,
    value,
    onValueChange,
    suggestions,
    placeholder,
    id,
    enabled,
    error,
    tone,
}: TagInputProps): ReactElement {
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
    const inputRef: RefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);

    const [open, setOpen]: [boolean, (open: boolean) => void] =
        useState<boolean>(false);
    const [activeIndex, setActiveIndex]: [number, (index: number) => void] =
        useState<number>(0);
    const [prevValue, setPrevValue]: [string, (value: string) => void] =
        useState<string>(value);
    const [anchorWidth, setAnchorWidth]: [number, (width: number) => void] =
        useState<number>(0);

    // Render-phase derived-state: every draft edit resets the cursor.
    if (value !== prevValue) {
        setPrevValue(value);
        setActiveIndex(0);
    }

    const ranked: readonly RankedSuggestion[] =
        suggestions === undefined ? [] : rankSuggestions(suggestions, tags, value);
    const listboxOpen: boolean =
        open && !isDisabled && value.trim().length > 0 && ranked.length > 0;
    const clampedIndex: number = Math.min(
        activeIndex,
        Math.max(0, ranked.length - 1),
    );
    const activeRow: RankedSuggestion | undefined = ranked[clampedIndex];

    // Match the listbox to the shell width, re-measured on open.
    useLayoutEffect((): void => {
        if (!listboxOpen) {
            return;
        }
        const anchor: HTMLDivElement | null = anchorRef.current;
        if (anchor === null) {
            return;
        }
        setAnchorWidth(anchor.getBoundingClientRect().width);
    }, [listboxOpen]);

    function suggestionDomId(index: number): string {
        return `${listboxId}-suggestion-${String(index)}`;
    }

    // Commit a tag: trim, drop empties, clear the draft; duplicates clear the
    // draft without re-adding.
    function commitTag(raw: string): void {
        const trimmed: string = raw.trim();
        if (trimmed.length === 0) {
            return;
        }
        onValueChange('');
        setOpen(false);
        if (tags.includes(trimmed)) {
            return;
        }
        onTagsChange([...tags, trimmed]);
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        onValueChange(event.currentTarget.value);
        setOpen(true);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                if (listboxOpen && activeRow !== undefined) {
                    commitTag(activeRow.text);
                    return;
                }
                commitTag(value);
                return;
            case ',':
                event.preventDefault();
                commitTag(value);
                return;
            case 'Backspace':
                if (value.length > 0 || tags.length === 0) {
                    return;
                }
                event.preventDefault();
                onTagsChange(tags.slice(0, -1));
                return;
            case 'ArrowDown':
                if (!listboxOpen) {
                    setOpen(true);
                    return;
                }
                event.preventDefault();
                setActiveIndex(Math.min(clampedIndex + 1, ranked.length - 1));
                return;
            case 'ArrowUp':
                if (!listboxOpen) {
                    return;
                }
                event.preventDefault();
                setActiveIndex(Math.max(clampedIndex - 1, 0));
                return;
            case 'Escape':
                if (!listboxOpen) {
                    return;
                }
                event.preventDefault();
                setOpen(false);
                return;
            default:
                return;
        }
    }

    // A direct press on the shell's empty area focuses the input, so the
    // whole field behaves like one text control; presses on chips (and their
    // remove keys) keep their own behavior.
    function handleShellClick(event: MouseEvent<HTMLDivElement>): void {
        if (event.target !== event.currentTarget) {
            return;
        }
        inputRef.current?.focus();
    }

    // The listbox ARIA wiring exists only when suggestions do, so a plain
    // tag field never advertises a popup it cannot open.
    const listboxWiring: InputHTMLAttributes<HTMLInputElement> =
        suggestions === undefined
            ? {}
            : {
                  role: 'combobox',
                  'aria-autocomplete': 'list',
                  'aria-haspopup': 'listbox',
                  'aria-expanded': listboxOpen,
                  'aria-controls': listboxId,
              };
    const activeSuggestionId: string | undefined =
        listboxOpen && activeRow !== undefined
            ? suggestionDomId(clampedIndex)
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
            data-invalid={hasError ? 'true' : 'false'}
        >
            <label id={labelId} className={styles.label} htmlFor={inputId}>
                {label}
            </label>
            <div
                ref={anchorRef}
                className={styles.shell}
                role="presentation"
                onClick={handleShellClick}
            >
                {tags.map(
                    (tag: string): ReactElement => (
                        <Chip
                            key={tag}
                            label={tag}
                            {...(enabled !== undefined ? { enabled } : {})}
                            onRemove={(): void => {
                                onTagsChange(
                                    tags.filter(
                                        (entry: string): boolean => entry !== tag,
                                    ),
                                );
                            }}
                        >
                            {tag}
                        </Chip>
                    ),
                )}
                <input
                    ref={inputRef}
                    id={inputId}
                    className={styles.input}
                    type="text"
                    value={value}
                    {...(placeholder !== undefined ? { placeholder } : {})}
                    autoComplete="off"
                    {...listboxWiring}
                    {...(activeSuggestionId !== undefined
                        ? { 'aria-activedescendant': activeSuggestionId }
                        : {})}
                    aria-invalid={hasError ? true : undefined}
                    aria-describedby={hasError ? errorId : undefined}
                    disabled={isDisabled}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
            </div>
            {hasError ? (
                <span id={errorId} className={styles.error}>
                    {error}
                </span>
            ) : null}
            {suggestions !== undefined ? (
                <Popover
                    open={listboxOpen}
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
                            (
                                row: RankedSuggestion,
                                index: number,
                            ): ReactElement => (
                                <div
                                    key={row.text}
                                    id={suggestionDomId(index)}
                                    role="option"
                                    className={styles.option}
                                    aria-selected={index === clampedIndex}
                                    data-active={
                                        index === clampedIndex ? 'true' : 'false'
                                    }
                                    onPointerDown={(): void => {
                                        // Pointer-down (the Select
                                        // precedent) commits before any
                                        // blur can close the listbox;
                                        // keyboard selection lives on the
                                        // input via aria-activedescendant.
                                        commitTag(row.text);
                                    }}
                                >
                                    {renderHighlighted(row.text, row.match.ranges)}
                                </div>
                            ),
                        )}
                    </div>
                </Popover>
            ) : null}
        </div>
    );
}
