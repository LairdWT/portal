import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Hotbar } from './Hotbar';
import { type HotbarSlot } from './Hotbar.types';

const SLOTS: readonly HotbarSlot[] = [
    { id: 'blink', label: 'Blink', keybind: '1', content: <span>BLNK</span> },
    { id: 'barrage', label: 'Barrage', keybind: '2', content: <span>BRRG</span> },
    { id: 'shield', label: 'Shield', keybind: '3', content: <span>SHLD</span> },
    { id: 'scan', label: 'Scan', keybind: '4', content: <span>SCAN</span> },
    { id: 'medkit', label: 'Medkit', keybind: '5', content: <span>MED</span> },
];

type HarnessProps = Readonly<{
    enabled?: EEnabledState;
}>;

// Controlled harness: the story owns the active slot.
function ControlledHotbar(props: HarnessProps): ReactElement {
    const [activeId, setActiveId]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('blink');
    return (
        <Hotbar
            label="Ability bar"
            slots={SLOTS}
            activeId={activeId}
            onActivate={setActiveId}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
        />
    );
}

type HotbarStoryArgs = Readonly<{ label: string }>;

const meta: Meta<HotbarStoryArgs> = {
    title: 'Components/Hotbar',
    args: { label: 'Hotbar' },
};

export default meta;

type Story = StoryObj<HotbarStoryArgs>;

export const Default: Story = {
    render: (): ReactElement => <ControlledHotbar />,
};

export const Disabled: Story = {
    render: (): ReactElement => (
        <ControlledHotbar enabled={EEnabledState.Disabled} />
    ),
};
