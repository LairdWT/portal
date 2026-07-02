import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { ESplitOrientation } from '../SplitPane/SplitPane.types';
import { DockLayout } from './DockLayout';
import {
    type DockLayoutState,
    type DockPanelDef,
    EDockNodeKind,
} from './DockLayout.types';

const BODY_STYLE: CSSProperties = {
    margin: 0,
    color: 'var(--portal-color-text-1)',
    fontSize: 'var(--portal-size-text-sm)',
};

function body(text: string): ReactElement {
    return <p style={BODY_STYLE}>{text}</p>;
}

const PANELS: readonly DockPanelDef[] = [
    {
        id: 'nav',
        title: 'Navigator',
        content: body('Scene hierarchy and asset browser slot.'),
    },
    {
        id: 'editor',
        title: 'Editor',
        content: body('Primary editing surface. Drag the group grips to re-dock.'),
    },
    {
        id: 'preview',
        title: 'Preview',
        content: body('Live render preview slot.'),
    },
    {
        id: 'console',
        title: 'Console',
        content: body('Build and diagnostics output slot.'),
    },
    {
        id: 'palette',
        title: 'Palette',
        content: body('Floating tool palette. Drag its title bar; dock it back.'),
    },
];

// nav | (editor+preview / console), palette floating.
const WORKSPACE: DockLayoutState = {
    root: {
        kind: EDockNodeKind.Split,
        orientation: ESplitOrientation.Horizontal,
        fraction: 0.25,
        first: { kind: EDockNodeKind.Tabs, panelIds: ['nav'], activeId: 'nav' },
        second: {
            kind: EDockNodeKind.Split,
            orientation: ESplitOrientation.Vertical,
            fraction: 0.65,
            first: {
                kind: EDockNodeKind.Tabs,
                panelIds: ['editor', 'preview'],
                activeId: 'editor',
            },
            second: {
                kind: EDockNodeKind.Tabs,
                panelIds: ['console'],
                activeId: 'console',
            },
        },
    },
    floating: [],
};

const WITH_FLOATING: DockLayoutState = {
    root: WORKSPACE.root,
    floating: [
        { panelId: 'palette', rect: { x: 480, y: 160, width: 340, height: 260 } },
    ],
};

type HarnessProps = Readonly<{
    initial: DockLayoutState;
    tone?: string;
}>;

// Controlled harness: the story owns the serializable layout state, exactly
// as an app would persist it.
function ControlledDockLayout(props: HarnessProps): ReactElement {
    const [layout, setLayout]: [
        DockLayoutState,
        Dispatch<SetStateAction<DockLayoutState>>,
    ] = useState<DockLayoutState>(props.initial);
    return (
        <DockLayout
            label="Workspace dock"
            panels={PANELS}
            layout={layout}
            onLayoutChange={setLayout}
            {...(props.tone !== undefined ? { tone: props.tone } : {})}
        />
    );
}

type DockLayoutStoryArgs = Readonly<{ label: string }>;

const meta: Meta<DockLayoutStoryArgs> = {
    title: 'UI/DockLayout',
    args: { label: 'DockLayout' },
    // A docking workspace needs the full canvas: the global centered layout
    // squeezes groups until their grip/menu keys clip out of reach.
    parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<DockLayoutStoryArgs>;

export const Default: Story = {
    render: (): ReactElement => <ControlledDockLayout initial={WORKSPACE} />,
};

export const FloatingPalette: Story = {
    render: (): ReactElement => <ControlledDockLayout initial={WITH_FLOATING} />,
};

export const SingleGroup: Story = {
    render: (): ReactElement => (
        <ControlledDockLayout
            initial={{
                root: {
                    kind: EDockNodeKind.Tabs,
                    panelIds: ['editor', 'preview', 'console'],
                    activeId: 'editor',
                },
                floating: [],
            }}
        />
    ),
};

export const Empty: Story = {
    render: (): ReactElement => (
        <ControlledDockLayout initial={{ root: null, floating: [] }} />
    ),
};

export const Toned: Story = {
    render: (): ReactElement => (
        <ControlledDockLayout
            initial={WORKSPACE}
            tone="var(--portal-color-success)"
        />
    ),
};
