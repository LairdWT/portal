import type { EEnabledState } from '../../state/state';
import type { CalendarDate } from '../Calendar/calendarMath';
import type { Toned } from '../tone';

// Props for the DatePicker: an ISO text field paired with a Calendar popup.
// The value is a calendar day or null (empty / not yet valid); typing a
// strict ISO date (YYYY-MM-DD) inside the min/max window commits it, clearing
// the field commits null, and any other draft stays local and marks the field
// invalid without destroying the caller's value. Picking a day in the popup
// commits and closes. The text format is deliberately ISO - unambiguous in
// every locale - while the popup carries the locale-formatted month and day
// names through `locale`.
export type DatePickerProps = Readonly<
    {
        label: string;
        value: CalendarDate | null;
        onValueChange: (value: CalendarDate | null) => void;
        locale?: string | undefined;
        min?: CalendarDate | undefined;
        max?: CalendarDate | undefined;
        isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
        placeholder?: string | undefined;
        calendarLabel?: string | undefined;
        toggleLabel?: string | undefined;
        formatHint?: string | undefined;
        id?: string | undefined;
        enabled?: EEnabledState | undefined;
        error?: string | undefined;
    } & Toned
>;
