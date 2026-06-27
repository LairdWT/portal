import type { Meta, StoryObj } from '@storybook/react-vite';
import { type CSSProperties, type ReactElement, type ReactNode } from 'react';

import { Panel } from '../Panel/Panel';
import { Scanlines } from './Scanlines';
import {
    EScanlineExtent,
    EScanlineFlicker,
    type ScanlinesProps,
} from './Scanlines.types';

// A bounded, dark host so the overlay is visible and legibility is demonstrable.
// transform establishes a containing block for BOTH the Contained (absolute) and
// Fixed (fixed) overlays, so the Fixed story paints inside the preview frame
// rather than escaping to the viewport. overflow:hidden bounds the texture.
const frameStyle: CSSProperties = {
    position: 'relative',
    transform: 'translateZ(0)',
    overflow: 'hidden',
    inlineSize: '100%',
    maxInlineSize: '32rem',
    minBlockSize: '12rem',
    padding: '1.5rem',
    border: '2px solid #2b3138',
    background: '#0d1013',
    color: '#e8eef2',
    fontFamily: 'system-ui, sans-serif',
};

const buttonStyle: CSSProperties = {
    minBlockSize: '3rem',
    paddingInline: '1rem',
};

// Real sample content the overlay sits above: body copy proves text stays legible
// under the texture, and a control proves pointer-events:none never blocks input.
// The overlay (children) is rendered LAST so, as the positioned final child, it
// paints above the static content.
function Frame({ children }: { children: ReactNode }): ReactElement {
    return (
        <div style={frameStyle}>
            <p style={{ margin: '0 0 1rem' }}>
                Reactor output is nominal. Coolant pressure holds at 2.4 bar and the
                secondary loop is within tolerance. This body copy must stay legible
                beneath the scanline overlay.
            </p>
            <button type="button" style={buttonStyle}>
                Acknowledge
            </button>
            {children}
        </div>
    );
}

const meta: Meta<typeof Scanlines> = {
    title: 'Display/Scanlines',
    component: Scanlines,
    parameters: {
        layout: 'padded',
    },
};

export default meta;

type Story = StoryObj<typeof Scanlines>;

export const Default: Story = {
    args: {
        extent: EScanlineExtent.Contained,
    },
    render: (args: ScanlinesProps): ReactElement => (
        <Frame>
            <Scanlines {...args} />
        </Frame>
    ),
};

export const OverPanel: Story = {
    args: {
        extent: EScanlineExtent.Contained,
    },
    render: (args: ScanlinesProps): ReactElement => (
        <Panel title="Reactor">
            <div
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    minBlockSize: '8rem',
                }}
            >
                <p style={{ margin: 0 }}>
                    The beveled host clips the overlay to its own machined corners,
                    so the scanlines take the HUD finish without authoring any
                    corner geometry of their own.
                </p>
                <Scanlines {...args} />
            </div>
        </Panel>
    ),
};

export const Fixed: Story = {
    args: {
        extent: EScanlineExtent.Fixed,
    },
    render: (args: ScanlinesProps): ReactElement => (
        <Frame>
            <Scanlines {...args} />
        </Frame>
    ),
};

export const Toned: Story = {
    args: {
        extent: EScanlineExtent.Contained,
        tone: 'oklch(0.78 0.13 75)',
    },
    render: (args: ScanlinesProps): ReactElement => (
        <Frame>
            <Scanlines {...args} />
        </Frame>
    ),
};

export const FinePitch: Story = {
    args: {
        extent: EScanlineExtent.Contained,
        pitch: '2px',
    },
    render: (args: ScanlinesProps): ReactElement => (
        <Frame>
            <Scanlines {...args} />
        </Frame>
    ),
};

export const CoarsePitch: Story = {
    args: {
        extent: EScanlineExtent.Contained,
        pitch: '6px',
    },
    render: (args: ScanlinesProps): ReactElement => (
        <Frame>
            <Scanlines {...args} />
        </Frame>
    ),
};

export const HigherOpacity: Story = {
    args: {
        extent: EScanlineExtent.Contained,
        opacity: 0.16,
    },
    render: (args: ScanlinesProps): ReactElement => (
        <Frame>
            <Scanlines {...args} />
            <p
                style={{
                    position: 'relative',
                    margin: '1rem 0 0',
                    fontSize: '0.85rem',
                    color: '#9aa6b0',
                }}
            >
                A stronger opacity reads more like glass but trades away legibility;
                keep it low (the ~0.06 default) over real body text.
            </p>
        </Frame>
    ),
};

export const FlickerSubtle: Story = {
    args: {
        extent: EScanlineExtent.Contained,
        flicker: EScanlineFlicker.Subtle,
    },
    render: (args: ScanlinesProps): ReactElement => (
        <Frame>
            <Scanlines {...args} />
        </Frame>
    ),
};
