import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type ComponentType, type ReactElement } from 'react';

import { EUiStatus } from '../tone';
import { Gauge } from './Gauge';

const meta: Meta<typeof Gauge> = {
    title: 'UI/Gauge',
    component: Gauge,
    args: {
        label: 'Reactor output',
        value: 62,
        units: 'MW',
    },
    decorators: [
        (Story: ComponentType): ReactElement => (
            <div style={{ maxInlineSize: '18rem' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof Gauge>;

export const Default: Story = {};

export const RedlineBands: Story = {
    args: {
        value: 88,
        bands: [
            { from: 0, to: 25, status: EUiStatus.Success },
            { from: 80, to: 100, status: EUiStatus.Danger },
        ],
    },
};

export const Toned: Story = {
    args: {
        label: 'Coolant flow',
        value: 41,
        units: 'L/s',
        tone: 'var(--portal-color-success)',
    },
};

export const StatusDanger: Story = {
    args: {
        label: 'Core temperature',
        value: 96,
        units: 'K',
        status: EUiStatus.Danger,
    },
};

export const FractionFormatted: Story = {
    args: {
        label: 'Shield integrity',
        value: 0.62,
        min: 0,
        max: 1,
        units: undefined,
        formatValue: (value: number): string =>
            `${String(Math.round(value * 100))}%`,
    },
};

export const Empty: Story = {
    args: {
        label: 'Auxiliary power',
        value: 0,
    },
};

// The instrument-panel form: a hub tag above the value, a units-independent
// amount line under it, and the min/max bounds at the dial shoulders.
export const Instrumented: Story = {
    args: {
        label: 'Reactor output',
        value: 620,
        min: 0,
        max: 1000,
        units: 'MW',
        centerContent: <span>PWR</span>,
        amountLabel: '620 / 1000',
        showBounds: true,
        bands: [{ from: 850, to: 1000, status: EUiStatus.Danger }],
    },
};
