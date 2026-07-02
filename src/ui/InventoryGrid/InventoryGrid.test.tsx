import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { InventoryGrid } from './InventoryGrid';
import { type InventorySlot } from './InventoryGrid.types';

type MoveCallback = (fromIndex: number, toIndex: number) => void;
type CaptureCallback = (pointerId: number) => void;

// 2 rows x 3 columns; the first two slots are occupied.
const SLOTS: readonly InventorySlot[] = [
    { id: 'plasma', label: 'Plasma cell', content: <span>PC</span> },
    { id: 'medkit', label: 'Medkit', content: <span>MK</span> },
    { id: 'e3' },
    { id: 'e4' },
    { id: 'e5' },
    { id: 'e6' },
];

// jsdom has no layout or pointer capture: stub the capture trio on the
// pressed cell and a fixed rect on the grid so slotMath sees real geometry
// (300x200 over 3x2 = 100x100 cells).
function installPointerStubs(cell: HTMLElement, grid: HTMLElement): void {
    cell.setPointerCapture = vi.fn<CaptureCallback>();
    cell.releasePointerCapture = vi.fn<CaptureCallback>();
    cell.hasPointerCapture = vi.fn<(pointerId: number) => boolean>(
        (): boolean => true,
    );
    grid.getBoundingClientRect = (): DOMRect => new DOMRect(0, 0, 300, 200);
}

describe('InventoryGrid', (): void => {
    it('renders the APG grid with rows, cells, and derived names', (): void => {
        render(<InventoryGrid label="Cargo" slots={SLOTS} columns={3} />);
        const grid: HTMLElement = screen.getByRole('grid', { name: 'Cargo' });
        expect(grid).toBeInTheDocument();
        expect(screen.getAllByRole('row')).toHaveLength(2);
        expect(screen.getAllByRole('gridcell')).toHaveLength(6);
        expect(
            screen.getByRole('gridcell', { name: 'Plasma cell' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('gridcell', { name: 'Empty slot 3' }),
        ).toBeInTheDocument();
    });

    it('roves a single tab stop with the arrows', (): void => {
        render(<InventoryGrid label="Cargo" slots={SLOTS} columns={3} />);
        const cells: readonly HTMLElement[] = screen.getAllByRole('gridcell');
        expect(cells[0]).toHaveAttribute('tabindex', '0');
        expect(cells[1]).toHaveAttribute('tabindex', '-1');
        const first: HTMLElement | undefined = cells[0];
        if (first === undefined) {
            throw new Error('missing first cell');
        }
        fireEvent.keyDown(first, { key: 'ArrowRight' });
        expect(cells[1]).toHaveAttribute('tabindex', '0');
        expect(cells[1]).toHaveFocus();
        fireEvent.keyDown(cells[1] ?? first, { key: 'ArrowDown' });
        expect(cells[4]).toHaveFocus();
    });

    it('grabs, moves, and drops from the keyboard', (): void => {
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        render(
            <InventoryGrid
                label="Cargo"
                slots={SLOTS}
                columns={3}
                onMove={handleMove}
            />,
        );
        const source: HTMLElement = screen.getByRole('gridcell', {
            name: 'Plasma cell',
        });
        fireEvent.keyDown(source, { key: ' ' });
        expect(source).toHaveAttribute('aria-selected', 'true');
        expect(source).toHaveAttribute('data-state', 'selected');
        expect(screen.getByRole('gridcell', { name: 'Medkit' })).toHaveAttribute(
            'data-state',
            'targetable',
        );
        expect(screen.getByText(/Plasma cell grabbed/)).toBeInTheDocument();
        // Walk to the empty slot below and drop.
        fireEvent.keyDown(source, { key: 'ArrowDown' });
        const target: HTMLElement = screen.getByRole('gridcell', {
            name: 'Empty slot 4',
        });
        expect(target).toHaveFocus();
        fireEvent.keyDown(target, { key: 'Enter' });
        expect(handleMove).toHaveBeenCalledWith(0, 3);
        expect(
            screen.getByText('Plasma cell moved to Empty slot 4.'),
        ).toBeInTheDocument();
    });

    it('cancels a grab with Escape and ignores grabbing empty slots', (): void => {
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        render(
            <InventoryGrid
                label="Cargo"
                slots={SLOTS}
                columns={3}
                onMove={handleMove}
            />,
        );
        const empty: HTMLElement = screen.getByRole('gridcell', {
            name: 'Empty slot 3',
        });
        fireEvent.keyDown(empty, { key: 'Enter' });
        expect(empty).toHaveAttribute('aria-selected', 'false');
        const source: HTMLElement = screen.getByRole('gridcell', {
            name: 'Plasma cell',
        });
        fireEvent.keyDown(source, { key: ' ' });
        fireEvent.keyDown(source, { key: 'Escape' });
        expect(source).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByText('Move canceled.')).toBeInTheDocument();
        expect(handleMove).not.toHaveBeenCalled();
    });

    it('reorders with a pointer drag onto another slot', (): void => {
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        const view: { container: HTMLElement } = render(
            <InventoryGrid
                label="Cargo"
                slots={SLOTS}
                columns={3}
                onMove={handleMove}
            />,
        );
        const grid: HTMLElement = screen.getByRole('grid');
        const source: HTMLElement = screen.getByRole('gridcell', {
            name: 'Plasma cell',
        });
        installPointerStubs(source, grid);
        // Press in cell 0 (50,50), drag to cell 5 (250,150), release.
        fireEvent.pointerDown(source, {
            button: 0,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        });
        fireEvent.pointerMove(source, { pointerId: 1, clientX: 250, clientY: 150 });
        expect(
            view.container.querySelector('[data-dragging="true"]'),
        ).not.toBeNull();
        expect(
            screen.getByRole('gridcell', { name: 'Empty slot 6' }),
        ).toHaveAttribute('data-drop', 'true');
        fireEvent.pointerUp(source, { pointerId: 1, clientX: 250, clientY: 150 });
        expect(handleMove).toHaveBeenCalledWith(0, 5);
    });

    it('disables every cell and ignores input when disabled', (): void => {
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        render(
            <InventoryGrid
                label="Cargo"
                slots={SLOTS}
                columns={3}
                onMove={handleMove}
                enabled={EEnabledState.Disabled}
            />,
        );
        const source: HTMLElement = screen.getByRole('gridcell', {
            name: 'Plasma cell',
        });
        expect(source).toBeDisabled();
        fireEvent.keyDown(source, { key: ' ' });
        expect(handleMove).not.toHaveBeenCalled();
    });
});
