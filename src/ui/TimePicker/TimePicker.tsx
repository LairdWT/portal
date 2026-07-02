import {
    type ChangeEvent,
    type FocusEvent,
    type KeyboardEvent,
    type ReactElement,
    useId,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './TimePicker.module.css';
import { ETimePickerCycle, type TimePickerProps } from './TimePicker.types';

// Which time segment an edit touches.
const ESegment: {
    readonly Hours: 'hours';
    readonly Minutes: 'minutes';
    readonly Seconds: 'seconds';
} = {
    Hours: 'hours',
    Minutes: 'minutes',
    Seconds: 'seconds',
};
type ESegment = (typeof ESegment)[keyof typeof ESegment];

const HOURS_PER_DAY: number = 24;
const HOURS_PER_MERIDIEM: number = 12;
const MINUTES_PER_HOUR: number = 60;

function wrap(raw: number, modulus: number): number {
    return ((raw % modulus) + modulus) % modulus;
}

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

// The locale's own hour cycle, mapped onto the two presented forms.
function localeCycle(locale: string | undefined): ETimePickerCycle {
    const options: Intl.ResolvedDateTimeFormatOptions = new Intl.DateTimeFormat(
        locale,
        { hour: 'numeric' },
    ).resolvedOptions();
    if (options.hourCycle === 'h11' || options.hourCycle === 'h12') {
        return ETimePickerCycle.H12;
    }
    return ETimePickerCycle.H23;
}

export function TimePicker({
    label,
    value,
    onValueChange,
    withSeconds,
    cycle,
    locale,
    hoursLabel,
    minutesLabel,
    secondsLabel,
    meridiemLabel,
    id,
    enabled,
    error,
    tone,
}: TimePickerProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const resolvedCycle: ETimePickerCycle = cycle ?? localeCycle(locale);
    const twelveHour: boolean = resolvedCycle === ETimePickerCycle.H12;
    const hasError: boolean = error !== undefined;

    const generatedId: string = useId();
    const hoursId: string = id ?? generatedId;
    const labelId: string = useId();
    const errorId: string = useId();

    const isPm: boolean = value.hours >= HOURS_PER_MERIDIEM;
    const displayHours: number = twelveHour
        ? ((value.hours + HOURS_PER_MERIDIEM - 1) % HOURS_PER_MERIDIEM) + 1
        : value.hours;

    function commit(segment: ESegment, raw: number): void {
        if (segment === ESegment.Hours) {
            const hours: number = twelveHour
                ? wrap(raw, HOURS_PER_MERIDIEM) + (isPm ? HOURS_PER_MERIDIEM : 0)
                : wrap(raw, HOURS_PER_DAY);
            onValueChange({ ...value, hours });
            return;
        }
        if (segment === ESegment.Minutes) {
            onValueChange({ ...value, minutes: wrap(raw, MINUTES_PER_HOUR) });
            return;
        }
        onValueChange({ ...value, seconds: wrap(raw, MINUTES_PER_HOUR) });
    }

    // Typed digits replace the segment: keep the last two digits typed and
    // clamp into range on commit (12-hour hour text of "12" maps to 0 + PM
    // offset through the wrap above).
    function handleSegmentChange(
        segment: ESegment,
        event: ChangeEvent<HTMLInputElement>,
    ): void {
        const digits: string = event.currentTarget.value
            .replace(/\D/g, '')
            .slice(-2);
        if (digits.length === 0) {
            commit(segment, 0);
            return;
        }
        const numeric: number = Number(digits);
        if (segment === ESegment.Hours && twelveHour) {
            commit(segment, numeric === HOURS_PER_MERIDIEM ? 0 : numeric);
            return;
        }
        commit(segment, numeric);
    }

    function handleSegmentKeyDown(
        segment: ESegment,
        current: number,
        event: KeyboardEvent<HTMLInputElement>,
    ): void {
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                commit(segment, current + 1);
                return;
            case 'ArrowDown':
                event.preventDefault();
                commit(segment, current - 1);
                return;
            default:
                return;
        }
    }

    function handleSegmentFocus(event: FocusEvent<HTMLInputElement>): void {
        event.currentTarget.select();
    }

    function toggleMeridiem(): void {
        const hours: number = isPm
            ? value.hours - HOURS_PER_MERIDIEM
            : value.hours + HOURS_PER_MERIDIEM;
        onValueChange({ ...value, hours });
    }

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
            <span id={labelId} className={styles.label}>
                {label}
            </span>
            <div className={styles.group} role="group" aria-labelledby={labelId}>
                <input
                    id={hoursId}
                    className={styles.segment}
                    type="text"
                    inputMode="numeric"
                    value={pad(displayHours)}
                    aria-label={hoursLabel ?? 'Hours'}
                    aria-invalid={hasError ? true : undefined}
                    aria-describedby={hasError ? errorId : undefined}
                    disabled={isDisabled}
                    onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                        handleSegmentChange(ESegment.Hours, event);
                    }}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>): void => {
                        handleSegmentKeyDown(ESegment.Hours, value.hours, event);
                    }}
                    onFocus={handleSegmentFocus}
                />
                <span className={styles.separator} aria-hidden="true" />
                <input
                    className={styles.segment}
                    type="text"
                    inputMode="numeric"
                    value={pad(value.minutes)}
                    aria-label={minutesLabel ?? 'Minutes'}
                    disabled={isDisabled}
                    onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                        handleSegmentChange(ESegment.Minutes, event);
                    }}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>): void => {
                        handleSegmentKeyDown(
                            ESegment.Minutes,
                            value.minutes,
                            event,
                        );
                    }}
                    onFocus={handleSegmentFocus}
                />
                {withSeconds === true ? (
                    <span className={styles.separator} aria-hidden="true" />
                ) : null}
                {withSeconds === true ? (
                    <input
                        className={styles.segment}
                        type="text"
                        inputMode="numeric"
                        value={pad(value.seconds)}
                        aria-label={secondsLabel ?? 'Seconds'}
                        disabled={isDisabled}
                        onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                            handleSegmentChange(ESegment.Seconds, event);
                        }}
                        onKeyDown={(
                            event: KeyboardEvent<HTMLInputElement>,
                        ): void => {
                            handleSegmentKeyDown(
                                ESegment.Seconds,
                                value.seconds,
                                event,
                            );
                        }}
                        onFocus={handleSegmentFocus}
                    />
                ) : null}
                {twelveHour ? (
                    <button
                        type="button"
                        className={styles.meridiem}
                        aria-label={meridiemLabel ?? 'Toggle AM or PM'}
                        aria-pressed={isPm}
                        disabled={isDisabled}
                        onClick={toggleMeridiem}
                    >
                        {isPm ? 'PM' : 'AM'}
                    </button>
                ) : null}
            </div>
            {hasError ? (
                <span id={errorId} className={styles.error}>
                    {error}
                </span>
            ) : null}
        </div>
    );
}
