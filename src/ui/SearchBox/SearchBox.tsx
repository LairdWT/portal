import {
    type ChangeEvent,
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    useId,
    useRef,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './SearchBox.module.css';
import { ESearchBoxState, type SearchBoxProps } from './SearchBox.types';

// The accessible name of the clear control. Kept as a constant so the component
// and its tests agree on the exact label without duplicating the literal.
const CLEAR_LABEL: string = 'Clear search';

export function SearchBox({
    label,
    value,
    onChange,
    onSubmit,
    id,
    placeholder,
    enabled,
    tone,
}: SearchBoxProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const isFilled: boolean = value.length > 0;
    const fillState: ESearchBoxState = isFilled
        ? ESearchBoxState.Filled
        : ESearchBoxState.Empty;

    // A generated id backs the label association when the caller omits one, so the
    // label is always programmatically tied to the input.
    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;

    // The input is focused after a clear so keyboard users keep their place; a ref
    // is the only React-blessed handle for that imperative focus call.
    const inputRef: RefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);

    // The root carries the tone scope (so the derived tone vars resolve) plus the
    // component root class. CSS-module keys are typed string | undefined, so empty
    // entries are filtered before joining.
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        if (isDisabled) {
            return;
        }
        onChange?.(event.currentTarget.value);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
        if (isDisabled) {
            return;
        }
        if (event.key !== 'Enter') {
            return;
        }
        event.preventDefault();
        onSubmit?.(value);
    }

    function handleClear(): void {
        if (isDisabled) {
            return;
        }
        onChange?.('');
        inputRef.current?.focus();
    }

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
            data-state={fillState}
        >
            <label className={styles.label} htmlFor={inputId}>
                {label}
            </label>
            <div className={styles.field}>
                <span className={styles.affordance} aria-hidden="true" />
                <input
                    ref={inputRef}
                    id={inputId}
                    className={styles.input}
                    type="search"
                    value={value}
                    {...(placeholder !== undefined ? { placeholder } : {})}
                    disabled={isDisabled}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
                {isFilled ? (
                    <button
                        type="button"
                        className={styles.clear}
                        aria-label={CLEAR_LABEL}
                        disabled={isDisabled}
                        data-enabled={resolvedEnabled}
                        onClick={handleClear}
                    >
                        <span className={styles.clearGlyph} aria-hidden="true" />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
