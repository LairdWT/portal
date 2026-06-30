import type { Meta, StoryObj } from '@storybook/react-vite';
import { type CSSProperties, type ReactElement } from 'react';

import { Panel } from '../Panel/Panel';
import { EUiStatus } from '../tone';
import { BarChart } from './BarChart';
import {
    type ChartLegendItem,
    type ChartRankedEntry,
    type ChartSegment,
} from './Chart.types';
import { LegendRow } from './LegendRow';
import { RankedBars } from './RankedBars';
import { RatioBar } from './RatioBar';
import { StackedBar } from './StackedBar';

const BAR_VALUES: readonly number[] = [4, 9, 6, 12, 8, 3, 11];

const SEGMENTS: readonly ChartSegment[] = [
    { label: 'Hand', value: 5 },
    { label: 'Deck', value: 12 },
    { label: 'Discard', value: 3 },
];

const SEGMENTS_TONED: readonly ChartSegment[] = [
    { label: 'Fire', value: 8, tone: 'oklch(0.62 0.2 25)' },
    { label: 'Water', value: 5, tone: 'oklch(0.7 0.15 240)' },
    { label: 'Earth', value: 3, tone: 'oklch(0.75 0.16 140)' },
];

const RANKED: readonly ChartRankedEntry[] = [
    { label: 'Strike', value: 42 },
    { label: 'Block', value: 31 },
    { label: 'Dash', value: 18 },
    { label: 'Heal', value: 7 },
];

const LEGEND: readonly ChartLegendItem[] = [
    { label: 'Fire', value: 8, tone: 'oklch(0.62 0.2 25)' },
    { label: 'Water', value: 5, tone: 'oklch(0.7 0.15 240)' },
    { label: 'Earth', value: 3, tone: 'oklch(0.75 0.16 140)' },
];

const FRAME_STYLE: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    inlineSize: 'min(28rem, 100%)',
};

const meta: Meta<typeof BarChart> = {
    title: 'UI/Chart',
    component: BarChart,
    parameters: { layout: 'fullscreen' },
    args: {
        label: 'Damage per turn',
        values: BAR_VALUES,
    },
};

export default meta;

type Story = StoryObj<typeof BarChart>;

export const BarChartDefault: Story = {};

export const BarChartToned: Story = {
    args: {
        label: 'Shield uptime',
        values: BAR_VALUES,
        tone: 'oklch(0.7 0.15 240)',
    },
};

export const BarChartEmpty: Story = {
    args: {
        label: 'Damage per turn',
        values: [],
        emptyLabel: 'No samples yet',
    },
};

export const StackedBarDefault: Story = {
    render: (): ReactElement => (
        <StackedBar label="Card zones" segments={SEGMENTS} />
    ),
};

export const StackedBarMultiTone: Story = {
    render: (): ReactElement => (
        <StackedBar label="Element mix" segments={SEGMENTS_TONED} />
    ),
};

export const StackedBarEmpty: Story = {
    render: (): ReactElement => (
        <StackedBar label="Element mix" segments={[]} emptyLabel="No segments" />
    ),
};

export const RankedBarsDefault: Story = {
    render: (): ReactElement => <RankedBars entries={RANKED} />,
};

export const RankedBarsEmpty: Story = {
    render: (): ReactElement => (
        <RankedBars entries={[]} emptyLabel="No actions ranked" />
    ),
};

export const RatioBarSuccess: Story = {
    render: (): ReactElement => (
        <RatioBar
            label="Hull integrity"
            value={92}
            max={100}
            status={EUiStatus.Success}
        />
    ),
};

export const RatioBarDanger: Story = {
    render: (): ReactElement => (
        <RatioBar
            label="Hull integrity"
            value={11}
            max={100}
            status={EUiStatus.Danger}
        />
    ),
};

export const LegendRowDefault: Story = {
    render: (): ReactElement => <LegendRow items={LEGEND} />,
};

// The opt-in keyboard affordance: RankedBars rows and LegendRow entries are
// focusable Tooltip triggers - Tab through them to reveal each readout, shown on
// focus as well as hover (never hover-only).
export const FocusableRows: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <RankedBars entries={RANKED} tone="oklch(0.72 0.16 150)" />
            <LegendRow items={LEGEND} />
        </div>
    ),
};

// The family reads as one machined-HUD console: a histogram, a stacked bar with
// its legend, and a ranked gauge list, stacked inside a Panel.
export const TelemetryPanel: Story = {
    render: (): ReactElement => (
        <Panel title="Combat telemetry">
            <div style={FRAME_STYLE}>
                <BarChart label="Damage per turn" values={BAR_VALUES} />
                <StackedBar label="Element mix" segments={SEGMENTS_TONED} />
                <LegendRow items={LEGEND} />
                <RankedBars entries={RANKED} tone="oklch(0.72 0.16 150)" />
                <RatioBar label="Hull integrity" value={92} max={100} />
            </div>
        </Panel>
    ),
};
