import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Badge } from '../Badge/Badge';
import { EBadgeKind } from '../Badge/Badge.types';
import { Panel } from '../Panel/Panel';
import { NavRail } from './NavRail';
import { type NavRailItem } from './NavRail.types';

// A single (non-union) story args shape. The component's own props are an XOR
// union (AccessibleName), which collapses Storybook's arg inference to `never`;
// the stories only ever exercise the `label` form, so a flat args type keeps the
// meta and story typing sound while still feeding valid NavRail props.
type NavRailStoryArgs = Readonly<{
    items: readonly NavRailItem[];
    active: string;
    label: string;
    enabled?: EEnabledState;
    tone?: string;
}>;

// A small decorative inline glyph for the icon slot - Portal ships no icon set,
// so the stories supply their own aria-hidden SVG (the component wraps the icon
// slot in an aria-hidden span as well). Angular, tone-inheriting via currentColor.
function NavGlyph(): ReactElement {
    return (
        <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden="true">
            <rect x={2} y={2} width={12} height={12} fill="currentColor" />
        </svg>
    );
}

const ITEMS: readonly NavRailItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'research', label: 'Research' },
    { id: 'logs', label: 'Logs' },
];

const ICON_ITEMS: readonly NavRailItem[] = [
    { id: 'overview', label: 'Overview', icon: <NavGlyph /> },
    { id: 'fleet', label: 'Fleet', icon: <NavGlyph /> },
    { id: 'research', label: 'Research', icon: <NavGlyph /> },
    { id: 'logs', label: 'Logs', icon: <NavGlyph /> },
];

const BADGE_ITEMS: readonly NavRailItem[] = [
    { id: 'overview', label: 'Overview' },
    {
        id: 'inbox',
        label: 'Inbox',
        badge: <Badge kind={EBadgeKind.Count} count={12} label="unread" />,
    },
    {
        id: 'alerts',
        label: 'Alerts',
        badge: <Badge kind={EBadgeKind.Count} count={3} label="alerts" />,
    },
];

const LINK_ITEMS: readonly NavRailItem[] = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'docs', label: 'Docs', href: '#docs' },
    { id: 'settings', label: 'Settings', href: '#settings' },
];

const MANY_ITEMS: readonly NavRailItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'research', label: 'Research' },
    { id: 'logistics', label: 'Logistics' },
    { id: 'diplomacy', label: 'Diplomacy' },
    { id: 'logs', label: 'Logs' },
    { id: 'settings', label: 'Settings' },
];

// A controlled wrapper the stories share: NavRail is controlled, so the story
// owns the active id and feeds it back through `onChange`, the pattern a consumer
// wiring NavRail to app state uses. The rail is sized like a sidebar column.
function ControlledNavRail(args: NavRailStoryArgs): ReactElement {
    const [active, setActive]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(args.active);
    return (
        <div style={{ inlineSize: '15rem' }}>
            <NavRail {...args} active={active} onChange={setActive} />
        </div>
    );
}

// The Composition story: the rail beside a content Panel, switching the visible
// pane as the active band changes.
function NavRailComposition(args: NavRailStoryArgs): ReactElement {
    const [active, setActive]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(args.active);
    const activeItem: NavRailItem | undefined = args.items.find(
        (item: NavRailItem): boolean => item.id === active,
    );
    return (
        <div
            style={{
                display: 'flex',
                gap: '1rem',
                inlineSize: 'min(40rem, 90vw)',
                alignItems: 'flex-start',
            }}
        >
            <div style={{ inlineSize: '14rem', flex: 'none' }}>
                <NavRail {...args} active={active} onChange={setActive} />
            </div>
            <Panel title="Active pane" headingLevel={2}>
                <p style={{ margin: 0, color: 'var(--portal-color-text-1)' }}>
                    {activeItem !== undefined
                        ? `Showing the ${activeItem.id} pane.`
                        : 'No pane selected.'}
                </p>
            </Panel>
        </div>
    );
}

const meta: Meta<NavRailStoryArgs> = {
    title: 'UI/NavRail',
    component: NavRail,
    args: {
        items: ITEMS,
        active: 'fleet',
        label: 'Primary navigation',
    },
    render: (args: NavRailStoryArgs): ReactElement => (
        <ControlledNavRail {...args} />
    ),
};

export default meta;

type Story = StoryObj<NavRailStoryArgs>;

export const Default: Story = {};

// A consumer-supplied opaque tone color drives the active indicator and glow.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

export const WithIcons: Story = {
    args: { items: ICON_ITEMS },
};

export const WithBadges: Story = {
    args: { items: BADGE_ITEMS, active: 'inbox', label: 'Mail navigation' },
};

// Items carrying an href render as <a> navigation links; one carries aria-current.
export const LinkMode: Story = {
    args: { items: LINK_ITEMS, active: 'docs', label: 'Docs navigation' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const ManyItems: Story = {
    args: { items: MANY_ITEMS, active: 'research', label: 'Sections' },
};

export const Composition: Story = {
    args: { tone: 'oklch(0.72 0.15 200)' },
    render: (args: NavRailStoryArgs): ReactElement => (
        <NavRailComposition {...args} />
    ),
};
