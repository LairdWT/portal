import {
    type ChangeEvent,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useId,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import styles from './ChannelInput.module.css';
import { type ChannelParseResult, parseChannelInput } from './colorMath';

// An INTERNAL number-only editable input rendered beside each ColorPicker slider.
// Kept INTERNAL to the ColorPicker directory (not barrel-exported), mirroring the
// colorMath module precedent, so the public surface stays tight. It is controlled
// with a local free-typing draft buffer (the same pattern the hex field uses) so a
// partial/transient entry does not fight the parent-owned canonical value, and it
// writes through the SAME channel handler the slider calls.
export type ChannelInputProps = Readonly<{
    label: string; // accessible name, e.g. "Red value"
    tag?: string; // optional decorative on-screen channel chip (aria-hidden)
    value: number; // canonical channel value (parent-owned)
    min: number;
    max: number;
    enabled?: EEnabledState;
    onChange: (value: number) => void; // SAME handler the slider uses
}>;

export function ChannelInput({
    label,
    tag,
    value,
    min,
    max,
    enabled,
    onChange,
}: ChannelInputProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const generatedId: string = useId();

    // null => show the canonical value; non-null => user is editing.
    const [draft, setDraft]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(null);

    const parsed: ChannelParseResult | null =
        draft === null ? null : parseChannelInput(draft, min, max);
    const isInvalid: boolean = parsed !== null && !parsed.ok;
    const display: string = draft ?? String(value);

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        const next: string = event.currentTarget.value;
        setDraft(next);
        const result: ChannelParseResult = parseChannelInput(next, min, max);
        if (!result.ok) {
            return; // reject non-numeric: keep draft, do NOT emit
        }
        onChange(result.value); // emit clamped value into the controlled contract
    }

    function handleBlur(): void {
        setDraft(null); // resync to the canonical value, discard a bad draft
    }

    return (
        <label className={styles.field} htmlFor={generatedId}>
            {tag !== undefined ? (
                <span className={styles.tag} aria-hidden="true">
                    {tag}
                </span>
            ) : null}
            <span className={styles.srOnly}>{label}</span>
            <input
                id={generatedId}
                className={styles.input}
                value={display}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                aria-label={label}
                disabled={isDisabled}
                data-enabled={resolvedEnabled}
                aria-invalid={isInvalid ? true : undefined}
                onChange={handleChange}
                onBlur={handleBlur}
            />
        </label>
    );
}
