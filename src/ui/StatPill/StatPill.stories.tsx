import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useEffect,
    useState,
} from 'react';

import { EUiStatus } from '../tone';
import { StatPill } from './StatPill';

const meta: Meta<typeof StatPill> = {
    title: 'UI/StatPill',
    component: StatPill,
    args: {
        label: 'Energy',
        value: 'high',
    },
};

export default meta;

type Story = StoryObj<typeof StatPill>;

export const Default: Story = {};

export const WithValueNumber: Story = {
    args: {
        label: 'Energy',
        value: 7,
    },
};

export const Toned: Story = {
    args: {
        label: 'Crimson',
        value: 12,
        tone: 'oklch(0.62 0.2 25)',
    },
};

export const DangerStatus: Story = {
    args: {
        label: 'Hull',
        value: 0,
        status: EUiStatus.Danger,
    },
};

export const PillRow: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <StatPill label="Energy" value={7} />
            <StatPill label="Shield" value={42} tone="oklch(0.7 0.15 240)" />
            <StatPill label="Hull" value={0} status={EUiStatus.Danger} />
            <StatPill label="Cycle" value={3} status={EUiStatus.Success} />
            <StatPill label="Phase" value="combat" />
        </div>
    ),
};

// Demonstrates the value-change pulse: the readout ticks on a timer and the
// value span pulses on every change (reduced-motion users see the plain tick).
function LiveTelemetryDemo(): ReactElement {
    const [tick, setTick]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(88);
    useEffect((): (() => void) => {
        const timer: number = window.setInterval((): void => {
            setTick((current: number): number => (current + 3) % 100);
        }, 1400);
        return (): void => {
            window.clearInterval(timer);
        };
    }, []);
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <StatPill label="Energy" value={tick} />
            <StatPill
                label="Shield"
                value={(tick * 7) % 100}
                tone="oklch(0.7 0.15 240)"
            />
        </div>
    );
}

export const LiveTelemetry: Story = {
    render: (): ReactElement => <LiveTelemetryDemo />,
};
