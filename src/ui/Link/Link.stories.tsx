import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

import { Link } from './Link';

const meta: Meta<typeof Link> = {
    title: 'UI/Link',
    component: Link,
    args: {
        href: '#',
        children: 'Mission briefing',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const External: Story = {
    args: {
        href: 'https://example.com',
        external: true,
        children: 'External telemetry feed',
    },
};

export const InProse: Story = {
    render: (): ReactElement => (
        <p
            style={{
                maxInlineSize: '32rem',
                color: 'var(--portal-color-text-0)',
                fontFamily: 'var(--portal-font-sans)',
                lineHeight: 'var(--portal-line-height-normal)',
            }}
        >
            Review the <Link href="#">mission briefing</Link> before departure, then
            confirm your loadout against the{' '}
            <Link href="https://example.com" external>
                fleet manifest
            </Link>
            .
        </p>
    ),
};

export const Toned: Story = {
    args: { tone: 'oklch(0.62 0.2 25)', children: 'Abort procedures' },
};
