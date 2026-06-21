import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import {
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { OrbBackdrop } from '../../r3f/OrbBackdrop';
import { rippleGridShader } from '../../shaders/rippleGrid/rippleGridShader';
import { Panel } from '../../ui/Panel/Panel';
import { EPanelElevation } from '../../ui/Panel/Panel.types';
import { BevelButton } from '../BevelButton/BevelButton';
import { HudPanel } from '../HudPanel/HudPanel';
import { Joystick } from '../Joystick/Joystick';
import { Slider } from '../Slider/Slider';
import { Toggle } from '../Toggle/Toggle';
import { ECheckedState } from '../Toggle/Toggle.types';
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
        tertiaryLabel: 'X',
        quaternaryLabel: 'Y',
        readouts: defaultReadouts,
    },
};

// ActionButtons take a single glyph or one or two characters; leftLabel is the
// joystick's accessible name, so a word there is fine.
export const Labelled: Story = {
    args: {
        leftLabel: 'Steer',
        primaryLabel: 'A',
        secondaryLabel: 'B',
        tertiaryLabel: 'L',
        quaternaryLabel: 'R',
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
// ControlSurface renders the nodes verbatim and forwards nothing to them. Word
// labels use BevelButton; ActionButton is reserved for single glyphs.
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
                <BevelButton
                    descriptor={CUSTOM_PRIMARY_DESCRIPTOR}
                    onSignal={logSignal}
                >
                    Boost
                </BevelButton>
            }
            secondarySlot={
                <BevelButton
                    descriptor={CUSTOM_SECONDARY_DESCRIPTOR}
                    onSignal={logSignal}
                >
                    Brake
                </BevelButton>
            }
        />
    ),
};

// Two un-configured instances. Each resolves a distinct instanceId, so the
// default preset descriptor ids do not collide.
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

// Auxiliary controls for the showcase: a value-driven Slider and an uncontrolled
// Toggle grouped in a tone-scoped Panel, demonstrating the generic UI layer
// composed alongside the controller primitives.
function ShowcaseExtras(): ReactElement {
    const [sensitivity, setSensitivity]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(60);

    return (
        <Panel title="Settings" elevation={EPanelElevation.Raised}>
            <Slider
                label="Sensitivity"
                value={sensitivity}
                onChange={setSensitivity}
                formatValueText={(value: number): string => `${String(value)}%`}
            />
            <Toggle label="Invert Y" defaultChecked={ECheckedState.Unchecked} />
        </Panel>
    );
}

// The controller showcase: the interactive rippleGrid + distort-orb scene as a
// full-bleed backdrop, a HudPanel band at the top, and the metal deck (Joystick,
// Start/Select, and the A/B/X/Y grid) at the bottom. The centred orb is the focal
// point; the backdrop is supplied through backgroundSlot, so ControlSurface
// itself stays free of the optional 3D stack.
export const Showcase: Story = {
    render: (): ReactElement => (
        <ControlSurface
            readouts={defaultReadouts}
            onSignal={logSignal}
            backgroundSlot={<OrbBackdrop shader={rippleGridShader} />}
        />
    ),
};

// The same scene with the generic UI layer composed into the extras strip: a
// value-driven Slider and an uncontrolled Toggle grouped in a tone-scoped Panel.
export const ShowcaseWithPanels: Story = {
    render: (): ReactElement => (
        <ControlSurface
            readouts={defaultReadouts}
            onSignal={logSignal}
            backgroundSlot={<OrbBackdrop shader={rippleGridShader} />}
            extrasSlot={<ShowcaseExtras />}
        />
    ),
};
