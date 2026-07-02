import type { Meta, StoryObj } from '@storybook/react-vite';

import { EUiStatus } from '../tone';
import { Timeline } from './Timeline';

const meta: Meta<typeof Timeline> = {
    title: 'UI/Timeline',
    component: Timeline,
    args: {
        label: 'Mission log',
        items: [
            {
                id: 'depart',
                title: 'Departure confirmed',
                time: '08:12',
                description: 'All hands aboard; convoy formation locked.',
            },
            {
                id: 'ridge',
                title: 'Eastern ridge cleared',
                time: '09:47',
                status: EUiStatus.Success,
            },
            {
                id: 'contact',
                title: 'Contact lost with scout wing',
                time: '11:03',
                description: 'Last ping at grid F7; search rotation queued.',
                status: EUiStatus.Danger,
            },
            {
                id: 'resume',
                title: 'Contact re-established',
                time: '11:26',
            },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};

export const SingleEntry: Story = {
    args: {
        items: [
            {
                id: 'boot',
                title: 'Systems online',
                time: '00:00',
            },
        ],
    },
};
