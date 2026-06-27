import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { Marquee } from './Marquee';
import { type EMarqueeDirection } from './Marquee.types';

// A single (non-union) story args shape. The component's own props mix the
// AccessibleName XOR union, which collapses Storybook's arg inference to `never`;
// the stories only ever exercise the `label` form, so a flat args type keeps the
// meta and story typing sound while still feeding valid Marquee props.
type MarqueeStoryArgs = Readonly<{
    children: string;
    label: string;
    speed?: number;
    gap?: string;
    direction?: EMarqueeDirection;
    autoPlay?: boolean;
    enabled?: EEnabledState;
    status?: EUiStatus;
    tone?: string;
}>;

const LONG_TEXT: string =
    'SYSTEM STATUS // reactor nominal // shields 92% // hull 88% // ' +
    'comms online // navigation locked // awaiting jump clearance';

const SHORT_TEXT: string = 'ALL SYSTEMS NOMINAL';

// A fixed-width frame so the inline-flex root is capped narrower than the
// content, forcing the overflow that drives the scroll (a consumer normally
// supplies this width via its layout cell). The static fallback is exercised by
// the reduced-motion e2e project, not a separate story, because the axe gate
// runs on the standard projects.
function Frame({ children }: { children: ReactElement }): ReactElement {
    return <div style={{ inlineSize: '22rem' }}>{children}</div>;
}

const meta: Meta<MarqueeStoryArgs> = {
    title: 'UI/Marquee',
    component: Marquee,
    args: {
        children: LONG_TEXT,
        label: 'System status ticker',
    },
    render: (args: MarqueeStoryArgs): ReactElement => (
        <Frame>
            <Marquee {...args} />
        </Frame>
    ),
};

export default meta;

type Story = StoryObj<MarqueeStoryArgs>;

export const Default: Story = {};

// Short content that fits the strip: static, no clone, no animation, no pause
// control - the fits-static parity.
export const Fits: Story = {
    args: { children: SHORT_TEXT, label: 'Status' },
};

// autoPlay false starts paused; the resume control is primed and axe evaluates a
// static (paused) strip.
export const Paused: Story = {
    args: { autoPlay: false },
};

// A consumer-supplied opaque tone color drives the strip border and glow; the
// scrolling text contrast is unchanged.
export const Toned: Story = {
    args: { tone: 'oklch(0.72 0.17 195)' },
};

// The universal danger status routes the danger ramp onto the border and glow.
export const Status: Story = {
    args: { status: EUiStatus.Danger },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const Slow: Story = {
    args: { speed: 24, label: 'Slow ticker' },
};

export const Fast: Story = {
    args: { speed: 120, label: 'Fast ticker' },
};
