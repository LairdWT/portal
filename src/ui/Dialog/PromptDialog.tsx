import { type ReactElement, type SyntheticEvent } from 'react';

import { SecretField } from '../SecretField/SecretField';
import { TextField } from '../TextField/TextField';
import { Dialog } from './Dialog';
import styles from './Dialog.module.css';
import { type PromptDialogProps } from './Dialog.types';

export function PromptDialog({
    open,
    onClose,
    title,
    label,
    value,
    onValueChange,
    onSubmit,
    onCancel,
    submitLabel = 'OK',
    cancelLabel = 'Cancel',
    placeholder,
    secret,
    tone,
}: PromptDialogProps): ReactElement {
    // A native form gives Enter-to-submit for free (the submit button is the
    // form's default action) without re-handling keydown on the field; the
    // TextField is the trap's first focusable, so focus lands in it on open.
    function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
        event.preventDefault();
        onSubmit(value);
        onClose();
    }

    function handleCancel(): void {
        onCancel?.();
        onClose();
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={title}
            {...(tone !== undefined ? { tone } : {})}
        >
            <form className={styles.promptForm} onSubmit={handleSubmit}>
                {secret !== undefined ? (
                    <SecretField
                        label={label}
                        value={value}
                        onValueChange={onValueChange}
                        autoComplete={secret.autoComplete}
                        {...(placeholder !== undefined ? { placeholder } : {})}
                        {...(secret.toggleLabel !== undefined
                            ? { toggleLabel: secret.toggleLabel }
                            : {})}
                        {...(secret.capsLockWarning !== undefined
                            ? { capsLockWarning: secret.capsLockWarning }
                            : {})}
                    />
                ) : (
                    <TextField
                        label={label}
                        value={value}
                        onValueChange={onValueChange}
                        {...(placeholder !== undefined ? { placeholder } : {})}
                    />
                )}
                <div className={styles.actions}>
                    {onCancel !== undefined ? (
                        <button
                            type="button"
                            className={styles.actionSecondary}
                            onClick={handleCancel}
                        >
                            {cancelLabel}
                        </button>
                    ) : null}
                    <button type="submit" className={styles.actionPrimary}>
                        {submitLabel}
                    </button>
                </div>
            </form>
        </Dialog>
    );
}
