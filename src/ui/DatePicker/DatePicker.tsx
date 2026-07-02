import {
    type ChangeEvent,
    type ReactElement,
    type RefObject,
    useId,
    useRef,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { Calendar } from '../Calendar/Calendar';
import {
    type CalendarDate,
    compareDates,
    dateToIso,
    parseIsoDate,
} from '../Calendar/calendarMath';
import { Popover } from '../Popover/Popover';
import { EPopoverPlacement, EPopoverRole } from '../Popover/Popover.types';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './DatePicker.module.css';
import type { DatePickerProps } from './DatePicker.types';

export function DatePicker({
    label,
    value,
    onValueChange,
    locale,
    min,
    max,
    isDateDisabled,
    placeholder,
    calendarLabel,
    toggleLabel,
    formatHint,
    id,
    enabled,
    error,
    tone,
}: DatePickerProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;

    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const messageId: string = useId();

    const anchorRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);

    const valueIso: string = value === null ? '' : dateToIso(value);
    const [draft, setDraft]: [string, (draft: string) => void] =
        useState<string>(valueIso);
    const [prevValueIso, setPrevValueIso]: [string, (iso: string) => void] =
        useState<string>(valueIso);
    const [open, setOpen]: [boolean, (open: boolean) => void] =
        useState<boolean>(false);

    // Render-phase derived-state: an external value change rewrites the
    // draft; local edits (which may be mid-typing invalid) never loop back.
    if (valueIso !== prevValueIso) {
        setPrevValueIso(valueIso);
        setDraft(valueIso);
    }

    function isInWindow(date: CalendarDate): boolean {
        if (min !== undefined && compareDates(date, min) < 0) {
            return false;
        }
        if (max !== undefined && compareDates(date, max) > 0) {
            return false;
        }
        return isDateDisabled?.(date) !== true;
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        const text: string = event.currentTarget.value;
        setDraft(text);
        if (text.trim().length === 0) {
            setPrevValueIso('');
            onValueChange(null);
            return;
        }
        const parsed: CalendarDate | null = parseIsoDate(text);
        if (parsed === null) {
            return;
        }
        if (!isInWindow(parsed)) {
            return;
        }
        setPrevValueIso(dateToIso(parsed));
        onValueChange(parsed);
    }

    function handlePick(date: CalendarDate): void {
        setPrevValueIso(dateToIso(date));
        setDraft(dateToIso(date));
        onValueChange(date);
        setOpen(false);
    }

    // The draft is invalid when non-empty and either unparseable or outside
    // the window; a caller-supplied error message always wins the slot.
    const parsedDraft: CalendarDate | null = parseIsoDate(draft);
    const draftInvalid: boolean =
        draft.trim().length > 0 &&
        (parsedDraft === null || !isInWindow(parsedDraft));
    const message: string | undefined =
        error ?? (draftInvalid ? (formatHint ?? 'Use YYYY-MM-DD.') : undefined);
    const invalid: boolean = error !== undefined || draftInvalid;

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-enabled={resolvedEnabled}
        >
            <label className={styles.label} htmlFor={inputId}>
                {label}
            </label>
            <div ref={anchorRef} className={styles.control}>
                <input
                    id={inputId}
                    className={styles.input}
                    type="text"
                    value={draft}
                    placeholder={placeholder ?? 'YYYY-MM-DD'}
                    autoComplete="off"
                    inputMode="numeric"
                    aria-invalid={invalid ? true : undefined}
                    aria-describedby={message !== undefined ? messageId : undefined}
                    disabled={isDisabled}
                    onChange={handleChange}
                />
                <button
                    type="button"
                    className={styles.toggle}
                    aria-label={toggleLabel ?? 'Open calendar'}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    disabled={isDisabled}
                    onClick={(): void => {
                        setOpen(!open);
                    }}
                >
                    <span className={styles.toggleGlyph} aria-hidden="true" />
                </button>
            </div>
            {message !== undefined ? (
                <span id={messageId} className={styles.message}>
                    {message}
                </span>
            ) : null}
            <Popover
                open={open && !isDisabled}
                onClose={(): void => {
                    setOpen(false);
                }}
                anchorRef={anchorRef}
                label={calendarLabel ?? 'Choose date'}
                placement={EPopoverPlacement.Bottom}
                role={EPopoverRole.Dialog}
                trapFocus
                restoreFocus
                tone={tone}
            >
                <Calendar
                    label={calendarLabel ?? 'Choose date'}
                    {...(value !== null ? { value } : {})}
                    onSelect={handlePick}
                    {...(locale !== undefined ? { locale } : {})}
                    {...(min !== undefined ? { min } : {})}
                    {...(max !== undefined ? { max } : {})}
                    {...(isDateDisabled !== undefined ? { isDateDisabled } : {})}
                    tone={tone}
                />
            </Popover>
        </div>
    );
}
