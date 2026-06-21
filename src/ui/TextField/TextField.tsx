import { type ChangeEvent, type ReactElement, useId } from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './TextField.module.css';
import { ETextFieldType, type TextFieldProps } from './TextField.types';

export function TextField({
    label,
    value,
    onValueChange,
    id,
    placeholder,
    type,
    enabled,
    error,
    tone,
}: TextFieldProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const inputType: ETextFieldType = type ?? ETextFieldType.Text;
    const hasError: boolean = error !== undefined;

    // A generated id backs the label association when the caller omits one, so
    // the label is always programmatically tied to the input.
    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const errorId: string = useId();

    // The root carries the tone scope (so the derived tone vars resolve) plus the
    // component root class. CSS-module keys are typed string | undefined, so empty
    // entries are filtered before joining.
    const className: string = [toneStyles.toneScope, styles.field]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        onValueChange?.(event.currentTarget.value);
    }

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
        >
            <label className={styles.label} htmlFor={inputId}>
                {label}
            </label>
            <input
                id={inputId}
                className={styles.input}
                type={inputType}
                value={value}
                {...(placeholder !== undefined ? { placeholder } : {})}
                disabled={isDisabled}
                aria-invalid={hasError ? true : undefined}
                aria-describedby={hasError ? errorId : undefined}
                onChange={handleChange}
            />
            {hasError ? (
                <span id={errorId} className={styles.error}>
                    {error}
                </span>
            ) : null}
        </div>
    );
}
