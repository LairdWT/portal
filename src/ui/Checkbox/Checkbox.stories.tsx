import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Checkbox } from './Checkbox';

// A single (non-union) story args shape. Checkbox's own props are a CheckboxNaming
// XOR union, which collapses Storybook's arg inference; the interactive stories
// only exercise the `label` arm, so a flat args type keeps the meta and story
// typing sound while still feeding valid Checkbox props (mirrors Rating.stories).
type CheckboxStoryArgs = Readonly<{
    label: string;
    checked: boolean;
    indeterminate?: boolean;
    enabled?: EEnabledState;
    required?: boolean;
    tone?: string;
}>;

// A controlled wrapper the interactive stories share: Checkbox is controlled, so
// the story owns `checked` in state and feeds it back through `onChange`, the
// pattern a consumer wiring it to app state uses. `indeterminate` stays a fixed
// overlay independent of the toggled checked value.
function ControlledCheckbox(args: CheckboxStoryArgs): ReactElement {
    const [checked, setChecked]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(args.checked);
    return (
        <Checkbox
            label={args.label}
            checked={checked}
            onChange={setChecked}
            {...(args.indeterminate !== undefined
                ? { indeterminate: args.indeterminate }
                : {})}
            {...(args.enabled !== undefined ? { enabled: args.enabled } : {})}
            {...(args.required === true ? { required: true } : {})}
            {...(args.tone !== undefined ? { tone: args.tone } : {})}
        />
    );
}

// `component` is intentionally omitted: Checkbox's props are a CheckboxNaming XOR
// union, which is not assignable from the flat CheckboxStoryArgs and so cannot
// satisfy Storybook's `component` constraint under this meta. The controlled render
// wrapper supplies the real Checkbox props (including onChange), so the component
// association is not needed here (mirrors Rating.stories).
const meta: Meta<CheckboxStoryArgs> = {
    title: 'UI/Checkbox',
    args: {
        label: 'Accept terms',
        checked: false,
    },
    render: (args: CheckboxStoryArgs): ReactElement => (
        <ControlledCheckbox {...args} />
    ),
};

export default meta;

type Story = StoryObj<CheckboxStoryArgs>;

export const Default: Story = {};

export const Checked: Story = {
    args: { checked: true },
};

export const Indeterminate: Story = {
    args: { checked: false, indeterminate: true },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

// A consumer-supplied opaque tone color drives the checked fill + marker ramp.
export const Toned: Story = {
    args: { checked: true, tone: 'oklch(0.7 0.18 25)' },
};

export const Required: Story = {
    args: { required: true },
};

// The labelledBy arm: no visible label is rendered; the checkbox takes its name
// from external visible text through aria-labelledby. This render bypasses the
// controlled wrapper to supply the labelledBy naming prop directly.
export const LabelledByExternal: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'grid', gap: '0.5rem', justifyItems: 'start' }}>
            <span id="cb-external-label">Enable telemetry uploads</span>
            <Checkbox checked={false} labelledBy="cb-external-label" />
        </div>
    ),
};

// A grid mounting unchecked, checked, indeterminate, disabled, and toned instances
// together so the global axe gate (.storybook/preview.tsx) scans every state in one
// story and the machined-HUD family reads consistently across them.
export const Composition: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
            <ControlledCheckbox label="Unchecked" checked={false} />
            <ControlledCheckbox label="Checked" checked={true} />
            <ControlledCheckbox
                label="Indeterminate"
                checked={false}
                indeterminate={true}
            />
            <ControlledCheckbox
                label="Disabled"
                checked={true}
                enabled={EEnabledState.Disabled}
            />
            <ControlledCheckbox
                label="Toned"
                checked={true}
                tone="oklch(0.7 0.15 240)"
            />
        </div>
    ),
};
