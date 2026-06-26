import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { SegmentedControl } from './SegmentedControl';
import {
    type SegmentedControlProps,
    type UiSegmentItem,
} from './SegmentedControl.types';

const ITEMS: readonly UiSegmentItem[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
];

const MANY_ITEMS: readonly UiSegmentItem[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'pending', label: 'Pending' },
    { id: 'closed', label: 'Closed' },
    { id: 'archived', label: 'Archived' },
];

// A controlled wrapper the stories share: SegmentedControl is controlled, so the
// story owns the selected id and feeds it back through `value`, the pattern a
// consumer wiring it to app state uses.
function ControlledSegmentedControl(args: SegmentedControlProps): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(args.value);
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
}

const meta: Meta<typeof SegmentedControl> = {
    title: 'UI/SegmentedControl',
    component: SegmentedControl,
    args: {
        items: ITEMS,
        value: 'day',
        label: 'Time range',
    },
    render: (args: SegmentedControlProps): ReactElement => (
        <ControlledSegmentedControl {...args} />
    ),
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// A consumer-supplied opaque tone color drives the selected indicator and scrim.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const ManySegments: Story = {
    args: { items: MANY_ITEMS, value: 'open', label: 'Status filter' },
};
