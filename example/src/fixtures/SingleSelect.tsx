import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import {
    NavRail,
    type NavRailItem,
    RadioGroup,
    type RadioItem,
    SegmentedControl,
    type SegmentItem,
    Select,
    type SelectOption,
    Tabs,
    type TabItem,
} from '@laird-wt/portal';

// Single-select fixture: five controlled single-choice families mounted side by
// side, each mirroring its controlled value into a data-testid readout so the
// behavior spec can read the reported selection without reaching into component
// internals. The five cover the three roving-tabindex automatic-activation groups
// (RadioGroup, SegmentedControl, Tabs), the manual-activation roving nav
// (NavRail), and the aria-activedescendant listbox-popup (Select) - the contrast
// the spec exercises in a real browser.

const DIFFICULTY_ITEMS: readonly RadioItem[] = [
    { id: 'easy', label: 'Easy' },
    // The middle option is disabled to prove roving navigation SKIPS it (focus
    // jumps from index 0 straight to index 2).
    { id: 'normal', label: 'Normal', disabled: true },
    { id: 'hard', label: 'Hard' },
];

const VIEW_ITEMS: readonly SegmentItem[] = [
    { id: 'grid', label: 'Grid' },
    { id: 'list', label: 'List' },
    { id: 'map', label: 'Map' },
];

const PANEL_ITEMS: readonly TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'history', label: 'History' },
];

const SECTION_ITEMS: readonly NavRailItem[] = [
    { id: 'home', label: 'Home' },
    { id: 'library', label: 'Library' },
    { id: 'settings', label: 'Settings' },
];

const REGION_OPTIONS: readonly SelectOption[] = [
    { id: 'na', label: 'North America' },
    { id: 'eu', label: 'Europe' },
    { id: 'apac', label: 'Asia Pacific' },
];

export function SingleSelect(): ReactElement {
    const [difficulty, setDifficulty]: [
        string,
        Dispatch<SetStateAction<string>>,
    ] = useState<string>('easy');
    const [view, setView]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('grid');
    const [panel, setPanel]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('overview');
    const [section, setSection]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('home');
    const [region, setRegion]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(null);

    return (
        <main>
            <section aria-label="Difficulty scenario">
                <RadioGroup
                    label="Difficulty"
                    items={DIFFICULTY_ITEMS}
                    value={difficulty}
                    onChange={setDifficulty}
                />
                <p data-testid="rg-value">{difficulty}</p>
            </section>
            <section aria-label="View scenario">
                <SegmentedControl
                    label="View"
                    items={VIEW_ITEMS}
                    value={view}
                    onChange={setView}
                />
                <p data-testid="seg-value">{view}</p>
            </section>
            <section aria-label="Panels scenario">
                <Tabs
                    label="Panels"
                    items={PANEL_ITEMS}
                    value={panel}
                    onChange={setPanel}
                />
                <p data-testid="tabs-value">{panel}</p>
            </section>
            <section aria-label="Sections scenario">
                <NavRail
                    label="Sections"
                    items={SECTION_ITEMS}
                    value={section}
                    onChange={setSection}
                />
                <p data-testid="nav-value">{section}</p>
            </section>
            <section aria-label="Region scenario">
                <Select
                    label="Region"
                    options={REGION_OPTIONS}
                    value={region}
                    onChange={setRegion}
                />
                <p data-testid="select-value">{region ?? ''}</p>
            </section>
        </main>
    );
}
