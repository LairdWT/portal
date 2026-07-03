import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import demoStyles from '../../examples/storySupport.module.css';
import {
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { EEnabledState } from '../../state/state';
import {
    ERadialAction,
    type RadialItem,
    type RadialSides,
} from '../../ui/Radial/Radial.types';
import { RadialPad } from './RadialPad';

const WEAPON_SECTIONS: readonly RadialItem[] = [
    { id: 'pistol', label: 'Pistol' },
    { id: 'rifle', label: 'Rifle' },
    { id: 'shotgun', label: 'Shotgun' },
    { id: 'grenade', label: 'Grenade' },
    { id: 'knife', label: 'Knife' },
    { id: 'sniper', label: 'Sniper' },
    { id: 'rocket', label: 'Rocket' },
    { id: 'heal', label: 'Heal' },
];

const CENTER_ACTIONS: readonly ERadialAction[] = [
    ERadialAction.Confirm,
    ERadialAction.Cancel,
    ERadialAction.Previous,
    ERadialAction.Next,
];

const radialDescriptor: InputDescriptor = {
    id: 'radial-demo',
    kind: EInputValueType.Digital,
    label: 'Radial selection',
};

function logSignal(signal: InputSignal): void {
    console.log('RadialPad signal', signal);
}

type DemoProps = Readonly<{
    sides: RadialSides;
    enabled: EEnabledState;
    collapsible?: boolean;
    initialOpen?: boolean;
}>;

// Collapsible (the default): the pad's own hub is the open/close toggle, so
// the demo just wires open state through onOpen/onClose. The modal form
// (collapsible=false) needs an external opener.
function RadialPadDemo({
    sides,
    enabled,
    collapsible,
    initialOpen,
}: DemoProps): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(initialOpen ?? true);
    const sections: readonly RadialItem[] = WEAPON_SECTIONS.slice(0, sides);
    const pad: ReactElement | null = (
        <RadialPad
            open={open}
            onClose={(): void => {
                setOpen(false);
            }}
            onOpen={(): void => {
                setOpen(true);
            }}
            label="Weapon wheel"
            sections={sections}
            sides={sides}
            enabled={enabled}
            centerActions={CENTER_ACTIONS}
            descriptor={radialDescriptor}
            onSignal={logSignal}
            onSelect={(id: string, index: number): void => {
                console.log('select', id, index);
            }}
            {...(collapsible !== undefined ? { collapsible } : {})}
        />
    );
    if (collapsible === false) {
        return (
            <>
                <button
                    type="button"
                    className={demoStyles.trigger}
                    onClick={(): void => {
                        setOpen(true);
                    }}
                >
                    Open weapon wheel
                </button>
                {pad}
            </>
        );
    }
    return pad;
}

const meta: Meta<typeof RadialPadDemo> = {
    title: 'Controls/RadialPad',
    component: RadialPadDemo,
    parameters: { layout: 'fullscreen' },
    args: { sides: 8, enabled: EEnabledState.Enabled },
    // `sides` is the RadialSides union, not a free number: the control offers
    // exactly the supported polygon counts (the component also normalizes any
    // out-of-range runtime value onto them).
    argTypes: {
        sides: { control: { type: 'inline-radio' }, options: [4, 6, 8] },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Octagonal: Story = {};

export const Hexagonal: Story = {
    args: { sides: 6 },
};

export const Square: Story = {
    args: { sides: 4 },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

// The pre-1.12 portaled modal overlay form, opened from an external trigger.
export const ModalOverlay: Story = {
    args: { collapsible: false, initialOpen: false },
};

// The collapsed resting state: the hub toggle waits for a press.
export const Collapsed: Story = {
    args: { initialOpen: false },
};
