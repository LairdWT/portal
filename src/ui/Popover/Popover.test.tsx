import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Popover } from './Popover';
import { EPopoverRole } from './Popover.types';

// Mutable reduced-motion flag the mocked hook reads, so a test can flip the
// preference without touching window.matchMedia. Hoisted so the vi.mock factory
// may reference it.
const reducedMotion: { value: boolean } = vi.hoisted((): { value: boolean } => ({
    value: false,
}));

vi.mock('../../react/hooks/useReducedMotion', () => ({
    useReducedMotion: (): boolean => reducedMotion.value,
}));

beforeEach((): void => {
    reducedMotion.value = false;
});

afterEach((): void => {
    document.body.innerHTML = '';
});

type HarnessProps = Readonly<{
    initialOpen?: boolean;
    trapFocus?: boolean;
    id?: string;
}>;

function Harness(props: HarnessProps): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialOpen ?? false);
    return (
        <Popover
            open={open}
            onClose={(): void => {
                setOpen(false);
            }}
            label="Test popover"
            role={EPopoverRole.Dialog}
            trapFocus={props.trapFocus ?? false}
            {...(props.id !== undefined ? { id: props.id } : {})}
            trigger={
                <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    onClick={(): void => {
                        setOpen((previous: boolean): boolean => !previous);
                    }}
                >
                    Toggle
                </button>
            }
        >
            <input aria-label="field" />
            <button type="button">Inside</button>
        </Popover>
    );
}

describe('Popover', (): void => {
    it('renders no panel while closed', (): void => {
        render(<Harness />);

        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders the panel content through the portal when open', (): void => {
        render(<Harness initialOpen />);

        const panel: HTMLElement = screen.getByRole('dialog', {
            name: 'Test popover',
        });
        expect(panel).toBeInTheDocument();
        expect(screen.getByLabelText('field')).toBeInTheDocument();
    });

    it('applies the computed coordinates and placement inline', (): void => {
        render(<Harness initialOpen />);

        const panel: HTMLElement = screen.getByRole('dialog', {
            name: 'Test popover',
        });
        // jsdom rects are zero, so with the default viewport the panel resolves
        // to the offset below a zero-sized anchor: clamped to the padding.
        expect(panel.style.top).toBe('8px');
        expect(panel.style.left).toBe('8px');
        expect(panel.style.visibility).toBe('visible');
        expect(panel).toHaveAttribute('data-placement', 'bottom');
    });

    it('applies a passed id to the panel', (): void => {
        render(<Harness initialOpen id="popover-panel" />);

        const panel: HTMLElement = screen.getByRole('dialog', {
            name: 'Test popover',
        });
        expect(panel).toHaveAttribute('id', 'popover-panel');
    });

    it('omits aria-modal in non-modal mode', (): void => {
        render(<Harness initialOpen />);

        const panel: HTMLElement = screen.getByRole('dialog', {
            name: 'Test popover',
        });
        expect(panel).not.toHaveAttribute('aria-modal');
    });

    it('marks the panel aria-modal in modal mode', (): void => {
        render(<Harness initialOpen trapFocus />);

        const panel: HTMLElement = screen.getByRole('dialog', {
            name: 'Test popover',
        });
        expect(panel).toHaveAttribute('aria-modal', 'true');
    });

    it('reports full motion when reduced motion is not preferred', (): void => {
        render(<Harness initialOpen />);

        const panel: HTMLElement = screen.getByRole('dialog', {
            name: 'Test popover',
        });
        expect(panel).toHaveAttribute('data-motion', 'full');
    });

    it('reports reduced motion when the user prefers reduced motion', (): void => {
        reducedMotion.value = true;
        render(<Harness initialOpen />);

        const panel: HTMLElement = screen.getByRole('dialog', {
            name: 'Test popover',
        });
        expect(panel).toHaveAttribute('data-motion', 'reduced');
    });

    it('closes on the Escape key', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialOpen />);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        await user.keyboard('{Escape}');

        await waitFor((): void => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    it('closes on an outside pointer press', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <>
                <Harness initialOpen />
                <button type="button">outside</button>
            </>,
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'outside' }));

        await waitFor((): void => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    it('stays open on a press inside the panel', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialOpen />);

        await user.click(screen.getByRole('button', { name: 'Inside' }));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('restores focus to the trigger on close', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness trapFocus />);

        const trigger: HTMLElement = screen.getByRole('button', { name: 'Toggle' });
        await user.click(trigger);
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await user.keyboard('{Escape}');
        await waitFor((): void => {
            expect(trigger).toHaveFocus();
        });
    });
});
