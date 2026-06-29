import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type ReactElement, type RefObject, useRef } from 'react';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { Breadcrumb } from './Breadcrumb';
import { type BreadcrumbItem, type BreadcrumbProps } from './Breadcrumb.types';

const ITEMS: readonly BreadcrumbItem[] = [
    { id: 'home', label: 'Home' },
    { id: 'reports', label: 'Reports' },
    { id: 'q3', label: 'Q3' },
];

const SHORT_ITEMS: readonly BreadcrumbItem[] = [
    { id: 'library', label: 'Library' },
    { id: 'decks', label: 'Decks' },
];

const DEEP_ITEMS: readonly BreadcrumbItem[] = [
    { id: 'root', label: 'Root' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'season', label: 'Season 4' },
    { id: 'episode', label: 'Episode 2' },
    { id: 'scene', label: 'Scene' },
];

const LONG_ITEMS: readonly BreadcrumbItem[] = [
    { id: 'root', label: 'Root' },
    { id: 'projects', label: 'Projects' },
    { id: 'portal', label: 'Portal' },
    { id: 'src', label: 'src' },
    { id: 'ui', label: 'ui' },
    { id: 'breadcrumb', label: 'Breadcrumb' },
    { id: 'styles', label: 'Styles' },
];

// A shared wrapper that supplies a real onNavigate so the ancestor crumbs render
// as interactive buttons (a crumb without any handler is inert text, by design).
// The reported id/index is parked in a write-only ref; nothing is rendered
// outside the nav landmark, so the axe `region` check stays satisfied.
function BreadcrumbStory(args: BreadcrumbProps): ReactElement {
    const lastNavigatedRef: RefObject<string | null> = useRef<string | null>(null);
    return (
        <Breadcrumb
            {...args}
            onNavigate={(id: string, index: number): void => {
                lastNavigatedRef.current = `${id}:${String(index)}`;
            }}
        />
    );
}

const meta: Meta<typeof Breadcrumb> = {
    title: 'UI/Breadcrumb',
    component: Breadcrumb,
    args: {
        items: ITEMS,
    },
    render: (args: BreadcrumbProps): ReactElement => <BreadcrumbStory {...args} />,
};

export default meta;

type Story = StoryObj<typeof meta>;

// A short trail: two clickable ancestors and the inert current node.
export const Default: Story = {};

// A consumer-supplied opaque tone color drives the lit edge on the ancestors and
// the current node trim.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};

// The universal danger seed routed through the tone scope (rare for a path, kept
// for tone/axe coverage).
export const DangerStatus: Story = {
    args: { status: EUiStatus.Danger },
};

// The whole landmark disabled: ancestors and the overflow trigger render as
// disabled buttons; the current node stays inert.
export const Disabled: Story = {
    args: { items: LONG_ITEMS, maxVisible: 4, enabled: EEnabledState.Disabled },
};

// A long trail collapsed to the root, an overflow control, and the tail. The
// story renders the collapsed (closed) state; opening the panel is exercised by
// the unit tests and the e2e spec.
export const Overflow: Story = {
    args: { items: LONG_ITEMS, maxVisible: 4 },
};

// The landmark named by a visible heading through `labelledBy` instead of the
// default inline label. aria-labelledby points at the heading id and takes
// precedence, so no aria-label is emitted (mirrors sibling Pagination).
export const LabelledBy: Story = {
    render: (): ReactElement => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--portal-space-2)',
            }}
        >
            <h2 id="breadcrumb-story-heading">Reports navigation</h2>
            <BreadcrumbStory items={ITEMS} labelledBy="breadcrumb-story-heading" />
        </div>
    ),
};

// Breadcrumbs of varying depth to show density and wrap behavior. Each landmark
// carries a distinct accessible name so the navigation landmarks stay unique.
export const Composition: Story = {
    render: (): ReactElement => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--portal-space-4)',
            }}
        >
            <BreadcrumbStory items={SHORT_ITEMS} label="Library path" />
            <BreadcrumbStory items={ITEMS} label="Reports path" />
            <BreadcrumbStory items={DEEP_ITEMS} label="Campaign path" />
        </div>
    ),
};
