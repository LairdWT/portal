import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { Hotbar } from './Hotbar';
import { type HotbarSlot } from './Hotbar.types';

type ActivateCallback = (id: string) => void;
type MoveCallback = (fromIndex: number, toIndex: number) => void;
type CaptureCallback = (pointerId: number) => void;

const SLOTS: readonly HotbarSlot[] = [
    { id: 'blink', label: 'Blink', keybind: 'Q', content: <span>BLNK</span> },
    { id: 'barrage', label: 'Barrage', keybind: 'E', content: <span>BRRG</span> },
    { id: 'shield', label: 'Shield', content: <span>SHLD</span> },
];

// jsdom has no layout or pointer capture: stub the capture trio on the
// pressed key and a fixed rect on the bar so slotMath sees real geometry
// (300x100 over 3 slots = 100px columns).
function installPointerStubs(key: HTMLElement, bar: HTMLElement): void {
    key.setPointerCapture = vi.fn<CaptureCallback>();
    key.releasePointerCapture = vi.fn<CaptureCallback>();
    key.hasPointerCapture = vi.fn<(pointerId: number) => boolean>(
        (): boolean => true,
    );
    bar.getBoundingClientRect = (): DOMRect => new DOMRect(0, 0, 300, 100);
}

describe('Hotbar', (): void => {
    it('renders the named group of keys with keybind shortcuts', (): void => {
        render(<Hotbar label="Abilities" slots={SLOTS} />);
        expect(
            screen.getByRole('group', { name: 'Abilities' }),
        ).toBeInTheDocument();
        const blink: HTMLElement = screen.getByRole('button', { name: 'Blink' });
        expect(blink).toHaveAttribute('aria-keyshortcuts', 'Q');
        expect(screen.getByRole('button', { name: 'Shield' })).not.toHaveAttribute(
            'aria-keyshortcuts',
        );
    });

    it('marks the active slot pressed', (): void => {
        render(<Hotbar label="Abilities" slots={SLOTS} activeId="barrage" />);
        expect(screen.getByRole('button', { name: 'Barrage' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        expect(screen.getByRole('button', { name: 'Blink' })).toHaveAttribute(
            'aria-pressed',
            'false',
        );
    });

    it('activates on click exactly once', (): void => {
        const handleActivate: Mock<ActivateCallback> = vi.fn<ActivateCallback>();
        render(
            <Hotbar label="Abilities" slots={SLOTS} onActivate={handleActivate} />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Blink' }));
        expect(handleActivate).toHaveBeenCalledTimes(1);
        expect(handleActivate).toHaveBeenCalledWith('blink');
    });

    it('reorders with Ctrl+Arrow and announces the move', (): void => {
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        render(<Hotbar label="Abilities" slots={SLOTS} onMove={handleMove} />);
        const blink: HTMLElement = screen.getByRole('button', { name: 'Blink' });
        // The reorder shortcuts join the keybind chip in aria-keyshortcuts.
        expect(blink).toHaveAttribute(
            'aria-keyshortcuts',
            'Q Control+ArrowLeft Control+ArrowRight',
        );
        fireEvent.keyDown(blink, { key: 'ArrowRight', ctrlKey: true });
        expect(handleMove).toHaveBeenCalledWith(0, 1);
        expect(screen.getByText('Blink moved to slot 2 of 3.')).toBeInTheDocument();
        // The edges clamp.
        fireEvent.keyDown(blink, { key: 'ArrowLeft', ctrlKey: true });
        expect(handleMove).toHaveBeenCalledTimes(1);
        // Plain arrows never reorder.
        fireEvent.keyDown(blink, { key: 'ArrowRight' });
        expect(handleMove).toHaveBeenCalledTimes(1);
    });

    it('offers no reorder affordances without onMove', (): void => {
        render(<Hotbar label="Abilities" slots={SLOTS} />);
        const blink: HTMLElement = screen.getByRole('button', { name: 'Blink' });
        expect(blink).toHaveAttribute('aria-keyshortcuts', 'Q');
        fireEvent.keyDown(blink, { key: 'ArrowRight', ctrlKey: true });
        expect(screen.queryByText(/moved to slot/)).not.toBeInTheDocument();
    });

    it('reorders with a pointer drag and swallows the trailing click', (): void => {
        const handleActivate: Mock<ActivateCallback> = vi.fn<ActivateCallback>();
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        const view: { container: HTMLElement } = render(
            <Hotbar
                label="Abilities"
                slots={SLOTS}
                onActivate={handleActivate}
                onMove={handleMove}
            />,
        );
        const bar: HTMLElement = screen.getByRole('group', { name: 'Abilities' });
        const blink: HTMLElement = screen.getByRole('button', { name: 'Blink' });
        installPointerStubs(blink, bar);
        // Press in slot 0 (50,50), drag past the threshold into slot 2, drop.
        fireEvent.pointerDown(blink, {
            button: 0,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        });
        fireEvent.pointerMove(blink, { pointerId: 1, clientX: 250, clientY: 50 });
        expect(
            view.container.querySelector('[data-dragging="true"]'),
        ).not.toBeNull();
        expect(screen.getByRole('button', { name: 'Shield' })).toHaveAttribute(
            'data-drop',
            'true',
        );
        fireEvent.pointerUp(blink, { pointerId: 1, clientX: 250, clientY: 50 });
        expect(handleMove).toHaveBeenCalledWith(0, 2);
        // The click that follows a real drag is swallowed once...
        fireEvent.click(blink);
        expect(handleActivate).not.toHaveBeenCalled();
        // ...and the next clean click activates as always.
        fireEvent.click(blink);
        expect(handleActivate).toHaveBeenCalledWith('blink');
    });

    it('keeps sub-threshold presses as activations when reorderable', (): void => {
        const handleActivate: Mock<ActivateCallback> = vi.fn<ActivateCallback>();
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        render(
            <Hotbar
                label="Abilities"
                slots={SLOTS}
                onActivate={handleActivate}
                onMove={handleMove}
            />,
        );
        const bar: HTMLElement = screen.getByRole('group', { name: 'Abilities' });
        const blink: HTMLElement = screen.getByRole('button', { name: 'Blink' });
        installPointerStubs(blink, bar);
        fireEvent.pointerDown(blink, {
            button: 0,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        });
        fireEvent.pointerMove(blink, { pointerId: 1, clientX: 53, clientY: 52 });
        fireEvent.pointerUp(blink, { pointerId: 1, clientX: 53, clientY: 52 });
        fireEvent.click(blink);
        expect(handleMove).not.toHaveBeenCalled();
        expect(handleActivate).toHaveBeenCalledWith('blink');
    });

    it('disables every key when disabled', (): void => {
        const handleActivate: Mock<ActivateCallback> = vi.fn<ActivateCallback>();
        render(
            <Hotbar
                label="Abilities"
                slots={SLOTS}
                onActivate={handleActivate}
                enabled={EEnabledState.Disabled}
            />,
        );
        const blink: HTMLElement = screen.getByRole('button', { name: 'Blink' });
        expect(blink).toBeDisabled();
        fireEvent.click(blink);
        expect(handleActivate).not.toHaveBeenCalled();
    });
});
