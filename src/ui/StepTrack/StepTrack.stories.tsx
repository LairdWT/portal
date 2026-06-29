import type { Meta, StoryObj } from '@storybook/react-vite';

import { StepTrack } from './StepTrack';
import { type Step } from './StepTrack.types';

const PHASES: readonly Step[] = [
    { id: 'draw', label: 'Draw' },
    { id: 'main', label: 'Main' },
    { id: 'combat', label: 'Combat' },
    { id: 'end', label: 'End' },
];

const meta: Meta<typeof StepTrack> = {
    title: 'UI/StepTrack',
    component: StepTrack,
    args: {
        steps: PHASES,
        currentId: 'draw',
    },
};

export default meta;

type Story = StoryObj<typeof StepTrack>;

export const Default: Story = {};

export const MidProgress: Story = {
    args: {
        currentId: 'combat',
    },
};

export const LastStep: Story = {
    args: {
        currentId: 'end',
    },
};

// A consumer-supplied opaque tone color accents the current step's marker and
// glow; order and position stay carried by list semantics and visible text.
export const Toned: Story = {
    args: {
        currentId: 'main',
        tone: 'oklch(0.7 0.18 25)',
    },
};
