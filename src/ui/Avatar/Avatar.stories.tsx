import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { EUiStatus } from '../tone';
import { Avatar } from './Avatar';
import { EAvatarShape, EAvatarSize } from './Avatar.types';

// A small stable inline image so the Default/Sizes/Shapes stories render a real
// raster without a network fetch. ASCII-only data URI (SVG disc).
const SAMPLE_IMAGE: string =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' " +
    "width='96' height='96'%3E%3Crect width='96' height='96' fill='%234a90d9'/%3E" +
    "%3Ccircle cx='48' cy='38' r='18' fill='%23ffffff'/%3E" +
    "%3Crect x='20' y='60' width='56' height='30' rx='15' fill='%23ffffff'/%3E%3C/svg%3E";

// A simple generic icon node for the icon-fallback link of the chain.
function SampleIcon(): ReactElement {
    return (
        <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden="true">
            <path
                d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z"
                fill="currentColor"
            />
        </svg>
    );
}

const meta: Meta<typeof Avatar> = {
    title: 'UI/Avatar',
    component: Avatar,
    args: {
        name: 'Jane Doe',
    },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
    args: {
        src: SAMPLE_IMAGE,
    },
};

export const Initials: Story = {
    args: {
        name: 'Jane Doe',
    },
};

export const BrokenImage: Story = {
    args: {
        src: 'https://invalid.example/none.png',
        name: 'Jane Doe',
    },
};

export const IconFallback: Story = {
    render: (): ReactElement => <Avatar icon={<SampleIcon />} />,
};

export const GlyphFallback: Story = {
    render: (): ReactElement => <Avatar />,
};

export const Sizes: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Avatar src={SAMPLE_IMAGE} name="Jane Doe" size={EAvatarSize.Sm} />
            <Avatar src={SAMPLE_IMAGE} name="Jane Doe" size={EAvatarSize.Md} />
            <Avatar src={SAMPLE_IMAGE} name="Jane Doe" size={EAvatarSize.Lg} />
        </div>
    ),
};

export const Shapes: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Avatar
                src={SAMPLE_IMAGE}
                name="Jane Doe"
                shape={EAvatarShape.Circle}
            />
            <Avatar src={SAMPLE_IMAGE} name="Jane Doe" shape={EAvatarShape.Bevel} />
            <Avatar name="Jane Doe" shape={EAvatarShape.Circle} />
            <Avatar name="Jane Doe" shape={EAvatarShape.Bevel} />
        </div>
    ),
};

export const WithStatusSuccess: Story = {
    args: {
        src: SAMPLE_IMAGE,
        status: { status: EUiStatus.Success, label: 'Online' },
    },
};

export const WithStatusDanger: Story = {
    args: {
        src: SAMPLE_IMAGE,
        status: { status: EUiStatus.Danger, label: 'Busy' },
    },
};

export const Toned: Story = {
    args: {
        name: 'Jane Doe',
        tone: 'oklch(0.7 0.15 240)',
    },
};

export const Decorative: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Avatar src={SAMPLE_IMAGE} name="Jane Doe" decorative />
            <span>Jane Doe</span>
        </div>
    ),
};

export const Fallbacks: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Avatar
                src={SAMPLE_IMAGE}
                name="Ada Lovelace"
                status={{ status: EUiStatus.Success, label: 'Online' }}
            />
            <Avatar name="Grace Hopper" />
            <Avatar icon={<SampleIcon />} />
            <Avatar />
            <Avatar
                name="Alan Turing"
                shape={EAvatarShape.Bevel}
                status={{ status: EUiStatus.Danger, label: 'Away' }}
            />
        </div>
    ),
};
