import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { EUiStatus } from '../tone';
import { StatTile } from './StatTile';
import { EStatTileEmphasis, EStatTrend } from './StatTile.types';
import { TileRow } from './TileRow';

const meta: Meta<typeof StatTile> = {
    title: 'UI/StatTile',
    component: StatTile,
    args: {
        label: 'Throughput',
        value: '1,024',
    },
};

export default meta;

type Story = StoryObj<typeof StatTile>;

export const Default: Story = {};

export const MetricEmphasis: Story = {
    args: {
        emphasis: EStatTileEmphasis.Metric,
    },
};

export const WithUnit: Story = {
    args: {
        unit: 'ops/s',
    },
};

export const WithDeltaUp: Story = {
    args: {
        unit: 'ops/s',
        delta: { value: '12%', trend: EStatTrend.Up },
    },
};

export const WithDeltaDown: Story = {
    args: {
        label: 'Latency',
        value: '38',
        unit: 'ms',
        delta: { value: '5 ms', trend: EStatTrend.Down },
    },
};

export const WithDeltaFlat: Story = {
    args: {
        label: 'Sessions',
        value: '512',
        delta: { value: '0', trend: EStatTrend.Flat },
    },
};

export const Toned: Story = {
    args: {
        unit: 'ops/s',
        tone: 'oklch(0.7 0.15 240)',
        delta: { value: '8%', trend: EStatTrend.Up },
    },
};

export const DangerStatus: Story = {
    args: {
        label: 'Error rate',
        value: '4.2',
        unit: '%',
        status: EUiStatus.Danger,
        delta: { value: '1.1%', trend: EStatTrend.Up },
    },
};

export const SuccessStatus: Story = {
    args: {
        label: 'Uptime',
        value: '99.98',
        unit: '%',
        status: EUiStatus.Success,
        delta: { value: '0.2%', trend: EStatTrend.Up },
    },
};

export const TileGrid: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <TileRow label="Cluster metrics">
                <StatTile
                    label="Throughput"
                    value="1,024"
                    unit="ops/s"
                    delta={{ value: '12%', trend: EStatTrend.Up }}
                />
                <StatTile
                    label="Latency"
                    value="38"
                    unit="ms"
                    status={EUiStatus.Success}
                    delta={{ value: '5 ms', trend: EStatTrend.Down }}
                />
                <StatTile
                    label="Error rate"
                    value="4.2"
                    unit="%"
                    status={EUiStatus.Danger}
                    delta={{ value: '1.1%', trend: EStatTrend.Up }}
                />
                <StatTile
                    label="Sessions"
                    value="512"
                    delta={{ value: '0', trend: EStatTrend.Flat }}
                />
            </TileRow>
            <TileRow label="Fixed four-column strip" columns={4}>
                <StatTile
                    emphasis={EStatTileEmphasis.Metric}
                    label="CPU"
                    value="62"
                    unit="%"
                />
                <StatTile
                    emphasis={EStatTileEmphasis.Metric}
                    label="Memory"
                    value="14.2"
                    unit="GB"
                />
                <StatTile
                    emphasis={EStatTileEmphasis.Metric}
                    label="Disk"
                    value="318"
                    unit="GB"
                />
                <StatTile
                    emphasis={EStatTileEmphasis.Metric}
                    label="Net"
                    value="1.2"
                    unit="Gb/s"
                />
            </TileRow>
        </div>
    ),
};
