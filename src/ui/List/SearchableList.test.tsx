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
import { SearchableList } from './SearchableList';

type Planet = Readonly<{
    id: string;
    name: string;
    summary: string;
}>;

const PLANETS: readonly Planet[] = [
    { id: 'mercury', name: 'Mercury', summary: 'Smallest planet.' },
    { id: 'venus', name: 'Venus', summary: 'Hot and cloudy.' },
    { id: 'earth', name: 'Earth', summary: 'Home world.' },
    { id: 'mars', name: 'Mars', summary: 'The red planet.' },
];

function planetKey(planet: Planet): string {
    return planet.id;
}

function planetFilterText(planet: Planet): string {
    return planet.name;
}

function renderPlanetRow(planet: Planet): ReactNode {
    return <span>{planet.name}</span>;
}

function renderPlanetDetail(planet: Planet | null): ReactNode {
    if (planet === null) {
        return <p>No planet selected.</p>;
    }
    return <p>{planet.summary}</p>;
}

afterEach((): void => {
    document.body.innerHTML = '';
});

type HarnessProps = Readonly<{
    items?: readonly Planet[];
    initialQuery?: string;
    initialSelectedKey?: string | null;
    withDetail?: boolean;
    enabled?: EEnabledState;
    onQueryChange?: (query: string) => void;
    onSelectedKeyChange?: (key: string | null) => void;
}>;

function Harness(props: HarnessProps): ReactElement {
    const [query, setQuery]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.initialQuery ?? '');
    const [selectedKey, setSelectedKey]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(props.initialSelectedKey ?? null);
    return (
        <SearchableList<Planet>
            items={props.items ?? PLANETS}
            getItemKey={planetKey}
            renderItem={renderPlanetRow}
            getFilterText={planetFilterText}
            query={query}
            onQueryChange={(next: string): void => {
                setQuery(next);
                props.onQueryChange?.(next);
            }}
            selectedKey={selectedKey}
            onSelectedKeyChange={(key: string | null): void => {
                setSelectedKey(key);
                props.onSelectedKeyChange?.(key);
            }}
            searchLabel="Filter planets"
            listLabel="Planets"
            {...(props.withDetail === true
                ? { renderDetail: renderPlanetDetail }
                : {})}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
        />
    );
}

describe('SearchableList', (): void => {
    it('renders the search box and the listbox', (): void => {
        render(<Harness />);

        expect(
            screen.getByRole('searchbox', { name: 'Filter planets' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('listbox', { name: 'Planets' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Mercury' })).toBeInTheDocument();
    });

    it('wires the search input aria-controls to the listbox root id', (): void => {
        render(<Harness />);

        const searchbox: HTMLElement = screen.getByRole('searchbox');
        const listbox: HTMLElement = screen.getByRole('listbox');
        const controls: string | null = searchbox.getAttribute('aria-controls');
        expect(controls).not.toBeNull();
        expect(controls).toBe(listbox.getAttribute('id'));
    });

    it('reports typed query through onQueryChange', async (): Promise<void> => {
        const onQueryChange: Mock<(query: string) => void> =
            vi.fn<(query: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness onQueryChange={onQueryChange} />);

        await user.type(screen.getByRole('searchbox'), 'mar');
        expect(onQueryChange).toHaveBeenCalled();
    });

    it('filters the rendered rows case-insensitively by the controlled query', (): void => {
        render(<Harness initialQuery="ar" />);

        // "ar" matches Earth and Mars, not Mercury or Venus.
        expect(screen.getByRole('option', { name: 'Earth' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Mars' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Mercury' })).toBeNull();
        expect(screen.queryByRole('option', { name: 'Venus' })).toBeNull();
    });

    it('shows "No matches." when the query excludes every item', (): void => {
        render(<Harness initialQuery="zzz" />);

        expect(screen.getByText('No matches.')).toBeInTheDocument();
        expect(screen.queryByRole('option')).toBeNull();
    });

    it('shows "No rows." when there are no items at all', (): void => {
        render(<Harness items={[]} />);

        expect(screen.getByText('No rows.')).toBeInTheDocument();
    });

    it('reports the selected key and reflects it in the detail region', async (): Promise<void> => {
        const onSelectedKeyChange: Mock<(key: string | null) => void> =
            vi.fn<(key: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness withDetail onSelectedKeyChange={onSelectedKeyChange} />);

        const detail: HTMLElement = screen.getByRole('region', {
            name: 'Selection detail',
        });
        expect(detail).toHaveTextContent('No planet selected.');

        await user.click(screen.getByRole('option', { name: 'Mars' }));
        expect(onSelectedKeyChange).toHaveBeenLastCalledWith('mars');
        expect(detail).toHaveTextContent('The red planet.');
    });

    it('seeds the detail from the controlled selectedKey', (): void => {
        render(<Harness withDetail initialSelectedKey="earth" />);

        expect(
            screen.getByRole('region', { name: 'Selection detail' }),
        ).toHaveTextContent('Home world.');
        expect(
            screen.getByRole('option', { name: 'Earth', selected: true }),
        ).toBeInTheDocument();
    });

    it('blocks interaction while disabled', async (): Promise<void> => {
        const onSelectedKeyChange: Mock<(key: string | null) => void> =
            vi.fn<(key: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                withDetail
                enabled={EEnabledState.Disabled}
                onSelectedKeyChange={onSelectedKeyChange}
            />,
        );

        const listbox: HTMLElement = screen.getByRole('listbox');
        expect(listbox).toHaveAttribute('aria-disabled', 'true');

        await user.click(screen.getByRole('option', { name: 'Mars' }));
        expect(onSelectedKeyChange).not.toHaveBeenCalled();
    });
});
