import {
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useRef,
    useState,
} from 'react';

import {
    type Command,
    CommandPalette,
    Dialog,
    Drawer,
    EDrawerMode,
    EMenuNodeKind,
    EPopoverRole,
    Menu,
    type MenuNode,
    Popover,
    Window,
} from '@laird-wt/portal';

// Overlay dismissal fixture: six independently-controlled portal overlays, each
// with a "before" sentinel button placed BEFORE its trigger so focus-restore is
// observable (focus must return to the trigger, never fall to <body>). The spec
// asserts BEHAVIOR (opened, focus moved into the panel, Escape dismisses, focus
// restored), never the callback name - the dismissal-contract split (onClose vs
// onOpenChange) is wired here so the spec stays contract-name agnostic.

function DialogOverlay(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    return (
        <section aria-label="Dialog overlay">
            <button type="button">Before dialog</button>
            <button
                type="button"
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open dialog
            </button>
            <Dialog
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                title="Dialog title"
            >
                <p>Dialog body</p>
                <button type="button">Dialog action</button>
            </Dialog>
        </section>
    );
}

function DrawerOverlay(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    return (
        <section aria-label="Drawer overlay">
            <button type="button">Before drawer</button>
            <button
                type="button"
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open drawer
            </button>
            <Drawer
                mode={EDrawerMode.Overlay}
                label="Drawer label"
                title="Drawer title"
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
            >
                <p>Drawer body</p>
                <button type="button">Drawer action</button>
            </Drawer>
        </section>
    );
}

function PopoverOverlay(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    return (
        <section aria-label="Popover overlay">
            <button type="button">Before popover</button>
            <Popover
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                role={EPopoverRole.Dialog}
                label="Popover label"
                trapFocus
                trigger={
                    <button
                        type="button"
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        onClick={(): void => {
                            setOpen(true);
                        }}
                    >
                        Open popover
                    </button>
                }
            >
                <p>Popover body</p>
                <button type="button">Popover action</button>
            </Popover>
        </section>
    );
}

const MENU_ITEMS: readonly MenuNode[] = [
    { kind: EMenuNodeKind.Action, id: 'rename', label: 'Rename' },
    { kind: EMenuNodeKind.Action, id: 'duplicate', label: 'Duplicate' },
    { kind: EMenuNodeKind.Action, id: 'delete', label: 'Delete' },
];

function MenuOverlay(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const anchorRef: RefObject<HTMLButtonElement | null> =
        useRef<HTMLButtonElement | null>(null);
    return (
        <section aria-label="Menu overlay">
            <button type="button">Before menu</button>
            <button
                ref={anchorRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open menu
            </button>
            <Menu
                items={MENU_ITEMS}
                open={open}
                onOpenChange={setOpen}
                onSelect={(): void => {
                    setOpen(false);
                }}
                anchorRef={anchorRef}
                label="Menu label"
            />
        </section>
    );
}

function WindowOverlay(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    return (
        <section aria-label="Window overlay">
            <button type="button">Before window</button>
            <button
                type="button"
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open window
            </button>
            <Window
                modal
                open={open}
                onOpenChange={setOpen}
                title="Window title"
                defaultPosition={{ x: 80, y: 80 }}
                defaultSize={{ width: 360, height: 220 }}
            >
                <p>Window body</p>
                <button type="button">Window action</button>
            </Window>
        </section>
    );
}

const PALETTE_COMMANDS: readonly Command[] = [
    { id: 'open', label: 'Open File' },
    { id: 'save', label: 'Save File' },
    { id: 'close', label: 'Close File' },
];

function PaletteOverlay(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [query, setQuery]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('');
    return (
        <section aria-label="Command palette overlay">
            <button type="button">Before palette</button>
            <button
                type="button"
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open palette
            </button>
            <CommandPalette
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                commands={PALETTE_COMMANDS}
                query={query}
                onQueryChange={setQuery}
                onSelect={(): void => {
                    setOpen(false);
                }}
                label="Command palette"
            />
        </section>
    );
}

export function Overlays(): ReactElement {
    return (
        <main>
            <DialogOverlay />
            <DrawerOverlay />
            <PopoverOverlay />
            <MenuOverlay />
            <WindowOverlay />
            <PaletteOverlay />
        </main>
    );
}
