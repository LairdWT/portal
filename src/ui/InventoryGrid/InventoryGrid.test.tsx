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

// 3 columns x 3 rows with a 2x2 crate anchored at 0 (covers 0,1,3,4) and a
// 1x1 kit at 2.
const SPAN_SLOTS: readonly InventorySlot[] = [
    {
        id: 'crate',
        label: 'Supply crate',
        content: <span>CR</span>,
        widthCells: 2,
        heightCells: 2,
    },
    { id: 's1' },
    { id: 'kit', label: 'Medkit', content: <span>MK</span> },
    { id: 's3' },
    { id: 's4' },
    { id: 's5' },
    { id: 's6' },
    { id: 's7' },
    { id: 's8' },
];

describe('InventoryGrid multi-cell spans', (): void => {
    it('speaks covered cells as part of the item and keeps every cell a gridcell', (): void => {
        render(<InventoryGrid label="Loadout" slots={SPAN_SLOTS} columns={3} />);
        expect(screen.getAllByRole('gridcell')).toHaveLength(9);
        expect(
            screen.getByRole('gridcell', { name: 'Supply crate' }),
        ).toBeInTheDocument();
        expect(
            screen.getAllByRole('gridcell', {
                name: 'Supply crate, part of 2 x 2',
            }),
        ).toHaveLength(3);
    });

    it('grabs the anchor from a covered cell', (): void => {
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        render(
            <InventoryGrid
                label="Loadout"
                slots={SPAN_SLOTS}
                columns={3}
                onMove={handleMove}
            />,
        );
        const covered: HTMLElement | undefined = screen.getAllByRole('gridcell', {
            name: 'Supply crate, part of 2 x 2',
        })[0];
        if (covered === undefined) {
            throw new Error('missing covered cell');
        }
        fireEvent.keyDown(covered, { key: ' ' });
        // The anchor cell (not the covered one) reads grabbed.
        expect(
            screen.getByRole('gridcell', { name: 'Supply crate' }),
        ).toHaveAttribute('aria-selected', 'true');
    });

    it('rejects a drop where the footprint cannot fit and announces it', (): void => {
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        render(
            <InventoryGrid
                label="Loadout"
                slots={SPAN_SLOTS}
                columns={3}
                onMove={handleMove}
            />,
        );
        const anchor: HTMLElement = screen.getByRole('gridcell', {
            name: 'Supply crate',
        });
        fireEvent.keyDown(anchor, { key: ' ' });
        // Cell 5 is the last column: a 2-wide crate overflows the edge.
        const edge: HTMLElement = screen.getByRole('gridcell', {
            name: 'Empty slot 6',
        });
        fireEvent.keyDown(edge, { key: ' ' });
        expect(handleMove).not.toHaveBeenCalled();
        expect(
            screen.getByText('Cannot place Supply crate here.'),
        ).toBeInTheDocument();
        // The grab survives a rejected drop. Shifting the crate onto cell 3
        // (inside its own footprint - covered cells are ignorable for the
        // moving item) is a valid one-cell move.
        const valid: HTMLElement | undefined = screen.getAllByRole('gridcell', {
            name: 'Supply crate, part of 2 x 2',
        })[1];
        if (valid === undefined) {
            throw new Error('missing footprint cell');
        }
        fireEvent.keyDown(valid, { key: ' ' });
        expect(handleMove).toHaveBeenCalledWith(0, 3);
    });

    it('keeps the classic 1x1-onto-occupied reorder contract', (): void => {
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        render(
            <InventoryGrid
                label="Cargo"
                slots={SLOTS}
                columns={3}
                onMove={handleMove}
            />,
        );
        // Plain 1x1 items: dropping on an occupied 1x1 slot is a reorder
        // (the pre-span contract the HUD showcase pins).
        fireEvent.keyDown(screen.getByRole('gridcell', { name: 'Plasma cell' }), {
            key: ' ',
        });
        fireEvent.keyDown(screen.getByRole('gridcell', { name: 'Medkit' }), {
            key: ' ',
        });
        expect(handleMove).toHaveBeenCalledWith(0, 1);
    });

    it('rejects a drop onto another item', (): void => {
        const handleMove: Mock<MoveCallback> = vi.fn<MoveCallback>();
        render(
            <InventoryGrid
                label="Loadout"
                slots={SPAN_SLOTS}
                columns={3}
                onMove={handleMove}
            />,
        );
        // Grab the 1x1 kit and try to drop it on a crate-covered cell.
        const kit: HTMLElement = screen.getByRole('gridcell', {
            name: 'Medkit',
        });
        fireEvent.keyDown(kit, { key: ' ' });
        const covered: HTMLElement | undefined = screen.getAllByRole('gridcell', {
            name: 'Supply crate, part of 2 x 2',
        })[0];
        if (covered === undefined) {
            throw new Error('missing covered cell');
        }
        fireEvent.keyDown(covered, { key: ' ' });
        expect(handleMove).not.toHaveBeenCalled();
    });

    it('draws each item once on the decorative layer at its true span', (): void => {
        const view: { container: HTMLElement } = render(
            <InventoryGrid label="Loadout" slots={SPAN_SLOTS} columns={3} />,
        );
        const layer: Element | null = view.container.querySelector(
            '[aria-hidden="true"][class*="itemLayer"]',
        );
        expect(layer).not.toBeNull();
        const tiles: readonly Element[] = Array.from(layer?.children ?? []);
        expect(tiles).toHaveLength(2);
        const crateTile: Element | undefined = tiles.find(
            (tile: Element): boolean => tile.textContent === 'CR',
        );
        if (!(crateTile instanceof HTMLElement)) {
            throw new Error('missing crate tile');
        }
        expect(crateTile.style.gridRow).toBe('1 / span 2');
        expect(crateTile.style.gridColumn).toBe('1 / span 2');
    });
});
