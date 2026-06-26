import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { EUiStatus } from '../tone';
import { Section } from './Section';

const meta: Meta<typeof Section> = {
    title: 'UI/Section',
    component: Section,
    args: {
        title: 'Telemetry',
        children: 'Live readouts for the current run.',
    },
};

export default meta;

type Story = StoryObj<typeof Section>;

export const Default: Story = {};

export const Toned: Story = {
    args: {
        title: 'Crimson Squad',
        tone: 'oklch(0.62 0.2 25)',
        children: 'Members and status for the crimson faction.',
    },
};

export const DangerStatus: Story = {
    args: {
        title: 'Faults',
        status: EUiStatus.Danger,
        children: 'Three subsystems are reporting errors.',
    },
};

export const WithActions: Story = {
    args: {
        title: 'Filters',
        actions: (
            <button type="button" style={{ minBlockSize: '3rem' }}>
                Clear
            </button>
        ),
        children: 'Active filters applied to the result set.',
    },
};

export const DeepHeadingLevel: Story = {
    args: {
        title: 'Nested grouping',
        headingLevel: 4,
        children: 'A grouping nested under higher-level headings.',
    },
};

export const SectionStack: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <Section title="Overview">High-level summary of the system.</Section>
            <Section title="Crimson" tone="oklch(0.62 0.2 25)">
                Faction-toned grouping accent.
            </Section>
            <Section title="Faults" status={EUiStatus.Danger}>
                Status-toned grouping accent.
            </Section>
            <Section
                title="Filters"
                actions={
                    <button type="button" style={{ minBlockSize: '3rem' }}>
                        Reset
                    </button>
                }
            >
                Grouping with a trailing actions slot.
            </Section>
        </div>
    ),
};
