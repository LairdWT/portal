import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { Drawer } from './Drawer';
import { EDrawerEdge, EDrawerMode } from './Drawer.types';

// The component props are a discriminated union crossed with the AccessibleName
// XOR union, which collapses Storybook's arg inference to `never`. A flat story
// args type keeps the meta and story typing sound; every story drives the real
// Drawer through a controlled wrapper (the Dialog story pattern), so the args are
// only a docs anchor.
type DrawerStoryArgs = Readonly<{ label: string }>;

const LAYOUT_STYLE: CSSProperties = {
    display: 'flex',
    minBlockSize: '20rem',
    gap: 'var(--portal-space-4)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-bg-1)',
};

const MAIN_STYLE: CSSProperties = {
    flex: '1 1 auto',
    padding: 'var(--portal-space-4)',
    color: 'var(--portal-color-text-0)',
};

const OPENER_STYLE: CSSProperties = {
    minBlockSize: 'var(--portal-touch-target-min)',
    paddingInline: 'var(--portal-space-4)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    cursor: 'pointer',
};

const DEMO_BODY: ReactNode = (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--portal-space-3)',
        }}
    >
        <p style={{ margin: 0 }}>
            The controller link is active and streaming telemetry. Adjust the
            filters below to scope the live feed.
        </p>
        <button type="button" style={OPENER_STYLE}>
            Reset filters
        </button>
    </div>
);

type OverlayDemoProps = Readonly<{
    edge?: EDrawerEdge;
    tone?: string;
    status?: EUiStatus;
    resizable?: boolean;
}>;

// A controlled overlay wrapper, primed OPEN on mount so the axe gate sees the
// live dialog tree.
function ControlledOverlayDrawer(props: OverlayDemoProps): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    const [size, setSize]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(320);
    return (
        <div style={MAIN_STYLE}>
            <button
                type="button"
                style={OPENER_STYLE}
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open drawer
            </button>
            <Drawer
                mode={EDrawerMode.Overlay}
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                title="Telemetry"
                label="Telemetry drawer"
                {...(props.edge !== undefined ? { edge: props.edge } : {})}
                {...(props.tone !== undefined ? { tone: props.tone } : {})}
                {...(props.status !== undefined ? { status: props.status } : {})}
                {...(props.resizable === true
                    ? {
                          resizable: true,
                          size,
                          onSizeChange: setSize,
                          minSize: 240,
                          maxSize: 520,
                      }
                    : {})}
            >
                {DEMO_BODY}
            </Drawer>
        </div>
    );
}

type InlineDemoProps = Readonly<{
    name?: string;
    edge?: EDrawerEdge;
    collapsible?: boolean;
    initialCollapsed?: boolean;
    resizable?: boolean;
    snapPoints?: readonly number[];
    tone?: string;
    status?: EUiStatus;
    enabled?: EEnabledState;
}>;

// A controlled inline wrapper, rendered in a flex layout next to body content
// (the Helicon editor-panel read).
function ControlledInlineDrawer(props: InlineDemoProps): ReactElement {
    const [collapsed, setCollapsed]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialCollapsed ?? false);
    const [size, setSize]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(280);
    const edge: EDrawerEdge = props.edge ?? EDrawerEdge.InlineStart;
    const name: string = props.name ?? 'Inspector';
    return (
        <div style={LAYOUT_STYLE}>
            <Drawer
                mode={EDrawerMode.Inline}
                edge={edge}
                title={name}
                label={`${name} panel`}
                collapsed={collapsed}
                onCollapsedChange={setCollapsed}
                {...(props.collapsible === true ? { collapsible: true } : {})}
                {...(props.tone !== undefined ? { tone: props.tone } : {})}
                {...(props.status !== undefined ? { status: props.status } : {})}
                {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
                {...(props.resizable === true
                    ? {
                          resizable: true,
                          size,
                          onSizeChange: setSize,
                          minSize: 200,
                          maxSize: 480,
                      }
                    : {})}
                {...(props.snapPoints !== undefined
                    ? { snapPoints: props.snapPoints }
                    : {})}
            >
                {DEMO_BODY}
            </Drawer>
            <div style={MAIN_STYLE}>
                <p style={{ marginBlockStart: 0 }}>
                    Main workspace content sits beside the docked inspector. The
                    inspector keeps its own scroll and never overlays this region.
                </p>
            </div>
        </div>
    );
}

// The meta is typed on the flat story-args shape (not typeof Drawer): the Drawer
// props union crossed with AccessibleName collapses Storybook's inference to
// `never`, and `component: Drawer` cannot be reconciled with a flat args type, so
// it is omitted - every story drives Drawer directly through a render function.
const meta: Meta<DrawerStoryArgs> = {
    title: 'UI/Drawer',
    args: { label: 'Drawer' },
};

export default meta;

type Story = StoryObj<DrawerStoryArgs>;

export const OverlayLeft: Story = {
    render: (): ReactElement => (
        <ControlledOverlayDrawer edge={EDrawerEdge.InlineStart} />
    ),
};

export const OverlayRight: Story = {
    render: (): ReactElement => (
        <ControlledOverlayDrawer edge={EDrawerEdge.InlineEnd} />
    ),
};

export const OverlayBottom: Story = {
    render: (): ReactElement => (
        <ControlledOverlayDrawer edge={EDrawerEdge.BlockEnd} />
    ),
};

export const InlineDocked: Story = {
    render: (): ReactElement => (
        <ControlledInlineDrawer edge={EDrawerEdge.InlineStart} />
    ),
};

export const InlineCollapsible: Story = {
    render: (): ReactElement => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--portal-space-4)',
            }}
        >
            <ControlledInlineDrawer name="Inspector expanded" collapsible />
            <ControlledInlineDrawer
                name="Inspector collapsed"
                collapsible
                initialCollapsed
            />
        </div>
    ),
};

// Release the resize drag and the panel settles onto the nearest snap size
// (240 / 360 / 480 px here); the live drag stays free.
export const SnapPoints: Story = {
    render: (): ReactElement => (
        <ControlledInlineDrawer
            edge={EDrawerEdge.InlineStart}
            resizable
            snapPoints={[240, 360, 480]}
        />
    ),
};

export const Resizable: Story = {
    render: (): ReactElement => (
        <ControlledInlineDrawer edge={EDrawerEdge.InlineStart} resizable />
    ),
};

export const Toned: Story = {
    render: (): ReactElement => (
        <ControlledInlineDrawer
            collapsible
            resizable
            tone="var(--portal-color-success)"
        />
    ),
};

export const StatusDanger: Story = {
    render: (): ReactElement => (
        <ControlledInlineDrawer collapsible status={EUiStatus.Danger} />
    ),
};

export const Disabled: Story = {
    render: (): ReactElement => (
        <ControlledInlineDrawer
            collapsible
            resizable
            enabled={EEnabledState.Disabled}
        />
    ),
};

export const Composition: Story = {
    render: (): ReactElement => (
        <div style={LAYOUT_STYLE}>
            <Drawer
                mode={EDrawerMode.Inline}
                edge={EDrawerEdge.InlineStart}
                title="Nav"
                label="Primary navigation"
                landmark={false}
            >
                <p style={{ margin: 0 }}>Navigation slot.</p>
            </Drawer>
            <div style={MAIN_STYLE}>
                <p style={{ marginBlockStart: 0 }}>Workspace.</p>
            </div>
            <Drawer
                mode={EDrawerMode.Inline}
                edge={EDrawerEdge.BlockEnd}
                title="Console"
                label="Console panel"
                landmark={false}
            >
                <p style={{ margin: 0 }}>Console output slot.</p>
            </Drawer>
        </div>
    ),
};
