import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { RadioGroup } from './RadioGroup';
import { ERadioOrientation, type UiRadioItem } from './RadioGroup.types';

// A single (non-union) story args shape. The component's own props are an XOR
// union (AccessibleName), which collapses Storybook's arg inference to `never`;
// the stories only ever exercise the `label` form, so a flat args type keeps the
// meta and story typing sound while still feeding valid RadioGroup props.
type RadioGroupStoryArgs = Readonly<{
    items: readonly UiRadioItem[];
    value: string;
    label: string;
    enabled?: EEnabledState;
    orientation?: ERadioOrientation;
    tone?: string;
}>;

const ITEMS: readonly UiRadioItem[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
];

const ITEMS_WITH_DISABLED: readonly UiRadioItem[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week', disabled: true },
    { id: 'month', label: 'Month' },
];

const MANY_ITEMS: readonly UiRadioItem[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'pending', label: 'Pending' },
    { id: 'closed', label: 'Closed' },
    { id: 'archived', label: 'Archived' },
];

// A controlled wrapper the stories share: RadioGroup is controlled, so the story
// owns the selected id and feeds it back through `value`, the pattern a consumer
// wiring it to app state uses.
function ControlledRadioGroup(args: RadioGroupStoryArgs): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(args.value);
    return <RadioGroup {...args} value={value} onChange={setValue} />;
}

const meta: Meta<RadioGroupStoryArgs> = {
    title: 'UI/RadioGroup',
    component: RadioGroup,
    args: {
        items: ITEMS,
        value: 'day',
        label: 'Time range',
    },
    render: (args: RadioGroupStoryArgs): ReactElement => (
        <ControlledRadioGroup {...args} />
    ),
};

export default meta;

type Story = StoryObj<RadioGroupStoryArgs>;

export const Default: Story = {};

export const Horizontal: Story = {
    args: { orientation: ERadioOrientation.Horizontal },
};

// A consumer-supplied opaque tone color drives the selected marker ring and dot.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

export const WithDisabledOption: Story = {
    args: { items: ITEMS_WITH_DISABLED },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const ManyOptions: Story = {
    args: { items: MANY_ITEMS, value: 'open', label: 'Status filter' },
};

// A column of a toned group above a plain group, mirroring the composition story
// the sibling primitives ship: two independent controlled groups side by side.
export const Composition: Story = {
    render: (args: RadioGroupStoryArgs): ReactElement => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
            }}
        >
            <ControlledRadioGroup {...args} tone="oklch(0.7 0.18 25)" />
            <ControlledRadioGroup {...args} />
        </div>
    ),
};
