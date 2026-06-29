import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { SegmentedControl } from './SegmentedControl';
import { type SegmentItem } from './SegmentedControl.types';

// A single (non-union) story args shape. The component's own props are an XOR
// union (AccessibleName), which collapses Storybook's arg inference to `never`;
// the stories only ever exercise the `label` form, so a flat args type keeps the
// meta and story typing sound while still feeding valid SegmentedControl props.
type SegmentedControlStoryArgs = Readonly<{
    items: readonly SegmentItem[];
    value: string;
    label: string;
    enabled?: EEnabledState;
    tone?: string;
}>;

const ITEMS: readonly SegmentItem[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
];

const MANY_ITEMS: readonly SegmentItem[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'pending', label: 'Pending' },
    { id: 'closed', label: 'Closed' },
    { id: 'archived', label: 'Archived' },
];

// A controlled wrapper the stories share: SegmentedControl is controlled, so the
// story owns the selected id and feeds it back through `value`, the pattern a
// consumer wiring it to app state uses.
function ControlledSegmentedControl(args: SegmentedControlStoryArgs): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(args.value);
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
}

const meta: Meta<SegmentedControlStoryArgs> = {
    title: 'UI/SegmentedControl',
    component: SegmentedControl,
    args: {
        items: ITEMS,
        value: 'day',
        label: 'Time range',
    },
    render: (args: SegmentedControlStoryArgs): ReactElement => (
        <ControlledSegmentedControl {...args} />
    ),
};

export default meta;

type Story = StoryObj<SegmentedControlStoryArgs>;

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
