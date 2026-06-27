import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type SetStateAction,
    useMemo,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { DataTable } from './DataTable';
import {
    type DataTableProps,
    EColumnAlign,
    ESelectionMode,
    ESortDirection,
    type TableCellContext,
    type TableColumn,
    type TableSort,
} from './DataTable.types';

// One crew record. `id` is the stable selection key, so a selected row survives a
// consumer re-sort even though virtualization recycles its DOM node.
type Person = Readonly<{
    id: string;
    name: string;
    role: string;
    status: string;
}>;

const PEOPLE: readonly Person[] = [
    { id: 'p1', name: 'Ada Vance', role: 'Commander', status: 'Active' },
    { id: 'p2', name: 'Boris Kale', role: 'Engineer', status: 'Active' },
    { id: 'p3', name: 'Cora Lin', role: 'Navigator', status: 'Standby' },
    { id: 'p4', name: 'Dario Sol', role: 'Medic', status: 'Active' },
    { id: 'p5', name: 'Esme Rho', role: 'Engineer', status: 'Offline' },
    { id: 'p6', name: 'Finn Oort', role: 'Gunner', status: 'Standby' },
    { id: 'p7', name: 'Gita Wren', role: 'Analyst', status: 'Active' },
    { id: 'p8', name: 'Hale Brix', role: 'Pilot', status: 'Offline' },
];

const PEOPLE_COLUMNS: readonly TableColumn[] = [
    { key: 'name', header: 'Name', sortable: true, weight: 2 },
    { key: 'role', header: 'Role', sortable: true },
    { key: 'status', header: 'Status', align: EColumnAlign.End },
];

// Static (no-reorder) people cell closure used only to satisfy the required
// renderCell prop on the generic meta args; the people stories supply their own
// reordering closure.
function staticPeopleCell(context: TableCellContext): ReactNode {
    const person: Person | undefined = PEOPLE[context.rowIndex];
    if (person === undefined) {
        return null;
    }
    return person[context.columnKey as keyof Person];
}

// A controlled wrapper the index-driven stories (empty, large, disabled) share:
// it owns the sort and selection the consumer would own, seeding from args.
function ControlledTable(args: DataTableProps): ReactElement {
    const [sort, setSort]: [
        TableSort | null,
        Dispatch<SetStateAction<TableSort | null>>,
    ] = useState<TableSort | null>(args.sort ?? null);
    const [selectedKeys, setSelectedKeys]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(args.selectedKeys ?? new Set<string>());
    return (
        <DataTable
            {...args}
            sort={sort}
            onSortChange={setSort}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
        />
    );
}

type PeopleTableProps = Readonly<{
    label: string;
    selectionMode?: ESelectionMode;
    enabled?: EEnabledState;
}>;

// The realistic story wrapper: it owns the sort and the selection, actually
// re-sorts its backing data on sort intent (so the cells reorder), and keys the
// selection on the stable record id.
function PeopleTable(props: PeopleTableProps): ReactElement {
    const [sort, setSort]: [
        TableSort | null,
        Dispatch<SetStateAction<TableSort | null>>,
    ] = useState<TableSort | null>(null);
    const [selectedKeys, setSelectedKeys]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>());

    const sortedRows: readonly Person[] = useMemo((): readonly Person[] => {
        if (sort === null) {
            return PEOPLE;
        }
        const field: keyof Person = sort.columnKey as keyof Person;
        const direction: number =
            sort.direction === ESortDirection.Descending ? -1 : 1;
        return [...PEOPLE].sort(
            (left: Person, right: Person): number =>
                left[field].localeCompare(right[field]) * direction,
        );
    }, [sort]);

    return (
        <DataTable
            label={props.label}
            columns={PEOPLE_COLUMNS}
            rowCount={sortedRows.length}
            renderCell={(context: TableCellContext): ReactNode => {
                const person: Person | undefined = sortedRows[context.rowIndex];
                if (person === undefined) {
                    return null;
                }
                return person[context.columnKey as keyof Person];
            }}
            getRowKey={(rowIndex: number): string =>
                sortedRows[rowIndex]?.id ?? String(rowIndex)
            }
            sort={sort}
            onSortChange={setSort}
            selectionMode={props.selectionMode ?? ESelectionMode.None}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
        />
    );
}

// Index-synthesized cell content for the large virtualization story; no backing
// array is allocated for the 5000 rows.
function largeCell(context: TableCellContext): ReactNode {
    if (context.columnKey === 'name') {
        return `Item ${String(context.rowIndex)}`;
    }
    if (context.columnKey === 'role') {
        return `Role ${String(context.rowIndex % 5)}`;
    }
    return `S${String(context.rowIndex % 3)}`;
}

const meta: Meta<typeof DataTable> = {
    title: 'UI/DataTable',
    component: DataTable,
    args: {
        label: 'Crew',
        columns: PEOPLE_COLUMNS,
        rowCount: PEOPLE.length,
        renderCell: staticPeopleCell,
    },
    render: (args: DataTableProps): ReactElement => <ControlledTable {...args} />,
};

export default meta;

type Story = StoryObj<typeof meta>;

// Basic sortable table: click a sortable header to cycle ascending -> descending
// and watch the rows reorder.
export const Sortable: Story = {
    render: (): ReactElement => <PeopleTable label="Crew" />,
};

// Single selection: a click replaces the prior selection (at most one row).
export const SingleSelection: Story = {
    render: (): ReactElement => (
        <PeopleTable label="Crew" selectionMode={ESelectionMode.Single} />
    ),
};

// Multi selection: Ctrl/Meta-click toggles a row, Shift-click extends a
// contiguous range from the anchor.
export const MultiSelection: Story = {
    render: (): ReactElement => (
        <PeopleTable label="Crew" selectionMode={ESelectionMode.Multi} />
    ),
};

// Empty state: rowCount 0 renders the emptyContent in place of the body rows.
export const Empty: Story = {
    args: {
        rowCount: 0,
        emptyContent: <span>No crew assigned.</span>,
    },
};

// Large virtualization: 5000 rows, yet only the windowed slice mounts. (jsdom and
// a zero-height fallback aside, the storybook browser windows from the live
// viewport height.)
export const LargeVirtualized: Story = {
    args: {
        label: 'Inventory',
        rowCount: 5000,
        renderCell: largeCell,
        selectionMode: ESelectionMode.Multi,
        maxBodyBlockSize: '24rem',
    },
};

// Disabled: the whole grid is inert (single tab stop drops out, no sort or
// selection callbacks fire).
export const Disabled: Story = {
    render: (): ReactElement => (
        <PeopleTable
            label="Crew"
            selectionMode={ESelectionMode.Single}
            enabled={EEnabledState.Disabled}
        />
    ),
};
