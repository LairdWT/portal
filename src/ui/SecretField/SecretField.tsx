import {
    type ChangeEvent,
    type Dispatch,
    type KeyboardEvent,
    type ReactElement,
    type SetStateAction,
    useId,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './SecretField.module.css';
import {
    ECapsLockState,
    ERevealState,
    type SecretFieldProps,
} from './SecretField.types';

// Default accessible name of the reveal toggle while the secret is masked. Kept as
// constants so the component and its tests agree on the exact literal.
const DEFAULT_REVEAL_LABEL: string = 'Show password';
// Default accessible name of the reveal toggle while the secret is shown.
const DEFAULT_CONCEAL_LABEL: string = 'Hide password';
// Default caps-lock advisory, announced politely while focused because a masked
// field hides the mis-casing caps lock would otherwise reveal.
const DEFAULT_CAPS_WARNING: string = 'Caps Lock is on';

export function SecretField({
    label,
    value,
    autoComplete,
    onValueChange,
    id,
    name,
    placeholder,
    enabled,
    error,
    revealLabel,
    concealLabel,
    capsLockWarning,
    tone,
}: SecretFieldProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;

    // A generated id backs the label association when the caller omits one, so the
    // label is always programmatically tied to the input. The error and caps-hint
    // ids back the aria-describedby association.
    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const errorId: string = useId();
    const capsHintId: string = useId();

    // Presentation-only local state. Neither enum holds the secret: reveal drives
    // the native input type and the glyph; capsLock drives the advisory only. The
    // value is parent-owned; this component stores none of it.
    const [reveal, setReveal]: [
        ERevealState,
        Dispatch<SetStateAction<ERevealState>>,
    ] = useState<ERevealState>(ERevealState.Hidden);
    const [capsLock, setCapsLock]: [
        ECapsLockState,
        Dispatch<SetStateAction<ECapsLockState>>,
    ] = useState<ECapsLockState>(ECapsLockState.Unknown);

    const isRevealed: boolean = reveal === ERevealState.Revealed;
    // Private literal union, deliberately NOT ETextFieldType: the secret type never
    // enters the public TextField surface. Masking is this native type switch.
    const inputType: 'password' | 'text' = isRevealed ? 'text' : 'password';
    const hasError: boolean = error !== undefined;
    const capsOn: boolean = capsLock === ECapsLockState.On;
    const resolvedRevealLabel: string = revealLabel ?? DEFAULT_REVEAL_LABEL;
    const resolvedConcealLabel: string = concealLabel ?? DEFAULT_CONCEAL_LABEL;

    // Compose aria-describedby from whichever advisories are present, mirroring the
    // className filter/join idiom; an empty result omits the attribute entirely.
    const describedBy: string = [
        hasError ? errorId : undefined,
        capsOn ? capsHintId : undefined,
    ]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

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
        // Forwards the raw value straight out; nothing is retained or logged.
        onValueChange?.(event.currentTarget.value);
    }

    function readCapsLock(event: KeyboardEvent<HTMLInputElement>): void {
        const isCapsLockOn: boolean = event.getModifierState('CapsLock');
        setCapsLock(isCapsLockOn ? ECapsLockState.On : ECapsLockState.Off);
    }

    function handleBlur(): void {
        // Resting state on blur, so a stale warning never persists after leaving.
        setCapsLock(ECapsLockState.Unknown);
    }

    function toggleReveal(): void {
        if (isDisabled) {
            return;
        }
        setReveal(
            (current: ERevealState): ERevealState =>
                current === ERevealState.Revealed
                    ? ERevealState.Hidden
                    : ERevealState.Revealed,
        );
    }

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
            data-reveal={reveal}
            data-invalid={hasError ? 'true' : undefined}
        >
            <label className={styles.label} htmlFor={inputId}>
                {label}
            </label>
            <div className={styles.field}>
                <input
                    id={inputId}
                    className={styles.input}
                    type={inputType}
                    value={value}
                    autoComplete={autoComplete}
                    spellCheck={false}
                    autoCapitalize="none"
                    {...(name !== undefined ? { name } : {})}
                    {...(placeholder !== undefined ? { placeholder } : {})}
                    disabled={isDisabled}
                    aria-invalid={hasError ? true : undefined}
                    aria-describedby={
                        describedBy.length > 0 ? describedBy : undefined
                    }
                    onChange={handleChange}
                    onKeyDown={readCapsLock}
                    onKeyUp={readCapsLock}
                    onBlur={handleBlur}
                />
                <button
                    type="button"
                    className={styles.toggle}
                    aria-label={
                        isRevealed ? resolvedConcealLabel : resolvedRevealLabel
                    }
                    aria-pressed={isRevealed}
                    aria-controls={inputId}
                    data-reveal={reveal}
                    disabled={isDisabled}
                    onClick={toggleReveal}
                >
                    <span className={styles.toggleGlyph} aria-hidden="true" />
                </button>
            </div>
            {/* A persistent live region: it is established in the DOM from mount
                so assistive tech reliably announces the caps advisory when its
                text appears (mounting the region only when the message appears is
                a known cause of missed announcements). Empty while caps is off;
                aria-describedby points at it only while the message is present. */}
            <span id={capsHintId} role="status" className={styles.capsHint}>
                {capsOn ? (capsLockWarning ?? DEFAULT_CAPS_WARNING) : ''}
            </span>
            {hasError ? (
                <span id={errorId} className={styles.error}>
                    {error}
                </span>
            ) : null}
        </div>
    );
}
