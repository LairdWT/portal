import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';
import type { CalendarDate } from './calendarMath';

// Props for the Calendar: a month-grid date display and selector (the APG
// date-grid pattern). `value` is the selected day; the presented month is
// uncontrolled by default (starting at the value's month, else today's) and
// controllable through `year`/`month` + `onMonthChange`. `locale` drives the
// month/weekday names and the first day of the week through Intl (defaulting
// to the runtime locale); `min`/`max`/`isDateDisabled` gate selection without
// removing days from the grid. Arrow keys move the focused day, PageUp/Down
// turn months, Home/End jump to the week edges - the grid manages one roving
// tab stop.
export type CalendarProps = Readonly<
    {
        label: string;
        value?: CalendarDate | undefined;
        onSelect?: ((date: CalendarDate) => void) | undefined;
        year?: number | undefined;
        month?: number | undefined;
        onMonthChange?: ((year: number, month: number) => void) | undefined;
        locale?: string | undefined;
        min?: CalendarDate | undefined;
        max?: CalendarDate | undefined;
        isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
        previousMonthLabel?: string | undefined;
        nextMonthLabel?: string | undefined;
        enabled?: EEnabledState | undefined;
    } & Toned
>;
