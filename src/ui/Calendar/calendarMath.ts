// calendarMath - the pure, React-free, zero-dependency date engine behind
// Calendar / DatePicker (the radialGeometry precedent: geometry out of the
// component, unit-tested directly). Dates are plain calendar-day value
// objects; all arithmetic runs through Date.UTC so daylight-saving
// transitions can never skip or double a day; month/weekday names and the
// first day of the week come from Intl, so the library ships no locale data
// of its own.

// A calendar day. `month` is 1-12 and `day` 1-based, matching how humans and
// ISO strings write dates (NOT the zero-based Date month).
export type CalendarDate = Readonly<{
    year: number;
    month: number;
    day: number;
}>;

// One grid cell: the day it shows and whether it belongs to the presented
// month (leading/trailing days render dimmed).
export type CalendarCell = Readonly<{
    date: CalendarDate;
    inMonth: boolean;
}>;

// One display row of seven cells.
export type CalendarWeek = readonly CalendarCell[];

const DAYS_PER_WEEK: number = 7;
const ISO_DATE_PATTERN: RegExp = /^(\d{4})-(\d{2})-(\d{2})$/;

// The UTC timestamp of a calendar day's midnight. The single bridge into
// Date; everything else derives from it.
function toUtc(date: CalendarDate): number {
    return Date.UTC(date.year, date.month - 1, date.day);
}

// Rebuild a calendar day from a UTC timestamp.
function fromUtc(timestamp: number): CalendarDate {
    const value: Date = new Date(timestamp);
    return {
        year: value.getUTCFullYear(),
        month: value.getUTCMonth() + 1,
        day: value.getUTCDate(),
    };
}

export function isSameDate(a: CalendarDate, b: CalendarDate): boolean {
    return a.year === b.year && a.month === b.month && a.day === b.day;
}

// Negative when a < b, zero when equal, positive when a > b.
export function compareDates(a: CalendarDate, b: CalendarDate): number {
    return toUtc(a) - toUtc(b);
}

export function daysInMonth(year: number, month: number): number {
    // Day 0 of the NEXT month is this month's last day.
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
    const step: number = 24 * 60 * 60 * 1000;
    return fromUtc(toUtc(date) + days * step);
}

// Month arithmetic clamps the day into the target month (Jan 31 + 1 month is
// Feb 28/29), the convention every date library shares.
export function addMonths(date: CalendarDate, months: number): CalendarDate {
    const zeroBased: number = date.month - 1 + months;
    const year: number = date.year + Math.floor(zeroBased / 12);
    const month: number = ((zeroBased % 12) + 12) % 12;
    const day: number = Math.min(date.day, daysInMonth(year, month + 1));
    return { year, month: month + 1, day };
}

export function clampDate(
    date: CalendarDate,
    min: CalendarDate | undefined,
    max: CalendarDate | undefined,
): CalendarDate {
    if (min !== undefined && compareDates(date, min) < 0) {
        return min;
    }
    if (max !== undefined && compareDates(date, max) > 0) {
        return max;
    }
    return date;
}

// The running day of week for a calendar day: 0 (Sunday) .. 6 (Saturday).
export function weekdayIndex(date: CalendarDate): number {
    return new Date(toUtc(date)).getUTCDay();
}

// Today as a calendar day in the RUNTIME's local time zone (a calendar shows
// the user's wall-clock today, not UTC's).
export function todayDate(): CalendarDate {
    const now: Date = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
    };
}

// ISO 8601 calendar-date text (YYYY-MM-DD), the interchange and wire format.
export function dateToIso(date: CalendarDate): string {
    const month: string = String(date.month).padStart(2, '0');
    const day: string = String(date.day).padStart(2, '0');
    return `${String(date.year)}-${month}-${day}`;
}

// Strict ISO calendar-date parsing: exact shape AND a real calendar day
// (2026-02-31 is rejected, not rolled over).
export function parseIsoDate(text: string): CalendarDate | null {
    const match: RegExpExecArray | null = ISO_DATE_PATTERN.exec(text.trim());
    if (match === null) {
        return null;
    }
    const year: number = Number(match[1]);
    const month: number = Number(match[2]);
    const day: number = Number(match[3]);
    if (month < 1 || month > 12) {
        return null;
    }
    if (day < 1 || day > daysInMonth(year, month)) {
        return null;
    }
    return { year, month, day };
}

// The locale's first day of the week as 0 (Sunday) .. 6 (Saturday), read
// from Intl.Locale week info. Falls back to Monday - the ISO 8601
// convention - when the tag does not parse.
const FALLBACK_FIRST_DAY: number = 1;

export function localeFirstDayOfWeek(locale: string): number {
    let resolved: Intl.Locale;
    try {
        resolved = new Intl.Locale(locale);
    } catch (error: unknown) {
        if (!(error instanceof RangeError)) {
            throw error;
        }
        return FALLBACK_FIRST_DAY;
    }
    // Week info counts 1 (Monday) .. 7 (Sunday); the grid counts from Sunday.
    return resolved.getWeekInfo().firstDay % DAYS_PER_WEEK;
}

// The seven weekday names starting from `firstDay`, in narrow and long forms
// (the narrow form heads the grid columns; the long form is the accessible
// name). Anchored to a known Sunday and formatted in UTC so the labels can
// never shift across a local midnight.
export type WeekdayLabel = Readonly<{
    narrow: string;
    long: string;
}>;

// 2023-01-01 was a Sunday.
const SUNDAY_ANCHOR: CalendarDate = { year: 2023, month: 1, day: 1 };

export function weekdayLabels(
    locale: string,
    firstDay: number,
): readonly WeekdayLabel[] {
    const narrowFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, {
        weekday: 'narrow',
        timeZone: 'UTC',
    });
    const longFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        timeZone: 'UTC',
    });
    const labels: WeekdayLabel[] = [];
    for (let offset: number = 0; offset < DAYS_PER_WEEK; offset += 1) {
        const day: CalendarDate = addDays(
            SUNDAY_ANCHOR,
            (firstDay + offset) % DAYS_PER_WEEK,
        );
        const timestamp: Date = new Date(toUtc(day));
        labels.push({
            narrow: narrowFormat.format(timestamp),
            long: longFormat.format(timestamp),
        });
    }
    return labels;
}

// The presented month's heading ("July 2026"), locale-formatted.
export function monthLabel(locale: string, year: number, month: number): string {
    const format: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
    return format.format(Date.UTC(year, month - 1, 1));
}

// A locale-formatted full date ("2 July 2026") for cell accessible names.
export function dateLabel(locale: string, date: CalendarDate): string {
    const format: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
    return format.format(toUtc(date));
}

// The month laid out as full weeks: leading and trailing out-of-month days
// pad every row to seven cells, so the grid is always 4-6 complete rows.
export function monthGrid(
    year: number,
    month: number,
    firstDay: number,
): readonly CalendarWeek[] {
    const first: CalendarDate = { year, month, day: 1 };
    const leading: number =
        (weekdayIndex(first) - firstDay + DAYS_PER_WEEK) % DAYS_PER_WEEK;
    const total: number = leading + daysInMonth(year, month);
    const rows: number = Math.ceil(total / DAYS_PER_WEEK);
    const gridStart: CalendarDate = addDays(first, -leading);

    const weeks: CalendarWeek[] = [];
    for (let row: number = 0; row < rows; row += 1) {
        const week: CalendarCell[] = [];
        for (let column: number = 0; column < DAYS_PER_WEEK; column += 1) {
            const date: CalendarDate = addDays(
                gridStart,
                row * DAYS_PER_WEEK + column,
            );
            week.push({ date, inMonth: date.month === month });
        }
        weeks.push(week);
    }
    return weeks;
}
