import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Toolbar } from './Toolbar';
import { EToolbarOrientation } from './Toolbar.types';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarSeparator } from './ToolbarSeparator';

function renderStrip(orientation?: EToolbarOrientation): void {
    render(
        <Toolbar label="Edit actions" orientation={orientation}>
            <ToolbarGroup label="Clipboard">
                <button type="button">Cut</button>
                <button type="button">Copy</button>
            </ToolbarGroup>
            <ToolbarSeparator />
            <button type="button">Paste</button>
        </Toolbar>,
    );
}

describe('Toolbar', (): void => {
    it('renders a labelled toolbar with exactly one tab stop', (): void => {
        renderStrip();
        expect(
            screen.getByRole('toolbar', { name: 'Edit actions' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cut' })).toHaveAttribute(
            'tabindex',
            '0',
        );
        expect(screen.getByRole('button', { name: 'Copy' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
        expect(screen.getByRole('button', { name: 'Paste' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
    });

    it('moves the stop with arrows, Home, and End', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        renderStrip();
        const cut: HTMLElement = screen.getByRole('button', { name: 'Cut' });
        cut.focus();
        await user.keyboard('{ArrowRight}');
        expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
        await user.keyboard('{End}');
        const paste: HTMLElement = screen.getByRole('button', { name: 'Paste' });
        expect(paste).toHaveFocus();
        expect(paste).toHaveAttribute('tabindex', '0');
        expect(cut).toHaveAttribute('tabindex', '-1');
        await user.keyboard('{Home}');
        expect(cut).toHaveFocus();
        // The stop clamps at the start rather than wrapping.
        await user.keyboard('{ArrowLeft}');
        expect(cut).toHaveFocus();
    });

    it('follows pointer focus so the stop lands where the user clicked', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        renderStrip();
        const copy: HTMLElement = screen.getByRole('button', { name: 'Copy' });
        await user.click(copy);
        expect(copy).toHaveAttribute('tabindex', '0');
        expect(screen.getByRole('button', { name: 'Cut' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
    });

    it('uses the block-axis arrows when vertical', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        renderStrip(EToolbarOrientation.Vertical);
        const cut: HTMLElement = screen.getByRole('button', { name: 'Cut' });
        cut.focus();
        await user.keyboard('{ArrowDown}');
        expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
        await user.keyboard('{ArrowUp}');
        expect(cut).toHaveFocus();
    });

    it('exposes group and separator semantics', (): void => {
        renderStrip();
        expect(
            screen.getByRole('group', { name: 'Clipboard' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('separator')).toBeInTheDocument();
    });
});
