import { describe, expect, it } from 'vitest';

import {
    addDays,
    addMonths,
    type CalendarDate,
    type CalendarWeek,
    clampDate,
    compareDates,
    dateLabel,
    dateToIso,
    daysInMonth,
    isSameDate,
    localeFirstDayOfWeek,
    monthGrid,
    monthLabel,
    parseIsoDate,
    todayDate,
    weekdayIndex,
    weekdayLabels,
} from './calendarMath';

describe('calendarMath', (): void => {
    it('knows month lengths including leap February', (): void => {
        expect(daysInMonth(2026, 1)).toBe(31);
        expect(daysInMonth(2026, 4)).toBe(30);
        expect(daysInMonth(2026, 2)).toBe(28);
        expect(daysInMonth(2024, 2)).toBe(29);
        expect(daysInMonth(2000, 2)).toBe(29);
        expect(daysInMonth(1900, 2)).toBe(28);
    });

    it('adds days across month and year boundaries', (): void => {
        expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({
            year: 2027,
            month: 1,
            day: 1,
        });
        expect(addDays({ year: 2026, month: 3, day: 1 }, -1)).toEqual({
            year: 2026,
            month: 2,
            day: 28,
        });
        expect(addDays({ year: 2026, month: 7, day: 2 }, 0)).toEqual({
            year: 2026,
            month: 7,
            day: 2,
        });
    });

    it('adds months with day clamping and negative wrap', (): void => {
        expect(addMonths({ year: 2026, month: 1, day: 31 }, 1)).toEqual({
            year: 2026,
            month: 2,
            day: 28,
        });
        expect(addMonths({ year: 2024, month: 1, day: 31 }, 1)).toEqual({
            year: 2024,
            month: 2,
            day: 29,
        });
        expect(addMonths({ year: 2026, month: 1, day: 15 }, -2)).toEqual({
            year: 2025,
            month: 11,
            day: 15,
        });
        expect(addMonths({ year: 2026, month: 11, day: 30 }, 3)).toEqual({
            year: 2027,
            month: 2,
            day: 28,
        });
    });

    it('compares, matches, and clamps dates', (): void => {
        const early: CalendarDate = { year: 2026, month: 7, day: 1 };
        const late: CalendarDate = { year: 2026, month: 7, day: 31 };
        expect(compareDates(early, late)).toBeLessThan(0);
        expect(compareDates(late, early)).toBeGreaterThan(0);
        expect(compareDates(early, { ...early })).toBe(0);
        expect(isSameDate(early, { ...early })).toBe(true);
        expect(isSameDate(early, late)).toBe(false);
        expect(clampDate(early, undefined, undefined)).toEqual(early);
        expect(clampDate({ year: 2026, month: 6, day: 15 }, early, late)).toEqual(
            early,
        );
        expect(clampDate({ year: 2026, month: 8, day: 15 }, early, late)).toEqual(
            late,
        );
    });

    it('resolves weekday indices from the calendar', (): void => {
        // 2026-07-02 is a Thursday.
        expect(weekdayIndex({ year: 2026, month: 7, day: 2 })).toBe(4);
        // 2023-01-01 (the Sunday anchor) is a Sunday.
        expect(weekdayIndex({ year: 2023, month: 1, day: 1 })).toBe(0);
    });

    it('produces a valid local today', (): void => {
        const today: CalendarDate = todayDate();
        expect(today.month).toBeGreaterThanOrEqual(1);
        expect(today.month).toBeLessThanOrEqual(12);
        expect(today.day).toBeGreaterThanOrEqual(1);
        expect(today.day).toBeLessThanOrEqual(daysInMonth(today.year, today.month));
    });

    it('round-trips ISO text and rejects impossible days', (): void => {
        expect(dateToIso({ year: 2026, month: 7, day: 2 })).toBe('2026-07-02');
        expect(parseIsoDate('2026-07-02')).toEqual({
            year: 2026,
            month: 7,
            day: 2,
        });
        expect(parseIsoDate('  2026-07-02  ')).toEqual({
            year: 2026,
            month: 7,
            day: 2,
        });
        expect(parseIsoDate('2026-7-2')).toBeNull();
        expect(parseIsoDate('02/07/2026')).toBeNull();
        expect(parseIsoDate('2026-13-01')).toBeNull();
        expect(parseIsoDate('2026-02-30')).toBeNull();
        expect(parseIsoDate('2024-02-29')).toEqual({
            year: 2024,
            month: 2,
            day: 29,
        });
    });

    it('reads the locale first weekday with a Monday fallback', (): void => {
        // Modern runtimes carry weekInfo: en-US weeks start Sunday, German
        // weeks start Monday.
        expect(localeFirstDayOfWeek('en-US')).toBe(0);
        expect(localeFirstDayOfWeek('de-DE')).toBe(1);
        // An unparseable tag falls back to the ISO Monday.
        expect(localeFirstDayOfWeek('not a locale tag')).toBe(1);
    });

    it('builds weekday labels from the requested first day', (): void => {
        const fromSunday: readonly { narrow: string; long: string }[] =
            weekdayLabels('en-US', 0);
        expect(fromSunday).toHaveLength(7);
        expect(fromSunday[0]?.long).toBe('Sunday');
        expect(fromSunday[6]?.long).toBe('Saturday');
        const fromMonday: readonly { narrow: string; long: string }[] =
            weekdayLabels('en-US', 1);
        expect(fromMonday[0]?.long).toBe('Monday');
        expect(fromMonday[6]?.long).toBe('Sunday');
    });

    it('formats month headings and full-date labels through Intl', (): void => {
        expect(monthLabel('en-US', 2026, 7)).toBe('July 2026');
        expect(dateLabel('en-US', { year: 2026, month: 7, day: 2 })).toBe(
            'July 2, 2026',
        );
    });

    it('lays out July 2026 as five complete Sunday-first weeks', (): void => {
        const weeks: readonly CalendarWeek[] = monthGrid(2026, 7, 0);
        expect(weeks).toHaveLength(5);
        for (const week of weeks) {
            expect(week).toHaveLength(7);
        }
        // July 1st 2026 is a Wednesday: three leading June days pad the row.
        expect(weeks[0]?.[0]?.date).toEqual({ year: 2026, month: 6, day: 28 });
        expect(weeks[0]?.[0]?.inMonth).toBe(false);
        expect(weeks[0]?.[3]?.date).toEqual({ year: 2026, month: 7, day: 1 });
        expect(weeks[0]?.[3]?.inMonth).toBe(true);
        // The grid runs through to the following Saturday: August 1st.
        expect(weeks[4]?.[6]?.date).toEqual({ year: 2026, month: 8, day: 1 });
        expect(weeks[4]?.[6]?.inMonth).toBe(false);
    });

    it('lays out a Monday-first grid without a leading gap when day one is Monday', (): void => {
        // June 2026 starts on a Monday.
        const weeks: readonly CalendarWeek[] = monthGrid(2026, 6, 1);
        expect(weeks[0]?.[0]?.date).toEqual({ year: 2026, month: 6, day: 1 });
        expect(weeks[0]?.[0]?.inMonth).toBe(true);
    });
});
