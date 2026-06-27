import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Rating } from './Rating';

// A single (non-union) story args shape. Rating's own props are a discriminated +
// XOR (AccessibleName) union, which collapses Storybook's arg inference; the
// interactive stories only ever exercise the `label` form, so a flat args type
// keeps the meta and story typing sound while still feeding valid Rating props.
type RatingStoryArgs = Readonly<{
    max: number;
    value: number;
    label: string;
    enabled?: EEnabledState;
    allowClear?: boolean;
    tone?: string;
}>;

// A controlled wrapper the interactive stories share: Rating is controlled, so the
// story owns the filled count and feeds it back through `value`, the pattern a
// consumer wiring it to app state uses.
function ControlledRating(args: RatingStoryArgs): ReactElement {
    const [value, setValue]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(args.value);
    return <Rating {...args} value={value} onChange={setValue} />;
}

// `component` is intentionally omitted: Rating's props are a discriminated +
// AccessibleName XOR union (RatingProps), which is not assignable from the flat
// RatingStoryArgs and so cannot satisfy Storybook's `component` constraint under
// this meta's arg type. The controlled render wrapper supplies the real Rating
// props (including onChange), so the component association is not needed here.
const meta: Meta<RatingStoryArgs> = {
    title: 'UI/Rating',
    args: {
        max: 5,
        value: 3,
        label: 'Rating',
    },
    render: (args: RatingStoryArgs): ReactElement => <ControlledRating {...args} />,
};

export default meta;

type Story = StoryObj<RatingStoryArgs>;

export const Default: Story = {};

// A consumer-supplied opaque tone color drives the filled pip ramp.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

// value=0 leaves nothing checked, but mark 1 stays the roving entry point.
export const Unrated: Story = {
    args: { value: 0 },
};

// allowClear lets re-activating the selected mark (or arrowing below 1) report 0.
export const Clearable: Story = {
    args: { allowClear: true },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

// Readonly is a non-interactive role="img"; its render bypasses the controlled
// wrapper since there is no onChange.
export const Readonly: Story = {
    args: { value: 4 },
    render: (args: RatingStoryArgs): ReactElement => (
        <Rating readOnly max={args.max} value={args.value} tone={args.tone} />
    ),
};

// The half-step surface: a fractional value renders a clipped partial pip.
export const ReadonlyHalfStep: Story = {
    args: { value: 3.5 },
    render: (args: RatingStoryArgs): ReactElement => (
        <Rating readOnly max={args.max} value={args.value} tone={args.tone} />
    ),
};

// A column of ratings showing the machined-HUD family reading consistently across
// interactive and readonly instances and tones.
export const Composition: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
            <ControlledRating max={5} value={4} label="Difficulty" />
            <ControlledRating
                max={5}
                value={2}
                label="Priority"
                tone="oklch(0.7 0.15 240)"
            />
            <Rating readOnly max={5} value={3.5} />
            <Rating readOnly max={5} value={5} tone="oklch(0.7 0.18 25)" />
        </div>
    ),
};
