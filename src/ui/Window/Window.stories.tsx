import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EUiStatus } from '../tone';
import { Window } from './Window';
import { EWindowResizeMode } from './Window.types';

// The stories ARE the automated axe gate (addon-a11y runs `error` under
// addon-vitest), so every wrapper primes the OPEN state on mount: axe then
// evaluates the live portaled dialog tree, not an empty shell.

const BODY_TEXT: string =
    'Drag the title bar to move this window; drag an edge or corner to resize it. Focus it to raise it to the front.';

function FloatingDemo(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    return (
        <Window
            open={open}
            onOpenChange={setOpen}
            title="Telemetry"
            defaultPosition={{ x: 64, y: 64 }}
            defaultSize={{ width: 460, height: 280 }}
        >
            <p>{BODY_TEXT}</p>
        </Window>
    );
}

function ModalDemo(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    return (
        <Window
            modal
            open={open}
            onOpenChange={setOpen}
            title="Confirm uplink"
            defaultPosition={{ x: 120, y: 100 }}
            defaultSize={{ width: 420, height: 240 }}
        >
            <p>
                This modal window blocks the rest of the page. Press Escape or click
                the backdrop to dismiss it.
            </p>
            <button type="button">Acknowledge</button>
        </Window>
    );
}

function NonResizableDemo(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    return (
        <Window
            open={open}
            onOpenChange={setOpen}
            title="Fixed panel"
            resize={EWindowResizeMode.None}
            defaultPosition={{ x: 64, y: 64 }}
            defaultSize={{ width: 400, height: 240 }}
        >
            <p>This window cannot be resized (resize is None).</p>
        </Window>
    );
}

function AffordancesDemo(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    return (
        <Window
            open={open}
            onOpenChange={setOpen}
            title="Mission log"
            minimizable
            maximizable
            defaultPosition={{ x: 80, y: 80 }}
            defaultSize={{ width: 480, height: 300 }}
        >
            <p>
                Use the minimize and maximize affordances in the title bar. The
                maximize button reflects its state with aria-pressed.
            </p>
        </Window>
    );
}

function TitleBarChromeDemo(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    return (
        <Window
            open={open}
            onOpenChange={setOpen}
            title="Sensor array"
            leadingIcon={<span aria-hidden="true">{'>'}</span>}
            statusText="Online"
            titleBarActions={
                <button type="button" aria-label="Refresh">
                    {'R'}
                </button>
            }
            defaultPosition={{ x: 72, y: 72 }}
            defaultSize={{ width: 500, height: 280 }}
        >
            <p>
                The title bar exposes a leading icon, a status string, and a
                host-supplied action cluster (the generalized Helicon title bar).
            </p>
        </Window>
    );
}

function TonedDemo(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    return (
        <Window
            open={open}
            onOpenChange={setOpen}
            title="Faction console"
            tone="oklch(0.7 0.16 150)"
            defaultPosition={{ x: 64, y: 64 }}
            defaultSize={{ width: 440, height: 260 }}
        >
            <p>
                The tone drives the frame edge, the title-bar glow, and the resize
                marks. The text stays on --portal-color-text-* for AA contrast.
            </p>
        </Window>
    );
}

function StatusDangerDemo(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    return (
        <Window
            open={open}
            onOpenChange={setOpen}
            title="Reactor warning"
            status={EUiStatus.Danger}
            defaultPosition={{ x: 64, y: 64 }}
            defaultSize={{ width: 440, height: 240 }}
        >
            <p>
                The danger status routes the danger ramp onto the frame edge and
                glow; the body text contrast is unaffected.
            </p>
        </Window>
    );
}

function MultiWindowDemo(): ReactElement {
    const [openA, setOpenA]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    const [openB, setOpenB]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    return (
        <>
            <Window
                open={openA}
                onOpenChange={setOpenA}
                title="Window A"
                defaultPosition={{ x: 64, y: 64 }}
                defaultSize={{ width: 360, height: 220 }}
            >
                <p>Focus the other window to raise it above this one.</p>
            </Window>
            <Window
                open={openB}
                onOpenChange={setOpenB}
                title="Window B"
                defaultPosition={{ x: 220, y: 160 }}
                defaultSize={{ width: 360, height: 220 }}
            >
                <p>Focusing a window raises it to the front (z-order).</p>
            </Window>
        </>
    );
}

// Window's public props are a discriminated (modal) union, which collapses
// Storybook's arg inference to `never`. The stories drive the component through
// dedicated wrapper components (each owns its controlled state), so a flat
// single-shape args type keeps the meta/story typing sound without ever feeding
// args through the union - matching the SegmentedControl story pattern.
type WindowStoryArgs = Readonly<{ title: string }>;

// `component` is intentionally omitted: tying it to the flat args type would
// require args to satisfy the modal/floating union. The stories render the real
// Window through their wrappers, so the a11y (axe) gate still evaluates the live
// component tree.
const meta: Meta<WindowStoryArgs> = {
    title: 'UI/Window',
    args: { title: 'Window' },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Floating: Story = {
    render: (): ReactElement => <FloatingDemo />,
};

export const Modal: Story = {
    render: (): ReactElement => <ModalDemo />,
};

export const NonResizable: Story = {
    render: (): ReactElement => <NonResizableDemo />,
};

export const WithAffordances: Story = {
    render: (): ReactElement => <AffordancesDemo />,
};

export const TitleBarChrome: Story = {
    render: (): ReactElement => <TitleBarChromeDemo />,
};

export const Toned: Story = {
    render: (): ReactElement => <TonedDemo />,
};

export const StatusDanger: Story = {
    render: (): ReactElement => <StatusDangerDemo />,
};

export const MultiWindow: Story = {
    render: (): ReactElement => <MultiWindowDemo />,
};
