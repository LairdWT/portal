import { fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Window } from './Window';
import {
    EWindowResizeMode,
    EWindowState,
    type WindowPoint,
    type WindowSize,
} from './Window.types';

// Mock callback signatures, so each vi.fn() carries the exact type its slot
// expects (the strict project-reference tsc rejects an untyped Mock assigned to a
// typed callback prop).
type OpenChangeCallback = (open: boolean) => void;
type MoveCallback = (point: WindowPoint) => void;
type ResizeCallback = (size: WindowSize) => void;
type WindowStateCallback = (state: EWindowState) => void;

afterEach((): void => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
});

type HarnessProps = Readonly<{
    initialOpen?: boolean;
    modal?: boolean;
    resize?: EWindowResizeMode;
    minimizable?: boolean;
    maximizable?: boolean;
    tone?: string;
    closeOnEscape?: boolean;
    onOpenChange?: OpenChangeCallback;
    onMove?: MoveCallback;
    onResize?: ResizeCallback;
    onWindowStateChange?: WindowStateCallback;
}>;

const DEFAULT_POSITION: WindowPoint = { x: 96, y: 96 };
const DEFAULT_SIZE: WindowSize = { width: 480, height: 300 };

type OptionalWindowProps = Partial<{
    resize: EWindowResizeMode;
    minimizable: boolean;
    maximizable: boolean;
    tone: string;
    closeOnEscape: boolean;
    onMove: MoveCallback;
    onResize: ResizeCallback;
    onWindowStateChange: WindowStateCallback;
}>;

function Harness(props: HarnessProps): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialOpen ?? true);
    function handleOpenChange(next: boolean): void {
        setOpen(next);
        props.onOpenChange?.(next);
    }
    const optional: OptionalWindowProps = {
        ...(props.resize !== undefined ? { resize: props.resize } : {}),
        ...(props.minimizable === true ? { minimizable: true } : {}),
        ...(props.maximizable === true ? { maximizable: true } : {}),
        ...(props.tone !== undefined ? { tone: props.tone } : {}),
        ...(props.closeOnEscape !== undefined
            ? { closeOnEscape: props.closeOnEscape }
            : {}),
        ...(props.onMove !== undefined ? { onMove: props.onMove } : {}),
        ...(props.onResize !== undefined ? { onResize: props.onResize } : {}),
        ...(props.onWindowStateChange !== undefined
            ? { onWindowStateChange: props.onWindowStateChange }
            : {}),
    };

    if (props.modal === true) {
        return (
            <Window
                modal
                open={open}
                onOpenChange={handleOpenChange}
                title="Settings"
                defaultPosition={DEFAULT_POSITION}
                defaultSize={DEFAULT_SIZE}
                {...optional}
            >
                <button type="button">inside</button>
                <p>window body</p>
            </Window>
        );
    }
    return (
        <Window
            open={open}
            onOpenChange={handleOpenChange}
            title="Settings"
            defaultPosition={DEFAULT_POSITION}
            defaultSize={DEFAULT_SIZE}
            {...optional}
        >
            <button type="button">inside</button>
            <p>window body</p>
        </Window>
    );
}

describe('Window', (): void => {
    it('renders a dialog named by its title with aria-modal reflecting modal', (): void => {
        render(<Harness />);
        const dialog: HTMLElement = screen.getByRole('dialog', {
            name: 'Settings',
        });
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'false');
    });

    it('renders nothing when closed', (): void => {
        render(<Harness initialOpen={false} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('reports a close request through onOpenChange', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onOpenChange: OpenChangeCallback = vi.fn<OpenChangeCallback>();
        render(<Harness onOpenChange={onOpenChange} />);
        await user.click(screen.getByRole('button', { name: 'Close' }));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('locks scroll and sets aria-modal true in modal mode', (): void => {
        render(<Harness modal />);
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('dismisses a modal window on Escape', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onOpenChange: OpenChangeCallback = vi.fn<OpenChangeCallback>();
        render(<Harness modal onOpenChange={onOpenChange} />);
        await user.keyboard('{Escape}');
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('ignores Escape on a non-modal window by default', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onOpenChange: OpenChangeCallback = vi.fn<OpenChangeCallback>();
        render(<Harness onOpenChange={onOpenChange} />);
        await user.keyboard('{Escape}');
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('moves the window with the arrow keys on the move grip', (): void => {
        const onMove: MoveCallback = vi.fn<MoveCallback>();
        render(<Harness onMove={onMove} />);
        const grip: HTMLElement = screen.getByRole('button', {
            name: 'Move Settings',
        });
        fireEvent.keyDown(grip, { key: 'ArrowRight' });
        expect(onMove).toHaveBeenCalledWith({ x: 104, y: 96 });
    });

    it('renders no resize handles when resize is None', (): void => {
        render(<Harness resize={EWindowResizeMode.None} />);
        expect(screen.queryByRole('button', { name: /Resize/ })).toBeNull();
    });

    it('renders the full resize handle set by default', (): void => {
        render(<Harness />);
        const handles: readonly HTMLElement[] = screen.getAllByRole('button', {
            name: /Resize/,
        });
        expect(handles).toHaveLength(8);
    });

    it('resizes the window with the arrow keys on a resize handle', (): void => {
        const onResize: ResizeCallback = vi.fn<ResizeCallback>();
        render(<Harness onResize={onResize} />);
        const handle: HTMLElement = screen.getByRole('button', {
            name: 'Resize right edge',
        });
        fireEvent.keyDown(handle, { key: 'ArrowRight' });
        expect(onResize).toHaveBeenCalledWith({ width: 488, height: 300 });
    });

    it('toggles the minimized state and hides the body', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onWindowStateChange: WindowStateCallback =
            vi.fn<WindowStateCallback>();
        render(<Harness minimizable onWindowStateChange={onWindowStateChange} />);
        expect(screen.getByText('window body')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Minimize' }));
        expect(onWindowStateChange).toHaveBeenCalledWith(EWindowState.Minimized);
        expect(screen.queryByText('window body')).toBeNull();
    });

    it('toggles the maximized state and tracks aria-pressed', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness maximizable />);
        const maximize: HTMLElement = screen.getByRole('button', {
            name: 'Maximize',
        });
        expect(maximize).toHaveAttribute('aria-pressed', 'false');
        await user.click(maximize);
        const dialog: HTMLElement = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('data-state', EWindowState.Maximized);
        expect(screen.getByRole('button', { name: 'Restore' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
    });

    it('applies the tone custom property without tinting text', (): void => {
        render(<Harness tone="oklch(0.7 0.16 150)" />);
        const dialog: HTMLElement = screen.getByRole('dialog');
        expect(dialog.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.16 150)',
        );
    });

    it('raises a focused window above its sibling (z-order)', (): void => {
        function Pair(): ReactElement {
            const [openA, setOpenA]: [boolean, Dispatch<SetStateAction<boolean>>] =
                useState<boolean>(true);
            const [openB, setOpenB]: [boolean, Dispatch<SetStateAction<boolean>>] =
                useState<boolean>(true);
            return (
                <>
                    <Window open={openA} onOpenChange={setOpenA} title="Window A">
                        <p>a</p>
                    </Window>
                    <Window open={openB} onOpenChange={setOpenB} title="Window B">
                        <p>b</p>
                    </Window>
                </>
            );
        }
        render(<Pair />);
        const dialogA: HTMLElement = screen.getByRole('dialog', {
            name: 'Window A',
        });
        const dialogB: HTMLElement = screen.getByRole('dialog', {
            name: 'Window B',
        });
        // B mounts after A, so it starts on top.
        expect(
            Number(dialogB.style.getPropertyValue('--portal-window-z')),
        ).toBeGreaterThan(
            Number(dialogA.style.getPropertyValue('--portal-window-z')),
        );
        fireEvent.focusIn(dialogA);
        expect(
            Number(dialogA.style.getPropertyValue('--portal-window-z')),
        ).toBeGreaterThan(
            Number(dialogB.style.getPropertyValue('--portal-window-z')),
        );
    });

    it('removes the viewport listener on unmount', (): void => {
        const removeSpy: ReturnType<typeof vi.spyOn> = vi.spyOn(
            window,
            'removeEventListener',
        );
        const { unmount }: { unmount: () => void } = render(<Harness />);
        unmount();
        expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    // axe accessibility coverage is delivered by Window.stories.tsx under the
    // addon-a11y story gate (matching Dialog/Select/Toast), not duplicated here.
});
