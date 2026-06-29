import {
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type SetStateAction,
    useState,
} from 'react';

import {
    Accordion,
    type AccordionItem,
    DataTable,
    EAccordionMode,
    ESelectionMode,
    List,
    type ListRowRenderState,
    type TableCellContext,
    type TableColumn,
    TreeView,
    type TreeNode,
} from '@laird-wt/portal';

// Collection-selection fixture: four controlled collections, each mirroring its
// ReadonlySet contract into a data-testid readout whose textContent is the
// SORTED, comma-joined current set. The two virtualized collections (List,
// DataTable) carry 1000 rows with a bounded viewport so only a handful of rows
// mount, letting the spec prove key-based selection survives real row recycling -
// the headline that jsdom cannot reach.

// Stable, order-independent serialization of a selection / expansion set so the
// spec reads membership without depending on insertion order.
function joinSet(set: ReadonlySet<string>): string {
    return [...set].sort().join(',');
}

const ROW_COUNT: number = 1000;
const LIST_ROWS: readonly number[] = Array.from(
    { length: ROW_COUNT },
    (_unused: unknown, index: number): number => index,
);

function listItemKey(_item: number, index: number): string {
    return `row-${String(index)}`;
}

function renderListRow(item: number, _state: ListRowRenderState): ReactNode {
    return <span>{`Row ${String(item)}`}</span>;
}

const TABLE_COLUMNS: readonly TableColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status' },
];

function tableRowKey(rowIndex: number): string {
    return `row-${String(rowIndex)}`;
}

function renderTableCell(context: TableCellContext): ReactNode {
    return `R${String(context.rowIndex)} ${context.columnKey}`;
}

const ACCORDION_ITEMS: readonly AccordionItem[] = [
    { id: 'alpha', title: 'Section Alpha', content: <p>Alpha body</p> },
    { id: 'bravo', title: 'Section Bravo', content: <p>Bravo body</p> },
    { id: 'charlie', title: 'Section Charlie', content: <p>Charlie body</p> },
];

const TREE_NODES: readonly TreeNode[] = [
    {
        id: 'fruits',
        label: 'Fruits',
        children: [
            { id: 'apple', label: 'Apple' },
            { id: 'banana', label: 'Banana' },
        ],
    },
    {
        id: 'veggies',
        label: 'Vegetables',
        children: [{ id: 'carrot', label: 'Carrot' }],
    },
];

export function Collections(): ReactElement {
    const [listSelected, setListSelected]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>());
    const [tableSelected, setTableSelected]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>());
    const [accordionExpanded, setAccordionExpanded]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>());
    const [treeExpanded, setTreeExpanded]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>());

    return (
        <main>
            <section aria-label="List collection">
                <List
                    label="Players"
                    items={LIST_ROWS}
                    getItemKey={listItemKey}
                    renderItem={renderListRow}
                    selectionMode={ESelectionMode.Multi}
                    selectedKeys={listSelected}
                    onSelectionChange={setListSelected}
                    maxBlockSize="480px"
                />
                <p data-testid="list-selected">{joinSet(listSelected)}</p>
            </section>
            <section aria-label="Table collection">
                <DataTable
                    label="Scores"
                    columns={TABLE_COLUMNS}
                    rowCount={ROW_COUNT}
                    renderCell={renderTableCell}
                    getRowKey={tableRowKey}
                    selectionMode={ESelectionMode.Multi}
                    selectedKeys={tableSelected}
                    onSelectionChange={setTableSelected}
                    maxBodyBlockSize="480px"
                />
                <p data-testid="table-selected">{joinSet(tableSelected)}</p>
            </section>
            <section aria-label="Accordion collection">
                <Accordion
                    mode={EAccordionMode.Multiple}
                    items={ACCORDION_ITEMS}
                    expandedIds={accordionExpanded}
                    onExpandedChange={setAccordionExpanded}
                />
                <p data-testid="acc-expanded">{joinSet(accordionExpanded)}</p>
            </section>
            <section aria-label="Tree collection">
                <TreeView
                    label="Catalog"
                    nodes={TREE_NODES}
                    expandedIds={treeExpanded}
                    onExpandedChange={setTreeExpanded}
                />
                <p data-testid="tree-expanded">{joinSet(treeExpanded)}</p>
            </section>
        </main>
    );
}
