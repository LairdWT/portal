import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Panel } from '../Panel/Panel';
import { EUiStatus } from '../tone';
import { NumberStepper } from './NumberStepper';
import {
    ENumberStepperFinish,
    type NumberStepperProps,
} from './NumberStepper.types';

// A controlled wrapper the stories share: NumberStepper is controlled, so the
// story owns the value and feeds it back through `value`, the pattern a consumer
// wiring it to app state uses.
function ControlledNumberStepper(args: NumberStepperProps): ReactElement {
    const [value, setValue]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(args.value);
    return <NumberStepper {...args} value={value} onChange={setValue} />;
}

const meta: Meta<typeof NumberStepper> = {
    title: 'UI/NumberStepper',
    component: NumberStepper,
    args: {
        label: 'Quantity',
        value: 4,
    },
    render: (args: NumberStepperProps): ReactElement => (
        <ControlledNumberStepper {...args} />
    ),
};

export default meta;

type Story = StoryObj<typeof NumberStepper>;

export const Default: Story = {};

// A consumer-supplied opaque tone color drives the HUD border, glow, and focus.
export const Toned: Story = {
    args: { tone: 'oklch(0.72 0.17 145)' },
};

// Small bounds so the keys dim/disable at the edges and Home/End apply.
export const Bounded: Story = {
    args: { label: 'Squad size', value: 3, min: 1, max: 5 },
};

// A larger step plus a distinct page step: Arrow moves by step, Page by pageStep.
export const Stepped: Story = {
    args: {
        label: 'Volume',
        value: 50,
        min: 0,
        max: 100,
        step: 5,
        pageStep: 25,
    },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

// The opt-in brushed-metal key finish (the pre-1.6 default look); the standard
// themed keys above are the default.
export const MetalFinish: Story = {
    args: { finish: ENumberStepperFinish.Metal },
};

// The universal danger status routes the seed through the tone scope.
export const Status: Story = {
    args: {
        label: 'Hull breaches',
        value: 2,
        min: 0,
        max: 9,
        status: EUiStatus.Danger,
    },
};

// A settings-panel layout proving the machined-HUD edge reads as one family.
export const Composition: Story = {
    render: (): ReactElement => (
        <Panel title="Match settings">
            <ControlledNumberStepper label="Players" value={4} min={2} max={8} />
            <ControlledNumberStepper label="Rounds" value={3} min={1} max={9} />
            <ControlledNumberStepper label="Lives" value={3} min={1} max={5} />
        </Panel>
    ),
};
