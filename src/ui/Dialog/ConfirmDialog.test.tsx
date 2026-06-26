import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { ConfirmDialog } from './ConfirmDialog';

afterEach((): void => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
});

describe('ConfirmDialog', (): void => {
    it('invokes onConfirm and onClose when the confirm action is pressed', async (): Promise<void> => {
        const onConfirm: Mock<() => void> = vi.fn<() => void>();
        const onCancel: Mock<() => void> = vi.fn<() => void>();
        const onClose: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <ConfirmDialog
                open
                onClose={onClose}
                title="Discard changes?"
                message="Unsaved work will be lost."
                onConfirm={onConfirm}
                onCancel={onCancel}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'OK' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('invokes onCancel and onClose when the cancel action is pressed', async (): Promise<void> => {
        const onConfirm: Mock<() => void> = vi.fn<() => void>();
        const onCancel: Mock<() => void> = vi.fn<() => void>();
        const onClose: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <ConfirmDialog
                open
                onClose={onClose}
                title="Discard changes?"
                message="Unsaved work will be lost."
                onConfirm={onConfirm}
                onCancel={onCancel}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('shows a single acknowledge button when onCancel is omitted', (): void => {
        const onConfirm: Mock<() => void> = vi.fn<() => void>();
        const onClose: Mock<() => void> = vi.fn<() => void>();
        render(
            <ConfirmDialog
                open
                onClose={onClose}
                title="Saved"
                message="Loadout stored."
                onConfirm={onConfirm}
            />,
        );

        expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    });
});
