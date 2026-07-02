import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Dial } from './Dial';

// The Dial is fully controlled, so every story drives it through a small
// stateful harness (the Drawer story pattern); the flat args type is only a
// docs anchor.
type DialStoryArgs = Readonly<{ label: string }>;

type HarnessProps = Readonly<{
    label?: string;
    initial?: number;
    step?: number;
    detents?: readonly number[];
    enabled?: EEnabledState;
    formatValueText?: ((value: number) => string) | undefined;
}>;

function ControlledDial(props: HarnessProps): ReactElement {
    const [value, setValue]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(props.initial ?? 35);
    return (
        <Dial
            label={props.label ?? 'Gain'}
            value={value}
            onChange={setValue}
            {...(props.step !== undefined ? { step: props.step } : {})}
            {...(props.detents !== undefined ? { detents: props.detents } : {})}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
            {...(props.formatValueText !== undefined
                ? { formatValueText: props.formatValueText }
                : {})}
        />
    );
}

const meta: Meta<DialStoryArgs> = {
    title: 'Components/Dial',
    args: { label: 'Dial' },
};

export default meta;

type Story = StoryObj<DialStoryArgs>;

export const Default: Story = {
    render: (): ReactElement => <ControlledDial />,
};

// Release the twist and the knob settles onto the nearest quarter detent;
// the live twist stays free.
export const Detents: Story = {
    render: (): ReactElement => (
        <ControlledDial label="Power" detents={[0, 25, 50, 75, 100]} />
    ),
};

export const FineStep: Story = {
    render: (): ReactElement => (
        <ControlledDial
            label="Trim"
            step={0.5}
            formatValueText={(value: number): string => `${String(value)} dB`}
        />
    ),
};

export const Disabled: Story = {
    render: (): ReactElement => (
        <ControlledDial label="Locked" enabled={EEnabledState.Disabled} />
    ),
};

export const Cluster: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', gap: 'var(--portal-space-5)' }}>
            <ControlledDial label="Gain" initial={62} />
            <ControlledDial label="Mix" initial={20} />
            <ControlledDial label="Drive" initial={88} />
        </div>
    ),
};
