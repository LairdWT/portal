import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { Skeleton } from './Skeleton';
import { ESkeletonAnimation, ESkeletonVariant } from './Skeleton.types';

// A flat args shape (no `component` binding needed): SkeletonProps is already a
// flat Readonly bag, so the meta feeds it straight through the render wrapper.
type SkeletonStoryArgs = Readonly<{
    variant: ESkeletonVariant;
    animation: ESkeletonAnimation;
    width?: string;
    height?: string;
    lines?: number;
    label?: string;
}>;

const meta: Meta<SkeletonStoryArgs> = {
    title: 'UI/Skeleton',
    args: {
        variant: ESkeletonVariant.Block,
        animation: ESkeletonAnimation.Shimmer,
    },
    render: (args: SkeletonStoryArgs): ReactElement => <Skeleton {...args} />,
};
export default meta;
type Story = StoryObj<SkeletonStoryArgs>;

export const Default: Story = {};

export const TextLines: Story = {
    args: {
        variant: ESkeletonVariant.Text,
        lines: 4,
        width: '20rem',
    },
};

export const Block: Story = {
    args: {
        variant: ESkeletonVariant.Block,
        width: '16rem',
        height: '8rem',
    },
};

export const Circle: Story = {
    args: {
        variant: ESkeletonVariant.Circle,
    },
};

export const Pulse: Story = {
    args: {
        animation: ESkeletonAnimation.Pulse,
    },
};

export const Static: Story = {
    args: {
        animation: ESkeletonAnimation.None,
    },
};

export const Announced: Story = {
    args: {
        label: 'Loading profile',
    },
};

// The explicit axe story: a grid exercising every variant under each animation
// plus a labeled instance, so the addon-a11y axe pass covers the whole matrix in
// one snapshot.
export const AxeGate: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '24rem' }}>
            <Skeleton variant={ESkeletonVariant.Text} lines={3} width="20rem" />
            <Skeleton
                variant={ESkeletonVariant.Block}
                width="16rem"
                height="6rem"
            />
            <Skeleton variant={ESkeletonVariant.Circle} />
            <Skeleton
                animation={ESkeletonAnimation.Pulse}
                width="16rem"
                height="4rem"
            />
            <Skeleton
                animation={ESkeletonAnimation.None}
                width="16rem"
                height="4rem"
            />
            <Skeleton label="Loading profile card" width="20rem" height="6rem" />
        </div>
    ),
};
