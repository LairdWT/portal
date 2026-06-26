import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { EUiStatus } from '../tone';
import { Badge } from './Badge';
import { EBadgeKind } from './Badge.types';

const meta: Meta<typeof Badge> = {
    title: 'UI/Badge',
    component: Badge,
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
    args: {
        kind: EBadgeKind.Status,
        label: 'Online',
    },
};

export const StatusWithoutDot: Story = {
    args: {
        kind: EBadgeKind.Status,
        label: 'Idle',
        showDot: false,
    },
};

export const Count: Story = {
    args: {
        kind: EBadgeKind.Count,
        count: 12,
        label: 'notifications',
    },
};

export const CountClamped: Story = {
    args: {
        kind: EBadgeKind.Count,
        count: 1280,
        max: 99,
        label: 'unread',
    },
};

export const Toned: Story = {
    args: {
        kind: EBadgeKind.Status,
        label: 'Crimson',
        tone: 'oklch(0.62 0.2 25)',
    },
};

export const DangerStatus: Story = {
    args: {
        kind: EBadgeKind.Status,
        label: 'Critical',
        status: EUiStatus.Danger,
    },
};

export const SuccessCount: Story = {
    args: {
        kind: EBadgeKind.Count,
        count: 3,
        label: 'passed',
        status: EUiStatus.Success,
    },
};

export const BadgeRow: Story = {
    render: (): ReactElement => (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                alignItems: 'center',
            }}
        >
            <Badge kind={EBadgeKind.Status} label="Online" />
            <Badge kind={EBadgeKind.Status} label="Idle" showDot={false} />
            <Badge
                kind={EBadgeKind.Status}
                label="Critical"
                status={EUiStatus.Danger}
            />
            <Badge kind={EBadgeKind.Count} count={7} label="items" />
            <Badge kind={EBadgeKind.Count} count={1280} max={99} label="unread" />
            <Badge
                kind={EBadgeKind.Count}
                count={42}
                label="online"
                tone="oklch(0.7 0.15 240)"
            />
        </div>
    ),
};
