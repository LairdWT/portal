import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type SetStateAction,
    useState,
} from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { ESelectionMode } from '../selectionMode';
import { DataTable } from './DataTable';
import {
    ESortDirection,
    type TableCellContext,
    type TableColumn,
    type TableSort,
} from './DataTable.types';

const COLUMNS: readonly TableColumn[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'role', header: 'Role', sortable: true },
    { key: 'status', header: 'Status' },
];

function renderCell(context: TableCellContext): ReactNode {
    return `${context.columnKey}-${String(context.rowIndex)}`;
}

afterEach((): void => {
    document.body.innerHTML = '';
});

type HarnessProps = Readonly<{
    rowCount?: number;
    selectionMode?: ESelectionMode;
    enabled?: EEnabledState;
    initialSort?: TableSort | null;
    initialSelected?: ReadonlySet<string>;
    emptyContent?: ReactNode;
    onSortChange?: (next: TableSort) => void;
    onSelectionChange?: (next: ReadonlySet<string>) => void;
}>;

// Controlled harness owning sort + selection, mirroring the Select.test idiom: the
// wrapper holds the state DataTable reports through its callbacks and feeds it
// back, while optional spies observe the raw callback payloads.
function Harness(props: HarnessProps): ReactElement {
    const [sort, setSort]: [
        TableSort | null,
        Dispatch<SetStateAction<TableSort | null>>,
    ] = useState<TableSort | null>(props.initialSort ?? null);
    const [selectedKeys, setSelectedKeys]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(props.initialSelected ?? new Set<string>());
    return (
        <DataTable
            label="People"
            columns={COLUMNS}
            rowCount={props.rowCount ?? 6}
            renderCell={renderCell}
            sort={sort}
            onSortChange={(next: TableSort): void => {
                setSort(next);
                props.onSortChange?.(next);
            }}
            selectionMode={props.selectionMode ?? ESelectionMode.None}
            selectedKeys={selectedKeys}
            onSelectionChange={(next: ReadonlySet<string>): void => {
                setSelectedKeys(next);
                props.onSelectionChange?.(next);
            }}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
            {...(props.emptyContent !== undefined
                ? { emptyContent: props.emptyContent }
                : {})}
        />
    );
}

function selectionSpy(): Mock<(next: ReadonlySet<string>) => void> {
    return vi.fn<(next: ReadonlySet<string>) => void>();
}

function sortSpy(): Mock<(next: TableSort) => void> {
    return vi.fn<(next: TableSort) => void>();
}

function lastSelection(spy: Mock<(next: ReadonlySet<string>) => void>): string[] {
    const calls: [ReadonlySet<string>][] = spy.mock.calls;
    const last: [ReadonlySet<string>] | undefined = calls[calls.length - 1];
    if (last === undefined) {
        throw new Error('expected onSelectionChange to have been called');
    }
    return [...last[0]].sort();
}

// The element the grid's roving 2D cursor currently points at, resolved through
// aria-activedescendant. Asserting it is non-null doubles as the proof that the
// active cell always has a rendered DOM element, even when virtualization has
// scrolled its row out of the window.
function activeCell(grid: HTMLElement): HTMLElement {
    const id: string | null = grid.getAttribute('aria-activedescendant');
    if (id === null) {
        throw new Error('expected the grid to expose aria-activedescendant');
    }
    const element: HTMLElement | null = document.getElementById(id);
    if (element === null) {
        throw new Error(`expected a rendered element for active cell ${id}`);
    }
    return element;
}

type ActiveInfo = Readonly<{
    role: string | null;
    col: string | null;
    rowIndex: string | null;
}>;

function activeInfo(grid: HTMLElement): ActiveInfo {
    const element: HTMLElement = activeCell(grid);
    const row: Element | null = element.closest('[role="row"]');
    return {
        role: element.getAttribute('role'),
        col: element.getAttribute('aria-colindex'),
        rowIndex: row === null ? null : row.getAttribute('aria-rowindex'),
    };
}

function rowOf(cell: HTMLElement): HTMLElement {
    const row: Element | null = cell.closest('[role="row"]');
    expect(row).not.toBeNull();
    return row as HTMLElement;
}

describe('DataTable', (): void => {
    it('exposes a grid with header and cell roles and the true row/column counts', (): void => {
        render(<Harness rowCount={6} />);

        const grid: HTMLElement = screen.getByRole('grid');
        expect(grid).toHaveAttribute('aria-label', 'People');
        // rowCount + 1 to account for the header row.
        expect(grid).toHaveAttribute('aria-rowcount', '7');
        expect(grid).toHaveAttribute('aria-colcount', '3');

        expect(screen.getAllByRole('columnheader')).toHaveLength(3);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
            'aria-colindex',
            '1',
        );

        // First body column is a rowheader; the rest are gridcells.
        const firstRowHeader: HTMLElement = screen.getByRole('rowheader', {
            name: 'name-0',
        });
        expect(rowOf(firstRowHeader)).toHaveAttribute('aria-rowindex', '2');
        expect(
            screen.getByRole('gridcell', { name: 'role-0' }),
        ).toBeInTheDocument();
    });

    it('names the grid through labelledBy when a visible caption is referenced', (): void => {
        render(
            <>
                <h2 id="people-caption">People</h2>
                <DataTable
                    labelledBy="people-caption"
                    columns={COLUMNS}
                    rowCount={3}
                    renderCell={renderCell}
                />
            </>,
        );

        const grid: HTMLElement = screen.getByRole('grid', { name: 'People' });
        expect(grid).toHaveAttribute('aria-labelledby', 'people-caption');
        expect(grid).not.toHaveAttribute('aria-label');
    });

    it('exposes data-motion full when motion is not reduced', (): void => {
        render(<Harness />);

        expect(screen.getByRole('grid')).toHaveAttribute('data-motion', 'full');
    });

    it('cycles aria-sort ascending then descending and fires onSortChange', async (): Promise<void> => {
        const onSortChange: Mock<(next: TableSort) => void> = sortSpy();
        const user: UserEvent = userEvent.setup();
        render(<Harness onSortChange={onSortChange} />);

        const nameHeader: HTMLElement = screen.getByRole('columnheader', {
            name: 'Name',
        });
        expect(nameHeader).toHaveAttribute('aria-sort', 'none');

        await user.click(screen.getByRole('button', { name: 'Name' }));
        expect(onSortChange).toHaveBeenLastCalledWith({
            columnKey: 'name',
            direction: ESortDirection.Ascending,
        });
        expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

        await user.click(screen.getByRole('button', { name: 'Name' }));
        expect(onSortChange).toHaveBeenLastCalledWith({
            columnKey: 'name',
            direction: ESortDirection.Descending,
        });
        expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('does not mark the non-sortable column with aria-sort', (): void => {
        render(<Harness />);

        expect(
            screen.getByRole('columnheader', { name: 'Status' }),
        ).not.toHaveAttribute('aria-sort');
    });

    it('replaces the selection in Single mode and sets aria-selected', async (): Promise<void> => {
        const onSelectionChange: Mock<(next: ReadonlySet<string>) => void> =
            selectionSpy();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Single}
                onSelectionChange={onSelectionChange}
            />,
        );

        const grid: HTMLElement = screen.getByRole('grid');
        // Single is not multi-selectable.
        expect(grid).not.toHaveAttribute('aria-multiselectable');

        await user.click(screen.getByRole('rowheader', { name: 'name-1' }));
        expect(lastSelection(onSelectionChange)).toEqual(['1']);
        expect(
            rowOf(screen.getByRole('rowheader', { name: 'name-1' })),
        ).toHaveAttribute('aria-selected', 'true');

        await user.click(screen.getByRole('rowheader', { name: 'name-3' }));
        // Single replaces rather than accumulating.
        expect(lastSelection(onSelectionChange)).toEqual(['3']);
        expect(
            rowOf(screen.getByRole('rowheader', { name: 'name-1' })),
        ).toHaveAttribute('aria-selected', 'false');
        expect(
            rowOf(screen.getByRole('rowheader', { name: 'name-3' })),
        ).toHaveAttribute('aria-selected', 'true');
    });

    it('toggles rows with Ctrl in Multi mode and marks the grid multi-selectable', async (): Promise<void> => {
        const onSelectionChange: Mock<(next: ReadonlySet<string>) => void> =
            selectionSpy();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Multi}
                onSelectionChange={onSelectionChange}
            />,
        );

        expect(screen.getByRole('grid')).toHaveAttribute(
            'aria-multiselectable',
            'true',
        );

        await user.click(screen.getByRole('rowheader', { name: 'name-1' }));
        expect(lastSelection(onSelectionChange)).toEqual(['1']);

        await user.keyboard('{Control>}');
        await user.click(screen.getByRole('rowheader', { name: 'name-3' }));
        await user.keyboard('{/Control}');
        expect(lastSelection(onSelectionChange)).toEqual(['1', '3']);

        await user.keyboard('{Control>}');
        await user.click(screen.getByRole('rowheader', { name: 'name-1' }));
        await user.keyboard('{/Control}');
        expect(lastSelection(onSelectionChange)).toEqual(['3']);
    });

    it('selects a contiguous range with Shift in Multi mode', async (): Promise<void> => {
        const onSelectionChange: Mock<(next: ReadonlySet<string>) => void> =
            selectionSpy();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Multi}
                onSelectionChange={onSelectionChange}
            />,
        );

        // Plain click sets the range anchor.
        await user.click(screen.getByRole('rowheader', { name: 'name-0' }));
        expect(lastSelection(onSelectionChange)).toEqual(['0']);

        await user.keyboard('{Shift>}');
        await user.click(screen.getByRole('rowheader', { name: 'name-3' }));
        await user.keyboard('{/Shift}');
        expect(lastSelection(onSelectionChange)).toEqual(['0', '1', '2', '3']);
    });

    it('moves the roving 2D cursor through the grid on the arrow keys', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness />);

        const grid: HTMLElement = screen.getByRole('grid');
        grid.focus();

        // Initial cursor: nothing highlighted and no aria-activedescendant until
        // the first navigation key establishes the roving cursor.
        expect(grid.getAttribute('aria-activedescendant')).toBeNull();

        await user.keyboard('{ArrowRight}');
        expect(activeInfo(grid)).toEqual({
            role: 'columnheader',
            col: '2',
            rowIndex: '1',
        });

        await user.keyboard('{ArrowDown}');
        expect(activeInfo(grid)).toEqual({
            role: 'gridcell',
            col: '2',
            rowIndex: '2',
        });

        await user.keyboard('{ArrowLeft}');
        expect(activeInfo(grid)).toEqual({
            role: 'rowheader',
            col: '1',
            rowIndex: '2',
        });

        await user.keyboard('{ArrowUp}');
        expect(activeInfo(grid)).toEqual({
            role: 'columnheader',
            col: '1',
            rowIndex: '1',
        });
    });

    it('honors Home, End, Ctrl+Home, and Ctrl+End', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness rowCount={6} />);

        const grid: HTMLElement = screen.getByRole('grid');
        grid.focus();

        await user.keyboard('{ArrowDown}');
        // End -> last column of the current row.
        await user.keyboard('{End}');
        expect(activeInfo(grid)).toEqual({
            role: 'gridcell',
            col: '3',
            rowIndex: '2',
        });

        // Home -> first column of the current row.
        await user.keyboard('{Home}');
        expect(activeInfo(grid)).toEqual({
            role: 'rowheader',
            col: '1',
            rowIndex: '2',
        });

        // Ctrl+End -> last cell of the last row (forced into the DOM though its
        // row is outside the rendered window).
        await user.keyboard('{Control>}{End}{/Control}');
        expect(activeInfo(grid)).toEqual({
            role: 'gridcell',
            col: '3',
            rowIndex: '7',
        });

        // Ctrl+Home -> the header's first column.
        await user.keyboard('{Control>}{Home}{/Control}');
        expect(activeInfo(grid)).toEqual({
            role: 'columnheader',
            col: '1',
            rowIndex: '1',
        });
    });

    it('activates a row on Enter and on Space', async (): Promise<void> => {
        const onSelectionChange: Mock<(next: ReadonlySet<string>) => void> =
            selectionSpy();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Single}
                onSelectionChange={onSelectionChange}
            />,
        );

        const grid: HTMLElement = screen.getByRole('grid');
        grid.focus();

        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');
        expect(lastSelection(onSelectionChange)).toEqual(['0']);

        await user.keyboard('{ArrowDown}');
        await user.keyboard(' ');
        expect(lastSelection(onSelectionChange)).toEqual(['1']);
    });

    it('activates the sort on Enter while the header is the active cell', async (): Promise<void> => {
        const onSortChange: Mock<(next: TableSort) => void> = sortSpy();
        const user: UserEvent = userEvent.setup();
        render(<Harness onSortChange={onSortChange} />);

        const grid: HTMLElement = screen.getByRole('grid');
        grid.focus();
        await user.keyboard('{Enter}');

        expect(onSortChange).toHaveBeenLastCalledWith({
            columnKey: 'name',
            direction: ESortDirection.Ascending,
        });
    });

    it('is inert while disabled', async (): Promise<void> => {
        const onSelectionChange: Mock<(next: ReadonlySet<string>) => void> =
            selectionSpy();
        const onSortChange: Mock<(next: TableSort) => void> = sortSpy();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Single}
                enabled={EEnabledState.Disabled}
                onSelectionChange={onSelectionChange}
                onSortChange={onSortChange}
            />,
        );

        const grid: HTMLElement = screen.getByRole('grid');
        // Drops out of the tab order and announces itself disabled.
        expect(grid).toHaveAttribute('tabindex', '-1');
        expect(grid).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByRole('button', { name: 'Name' })).toBeDisabled();

        await user.click(screen.getByRole('rowheader', { name: 'name-1' }));
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onSortChange).not.toHaveBeenCalled();
    });

    it('renders the empty state when rowCount is 0', (): void => {
        render(<Harness rowCount={0} emptyContent={<span>No rows here.</span>} />);

        const grid: HTMLElement = screen.getByRole('grid');
        expect(grid).toHaveAttribute('aria-rowcount', '1');
        expect(screen.getByText('No rows here.')).toBeInTheDocument();
        expect(screen.queryByRole('rowheader')).toBeNull();
    });

    it('windows a large row set yet keeps the active row in the DOM', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness rowCount={5000} />);

        const grid: HTMLElement = screen.getByRole('grid');
        expect(grid).toHaveAttribute('aria-rowcount', '5001');

        // Only a window of rows mounts: the rendered body set is a strict subset.
        const rendered: HTMLElement[] = screen.getAllByRole('rowheader');
        expect(rendered.length).toBeGreaterThan(0);
        expect(rendered.length).toBeLessThan(5000);
        for (const cell of rendered) {
            const index: number = Number(rowOf(cell).getAttribute('aria-rowindex'));
            expect(index).toBeGreaterThanOrEqual(2);
            expect(index).toBeLessThanOrEqual(5001);
        }

        // Jump to the very last row; its element must still exist for
        // aria-activedescendant even though it is outside the window.
        grid.focus();
        await user.keyboard('{Control>}{End}{/Control}');
        expect(activeInfo(grid)).toEqual({
            role: 'gridcell',
            col: '3',
            rowIndex: '5001',
        });
    });
});
