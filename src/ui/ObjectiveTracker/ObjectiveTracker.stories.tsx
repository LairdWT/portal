import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type CSSProperties, type ReactElement } from 'react';

import { ObjectiveTracker } from './ObjectiveTracker';
import { EObjectiveState, type Objective } from './ObjectiveTracker.types';

const FRAME_STYLE: CSSProperties = { inlineSize: 'min(24rem, 90vw)' };

const OBJECTIVES: readonly Objective[] = [
    { id: 'reach', label: 'Reach the relay' },
    {
        id: 'cells',
        label: 'Recover power cells',
        count: 3,
        total: 5,
    },
    {
        id: 'silence',
        label: 'Silence the battery',
        state: EObjectiveState.Complete,
    },
    {
        id: 'convoy',
        label: 'Protect the convoy',
        state: EObjectiveState.Failed,
    },
    {
        id: 'intel',
        label: 'Gather intel on the raiders',
        optional: true,
    },
];

type ObjectiveTrackerStoryArgs = Readonly<{ label: string }>;

const meta: Meta<ObjectiveTrackerStoryArgs> = {
    title: 'UI/ObjectiveTracker',
    args: { label: 'ObjectiveTracker' },
};

export default meta;

type Story = StoryObj<ObjectiveTrackerStoryArgs>;

export const Default: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <ObjectiveTracker label="Objectives" objectives={OBJECTIVES} />
        </div>
    ),
};

export const Toned: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <ObjectiveTracker
                label="Contract: The Eastern Pass"
                objectives={OBJECTIVES}
                tone="var(--portal-color-warning)"
            />
        </div>
    ),
};
