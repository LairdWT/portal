import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { EUiStatus } from '../tone';
import { EmptyState } from './EmptyState';
import { EEmptyStateRole } from './EmptyState.types';

// A dependency-free placeholder glyph for the icon slot. Inline SVG keeps the
// stories self-contained without bundling an icon set (Portal ships none).
function PlaceholderIcon(): ReactElement {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path
                d="M8 12h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

const meta: Meta<typeof EmptyState> = {
    title: 'UI/EmptyState',
    component: EmptyState,
    args: {
        title: 'No results',
        description: 'Nothing matches the current filters yet.',
    },
};

export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const WithIcon: Story = {
    args: {
        icon: <PlaceholderIcon />,
        title: 'Inbox is empty',
        description: 'New messages will show up here as they arrive.',
    },
};

export const WithAction: Story = {
    args: {
        icon: <PlaceholderIcon />,
        title: 'No projects yet',
        description: 'Create your first project to get started.',
        action: (
            <button type="button" style={{ minBlockSize: '3rem' }}>
                Create project
            </button>
        ),
    },
};

export const Toned: Story = {
    args: {
        icon: <PlaceholderIcon />,
        title: 'All clear',
        description: 'There are no pending items in this view.',
        tone: 'oklch(0.7 0.15 240)',
    },
};

export const DangerStatus: Story = {
    args: {
        icon: <PlaceholderIcon />,
        title: 'Failed to load',
        description: 'The data could not be retrieved. Try again.',
        status: EUiStatus.Danger,
    },
};

export const RegionLandmark: Story = {
    args: {
        title: 'No notifications',
        description: 'You are all caught up.',
        role: EEmptyStateRole.Region,
    },
};

export const EmptyStateGrid: Story = {
    render: (): ReactElement => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
                gap: '1rem',
            }}
        >
            <EmptyState
                icon={<PlaceholderIcon />}
                title="No results"
                description="Nothing matches the current filters yet."
            />
            <EmptyState
                icon={<PlaceholderIcon />}
                title="All clear"
                description="There are no pending items."
                tone="oklch(0.7 0.15 240)"
            />
            <EmptyState
                icon={<PlaceholderIcon />}
                title="Failed to load"
                description="The data could not be retrieved."
                status={EUiStatus.Danger}
            />
        </div>
    ),
};
