import { type ChangeEvent, type ReactElement, useId } from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './TextArea.module.css';
import { ETextAreaResize, type TextAreaProps } from './TextArea.types';

const DEFAULT_ROWS: number = 3;

// The multiline twin of TextField: identical label association, enabled
// resolution, error semantics, and tone plumbing, over a native <textarea>.
export function TextArea({
    label,
    value,
    onValueChange,
    id,
    placeholder,
    rows,
    resize,
    autoSize,
    enabled,
    error,
    tone,
}: TextAreaProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const resolvedResize: ETextAreaResize = resize ?? ETextAreaResize.Block;
    const hasError: boolean = error !== undefined;

    // A generated id backs the label association when the caller omits one, so
    // the label is always programmatically tied to the textarea.
    const generatedId: string = useId();
    const areaId: string = id ?? generatedId;
    const errorId: string = useId();

    const className: string = [toneStyles.toneScope, styles.field]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function handleChange(event: ChangeEvent<HTMLTextAreaElement>): void {
        onValueChange?.(event.currentTarget.value);
    }

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
        >
            <label className={styles.label} htmlFor={areaId}>
                {label}
            </label>
            <textarea
                id={areaId}
                className={styles.input}
                value={value}
                rows={rows ?? DEFAULT_ROWS}
                {...(placeholder !== undefined ? { placeholder } : {})}
                disabled={isDisabled}
                aria-invalid={hasError ? true : undefined}
                aria-describedby={hasError ? errorId : undefined}
                data-resize={resolvedResize}
                data-autosize={autoSize === true ? 'true' : 'false'}
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
