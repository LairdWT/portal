import { type ChangeEvent, type ReactElement, useId } from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './OtpField.module.css';
import { EOtpFieldMode, type OtpFieldProps } from './OtpField.types';

const DEFAULT_LENGTH: number = 6;

// Strip characters the mode forbids and cap to the cell count. Numeric keeps
// digits only; Text drops whitespace (so a pasted "123 456" still lands).
function sanitizeCode(raw: string, mode: EOtpFieldMode, length: number): string {
    if (mode === EOtpFieldMode.Numeric) {
        return raw.replace(/\D/g, '').slice(0, length);
    }
    return raw.replace(/\s/g, '').slice(0, length);
}

export function OtpField({
    label,
    value,
    onValueChange,
    onComplete,
    length,
    mode,
    id,
    enabled,
    error,
    tone,
}: OtpFieldProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const resolvedLength: number = Math.max(
        1,
        Math.trunc(length ?? DEFAULT_LENGTH),
    );
    const resolvedMode: EOtpFieldMode = mode ?? EOtpFieldMode.Numeric;
    const hasError: boolean = error !== undefined;

    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const errorId: string = useId();

    // The cell holding the caret: one past the filled cells, clamped to the
    // last cell once the code is full.
    const activeIndex: number = Math.min(value.length, resolvedLength - 1);

    const className: string = [toneStyles.toneScope, styles.field]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        const next: string = sanitizeCode(
            event.currentTarget.value,
            resolvedMode,
            resolvedLength,
        );
        if (next === value) {
            return;
        }
        onValueChange?.(next);
        if (next.length === resolvedLength) {
            onComplete?.(next);
        }
    }

    const cells: readonly number[] = Array.from(
        { length: resolvedLength },
        (_unused: unknown, index: number): number => index,
    );

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-enabled={resolvedEnabled}
            data-invalid={hasError ? 'true' : 'false'}
        >
            <label className={styles.label} htmlFor={inputId}>
                {label}
            </label>
            {/* The row is itself a label for the input, so tapping any cell
                focuses the real control natively (its aria-hidden content adds
                nothing to the accessible name, which the text label owns). */}
            <label className={styles.cells} htmlFor={inputId}>
                <input
                    id={inputId}
                    className={styles.input}
                    type="text"
                    value={value}
                    autoComplete="one-time-code"
                    inputMode={
                        resolvedMode === EOtpFieldMode.Numeric ? 'numeric' : 'text'
                    }
                    disabled={isDisabled}
                    aria-invalid={hasError ? true : undefined}
                    aria-describedby={hasError ? errorId : undefined}
                    onChange={handleChange}
                />
                {cells.map(
                    (index: number): ReactElement => (
                        <span
                            key={index}
                            className={styles.cell}
                            aria-hidden="true"
                            data-filled={index < value.length ? 'true' : 'false'}
                            data-active={index === activeIndex ? 'true' : 'false'}
                        >
                            {value[index] ?? ''}
                        </span>
                    ),
                )}
            </label>
            {hasError ? (
                <span id={errorId} className={styles.error}>
                    {error}
                </span>
            ) : null}
        </div>
    );
}
