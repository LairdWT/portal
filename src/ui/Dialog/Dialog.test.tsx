import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { Dialog } from './Dialog';

afterEach((): void => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
});

type HarnessProps = Readonly<{
    initialOpen?: boolean;
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
}>;

function Harness(props: HarnessProps): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialOpen ?? false);
    return (
        <>
            <button
                type="button"
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open
            </button>
            <button type="button">outside</button>
            <Dialog
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                title="Settings"
                {...(props.closeOnEscape !== undefined
                    ? { closeOnEscape: props.closeOnEscape }
                    : {})}
                {...(props.closeOnBackdrop !== undefined
                    ? { closeOnBackdrop: props.closeOnBackdrop }
                    : {})}
            >
                <button type="button">first</button>
                <button type="button">second</button>
            </Dialog>
        </>
    );
}

describe('Dialog', (): void => {
    it('renders a modal dialog named by its title', (): void => {
        render(<Harness initialOpen />);

        const dialog: HTMLElement = screen.getByRole('dialog', {
            name: 'Settings',
        });
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('dismisses on the Escape key', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialOpen />);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        await user.keyboard('{Escape}');

        await waitFor((): void => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    it('dismisses on an outside (backdrop) pointer press', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialOpen />);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'outside' }));

        await waitFor((): void => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    it('keeps open on Escape when closeOnEscape is false', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialOpen closeOnEscape={false} />);

        await user.keyboard('{Escape}');
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('keeps open on an outside press when closeOnBackdrop is false', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialOpen closeOnBackdrop={false} />);

        await user.click(screen.getByRole('button', { name: 'outside' }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('traps focus: initial focus inside, Tab cycles, focus stays in', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialOpen />);

        const first: HTMLElement = screen.getByRole('button', { name: 'first' });
        const second: HTMLElement = screen.getByRole('button', {
            name: 'second',
        });
        await waitFor((): void => {
            expect(first).toHaveFocus();
        });

        await user.tab();
        expect(second).toHaveFocus();

        await user.tab();
        expect(first).toHaveFocus();
    });

    it('restores focus to the opener on close', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness />);

        const opener: HTMLElement = screen.getByRole('button', { name: 'Open' });
        await user.click(opener);
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await user.keyboard('{Escape}');
        await waitFor((): void => {
            expect(opener).toHaveFocus();
        });
    });

    it('locks body scroll while open and restores it on close', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialOpen />);

        expect(document.body.style.overflow).toBe('hidden');

        await user.keyboard('{Escape}');
        await waitFor((): void => {
            expect(document.body.style.overflow).toBe('');
        });
    });
});
