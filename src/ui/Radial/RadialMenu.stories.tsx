import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { ERadialAction, type RadialItem, type RadialSides } from './Radial.types';
import { RadialMenu } from './RadialMenu';

const ACTION_ITEMS: readonly RadialItem[] = [
    { id: 'attack', label: 'Attack' },
    { id: 'defend', label: 'Defend' },
    { id: 'item', label: 'Item' },
    { id: 'magic', label: 'Magic' },
    { id: 'talk', label: 'Talk' },
    { id: 'flee', label: 'Flee' },
    { id: 'wait', label: 'Wait' },
    { id: 'scan', label: 'Scan' },
    // A second page's worth, so the paged story can run a full eight-sided
    // wheel across two pages (earlier stories slice from the front and are
    // unaffected).
    { id: 'guard', label: 'Guard' },
    { id: 'sneak', label: 'Sneak' },
    { id: 'trade', label: 'Trade' },
    { id: 'rest', label: 'Rest' },
    { id: 'craft', label: 'Craft' },
    { id: 'map', label: 'Map' },
    { id: 'journal', label: 'Journal' },
    { id: 'camp', label: 'Camp' },
];

const CENTER_ACTIONS: readonly ERadialAction[] = [
    ERadialAction.Confirm,
    ERadialAction.Cancel,
    ERadialAction.Previous,
    ERadialAction.Next,
];

// Simple geometric SVG marks (on currentColor) for the icon-only story, so
// the glyph-key presentation is demonstrated with real drawn icons rather
// than letters.
function shapeIcon(path: string): ReactElement {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d={path} />
        </svg>
    );
}

const ICON_ITEMS: readonly RadialItem[] = [
    {
        id: 'move',
        label: 'Move',
        iconOnly: true,
        icon: shapeIcon('M12 2 22 12 12 22 2 12Z'),
    },
    {
        id: 'strike',
        label: 'Strike',
        iconOnly: true,
        icon: shapeIcon('M12 3 21 20H3Z'),
    },
    {
        id: 'guard',
        label: 'Guard',
        iconOnly: true,
        icon: shapeIcon('M5 4H19V16L12 21 5 16Z'),
    },
    { id: 'wait', label: 'Wait', iconOnly: true, icon: shapeIcon('M4 4H20V20H4Z') },
];

// A small controlled harness so each story is a real open/close radial: the
// trigger opens it, selecting an item or cancelling closes it. Opened by default
// so the story renders the radial for the visual and a11y (axe) gates.
type DemoProps = Readonly<{
    sides: RadialSides;
    centerActions: readonly ERadialAction[];
    itemCount: number;
    items?: readonly RadialItem[];
}>;

function RadialMenuDemo({
    sides,
    centerActions,
    itemCount,
    items: itemsOverride,
}: DemoProps): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    const items: readonly RadialItem[] = (itemsOverride ?? ACTION_ITEMS).slice(
        0,
        itemCount,
    );
    return (
        <>
            <button
                type="button"
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open radial menu
            </button>
            <RadialMenu
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                label="Battle actions"
                items={items}
                onSelect={(id: string): void => {
                    console.log('select', id);
                }}
                sides={sides}
                centerActions={centerActions}
                onCenterAction={(action: ERadialAction): void => {
                    console.log('action', action);
                }}
            />
        </>
    );
}

const meta: Meta<typeof RadialMenuDemo> = {
    title: 'UI/RadialMenu',
    component: RadialMenuDemo,
    parameters: { layout: 'fullscreen' },
    args: { sides: 8, centerActions: CENTER_ACTIONS, itemCount: 8 },
    // `sides` is the RadialSides union, not a free number: the control offers
    // exactly the supported polygon counts (the component also normalizes any
    // out-of-range runtime value onto them).
    argTypes: {
        sides: { control: { type: 'inline-radio' }, options: [4, 6, 8] },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Octagonal: Story = {};

export const Hexagonal: Story = {
    args: { sides: 6, itemCount: 6 },
};

export const Square: Story = {
    args: { sides: 4, itemCount: 4 },
};

// Center hub variants: no hub, a single confirm, and a confirm/cancel pair.
export const NoCenterButtons: Story = {
    args: { centerActions: [] },
};

export const SingleConfirm: Story = {
    args: { centerActions: [ERadialAction.Confirm] },
};

export const ConfirmCancel: Story = {
    args: { centerActions: [ERadialAction.Confirm, ERadialAction.Cancel] },
};

// Icon-only sections: each wedge is a pure glyph key (the label still names
// it for assistive tech), around the split-vertical two-action hub.
export const IconSections: Story = {
    args: {
        sides: 4,
        itemCount: 4,
        items: ICON_ITEMS,
        centerActions: [ERadialAction.Confirm, ERadialAction.Cancel],
    },
};

// More items than sides: the center previous/next actions page through them
// (wrapping), with the wedge entrance replaying per page. The full
// eight-sided wheel is the default presentation, paging sixteen items.
export const Paged: Story = {
    args: {
        sides: 8,
        itemCount: 16,
        centerActions: [ERadialAction.Previous, ERadialAction.Next],
    },
};

// The collapsible inline form: the hub itself is the themed open/close
// toggle (a tone plus that rotates into a cross), the box grows from the
// hub footprint to the full ring, and the wedges fan out around it in place.
function CollapsibleRadialDemo(): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    return (
        <div style={{ padding: 'var(--portal-space-6, 2rem)' }}>
            <RadialMenu
                collapsible
                open={open}
                onOpen={(): void => {
                    setOpen(true);
                }}
                onClose={(): void => {
                    setOpen(false);
                }}
                label="Quick actions"
                items={ACTION_ITEMS}
                sides={8}
                centerActions={[ERadialAction.Confirm, ERadialAction.Cancel]}
                onSelect={(id: string): void => {
                    console.log('select', id);
                }}
            />
        </div>
    );
}

export const Collapsible: Story = {
    render: (): ReactElement => <CollapsibleRadialDemo />,
};
