import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EMenuNodeKind, type MenuBarMenu } from './Menu.types';
import { MenuBar } from './MenuBar';

const BAR_MENUS: readonly MenuBarMenu[] = [
    {
        id: 'file',
        label: 'File',
        items: [
            { kind: EMenuNodeKind.Action, id: 'new', label: 'New' },
            { kind: EMenuNodeKind.Action, id: 'open', label: 'Open' },
        ],
    },
    {
        id: 'edit',
        label: 'Edit',
        items: [
            { kind: EMenuNodeKind.Action, id: 'undo', label: 'Undo' },
            { kind: EMenuNodeKind.Action, id: 'redo', label: 'Redo' },
        ],
    },
    {
        id: 'view',
        label: 'View',
        items: [{ kind: EMenuNodeKind.Action, id: 'zoom', label: 'Zoom' }],
    },
];

// A four-entry bar where Edit and Export share the leading `e`, so a second
// type-ahead character can refine the match past Edit onto Export.
const TYPEAHEAD_MENUS: readonly MenuBarMenu[] = [
    {
        id: 'file',
        label: 'File',
        items: [{ kind: EMenuNodeKind.Action, id: 'new', label: 'New' }],
    },
    {
        id: 'edit',
        label: 'Edit',
        items: [{ kind: EMenuNodeKind.Action, id: 'undo', label: 'Undo' }],
    },
    {
        id: 'export',
        label: 'Export',
        items: [{ kind: EMenuNodeKind.Action, id: 'png', label: 'PNG' }],
    },
    {
        id: 'view',
        label: 'View',
        items: [{ kind: EMenuNodeKind.Action, id: 'zoom', label: 'Zoom' }],
    },
];

// A bar with a disabled middle entry, so roving must step over Edit.
const DISABLED_BAR: readonly MenuBarMenu[] = [
    {
        id: 'file',
        label: 'File',
        items: [{ kind: EMenuNodeKind.Action, id: 'new', label: 'New' }],
    },
    {
        id: 'edit',
        label: 'Edit',
        disabled: true,
        items: [{ kind: EMenuNodeKind.Action, id: 'undo', label: 'Undo' }],
    },
    {
        id: 'view',
        label: 'View',
        items: [{ kind: EMenuNodeKind.Action, id: 'zoom', label: 'Zoom' }],
    },
];

afterEach((): void => {
    document.body.innerHTML = '';
});

describe('MenuBar type-ahead', (): void => {
    it('moves bar focus to a typed prefix match', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={TYPEAHEAD_MENUS} label="App" onSelect={vi.fn()} />);
        screen.getByRole('menuitem', { name: 'File' }).focus();

        await user.keyboard('v');

        expect(screen.getByRole('menuitem', { name: 'View' })).toHaveFocus();
    });

    it('refines bar focus as more characters are typed', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={TYPEAHEAD_MENUS} label="App" onSelect={vi.fn()} />);
        screen.getByRole('menuitem', { name: 'File' }).focus();

        await user.keyboard('e');
        expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();

        await user.keyboard('x');
        expect(screen.getByRole('menuitem', { name: 'Export' })).toHaveFocus();
    });

    it('treats a non-matching type-ahead character as a no-op', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={TYPEAHEAD_MENUS} label="App" onSelect={vi.fn()} />);
        const fileButton: HTMLElement = screen.getByRole('menuitem', {
            name: 'File',
        });
        fileButton.focus();

        await user.keyboard('z');

        expect(fileButton).toHaveFocus();
    });
});

describe('MenuBar roving', (): void => {
    it('jumps to the first and last bar items with Home and End', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={vi.fn()} />);
        screen.getByRole('menuitem', { name: 'Edit' }).focus();

        await user.keyboard('{End}');
        expect(screen.getByRole('menuitem', { name: 'View' })).toHaveFocus();

        await user.keyboard('{Home}');
        expect(screen.getByRole('menuitem', { name: 'File' })).toHaveFocus();
    });

    it('skips a disabled bar item while roving', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={DISABLED_BAR} label="App" onSelect={vi.fn()} />);
        const fileButton: HTMLElement = screen.getByRole('menuitem', {
            name: 'File',
        });
        const viewButton: HTMLElement = screen.getByRole('menuitem', {
            name: 'View',
        });
        fileButton.focus();

        await user.keyboard('{ArrowRight}');
        expect(viewButton).toHaveFocus();

        await user.keyboard('{ArrowLeft}');
        expect(fileButton).toHaveFocus();
    });
});

describe('MenuBar open and close', (): void => {
    it('opens the menu and focuses its first item on ArrowDown', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={vi.fn()} />);
        const fileButton: HTMLElement = screen.getByRole('menuitem', {
            name: 'File',
        });
        fileButton.focus();

        await user.keyboard('{ArrowDown}');

        expect(await screen.findByRole('menuitem', { name: 'New' })).toHaveFocus();
        expect(fileButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('opens the menu and focuses its first item on Enter', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={vi.fn()} />);
        screen.getByRole('menuitem', { name: 'File' }).focus();

        await user.keyboard('{Enter}');

        expect(await screen.findByRole('menuitem', { name: 'New' })).toHaveFocus();
    });

    it('opens the menu and focuses its first item on Space', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={vi.fn()} />);
        screen.getByRole('menuitem', { name: 'File' }).focus();

        await user.keyboard('[Space]');

        expect(await screen.findByRole('menuitem', { name: 'New' })).toHaveFocus();
    });

    it('returns focus to the owning bar button when the menu closes', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={vi.fn()} />);
        const fileButton: HTMLElement = screen.getByRole('menuitem', {
            name: 'File',
        });

        await user.click(fileButton);
        await screen.findByRole('menuitem', { name: 'New' });

        await user.keyboard('{Escape}');

        await waitFor((): void => {
            expect(screen.queryByRole('menuitem', { name: 'New' })).toBeNull();
        });
        expect(fileButton).toHaveFocus();
    });
});

describe('MenuBar cross-menu navigation', (): void => {
    it('wraps to the last menu on ArrowLeft from the first open menu', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={vi.fn()} />);

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        await screen.findByRole('menuitem', { name: 'New' });

        await user.keyboard('{ArrowLeft}');

        expect(
            await screen.findByRole('menuitem', { name: 'Zoom' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: 'New' })).toBeNull();
    });

    it('wraps to the first menu on ArrowRight from the last open menu', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={vi.fn()} />);

        await user.click(screen.getByRole('menuitem', { name: 'View' }));
        await screen.findByRole('menuitem', { name: 'Zoom' });

        await user.keyboard('{ArrowRight}');

        expect(
            await screen.findByRole('menuitem', { name: 'New' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: 'Zoom' })).toBeNull();
    });
});
