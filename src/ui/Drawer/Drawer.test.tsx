import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { Drawer } from './Drawer';
import { EDrawerEdge, EDrawerMode } from './Drawer.types';

// axe coverage is delivered by Drawer.stories.tsx under the addon-a11y story gate
// (the repo convention - Dialog / Select / Toast rely on the same gate), not by
// jest-axe here. These tests cover behavior, ARIA wiring, and the resize / geometry
// path.

// jsdom does not implement pointer capture; stub the trio so usePointerDrag's
// capture + teardown run without throwing during the pointer-resize test.
beforeAll((): void => {
    const proto: HTMLElement = HTMLElement.prototype;
    if (typeof proto.setPointerCapture !== 'function') {
        proto.setPointerCapture = (): void => undefined;
    }
    if (typeof proto.releasePointerCapture !== 'function') {
        proto.releasePointerCapture = (): void => undefined;
    }
    if (typeof proto.hasPointerCapture !== 'function') {
        proto.hasPointerCapture = (): boolean => false;
    }
});

afterEach((): void => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
});

// ----- Overlay -----------------------------------------------------------

type OverlayHarnessProps = Readonly<{
    initialOpen?: boolean;
    edge?: EDrawerEdge;
}>;

function OverlayHarness(props: OverlayHarnessProps): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialOpen ?? false);
    return (
        <>
            <button
                type="button"
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open
            </button>
            <button type="button">outside</button>
            <Drawer
                mode={EDrawerMode.Overlay}
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                edge={props.edge ?? EDrawerEdge.InlineStart}
                title="Telemetry"
                label="Telemetry drawer"
            >
                <button type="button">inside</button>
            </Drawer>
        </>
    );
}

describe('Drawer overlay mode', (): void => {
    it('renders a named modal dialog only while open', (): void => {
        render(<OverlayHarness initialOpen />);
        const dialog: HTMLElement = screen.getByRole('dialog', {
            name: 'Telemetry drawer',
        });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('data-mode', 'overlay');
    });

    it('renders nothing while closed', (): void => {
        render(<OverlayHarness />);
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('reflects the edge on data-edge', (): void => {
        render(<OverlayHarness initialOpen edge={EDrawerEdge.InlineEnd} />);
        expect(screen.getByRole('dialog')).toHaveAttribute(
            'data-edge',
            'inline-end',
        );
    });

    it('dismisses on Escape', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<OverlayHarness initialOpen />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        await user.keyboard('{Escape}');
        await waitFor((): void => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    it('locks body scroll while open and restores it on close', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<OverlayHarness initialOpen />);
        expect(document.body.style.overflow).toBe('hidden');
        await user.keyboard('{Escape}');
        await waitFor((): void => {
            expect(document.body.style.overflow).toBe('');
        });
    });
});

// ----- Inline ------------------------------------------------------------

type InlineHarnessProps = Readonly<{
    edge?: EDrawerEdge;
    collapsible?: boolean;
    initialCollapsed?: boolean;
    resizable?: boolean;
    enabled?: EEnabledState;
    landmark?: boolean;
    tone?: string;
    onCollapsedChange?: (collapsed: boolean) => void;
    onSizeChange?: (size: number) => void;
}>;

function InlineHarness(props: InlineHarnessProps): ReactElement {
    const [collapsed, setCollapsed]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialCollapsed ?? false);
    const [size, setSize]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(300);
    return (
        <Drawer
            mode={EDrawerMode.Inline}
            edge={props.edge ?? EDrawerEdge.InlineStart}
            title="Inspector"
            label="Inspector panel"
            landmark={props.landmark ?? true}
            collapsible={props.collapsible ?? false}
            collapsed={collapsed}
            toggleLabel="Toggle inspector"
            onCollapsedChange={(next: boolean): void => {
                props.onCollapsedChange?.(next);
                setCollapsed(next);
            }}
            resizable={props.resizable ?? false}
            size={size}
            minSize={200}
            maxSize={500}
            resizeLabel="Resize inspector"
            onSizeChange={(next: number): void => {
                props.onSizeChange?.(next);
                setSize(next);
            }}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
            {...(props.tone !== undefined ? { tone: props.tone } : {})}
        >
            <p>body content</p>
        </Drawer>
    );
}

describe('Drawer inline mode', (): void => {
    it('renders a named complementary landmark by default', (): void => {
        render(<InlineHarness />);
        const region: HTMLElement = screen.getByRole('complementary', {
            name: 'Inspector panel',
        });
        expect(region).toHaveAttribute('data-mode', 'inline');
        expect(region).toHaveAttribute('data-edge', 'inline-start');
    });

    it('downgrades to a region landmark when landmark is false', (): void => {
        render(<InlineHarness landmark={false} />);
        expect(screen.queryByRole('complementary')).toBeNull();
        expect(
            screen.getByRole('region', { name: 'Inspector panel' }),
        ).toBeInTheDocument();
    });

    it('toggles collapse through the chevron and flips the marker + aria-expanded', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onCollapsedChange: (collapsed: boolean) => void =
            vi.fn<(collapsed: boolean) => void>();
        render(<InlineHarness collapsible onCollapsedChange={onCollapsedChange} />);
        const chevron: HTMLElement = screen.getByRole('button', {
            name: 'Toggle inspector',
        });
        expect(chevron).toHaveAttribute('aria-expanded', 'true');

        await user.click(chevron);
        expect(onCollapsedChange).toHaveBeenCalledWith(true);
        expect(chevron).toHaveAttribute('aria-expanded', 'false');
    });

    it('marks the collapsed body inert and the expanded body not', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<InlineHarness collapsible />);
        const body: HTMLElement | null =
            screen.getByText('body content').parentElement;
        expect(body).not.toBeNull();
        expect(body).not.toHaveAttribute('inert');

        await user.click(screen.getByRole('button', { name: 'Toggle inspector' }));
        expect(body).toHaveAttribute('inert');
    });

    it('exposes the tone custom property on the root', (): void => {
        render(<InlineHarness tone="rgb(1 2 3)" />);
        const region: HTMLElement = screen.getByRole('complementary');
        expect(region.style.getPropertyValue('--portal-tone')).toBe('rgb(1 2 3)');
    });
});

// ----- Resize splitter ---------------------------------------------------

describe('Drawer resize splitter', (): void => {
    it('renders a window-splitter wired to the body with size ARIA', (): void => {
        render(<InlineHarness resizable />);
        const handle: HTMLElement = screen.getByRole('slider', {
            name: 'Resize inspector',
        });
        expect(handle).toHaveAttribute('aria-orientation', 'vertical');
        expect(handle).toHaveAttribute('aria-valuenow', '300');
        expect(handle).toHaveAttribute('aria-valuemin', '200');
        expect(handle).toHaveAttribute('aria-valuemax', '500');
        const body: HTMLElement | null =
            screen.getByText('body content').parentElement;
        expect(handle.getAttribute('aria-controls')).toBe(body?.id);
    });

    it('steps the size with the Arrow keys and jumps with Home/End', (): void => {
        const onSizeChange: (size: number) => void =
            vi.fn<(size: number) => void>();
        render(<InlineHarness resizable onSizeChange={onSizeChange} />);
        const handle: HTMLElement = screen.getByRole('slider');

        fireEvent.keyDown(handle, { key: 'ArrowRight' });
        expect(onSizeChange).toHaveBeenLastCalledWith(316);

        fireEvent.keyDown(handle, { key: 'Home' });
        expect(onSizeChange).toHaveBeenLastCalledWith(200);

        fireEvent.keyDown(handle, { key: 'End' });
        expect(onSizeChange).toHaveBeenLastCalledWith(500);
    });

    it('reports the clamped mapped size on a pointer drag', (): void => {
        const onSizeChange: (size: number) => void =
            vi.fn<(size: number) => void>();
        render(<InlineHarness resizable onSizeChange={onSizeChange} />);
        const handle: HTMLElement = screen.getByRole('slider');

        fireEvent.pointerDown(handle, {
            button: 0,
            pointerId: 1,
            clientX: 100,
            clientY: 100,
        });
        fireEvent.pointerMove(handle, {
            pointerId: 1,
            clientX: 140,
            clientY: 100,
        });
        fireEvent.pointerUp(handle, {
            pointerId: 1,
            clientX: 140,
            clientY: 100,
        });

        // InlineStart, +1 sign: 300 + (140 - 100) = 340, within [200, 500].
        expect(onSizeChange).toHaveBeenLastCalledWith(340);
    });
});

// ----- Disabled ----------------------------------------------------------

describe('Drawer disabled', (): void => {
    it('disables the chevron and the splitter and fires no callbacks', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onCollapsedChange: (collapsed: boolean) => void =
            vi.fn<(collapsed: boolean) => void>();
        const onSizeChange: (size: number) => void =
            vi.fn<(size: number) => void>();
        render(
            <InlineHarness
                collapsible
                resizable
                enabled={EEnabledState.Disabled}
                onCollapsedChange={onCollapsedChange}
                onSizeChange={onSizeChange}
            />,
        );
        const chevron: HTMLElement = screen.getByRole('button', {
            name: 'Toggle inspector',
        });
        expect(chevron).toBeDisabled();

        const handle: HTMLElement = screen.getByRole('slider');
        expect(handle).toHaveAttribute('tabindex', '-1');
        expect(handle).toHaveAttribute('data-disabled');

        await user.click(chevron);
        expect(onCollapsedChange).not.toHaveBeenCalled();

        fireEvent.keyDown(handle, { key: 'ArrowRight' });
        expect(onSizeChange).not.toHaveBeenCalled();
    });
});

// ----- data attributes ---------------------------------------------------

describe('Drawer data attributes', (): void => {
    it('reflects status on data-status', (): void => {
        render(
            <Drawer
                mode={EDrawerMode.Inline}
                title="Inspector"
                label="Inspector panel"
                status={EUiStatus.Danger}
            >
                <p>content</p>
            </Drawer>,
        );
        expect(screen.getByRole('complementary')).toHaveAttribute(
            'data-status',
            'danger',
        );
    });
});
