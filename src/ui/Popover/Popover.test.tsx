import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { Popover, resolvePopoverPosition } from './Popover';
import { EPopoverPlacement, EPopoverRole } from './Popover.types';

afterEach((): void => {
    document.body.innerHTML = '';
});

type HarnessProps = Readonly<{
    initialOpen?: boolean;
    trapFocus?: boolean;
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

describe('resolvePopoverPosition', (): void => {
    const viewport: { width: number; height: number } = {
        width: 1000,
        height: 800,
    };

    it('places the panel below the anchor for the bottom placement', (): void => {
        const coords: ReturnType<typeof resolvePopoverPosition> =
            resolvePopoverPosition({
                anchor: { top: 300, left: 400, width: 100, height: 40 },
                panel: { top: 0, left: 0, width: 200, height: 100 },
                viewport,
                placement: EPopoverPlacement.Bottom,
                offset: 8,
                padding: 8,
            });
        expect(coords).toEqual({
            top: 348,
            left: 400,
            placement: EPopoverPlacement.Bottom,
        });
    });

    it('flips to the top when there is no room below', (): void => {
        const coords: ReturnType<typeof resolvePopoverPosition> =
            resolvePopoverPosition({
                anchor: { top: 740, left: 400, width: 100, height: 40 },
                panel: { top: 0, left: 0, width: 200, height: 100 },
                viewport,
                placement: EPopoverPlacement.Bottom,
                offset: 8,
                padding: 8,
            });
        expect(coords.placement).toBe(EPopoverPlacement.Top);
        expect(coords.top).toBe(632);
    });

    it('shifts left to keep a right-overflowing panel in view', (): void => {
        const coords: ReturnType<typeof resolvePopoverPosition> =
            resolvePopoverPosition({
                anchor: { top: 300, left: 900, width: 80, height: 40 },
                panel: { top: 0, left: 0, width: 200, height: 100 },
                viewport,
                placement: EPopoverPlacement.Bottom,
                offset: 8,
                padding: 8,
            });
        expect(coords.left).toBe(792);
    });

    it('clamps a left-overflowing panel to the viewport padding', (): void => {
        const coords: ReturnType<typeof resolvePopoverPosition> =
            resolvePopoverPosition({
                anchor: { top: 300, left: -20, width: 80, height: 40 },
                panel: { top: 0, left: 0, width: 200, height: 100 },
                viewport,
                placement: EPopoverPlacement.Bottom,
                offset: 8,
                padding: 8,
            });
        expect(coords.left).toBe(8);
    });

    it('flips a right placement to the left near the right edge', (): void => {
        const coords: ReturnType<typeof resolvePopoverPosition> =
            resolvePopoverPosition({
                anchor: { top: 300, left: 850, width: 100, height: 40 },
                panel: { top: 0, left: 0, width: 200, height: 100 },
                viewport,
                placement: EPopoverPlacement.Right,
                offset: 8,
                padding: 8,
            });
        expect(coords.placement).toBe(EPopoverPlacement.Left);
        expect(coords.left).toBe(642);
    });
});

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
