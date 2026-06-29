import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useRef,
    useState,
} from 'react';

import { ContextMenu } from './ContextMenu';
import { Menu } from './Menu';
import { EMenuNodeKind, type MenuBarMenu, type MenuNode } from './Menu.types';
import { MenuBar } from './MenuBar';

// The shared editor menu used by the dropdown and context-menu stories: actions
// with shortcuts, a checkable item, an exclusive radio group, a disabled action,
// nested separators, and a submenu (itself nesting a submenu).
function buildItems(wrap: boolean, view: string): readonly MenuNode[] {
    return [
        { kind: EMenuNodeKind.Action, id: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
        {
            kind: EMenuNodeKind.Action,
            id: 'copy',
            label: 'Copy',
            shortcut: 'Ctrl+C',
        },
        {
            kind: EMenuNodeKind.Action,
            id: 'paste',
            label: 'Paste',
            shortcut: 'Ctrl+V',
            disabled: true,
        },
        { kind: EMenuNodeKind.Separator, id: 'sep-1' },
        {
            kind: EMenuNodeKind.Checkbox,
            id: 'wrap',
            label: 'Word wrap',
            checked: wrap,
        },
        { kind: EMenuNodeKind.Separator, id: 'sep-2' },
        {
            kind: EMenuNodeKind.Radio,
            id: 'view-list',
            label: 'List view',
            group: 'view',
            checked: view === 'view-list',
        },
        {
            kind: EMenuNodeKind.Radio,
            id: 'view-grid',
            label: 'Grid view',
            group: 'view',
            checked: view === 'view-grid',
        },
        {
            kind: EMenuNodeKind.Radio,
            id: 'view-columns',
            label: 'Columns view',
            group: 'view',
            checked: view === 'view-columns',
        },
        { kind: EMenuNodeKind.Separator, id: 'sep-3' },
        {
            kind: EMenuNodeKind.Submenu,
            id: 'share',
            label: 'Share',
            items: [
                {
                    kind: EMenuNodeKind.Action,
                    id: 'share-link',
                    label: 'Copy link',
                },
                { kind: EMenuNodeKind.Action, id: 'share-email', label: 'Email' },
                {
                    kind: EMenuNodeKind.Submenu,
                    id: 'share-social',
                    label: 'Social',
                    items: [
                        {
                            kind: EMenuNodeKind.Action,
                            id: 'share-mastodon',
                            label: 'Mastodon',
                        },
                        {
                            kind: EMenuNodeKind.Action,
                            id: 'share-bluesky',
                            label: 'Bluesky',
                        },
                    ],
                },
            ],
        },
    ];
}

// Shared checkable state used by the menu wrappers, so activating a checkbox or
// radio flips it the way a consumer wires onSelect to app state.
function useMenuModel(): Readonly<{
    items: readonly MenuNode[];
    onSelect: (id: string) => void;
}> {
    const [wrap, setWrap]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    const [view, setView]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('view-list');
    function onSelect(id: string): void {
        if (id === 'wrap') {
            setWrap((prev: boolean): boolean => !prev);
            return;
        }
        if (id.startsWith('view-')) {
            setView(id);
        }
    }
    return { items: buildItems(wrap, view), onSelect };
}

// A controlled dropdown: a trigger button owns the anchor and the open state.
function ControlledMenu(): ReactElement {
    const anchorRef: RefObject<HTMLButtonElement | null> =
        useRef<HTMLButtonElement | null>(null);
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const { items, onSelect }: ReturnType<typeof useMenuModel> = useMenuModel();
    return (
        <>
            <button
                ref={anchorRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={(): void => {
                    setOpen((prev: boolean): boolean => !prev);
                }}
            >
                Edit menu
            </button>
            <Menu
                items={items}
                open={open}
                onOpenChange={setOpen}
                onSelect={onSelect}
                anchorRef={anchorRef}
                label="Edit"
            />
        </>
    );
}

const BAR_MENUS: readonly MenuBarMenu[] = [
    {
        id: 'file',
        label: 'File',
        items: [
            {
                kind: EMenuNodeKind.Action,
                id: 'new',
                label: 'New',
                shortcut: 'Ctrl+N',
            },
            {
                kind: EMenuNodeKind.Action,
                id: 'open',
                label: 'Open',
                shortcut: 'Ctrl+O',
            },
            { kind: EMenuNodeKind.Separator, id: 'file-sep' },
            {
                kind: EMenuNodeKind.Action,
                id: 'save',
                label: 'Save',
                shortcut: 'Ctrl+S',
            },
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
        items: [
            {
                kind: EMenuNodeKind.Submenu,
                id: 'zoom',
                label: 'Zoom',
                items: [
                    { kind: EMenuNodeKind.Action, id: 'zoom-in', label: 'Zoom in' },
                    {
                        kind: EMenuNodeKind.Action,
                        id: 'zoom-out',
                        label: 'Zoom out',
                    },
                ],
            },
        ],
    },
];

function ControlledMenuBar(): ReactElement {
    const [last, setLast]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('none');
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--portal-space-3)',
            }}
        >
            <MenuBar
                menus={BAR_MENUS}
                label="Application"
                onSelect={(menuId: string, itemId: string): void => {
                    setLast(`${menuId} / ${itemId}`);
                }}
            />
            <span>Last selection: {last}</span>
        </div>
    );
}

function ControlledContextMenu(): ReactElement {
    const { items, onSelect }: ReturnType<typeof useMenuModel> = useMenuModel();
    return (
        <ContextMenu items={items} onSelect={onSelect} label="Region actions">
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minBlockSize: 'calc(var(--portal-touch-target-min) * 4)',
                    minInlineSize: 'calc(var(--portal-touch-target-min) * 8)',
                    border: 'var(--portal-border-thickness-thin) dashed var(--portal-color-border)',
                    borderRadius: 'var(--portal-bevel-2)',
                    color: 'var(--portal-color-text-1)',
                }}
            >
                Right-click this region
            </div>
        </ContextMenu>
    );
}

function TonedMenu(): ReactElement {
    const anchorRef: RefObject<HTMLButtonElement | null> =
        useRef<HTMLButtonElement | null>(null);
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const { items, onSelect }: ReturnType<typeof useMenuModel> = useMenuModel();
    return (
        <>
            <button
                ref={anchorRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={(): void => {
                    setOpen((prev: boolean): boolean => !prev);
                }}
            >
                Toned menu
            </button>
            <Menu
                items={items}
                open={open}
                onOpenChange={setOpen}
                onSelect={onSelect}
                anchorRef={anchorRef}
                label="Toned"
                tone="oklch(0.7 0.18 145)"
            />
        </>
    );
}

const meta: Meta<typeof Menu> = {
    title: 'UI/Menu',
    component: Menu,
};

export default meta;

// The stories are render-only controlled wrappers (Menu requires an anchorRef and
// controlled open state that cannot be expressed as plain story args), so the
// Story type is decoupled from the component's args.
type Story = StoryObj;

export const Dropdown: Story = {
    render: (): ReactElement => <ControlledMenu />,
};

export const Bar: Story = {
    render: (): ReactElement => <ControlledMenuBar />,
};

export const Context: Story = {
    render: (): ReactElement => <ControlledContextMenu />,
};

export const Toned: Story = {
    render: (): ReactElement => <TonedMenu />,
};
