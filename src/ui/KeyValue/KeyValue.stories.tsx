// Storybook stories for KeyValue / PropertyGrid. Imports the component from its
// module path (never the root barrel - addon-vitest browser-project rule). Covers
// the grid, single-pair, toned, per-row tone, status, wrap/truncate, ReactNode
// values, and the narrow stacked container-query fallback. Confirm the addon-a11y
// panel is clean for every story (the axe gate).

import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { EUiStatus } from '../tone';
import { KeyValue } from './KeyValue';
import { EKeyValueOverflow, type KeyValuePair } from './KeyValue.types';

const basePairs: readonly KeyValuePair[] = [
    { id: 'theme', key: 'THEME', value: 'integration' },
    { id: 'members', key: 'MEMBERS', value: 12 },
    { id: 'status', key: 'STATUS', value: 'online' },
];

const longPairs: readonly KeyValuePair[] = [
    {
        id: 'commit',
        key: 'COMMIT',
        value: '9f2c1ad7be8043c5a1d6e0f4b27c9a3e5d8f1029ab34cd56ef7890123456abcd',
    },
    {
        id: 'endpoint',
        key: 'ENDPOINT',
        value: 'https://cluster.example.internal/api/v2/nodes/primary/metadata',
    },
    { id: 'region', key: 'REGION', value: 'eu-west-control-plane-1' },
];

const meta: Meta<typeof KeyValue> = {
    title: 'UI/KeyValue',
    component: KeyValue,
    args: {
        label: 'Cluster metadata',
        pairs: basePairs,
    },
};

export default meta;

type Story = StoryObj<typeof KeyValue>;

export const Default: Story = {};

export const SinglePair: Story = {
    args: {
        label: 'Build target',
        pairs: [{ id: 'arch', key: 'ARCH', value: 'wasm32-unknown' }],
    },
};

export const Toned: Story = {
    args: {
        label: 'Crimson cluster',
        tone: 'oklch(0.62 0.2 25)',
        pairs: basePairs,
    },
};

export const PerRowTone: Story = {
    render: (): ReactElement => (
        <KeyValue
            label="Resource pool"
            pairs={[
                {
                    id: 'crimson',
                    key: 'CRIMSON',
                    value: 3,
                    tone: 'oklch(0.62 0.2 25)',
                },
                {
                    id: 'azure',
                    key: 'AZURE',
                    value: 5,
                    tone: 'oklch(0.7 0.15 240)',
                },
                {
                    id: 'verdant',
                    key: 'VERDANT',
                    value: 2,
                    tone: 'oklch(0.72 0.16 150)',
                },
                {
                    id: 'amber',
                    key: 'AMBER',
                    value: 8,
                    tone: 'oklch(0.78 0.15 80)',
                },
            ]}
        />
    ),
};

export const DangerStatus: Story = {
    args: {
        label: 'Critical systems',
        status: EUiStatus.Danger,
        pairs: [
            { id: 'hull', key: 'HULL', value: 0 },
            { id: 'shield', key: 'SHIELD', value: 0 },
            { id: 'reactor', key: 'REACTOR', value: 'offline' },
        ],
    },
};

export const LongValuesWrap: Story = {
    args: {
        label: 'Deployment',
        overflow: EKeyValueOverflow.Wrap,
        pairs: longPairs,
    },
};

// Truncate clips each value to one line. The full text stays in the DOM so
// assistive tech still reads it, but a sighted mouse user has no hover/title
// affordance to reveal the elided text - a recorded tradeoff. A consumer needing
// a tooltip should pass a titled node as `value` (the grid forwards arbitrary
// ReactNode content), e.g. value={<span title={full}>{full}</span>}.
export const LongValuesTruncate: Story = {
    args: {
        label: 'Deployment',
        overflow: EKeyValueOverflow.Truncate,
        pairs: longPairs,
    },
};

export const RichValues: Story = {
    render: (): ReactElement => (
        <KeyValue
            label="Service record"
            pairs={[
                { id: 'owner', key: 'OWNER', value: <strong>Ada Lovelace</strong> },
                {
                    id: 'docs',
                    key: 'DOCS',
                    value: <a href="https://example.internal/docs">runbook</a>,
                },
                { id: 'sha', key: 'SHA', value: <code>9f2c1ad</code> },
            ]}
        />
    ),
};

export const NarrowStacked: Story = {
    render: (): ReactElement => (
        <div style={{ width: '18rem' }}>
            <KeyValue label="Cluster metadata" pairs={basePairs} />
        </div>
    ),
};
