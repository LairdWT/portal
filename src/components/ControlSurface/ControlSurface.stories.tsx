import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import {
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { ActionButton } from '../ActionButton/ActionButton';
import { HudPanel } from '../HudPanel/HudPanel';
import { Joystick } from '../Joystick/Joystick';
import { ControlSurface } from './ControlSurface';
import { type ControlSurfaceReadout } from './ControlSurface.types';

const meta: Meta<typeof ControlSurface> = {
    title: 'Composites/ControlSurface',
    component: ControlSurface,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

const defaultReadouts: readonly ControlSurfaceReadout[] = [
    { id: 'health', label: 'Health', value01: 0.82 },
    { id: 'shield', label: 'Shield', value01: 0.45 },
    { id: 'boost', label: 'Boost', value01: 0.12 },
];

export const Default: Story = {
    args: {
        leftLabel: 'Movement',
        primaryLabel: 'A',
        secondaryLabel: 'B',
        readouts: defaultReadouts,
    },
};

export const Labelled: Story = {
    args: {
        leftLabel: 'Steer',
        primaryLabel: 'Fire',
        secondaryLabel: 'Jump',
        readouts: defaultReadouts,
    },
};

const CUSTOM_MOVE_DESCRIPTOR: InputDescriptor = {
    id: 'story.custom.move',
    kind: EInputValueType.Axis2D,
    label: 'Steering',
};

const CUSTOM_PRIMARY_DESCRIPTOR: InputDescriptor = {
    id: 'story.custom.primary',
    kind: EInputValueType.Digital,
    label: 'Boost',
};

const CUSTOM_SECONDARY_DESCRIPTOR: InputDescriptor = {
    id: 'story.custom.secondary',
    kind: EInputValueType.Digital,
    label: 'Brake',
};

function logSignal(signal: InputSignal): void {
    console.log(signal.descriptor.id);
}

// Consumer-supplied controls: each slot owns its descriptor and onSignal sink.
// ControlSurface renders the nodes verbatim and forwards nothing to them.
export const ComposedCustomControls: Story = {
    render: (): ReactElement => (
        <ControlSurface
            hudSlot={<HudPanel label="Telemetry" readouts={defaultReadouts} />}
            movementSlot={
                <Joystick
                    label="Steering"
                    descriptor={CUSTOM_MOVE_DESCRIPTOR}
                    onSignal={logSignal}
                />
            }
            primarySlot={
                <ActionButton
                    label="Boost"
                    descriptor={CUSTOM_PRIMARY_DESCRIPTOR}
                    onSignal={logSignal}
                />
            }
            secondarySlot={
                <ActionButton
                    label="Brake"
                    descriptor={CUSTOM_SECONDARY_DESCRIPTOR}
                    onSignal={logSignal}
                />
            }
        />
    ),
};

// Two un-configured instances. Each resolves a distinct instanceId, so the
// default preset descriptor ids (move/primary/secondary) do not collide.
export const TwoInstancesNoCollision: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <ControlSurface
                instanceId="player-one"
                readouts={defaultReadouts}
                onSignal={logSignal}
            />
            <ControlSurface
                instanceId="player-two"
                readouts={defaultReadouts}
                onSignal={logSignal}
            />
        </div>
    ),
};
