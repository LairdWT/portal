import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type CSSProperties, type ReactElement } from 'react';

import { Minimap } from './Minimap';
import { EMapMarkerKind, EMinimapShape, type MapMarker } from './Minimap.types';

const FRAME_STYLE: CSSProperties = { maxInlineSize: '20rem' };

const MARKERS: readonly MapMarker[] = [
    { id: 'wing', x: -30, y: 45, label: 'Wingman', kind: EMapMarkerKind.Ally },
    { id: 'convoy', x: 55, y: 20, label: 'Convoy', kind: EMapMarkerKind.Ally },
    {
        id: 'raider-1',
        x: 40,
        y: -60,
        label: 'Raider one',
        kind: EMapMarkerKind.Hostile,
    },
    {
        id: 'raider-2',
        x: -70,
        y: -25,
        label: 'Raider two',
        kind: EMapMarkerKind.Hostile,
    },
    {
        id: 'relay',
        x: 220,
        y: 160,
        label: 'Relay (out of range)',
        kind: EMapMarkerKind.Objective,
    },
    { id: 'drift', x: 10, y: 80, label: 'Unknown contact' },
];

type MinimapStoryArgs = Readonly<{ label: string }>;

const meta: Meta<MinimapStoryArgs> = {
    title: 'UI/Minimap',
    args: { label: 'Minimap' },
};

export default meta;

type Story = StoryObj<MinimapStoryArgs>;

export const Default: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <Minimap
                label="Tactical"
                markers={MARKERS}
                center={{ x: 0, y: 0 }}
                range={100}
                heading={30}
            />
        </div>
    ),
};

export const HeadingUp: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <Minimap
                label="Tactical (heading up)"
                markers={MARKERS}
                center={{ x: 0, y: 0 }}
                range={100}
                heading={30}
                headingUp={true}
            />
        </div>
    ),
};

export const RadarSweep: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <Minimap
                label="Long-range radar"
                markers={MARKERS}
                center={{ x: 0, y: 0 }}
                range={250}
                sweep={true}
                tone="var(--portal-color-success)"
            />
        </div>
    ),
};

export const SquareChart: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <Minimap
                label="Sector chart"
                markers={MARKERS}
                center={{ x: 0, y: 0 }}
                range={100}
                shape={EMinimapShape.Square}
            />
        </div>
    ),
};
