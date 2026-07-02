import {
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Calendar.module.css';
import type { CalendarProps } from './Calendar.types';
import {
    addDays,
    addMonths,
    type CalendarCell,
    type CalendarDate,
    type CalendarWeek,
    compareDates,
    dateLabel,
    dateToIso,
    daysInMonth,
    isSameDate,
    localeFirstDayOfWeek,
    monthGrid,
    monthLabel,
    todayDate,
    weekdayIndex,
    type WeekdayLabel,
    weekdayLabels,
} from './calendarMath';

const DAYS_PER_WEEK: number = 7;

export function Calendar({
    label,
    value,
    onSelect,
    year,
    month,
    onMonthChange,
    locale,
    min,
    max,
    isDateDisabled,
    previousMonthLabel,
    nextMonthLabel,
    enabled,
    tone,
}: CalendarProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const resolvedLocale: string =
        locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
    const firstDay: number = localeFirstDayOfWeek(resolvedLocale);
    const today: CalendarDate = todayDate();
    const initial: CalendarDate = value ?? today;

    const labelId: string = useId();
    const headingId: string = useId();
    const gridRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
        null,
    );
    // Set when a keyboard move should carry DOM focus to the new day after
    // the re-render (an effect focusing an element writes no state).
    const pendingFocusRef: RefObject<boolean> = useRef<boolean>(false);

    const [viewYear, setViewYear]: [number, (year: number) => void] =
        useState<number>(initial.year);
    const [viewMonth, setViewMonth]: [number, (month: number) => void] =
        useState<number>(initial.month);
    const [focused, setFocused]: [CalendarDate, (date: CalendarDate) => void] =
        useState<CalendarDate>(initial);

    const presentedYear: number = year ?? viewYear;
    const presentedMonth: number = month ?? viewMonth;

    // The roving tab stop: the focused day when it is visible, else the first
    // of the presented month (so the grid always has exactly one stop).
    const tabStop: CalendarDate =
        focused.year === presentedYear && focused.month === presentedMonth
            ? focused
            : { year: presentedYear, month: presentedMonth, day: 1 };

    useEffect((): void => {
        if (!pendingFocusRef.current) {
            return;
        }
        pendingFocusRef.current = false;
        const grid: HTMLDivElement | null = gridRef.current;
        if (grid === null) {
            return;
        }
        const target: HTMLButtonElement | null = grid.querySelector(
            `[data-iso="${dateToIso(focused)}"]`,
        );
        target?.focus();
    }, [focused]);

    function presentMonth(nextYear: number, nextMonth: number): void {
        setViewYear(nextYear);
        setViewMonth(nextMonth);
        onMonthChange?.(nextYear, nextMonth);
    }

    function isDayDisabled(date: CalendarDate): boolean {
        if (isDisabled) {
            return true;
        }
        if (min !== undefined && compareDates(date, min) < 0) {
            return true;
        }
        if (max !== undefined && compareDates(date, max) > 0) {
            return true;
        }
        return isDateDisabled?.(date) === true;
    }

    // Keyboard focus movement; turning past the month edge presents the new
    // month and carries DOM focus with it.
    function moveFocus(next: CalendarDate): void {
        if (next.year !== presentedYear || next.month !== presentedMonth) {
            presentMonth(next.year, next.month);
        }
        setFocused(next);
        pendingFocusRef.current = true;
    }

    // A month turn from the header keeps the focused day number, clamped to
    // the target month's length.
    function turnMonth(offset: number): void {
        const anchor: CalendarDate = {
            year: presentedYear,
            month: presentedMonth,
            day: Math.min(tabStop.day, daysInMonth(presentedYear, presentedMonth)),
        };
        const next: CalendarDate = addMonths(anchor, offset);
        presentMonth(next.year, next.month);
        setFocused(next);
    }

    // Attached to every day key (keydown bubbles from the only focusable
    // cell); the moves always act on the roving tab stop.
    function handleGridKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
        if (isDisabled) {
            return;
        }
        const grid: HTMLDivElement | null = gridRef.current;
        const isRtl: boolean =
            grid !== null && getComputedStyle(grid).direction === 'rtl';
        const inlineStep: number = isRtl ? -1 : 1;
        const weekStart: CalendarDate = addDays(
            tabStop,
            -((weekdayIndex(tabStop) - firstDay + DAYS_PER_WEEK) % DAYS_PER_WEEK),
        );
        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                moveFocus(addDays(tabStop, inlineStep));
                return;
            case 'ArrowLeft':
                event.preventDefault();
                moveFocus(addDays(tabStop, -inlineStep));
                return;
            case 'ArrowUp':
                event.preventDefault();
                moveFocus(addDays(tabStop, -DAYS_PER_WEEK));
                return;
            case 'ArrowDown':
                event.preventDefault();
                moveFocus(addDays(tabStop, DAYS_PER_WEEK));
                return;
            case 'Home':
                event.preventDefault();
                moveFocus(weekStart);
                return;
            case 'End':
                event.preventDefault();
                moveFocus(addDays(weekStart, DAYS_PER_WEEK - 1));
                return;
            case 'PageUp':
                event.preventDefault();
                moveFocus(addMonths(tabStop, -1));
                return;
            case 'PageDown':
                event.preventDefault();
                moveFocus(addMonths(tabStop, 1));
                return;
            default:
                return;
        }
    }

    function handleDayClick(date: CalendarDate): void {
        if (isDayDisabled(date)) {
            return;
        }
        setFocused(date);
        onSelect?.(date);
    }

    // Header navigation is gated when the whole adjacent month is outside the
    // min/max window.
    const previousMonthEnd: CalendarDate = addDays(
        { year: presentedYear, month: presentedMonth, day: 1 },
        -1,
    );
    const nextMonthStart: CalendarDate = addMonths(
        { year: presentedYear, month: presentedMonth, day: 1 },
        1,
    );
    const previousBlocked: boolean =
        isDisabled ||
        (min !== undefined && compareDates(previousMonthEnd, min) < 0);
    const nextBlocked: boolean =
        isDisabled || (max !== undefined && compareDates(nextMonthStart, max) > 0);

    const weeks: readonly CalendarWeek[] = monthGrid(
        presentedYear,
        presentedMonth,
        firstDay,
    );
    const headers: readonly WeekdayLabel[] = weekdayLabels(
        resolvedLocale,
        firstDay,
    );

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-enabled={resolvedEnabled}
        >
            <span id={labelId} className={styles.label}>
                {label}
            </span>
            <div className={styles.header}>
                <button
                    type="button"
                    className={styles.turnKey}
                    aria-label={previousMonthLabel ?? 'Previous month'}
                    disabled={previousBlocked}
                    onClick={(): void => {
                        turnMonth(-1);
                    }}
                >
                    <span
                        className={styles.turnGlyph}
                        data-direction="previous"
                        aria-hidden="true"
                    />
                </button>
                <span id={headingId} className={styles.heading} aria-live="polite">
                    {monthLabel(resolvedLocale, presentedYear, presentedMonth)}
                </span>
                <button
                    type="button"
                    className={styles.turnKey}
                    aria-label={nextMonthLabel ?? 'Next month'}
                    disabled={nextBlocked}
                    onClick={(): void => {
                        turnMonth(1);
                    }}
                >
                    <span
                        className={styles.turnGlyph}
                        data-direction="next"
                        aria-hidden="true"
                    />
                </button>
            </div>
            <div
                ref={gridRef}
                role="grid"
                aria-labelledby={labelId}
                aria-describedby={headingId}
                className={styles.grid}
            >
                <div role="row" className={styles.weekdays}>
                    {headers.map(
                        (header: WeekdayLabel): ReactElement => (
                            <span
                                key={header.long}
                                role="columnheader"
                                className={styles.weekday}
                                aria-label={header.long}
                            >
                                {header.narrow}
                            </span>
                        ),
                    )}
                </div>
                {weeks.map(
                    (week: CalendarWeek): ReactElement => (
                        <div
                            key={dateToIso(week[0]?.date ?? tabStop)}
                            role="row"
                            className={styles.week}
                        >
                            {week.map((cell: CalendarCell): ReactElement => {
                                const iso: string = dateToIso(cell.date);
                                const selected: boolean =
                                    value !== undefined &&
                                    isSameDate(cell.date, value);
                                const dayDisabled: boolean = isDayDisabled(
                                    cell.date,
                                );
                                return (
                                    <button
                                        key={iso}
                                        type="button"
                                        role="gridcell"
                                        className={styles.day}
                                        data-iso={iso}
                                        tabIndex={
                                            isSameDate(cell.date, tabStop) &&
                                            !isDisabled
                                                ? 0
                                                : -1
                                        }
                                        aria-label={dateLabel(
                                            resolvedLocale,
                                            cell.date,
                                        )}
                                        aria-selected={selected}
                                        aria-disabled={
                                            dayDisabled ? true : undefined
                                        }
                                        data-in-month={
                                            cell.inMonth ? 'true' : 'false'
                                        }
                                        data-selected={selected ? 'true' : 'false'}
                                        data-today={
                                            isSameDate(cell.date, today)
                                                ? 'true'
                                                : 'false'
                                        }
                                        data-disabled={
                                            dayDisabled ? 'true' : 'false'
                                        }
                                        onClick={(): void => {
                                            handleDayClick(cell.date);
                                        }}
                                        onKeyDown={handleGridKeyDown}
                                    >
                                        {cell.date.day}
                                    </button>
                                );
                            })}
                        </div>
                    ),
                )}
            </div>
        </div>
    );
}
