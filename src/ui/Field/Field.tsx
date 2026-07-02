import { type ReactElement, useId } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Field.module.css';
import type { FieldControlProps, FieldProps } from './Field.types';

// Form scaffolding wrapper: label / hint / error frame plus the id wiring for
// any control. The control is supplied through the children render prop and
// receives spreadable attribute props (id, aria-describedby, aria-invalid,
// aria-required), so Field composes with native inputs and Portal inputs
// alike without owning any input state.
export function Field({
    label,
    children,
    id,
    hint,
    error,
    required,
    tone,
}: FieldProps): ReactElement {
    // A generated id backs the label association when the caller omits one,
    // matching TextField's convention.
    const generatedId: string = useId();
    const controlId: string = id ?? generatedId;
    const hintId: string = useId();
    const errorId: string = useId();

    const hasHint: boolean = hint !== undefined;
    const hasError: boolean = error !== undefined;
    const describedIds: readonly string[] = [
        hasHint ? hintId : undefined,
        hasError ? errorId : undefined,
    ].filter((entry: string | undefined): entry is string => entry !== undefined);
    const describedBy: string | undefined =
        describedIds.length === 0 ? undefined : describedIds.join(' ');

    const control: FieldControlProps = {
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': hasError ? true : undefined,
        'aria-required': required === true ? true : undefined,
    };

    const className: string = [toneStyles.toneScope, styles.field]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-invalid={hasError ? 'true' : 'false'}
        >
            <label className={styles.label} htmlFor={controlId}>
                {label}
                {required === true ? (
                    <span className={styles.requiredMark} aria-hidden="true" />
                ) : null}
            </label>
            {children(control)}
            {hasHint ? (
                <span id={hintId} className={styles.hint}>
                    {hint}
                </span>
            ) : null}
            {hasError ? (
                <span id={errorId} className={styles.error}>
                    {error}
                </span>
            ) : null}
        </div>
    );
}
