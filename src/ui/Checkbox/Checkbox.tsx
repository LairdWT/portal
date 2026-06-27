import {
    type ChangeEvent,
    type ReactElement,
    type RefObject,
    useEffect,
    useRef,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Checkbox.module.css';
import { type CheckboxProps } from './Checkbox.types';

// A controlled, tri-aware boolean checkbox for the generic UI layer. The native
// <input type="checkbox"> is the single source of truth for state, focus, and
// keyboard; it is visually hidden with the sr-only clip technique (kept focusable
// and in the tab order) and wrapped in a <label> so the whole >= 3rem row toggles
// it. All presentation derives from the native pseudo-classes (:checked,
// :indeterminate, :disabled, :focus-visible) via an adjacent-sibling selector onto
// the styled box, so there is no presentation enum and no data-state attribute.
export function Checkbox({
    checked,
    indeterminate,
    onChange,
    enabled,
    name,
    value,
    required,
    label,
    labelledBy,
    tone,
}: CheckboxProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    // The native input owns checked/focus/keyboard; a ref lets the effect set the
    // indeterminate DOM PROPERTY (not an attribute, so it cannot be a JSX prop).
    const inputRef: RefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);
    // Root carries the tone scope (so the derived tone vars resolve) plus the
    // component root class; CSS-module keys are string | undefined, so empties are
    // filtered before joining (the SegmentedControl/Rating idiom).
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    // Sync the indeterminate DOM property to the prop. Negative-first guard: a
    // null ref (not yet mounted) returns early. Keyed on `indeterminate` only;
    // `checked` is a controlled attribute React already reconciles.
    useEffect((): void => {
        const node: HTMLInputElement | null = inputRef.current;
        if (node === null) {
            return;
        }
        node.indeterminate = indeterminate === true;
    }, [indeterminate]);

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        if (resolvedEnabled === EEnabledState.Disabled) {
            return;
        }
        onChange?.(event.currentTarget.checked);
    }

    return (
        <label
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
        >
            <input
                ref={inputRef}
                type="checkbox"
                className={styles.input}
                checked={checked}
                disabled={isDisabled}
                {...(name !== undefined ? { name } : {})}
                {...(value !== undefined ? { value } : {})}
                {...(required === true ? { required: true } : {})}
                {...(labelledBy !== undefined
                    ? { 'aria-labelledby': labelledBy }
                    : {})}
                onChange={handleChange}
            />
            <span className={styles.box} aria-hidden="true">
                <svg
                    className={styles.check}
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M3 8.5 L6.5 12 L13 4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <span className={styles.dash} />
            </span>
            {label !== undefined ? (
                <span className={styles.label}>{label}</span>
            ) : null}
        </label>
    );
}
