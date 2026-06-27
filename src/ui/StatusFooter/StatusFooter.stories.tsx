import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type ReactElement, type ReactNode } from 'react';

import { StatusFooter } from './StatusFooter';
import {
    EFooterLiveness,
    EFooterRegion,
    EFooterStatus,
} from './StatusFooter.types';

// StatusFooter's props are an XOR union (AccessibleName), which collapses
// Storybook's arg inference to `never`; a flat args type that always carries the
// `label` form keeps the meta and story typing sound while still feeding valid
// StatusFooter props (the SegmentedControl stories precedent). The LabelledBy
// story renders the labelledBy form directly in its own render.
type StatusFooterStoryArgs = Readonly<{
    status: EFooterStatus;
    label: string;
    badgeText?: string;
    message?: ReactNode;
    end?: ReactNode;
    region?: EFooterRegion;
    liveness?: EFooterLiveness;
    showDot?: boolean;
    tone?: string;
}>;

// A representative end block: a version stamp and a build hash, the inline-end
// readouts Helicon's right_content closure renders.
const END_STAMP: ReactNode = (
    <>
        <span>v0.10.1</span>
        <span>build 9f3a1c</span>
    </>
);

const meta: Meta<StatusFooterStoryArgs> = {
    title: 'UI/StatusFooter',
    component: StatusFooter,
    args: {
        status: EFooterStatus.Ok,
        label: 'Application status',
        message: 'All systems nominal',
    },
    render: (args: StatusFooterStoryArgs): ReactElement => (
        <StatusFooter {...args} />
    ),
};

export default meta;

type Story = StoryObj<StatusFooterStoryArgs>;

export const Ok: Story = {};

export const Warning: Story = {
    args: { status: EFooterStatus.Warning, message: 'Telemetry buffer at 82%' },
};

export const Error: Story = {
    args: { status: EFooterStatus.Error, message: 'Disk full - writes paused' },
};

export const Idle: Story = {
    args: { status: EFooterStatus.Idle, message: 'Awaiting input' },
};

// An inline-end block (version stamp + build hash) alongside the badge + message.
export const WithEndStamp: Story = {
    args: { end: END_STAMP },
};

// A caller-supplied bracket label overrides the per-status default; the badge
// COLOR signal still comes from `status`.
export const CustomBadgeText: Story = {
    args: { badgeText: '[LINK: ONLINE]' },
};

// A consumer-supplied opaque tone color drives the dot and the outer glow.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

// A standalone polite status region rather than the page footer landmark.
export const StatusRegion: Story = {
    args: { region: EFooterRegion.Status, message: 'Sync in progress' },
};

// Error keeps its default assertive liveness; the live tree is primed on mount so
// axe evaluates the announcing region.
export const Assertive: Story = {
    args: {
        status: EFooterStatus.Error,
        message: 'Connection lost',
        liveness: EFooterLiveness.Assertive,
    },
};

// The labelledBy form of the accessible name: a visible element names the
// landmark via aria-labelledby instead of an inline aria-label.
export const LabelledBy: Story = {
    render: (args: StatusFooterStoryArgs): ReactElement => (
        <>
            <span id="status-footer-name">Session status</span>
            <StatusFooter
                status={args.status}
                message={args.message}
                labelledBy="status-footer-name"
            />
        </>
    ),
};
