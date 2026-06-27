import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { SearchableList } from './SearchableList';

// One catalog record. `id` is the stable selection / detail key.
type Planet = Readonly<{
    id: string;
    name: string;
    summary: string;
}>;

const PLANETS: readonly Planet[] = [
    { id: 'mercury', name: 'Mercury', summary: 'The smallest, innermost planet.' },
    { id: 'venus', name: 'Venus', summary: 'A hot world with a thick atmosphere.' },
    { id: 'earth', name: 'Earth', summary: 'The only known life-bearing world.' },
    { id: 'mars', name: 'Mars', summary: 'The cold, dusty red planet.' },
    { id: 'jupiter', name: 'Jupiter', summary: 'The largest gas giant.' },
    { id: 'saturn', name: 'Saturn', summary: 'Famous for its broad ring system.' },
    { id: 'uranus', name: 'Uranus', summary: 'An ice giant tipped on its side.' },
    { id: 'neptune', name: 'Neptune', summary: 'The windiest, farthest planet.' },
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
        return <p>Select a planet to see its detail.</p>;
    }
    return (
        <div>
            <h3>{planet.name}</h3>
            <p>{planet.summary}</p>
        </div>
    );
}

// A flat (non-union) story args shape feeding valid SearchableList props with the
// Item fixed to Planet. The component stays generic over Item.
type SearchableListStoryArgs = Readonly<{
    items: readonly Planet[];
    searchLabel: string;
    searchPlaceholder?: string;
    listLabel?: string;
    initialQuery?: string;
    initialSelectedKey?: string | null;
    withDetail?: boolean;
    enabled?: EEnabledState;
    tone?: string;
}>;

// A controlled wrapper the stories share: SearchableList owns the query and the
// selected key the consumer would own, seeding from args.
function ControlledSearchableList(args: SearchableListStoryArgs): ReactElement {
    const [query, setQuery]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(args.initialQuery ?? '');
    const [selectedKey, setSelectedKey]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(args.initialSelectedKey ?? null);
    return (
        <SearchableList<Planet>
            items={args.items}
            getItemKey={planetKey}
            renderItem={renderPlanetRow}
            getFilterText={planetFilterText}
            query={query}
            onQueryChange={setQuery}
            selectedKey={selectedKey}
            onSelectedKeyChange={setSelectedKey}
            searchLabel={args.searchLabel}
            {...(args.searchPlaceholder !== undefined
                ? { searchPlaceholder: args.searchPlaceholder }
                : {})}
            {...(args.listLabel !== undefined ? { listLabel: args.listLabel } : {})}
            {...(args.withDetail === true
                ? { renderDetail: renderPlanetDetail }
                : {})}
            {...(args.enabled !== undefined ? { enabled: args.enabled } : {})}
            {...(args.tone !== undefined ? { tone: args.tone } : {})}
        />
    );
}

const SearchableListComponent: (props: SearchableListStoryArgs) => ReactElement =
    SearchableList as (props: SearchableListStoryArgs) => ReactElement;

const meta: Meta<SearchableListStoryArgs> = {
    title: 'UI/SearchableList',
    component: SearchableListComponent,
    args: {
        items: PLANETS,
        searchLabel: 'Filter planets',
        searchPlaceholder: 'Type to filter',
        listLabel: 'Planets',
    },
    render: (args: SearchableListStoryArgs): ReactElement => (
        <ControlledSearchableList {...args} />
    ),
};

export default meta;

type Story = StoryObj<SearchableListStoryArgs>;

// Default: filter plus list, no detail column.
export const Default: Story = {};

// Master-detail: a selected row drives the beveled detail panel.
export const MasterDetail: Story = {
    args: {
        withDetail: true,
        initialSelectedKey: 'earth',
    },
};

// No matches: a query that excludes every item shows "No matches.".
export const NoMatches: Story = {
    args: {
        withDetail: true,
        initialQuery: 'zzz',
    },
};

// Empty: an empty catalog shows "No rows.".
export const Empty: Story = {
    args: {
        items: [],
        withDetail: true,
    },
};

// A consumer-supplied opaque tone color drives the HUD edges and selection.
export const Toned: Story = {
    args: {
        withDetail: true,
        initialSelectedKey: 'mars',
        tone: 'oklch(0.7 0.18 25)',
    },
};

// Disabled: the filter and list are inert.
export const Disabled: Story = {
    args: {
        withDetail: true,
        initialSelectedKey: 'venus',
        enabled: EEnabledState.Disabled,
    },
};

// Composition: a plain searchable list beside a master-detail one.
export const Composition: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', gap: 'var(--portal-space-5)' }}>
            <ControlledSearchableList
                items={PLANETS}
                searchLabel="Filter planets"
                listLabel="Planets"
            />
            <ControlledSearchableList
                items={PLANETS}
                searchLabel="Filter planets"
                listLabel="Planets"
                withDetail
                initialSelectedKey="jupiter"
            />
        </div>
    ),
};
