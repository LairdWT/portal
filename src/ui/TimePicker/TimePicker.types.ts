import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// A wall-clock time of day. Hours are ALWAYS 0-23 in the value regardless of
// the presented cycle; the 12-hour form is a display concern only.
export type TimeValue = Readonly<{
    hours: number;
    minutes: number;
    seconds: number;
}>;

// The presented hour cycle. Locale resolves the default through Intl when
// the prop is omitted.
export const ETimePickerCycle: {
    readonly H23: 'h23';
    readonly H12: 'h12';
} = {
    H23: 'h23',
    H12: 'h12',
};
export type ETimePickerCycle =
    (typeof ETimePickerCycle)[keyof typeof ETimePickerCycle];

// Props for the TimePicker: segmented HH:MM(:SS) entry. Each segment is a
// real numeric input - type to replace, ArrowUp/Down to step with wrapping,
// blur zero-pads - and the meridiem key (12-hour cycle only) toggles AM/PM.
// The value stays 24-hour; `cycle` only changes the presentation and
// defaults from the locale's own hour cycle.
export type TimePickerProps = Readonly<
    {
        label: string;
        value: TimeValue;
        onValueChange: (value: TimeValue) => void;
        withSeconds?: boolean | undefined;
        cycle?: ETimePickerCycle | undefined;
        locale?: string | undefined;
        hoursLabel?: string | undefined;
        minutesLabel?: string | undefined;
        secondsLabel?: string | undefined;
        meridiemLabel?: string | undefined;
        id?: string | undefined;
        enabled?: EEnabledState | undefined;
        error?: string | undefined;
    } & Toned
>;
