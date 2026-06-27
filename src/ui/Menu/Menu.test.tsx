import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useRef,
    useState,
} from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { ContextMenu } from './ContextMenu';
import { Menu } from './Menu';
import { EMenuNodeKind, type UiMenuBarMenu, type UiMenuNode } from './Menu.types';
import { MenuBar } from './MenuBar';

const ITEMS: readonly UiMenuNode[] = [
    { kind: EMenuNodeKind.Action, id: 'new', label: 'New' },
    { kind: EMenuNodeKind.Action, id: 'open', label: 'Open' },
    { kind: EMenuNodeKind.Separator, id: 'sep-1' },
    { kind: EMenuNodeKind.Checkbox, id: 'wrap', label: 'Wrap', checked: false },
    {
        kind: EMenuNodeKind.Radio,
        id: 'list',
        label: 'List',
        group: 'view',
        checked: true,
    },
    {
        kind: EMenuNodeKind.Radio,
        id: 'grid',
        label: 'Grid',
        group: 'view',
        checked: false,
    },
    { kind: EMenuNodeKind.Action, id: 'paste', label: 'Paste', disabled: true },
    {
        kind: EMenuNodeKind.Submenu,
        id: 'more',
        label: 'More',
        items: [
            { kind: EMenuNodeKind.Action, id: 'sub-one', label: 'Sub One' },
            { kind: EMenuNodeKind.Action, id: 'sub-two', label: 'Sub Two' },
        ],
    },
];

const BAR_MENUS: readonly UiMenuBarMenu[] = [
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

const CONTEXT_ITEMS: readonly UiMenuNode[] = [
    { kind: EMenuNodeKind.Action, id: 'edit', label: 'Edit' },
    { kind: EMenuNodeKind.Action, id: 'remove', label: 'Remove' },
];

afterEach((): void => {
    document.body.innerHTML = '';
});

type MenuHarnessProps = Readonly<{
    items?: readonly UiMenuNode[];
    enabled?: EEnabledState;
    onSelect?: (id: string) => void;
}>;

function MenuHarness(props: MenuHarnessProps): ReactElement {
    const anchorRef: RefObject<HTMLButtonElement | null> =
        useRef<HTMLButtonElement | null>(null);
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    return (
        <>
            <button
                ref={anchorRef}
                type="button"
                onClick={(): void => {
                    setOpen((prev: boolean): boolean => !prev);
                }}
            >
                Toggle
            </button>
            <Menu
                items={props.items ?? ITEMS}
                open={open}
                onOpenChange={setOpen}
                onSelect={(id: string): void => {
                    props.onSelect?.(id);
                }}
                anchorRef={anchorRef}
                label="Actions"
                {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
            />
        </>
    );
}

async function openMenu(user: UserEvent): Promise<void> {
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    await screen.findByRole('menu', { name: 'Actions' });
}

describe('Menu', (): void => {
    it('exposes the menu roles for each node kind', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness />);
        await openMenu(user);

        expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument();
        expect(screen.getAllByRole('menuitem')).toHaveLength(4);
        expect(
            screen.getByRole('menuitemcheckbox', { name: 'Wrap' }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole('menuitemradio')).toHaveLength(2);
        expect(screen.getAllByRole('separator')).toHaveLength(1);
    });

    it('auto-focuses the first row and roves with Arrow keys, wrapping', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness />);
        await openMenu(user);

        const newRow: HTMLElement = screen.getByRole('menuitem', { name: 'New' });
        const openRow: HTMLElement = screen.getByRole('menuitem', { name: 'Open' });
        const moreRow: HTMLElement = screen.getByRole('menuitem', { name: 'More' });
        expect(newRow).toHaveFocus();

        await user.keyboard('{ArrowDown}');
        expect(openRow).toHaveFocus();

        await user.keyboard('{ArrowUp}');
        expect(newRow).toHaveFocus();

        await user.keyboard('{ArrowUp}');
        expect(moreRow).toHaveFocus();

        await user.keyboard('{ArrowDown}');
        expect(newRow).toHaveFocus();
    });

    it('jumps to first and last rows with Home and End', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness />);
        await openMenu(user);

        await user.keyboard('{End}');
        expect(screen.getByRole('menuitem', { name: 'More' })).toHaveFocus();

        await user.keyboard('{Home}');
        expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus();
    });

    it('moves focus to a type-ahead prefix match', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness />);
        await openMenu(user);

        await user.keyboard('o');
        expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    });

    it('activates the focused action on Enter, reporting onSelect and closing', async (): Promise<void> => {
        const onSelect: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness onSelect={onSelect} />);
        await openMenu(user);

        await user.keyboard('{Enter}');

        expect(onSelect).toHaveBeenCalledWith('new');
        await waitFor((): void => {
            expect(screen.queryByRole('menu', { name: 'Actions' })).toBeNull();
        });
    });

    it('activates the focused action on Space', async (): Promise<void> => {
        const onSelect: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness onSelect={onSelect} />);
        await openMenu(user);

        await user.keyboard('{ArrowDown}');
        await user.keyboard('[Space]');

        expect(onSelect).toHaveBeenCalledWith('open');
    });

    it('reports a checkbox row id on activation', async (): Promise<void> => {
        const onSelect: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness onSelect={onSelect} />);
        await openMenu(user);

        await user.click(screen.getByRole('menuitemcheckbox', { name: 'Wrap' }));
        expect(onSelect).toHaveBeenCalledWith('wrap');
    });

    it('closes on Escape without selecting', async (): Promise<void> => {
        const onSelect: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness onSelect={onSelect} />);
        await openMenu(user);

        await user.keyboard('{Escape}');

        await waitFor((): void => {
            expect(screen.queryByRole('menu', { name: 'Actions' })).toBeNull();
        });
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('opens a submenu on ArrowRight and closes it on ArrowLeft', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness />);
        await openMenu(user);

        const moreRow: HTMLElement = screen.getByRole('menuitem', { name: 'More' });
        expect(moreRow).toHaveAttribute('aria-haspopup', 'menu');
        expect(moreRow).toHaveAttribute('aria-expanded', 'false');

        await user.keyboard('{End}');
        await user.keyboard('{ArrowRight}');

        expect(moreRow).toHaveAttribute('aria-expanded', 'true');
        expect(
            await screen.findByRole('menuitem', { name: 'Sub One' }),
        ).toHaveFocus();

        await user.keyboard('{ArrowLeft}');

        await waitFor((): void => {
            expect(screen.queryByRole('menuitem', { name: 'Sub One' })).toBeNull();
        });
        expect(moreRow).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens a submenu on click', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness />);
        await openMenu(user);

        fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'More' }));
        expect(
            await screen.findByRole('menuitem', { name: 'Sub One' }),
        ).toBeInTheDocument();
    });

    it('keeps a disabled row inert', async (): Promise<void> => {
        const onSelect: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness onSelect={onSelect} />);
        await openMenu(user);

        const pasteRow: HTMLElement = screen.getByRole('menuitem', {
            name: 'Paste',
        });
        expect(pasteRow).toHaveAttribute('aria-disabled', 'true');

        await user.click(pasteRow);
        expect(onSelect).not.toHaveBeenCalled();
        expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument();
    });

    it('does not open while disabled', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuHarness enabled={EEnabledState.Disabled} />);

        await user.click(screen.getByRole('button', { name: 'Toggle' }));
        expect(screen.queryByRole('menu', { name: 'Actions' })).toBeNull();
    });
});

describe('MenuBar', (): void => {
    it('exposes a menubar of menuitem buttons', (): void => {
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={vi.fn()} />);

        expect(screen.getByRole('menubar', { name: 'App' })).toBeInTheDocument();
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    });

    it('roves across bar buttons with ArrowRight and ArrowLeft', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={vi.fn()} />);

        const fileButton: HTMLElement = screen.getByRole('menuitem', {
            name: 'File',
        });
        const editButton: HTMLElement = screen.getByRole('menuitem', {
            name: 'Edit',
        });
        fileButton.focus();

        await user.keyboard('{ArrowRight}');
        expect(editButton).toHaveFocus();

        await user.keyboard('{ArrowLeft}');
        expect(fileButton).toHaveFocus();
    });

    it('switches the open menu across edges with ArrowRight and ArrowLeft', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={vi.fn()} />);

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        expect(
            await screen.findByRole('menuitem', { name: 'New' }),
        ).toBeInTheDocument();

        await user.keyboard('{ArrowRight}');
        expect(
            await screen.findByRole('menuitem', { name: 'Undo' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: 'New' })).toBeNull();

        await user.keyboard('{ArrowLeft}');
        expect(
            await screen.findByRole('menuitem', { name: 'New' }),
        ).toBeInTheDocument();
    });

    it('reports onSelect with the menu id and item id', async (): Promise<void> => {
        const onSelect: Mock<(menuId: string, itemId: string) => void> =
            vi.fn<(menuId: string, itemId: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<MenuBar menus={BAR_MENUS} label="App" onSelect={onSelect} />);

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        await user.click(await screen.findByRole('menuitem', { name: 'Open' }));

        expect(onSelect).toHaveBeenCalledWith('file', 'open');
    });
});

type ContextHarnessProps = Readonly<{
    enabled?: EEnabledState;
    onSelect?: (id: string) => void;
}>;

function ContextHarness(props: ContextHarnessProps): ReactElement {
    return (
        <ContextMenu
            items={CONTEXT_ITEMS}
            label="Region"
            onSelect={(id: string): void => {
                props.onSelect?.(id);
            }}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
        >
            <div data-testid="region">Region</div>
        </ContextMenu>
    );
}

describe('ContextMenu', (): void => {
    it('opens at the pointer on the contextmenu event', async (): Promise<void> => {
        render(<ContextHarness />);

        fireEvent.contextMenu(screen.getByTestId('region'), {
            clientX: 40,
            clientY: 60,
        });

        expect(
            await screen.findByRole('menu', { name: 'Region' }),
        ).toBeInTheDocument();
    });

    it('reports onSelect and closes when an item is activated', async (): Promise<void> => {
        const onSelect: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<ContextHarness onSelect={onSelect} />);

        fireEvent.contextMenu(screen.getByTestId('region'));
        await screen.findByRole('menu', { name: 'Region' });

        await user.click(screen.getByRole('menuitem', { name: 'Remove' }));

        expect(onSelect).toHaveBeenCalledWith('remove');
        await waitFor((): void => {
            expect(screen.queryByRole('menu', { name: 'Region' })).toBeNull();
        });
    });

    it('closes on Escape', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<ContextHarness />);

        fireEvent.contextMenu(screen.getByTestId('region'));
        await screen.findByRole('menu', { name: 'Region' });

        await user.keyboard('{Escape}');
        await waitFor((): void => {
            expect(screen.queryByRole('menu', { name: 'Region' })).toBeNull();
        });
    });

    it('does not open while disabled', (): void => {
        render(<ContextHarness enabled={EEnabledState.Disabled} />);

        fireEvent.contextMenu(screen.getByTestId('region'));
        expect(screen.queryByRole('menu', { name: 'Region' })).toBeNull();
    });
});
