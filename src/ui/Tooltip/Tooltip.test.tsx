import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Tooltip } from './Tooltip';

afterEach((): void => {
    document.body.innerHTML = '';
});

describe('Tooltip', (): void => {
    it('shows on focus and hides on blur', async (): Promise<void> => {
        render(
            <Tooltip content="Help body">
                <button type="button">Trigger</button>
            </Tooltip>,
        );

        const trigger: HTMLElement = screen.getByRole('button', {
            name: 'Trigger',
        });
        trigger.focus();
        expect(await screen.findByRole('tooltip')).toBeInTheDocument();

        trigger.blur();
        await waitFor((): void => {
            expect(screen.queryByRole('tooltip')).toBeNull();
        });
    });

    it('shows on pointer enter and hides on leave', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <Tooltip content="Help body">
                <button type="button">Trigger</button>
            </Tooltip>,
        );

        const trigger: HTMLElement = screen.getByRole('button', {
            name: 'Trigger',
        });
        await user.hover(trigger);
        expect(await screen.findByRole('tooltip')).toBeInTheDocument();

        await user.unhover(trigger);
        await waitFor((): void => {
            expect(screen.queryByRole('tooltip')).toBeNull();
        });
    });

    it('dismisses on the Escape key', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <Tooltip content="Help body">
                <button type="button">Trigger</button>
            </Tooltip>,
        );

        const trigger: HTMLElement = screen.getByRole('button', {
            name: 'Trigger',
        });
        trigger.focus();
        expect(await screen.findByRole('tooltip')).toBeInTheDocument();

        await user.keyboard('{Escape}');
        await waitFor((): void => {
            expect(screen.queryByRole('tooltip')).toBeNull();
        });
    });

    it('wires aria-describedby on the trigger to the panel id', async (): Promise<void> => {
        render(
            <Tooltip content="Help body">
                <button type="button">Trigger</button>
            </Tooltip>,
        );

        const trigger: HTMLElement = screen.getByRole('button', {
            name: 'Trigger',
        });
        trigger.focus();
        const panel: HTMLElement = await screen.findByRole('tooltip');

        const panelId: string | null = panel.getAttribute('id');
        expect(panelId).not.toBeNull();
        expect(trigger).toHaveAttribute('aria-describedby', panelId ?? '');
    });

    it('renders the title and body for the titled variant', async (): Promise<void> => {
        render(
            <Tooltip title="Database" content="Re-runs the query.">
                <button type="button">Trigger</button>
            </Tooltip>,
        );

        const trigger: HTMLElement = screen.getByRole('button', {
            name: 'Trigger',
        });
        trigger.focus();
        await screen.findByRole('tooltip');

        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Re-runs the query.')).toBeInTheDocument();
    });

    it('applies the tone style to the panel', async (): Promise<void> => {
        const toneColor: string = 'rgb(0, 128, 255)';
        render(
            <Tooltip content="Help body" tone={toneColor}>
                <button type="button">Trigger</button>
            </Tooltip>,
        );

        const trigger: HTMLElement = screen.getByRole('button', {
            name: 'Trigger',
        });
        trigger.focus();
        const panel: HTMLElement = await screen.findByRole('tooltip');

        expect(panel.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });
});
