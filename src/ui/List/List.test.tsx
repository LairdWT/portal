import { act, render, type RenderResult, screen } from '@testing-library/react';
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
import { List } from './List';

const ITEMS: readonly string[] = [
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberry',
];

function itemKey(item: string): string {
    return item;
}

function renderRow(item: string): ReactNode {
    return <span>{item}</span>;
}

function makeRows(count: number): readonly string[] {
    const out: string[] = [];
    for (let index: number = 0; index < count; index += 1) {
        out.push(`Row ${String(index)}`);
    }
    return out;
}

afterEach((): void => {
    document.body.innerHTML = '';
});

type HarnessProps = Readonly<{
    items?: readonly string[];
    selectionMode?: ESelectionMode;
    enabled?: EEnabledState;
    initialSelected?: ReadonlySet<string>;
    getTypeAheadText?: (item: string) => string;
    emptyContent?: ReactNode;
    tone?: string;
    onSelectionChange?: (keys: ReadonlySet<string>) => void;
}>;

// Controlled harness owning the selection, mirroring the DataTable.test idiom: the
// wrapper holds the keys List reports through its callback and feeds them back,
// while an optional spy observes the raw callback payload.
function Harness(props: HarnessProps): ReactElement {
    const [selectedKeys, setSelectedKeys]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(props.initialSelected ?? new Set<string>());
    return (
        <List<string>
            label="Fruit"
            items={props.items ?? ITEMS}
            getItemKey={itemKey}
            renderItem={renderRow}
            selectionMode={props.selectionMode ?? ESelectionMode.None}
            selectedKeys={selectedKeys}
            onSelectionChange={(keys: ReadonlySet<string>): void => {
                setSelectedKeys(keys);
                props.onSelectionChange?.(keys);
            }}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
            {...(props.getTypeAheadText !== undefined
                ? { getTypeAheadText: props.getTypeAheadText }
                : {})}
            {...(props.emptyContent !== undefined
                ? { emptyContent: props.emptyContent }
                : {})}
            {...(props.tone !== undefined ? { tone: props.tone } : {})}
        />
    );
}

function selectionSpy(): Mock<(keys: ReadonlySet<string>) => void> {
    return vi.fn<(keys: ReadonlySet<string>) => void>();
}

function lastSelection(spy: Mock<(keys: ReadonlySet<string>) => void>): string[] {
    const calls: [ReadonlySet<string>][] = spy.mock.calls;
    const last: [ReadonlySet<string>] | undefined = calls[calls.length - 1];
    if (last === undefined) {
        throw new Error('expected onSelectionChange to have been called');
    }
    return [...last[0]].sort();
}

// The row the listbox cursor points at, resolved through aria-activedescendant.
function activeRow(listbox: HTMLElement): HTMLElement {
    const id: string | null = listbox.getAttribute('aria-activedescendant');
    if (id === null) {
        throw new Error('expected the listbox to expose aria-activedescendant');
    }
    const element: HTMLElement | null = document.getElementById(id);
    if (element === null) {
        throw new Error(`expected a rendered element for active row ${id}`);
    }
    return element;
}

describe('List', (): void => {
    it('renders a presentational list with listitem rows when selection is None', (): void => {
        render(<Harness />);

        const list: HTMLElement = screen.getByRole('list');
        expect(list).toHaveAttribute('aria-label', 'Fruit');
        // The scroll viewport is keyboard-focusable so the windowed scroll region
        // stays reachable, but it carries no selection role/handlers.
        expect(list).toHaveAttribute('tabindex', '0');
        // jsdom reports a zero-height viewport, so the windowed slice is a subset
        // of the items; assert presence of the first row plus the listitem role
        // rather than the full (un-windowed) count.
        const rows: HTMLElement[] = screen.getAllByRole('listitem');
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThanOrEqual(ITEMS.length);
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.queryByRole('option')).toBeNull();
    });

    it('resolves the accessible name from labelledBy', (): void => {
        render(
            <div>
                <span id="list-heading">Crew roster</span>
                <List<string>
                    labelledBy="list-heading"
                    items={ITEMS}
                    getItemKey={itemKey}
                    renderItem={renderRow}
                    selectionMode={ESelectionMode.Single}
                />
            </div>,
        );

        expect(screen.getByRole('listbox')).toHaveAttribute(
            'aria-labelledby',
            'list-heading',
        );
    });

    it('exposes a listbox with option rows and aria-selected in Single mode', (): void => {
        render(
            <Harness
                selectionMode={ESelectionMode.Single}
                initialSelected={new Set<string>(['Banana'])}
            />,
        );

        const listbox: HTMLElement = screen.getByRole('listbox');
        expect(listbox).not.toHaveAttribute('aria-multiselectable');
        expect(listbox).toHaveAttribute('tabindex', '0');
        expect(
            screen.getByRole('option', { name: 'Banana', selected: true }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'Apple', selected: false }),
        ).toBeInTheDocument();
    });

    it('replaces the selection in Single mode on click', async (): Promise<void> => {
        const onSelectionChange: Mock<(keys: ReadonlySet<string>) => void> =
            selectionSpy();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Single}
                onSelectionChange={onSelectionChange}
            />,
        );

        await user.click(screen.getByRole('option', { name: 'Cherry' }));
        expect(lastSelection(onSelectionChange)).toEqual(['Cherry']);
        expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute(
            'aria-selected',
            'true',
        );

        await user.click(screen.getByRole('option', { name: 'Date' }));
        expect(lastSelection(onSelectionChange)).toEqual(['Date']);
        expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute(
            'aria-selected',
            'false',
        );
    });

    it('marks the listbox multi-selectable and toggles membership in Multiple mode', async (): Promise<void> => {
        const onSelectionChange: Mock<(keys: ReadonlySet<string>) => void> =
            selectionSpy();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Multi}
                onSelectionChange={onSelectionChange}
            />,
        );

        expect(screen.getByRole('listbox')).toHaveAttribute(
            'aria-multiselectable',
            'true',
        );

        await user.click(screen.getByRole('option', { name: 'Apple' }));
        expect(lastSelection(onSelectionChange)).toEqual(['Apple']);

        await user.click(screen.getByRole('option', { name: 'Cherry' }));
        expect(lastSelection(onSelectionChange)).toEqual(['Apple', 'Cherry']);

        await user.click(screen.getByRole('option', { name: 'Apple' }));
        expect(lastSelection(onSelectionChange)).toEqual(['Cherry']);
    });

    it('moves the activedescendant cursor with the arrow keys and Home/End', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness selectionMode={ESelectionMode.Single} />);

        const listbox: HTMLElement = screen.getByRole('listbox');
        listbox.focus();

        // The cursor starts on the first row.
        expect(activeRow(listbox)).toHaveTextContent('Apple');

        await user.keyboard('{ArrowDown}');
        expect(activeRow(listbox)).toHaveTextContent('Banana');

        await user.keyboard('{ArrowDown}');
        await user.keyboard('{ArrowUp}');
        expect(activeRow(listbox)).toHaveTextContent('Banana');

        await user.keyboard('{End}');
        expect(activeRow(listbox)).toHaveTextContent('Elderberry');

        await user.keyboard('{Home}');
        expect(activeRow(listbox)).toHaveTextContent('Apple');
    });

    it('selects the active row on Enter and on Space', async (): Promise<void> => {
        const onSelectionChange: Mock<(keys: ReadonlySet<string>) => void> =
            selectionSpy();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Single}
                onSelectionChange={onSelectionChange}
            />,
        );

        const listbox: HTMLElement = screen.getByRole('listbox');
        listbox.focus();

        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');
        expect(lastSelection(onSelectionChange)).toEqual(['Banana']);

        await user.keyboard('{ArrowDown}');
        await user.keyboard(' ');
        expect(lastSelection(onSelectionChange)).toEqual(['Cherry']);
    });

    it('extends a contiguous range with Shift+ArrowDown in Multiple mode', async (): Promise<void> => {
        const onSelectionChange: Mock<(keys: ReadonlySet<string>) => void> =
            selectionSpy();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Multi}
                onSelectionChange={onSelectionChange}
            />,
        );

        const listbox: HTMLElement = screen.getByRole('listbox');
        listbox.focus();

        // Anchor on the first row, then extend the range down two rows.
        await user.keyboard('{Enter}');
        expect(lastSelection(onSelectionChange)).toEqual(['Apple']);

        await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}');
        expect(lastSelection(onSelectionChange)).toEqual([
            'Apple',
            'Banana',
            'Cherry',
        ]);
    });

    it('moves the cursor to the next matching row on type-ahead', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Single}
                getTypeAheadText={itemKey}
            />,
        );

        const listbox: HTMLElement = screen.getByRole('listbox');
        listbox.focus();

        // A single printable key jumps the cursor to the next row whose
        // type-ahead text begins with it (the buffer accumulates within the reset
        // window, so distinct rapid keystrokes form one prefix).
        await user.keyboard('d');
        expect(activeRow(listbox)).toHaveTextContent('Date');
    });

    it('is inert while disabled', async (): Promise<void> => {
        const onSelectionChange: Mock<(keys: ReadonlySet<string>) => void> =
            selectionSpy();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                selectionMode={ESelectionMode.Single}
                enabled={EEnabledState.Disabled}
                onSelectionChange={onSelectionChange}
            />,
        );

        const listbox: HTMLElement = screen.getByRole('listbox');
        expect(listbox).toHaveAttribute('tabindex', '-1');
        expect(listbox).toHaveAttribute('aria-disabled', 'true');

        await user.click(screen.getByRole('option', { name: 'Apple' }));
        expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it('renders the default empty state when there are no items', (): void => {
        render(<Harness items={[]} />);

        expect(screen.getByText('No rows.')).toBeInTheDocument();
        expect(screen.queryByRole('listitem')).toBeNull();
    });

    it('renders custom empty content when supplied', (): void => {
        render(<Harness items={[]} emptyContent={<span>Nothing here.</span>} />);

        expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    });

    it('applies the tone custom property to the root', (): void => {
        render(<Harness tone="oklch(0.7 0.18 25)" />);

        const list: HTMLElement = screen.getByRole('list');
        expect(list.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.18 25)',
        );
    });

    it('windows a large item set yet keeps the active row in the DOM', async (): Promise<void> => {
        const largeItems: readonly string[] = makeRows(5000);
        const user: UserEvent = userEvent.setup();
        render(
            <Harness items={largeItems} selectionMode={ESelectionMode.Single} />,
        );

        const listbox: HTMLElement = screen.getByRole('listbox');
        const rendered: HTMLElement[] = screen.getAllByRole('option');
        expect(rendered.length).toBeGreaterThan(0);
        expect(rendered.length).toBeLessThan(5000);

        // Jump to the last row; its element must still exist for
        // aria-activedescendant even though it is outside the rendered window.
        listbox.focus();
        await user.keyboard('{End}');
        expect(activeRow(listbox)).toHaveTextContent('Row 4999');
    });

    it('exposes absolute aria-setsize/aria-posinset on every windowed option', (): void => {
        const items: readonly string[] = makeRows(50);
        render(<Harness items={items} selectionMode={ESelectionMode.Single} />);

        const options: HTMLElement[] = screen.getAllByRole('option');
        // The list is windowed: only a slice of the 50 rows is mounted.
        expect(options.length).toBeLessThan(50);
        for (const option of options) {
            const index: number = Number(option.getAttribute('data-index'));
            // setsize is the TOTAL item count (not the rendered slice size) and
            // posinset is the 1-based ABSOLUTE index, so AT announces "N of 50"
            // instead of a within-slice position.
            expect(option).toHaveAttribute('aria-setsize', '50');
            expect(option).toHaveAttribute('aria-posinset', String(index + 1));
        }
    });

    it('keeps absolute posinset on the active row forced into the DOM after End', async (): Promise<void> => {
        const items: readonly string[] = makeRows(50);
        const user: UserEvent = userEvent.setup();
        render(<Harness items={items} selectionMode={ESelectionMode.Single} />);

        const listbox: HTMLElement = screen.getByRole('listbox');
        listbox.focus();
        await user.keyboard('{End}');

        // The last row scrolled out of the initial window but is forced into the
        // DOM for aria-activedescendant; its posinset is the absolute position
        // (50 of 50), never a window-slice offset.
        const active: HTMLElement = activeRow(listbox);
        expect(active).toHaveTextContent('Row 49');
        expect(active).toHaveAttribute('aria-posinset', '50');
        expect(active).toHaveAttribute('aria-setsize', '50');
    });

    it('draws the active-row ring only while the listbox holds focus', (): void => {
        render(<Harness selectionMode={ESelectionMode.Single} />);

        const listbox: HTMLElement = screen.getByRole('listbox');
        // Idle (unfocused): the cursor exists logically but the ring attribute is
        // absent, so there is no permanent ring on row 0 while the list is idle.
        expect(screen.getByRole('option', { name: 'Apple' })).not.toHaveAttribute(
            'data-active',
        );

        act((): void => {
            listbox.focus();
        });
        expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
            'data-active',
            'true',
        );

        act((): void => {
            listbox.blur();
        });
        expect(screen.getByRole('option', { name: 'Apple' })).not.toHaveAttribute(
            'data-active',
        );
    });

    it('applies an explicit id to the interactive listbox root', (): void => {
        render(
            <List<string>
                id="my-list"
                label="Fruit"
                items={ITEMS}
                getItemKey={itemKey}
                renderItem={renderRow}
                selectionMode={ESelectionMode.Single}
            />,
        );

        expect(screen.getByRole('listbox').getAttribute('id')).toBe('my-list');
    });

    it('applies an explicit id to the presentational list root', (): void => {
        render(
            <List<string>
                id="my-list"
                label="Fruit"
                items={ITEMS}
                getItemKey={itemKey}
                renderItem={renderRow}
                selectionMode={ESelectionMode.None}
            />,
        );

        expect(screen.getByRole('list').getAttribute('id')).toBe('my-list');
    });

    it('applies an explicit id to the empty-state root so the node resolves', (): void => {
        const { container }: RenderResult = render(
            <List<string>
                id="my-list"
                label="Fruit"
                items={[]}
                getItemKey={itemKey}
                renderItem={renderRow}
                selectionMode={ESelectionMode.Single}
            />,
        );

        const root: HTMLElement | null = container.querySelector('#my-list');
        expect(root).not.toBeNull();
    });

    it('emits no id attribute when id is omitted', (): void => {
        render(
            <List<string>
                label="Fruit"
                items={ITEMS}
                getItemKey={itemKey}
                renderItem={renderRow}
                selectionMode={ESelectionMode.Single}
            />,
        );

        expect(screen.getByRole('listbox').hasAttribute('id')).toBe(false);
    });
});
