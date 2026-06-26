import { type ReactElement, type RefObject, useRef } from 'react';

import { EUiStatus } from '../tone';
import { Dialog } from './Dialog';
import styles from './Dialog.module.css';
import { type ConfirmDialogProps } from './Dialog.types';

export function ConfirmDialog({
    open,
    onClose,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    status = EUiStatus.None,
    icon,
    tone,
}: ConfirmDialogProps): ReactElement {
    // The confirm button is the trap's first focus (there is no field), so it is
    // referenced and handed to the Dialog as the initial focus target.
    const confirmRef: RefObject<HTMLButtonElement | null> =
        useRef<HTMLButtonElement | null>(null);
    const showCancel: boolean = onCancel !== undefined;

    function handleConfirm(): void {
        onConfirm();
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
            status={status}
            initialFocusRef={confirmRef}
            {...(tone !== undefined ? { tone } : {})}
        >
            <div className={styles.message}>
                {icon !== undefined ? (
                    <span className={styles.icon} aria-hidden="true">
                        {icon}
                    </span>
                ) : null}
                <span>{message}</span>
            </div>
            <div className={styles.actions}>
                {showCancel ? (
                    <button
                        type="button"
                        className={styles.actionSecondary}
                        onClick={handleCancel}
                    >
                        {cancelLabel}
                    </button>
                ) : null}
                <button
                    ref={confirmRef}
                    type="button"
                    className={styles.actionPrimary}
                    onClick={handleConfirm}
                >
                    {confirmLabel}
                </button>
            </div>
        </Dialog>
    );
}
