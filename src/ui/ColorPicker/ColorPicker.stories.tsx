import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { ColorPicker } from './ColorPicker';
import { type ColorPickerProps } from './ColorPicker.types';

// A controlled wrapper so the stories drive the color locally; ColorPicker stays
// controlled and the story owns the value state.
function ControlledColorPicker(
    props: ColorPickerProps,
): ReturnType<typeof ColorPicker> {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    return <ColorPicker {...props} value={value} onValueChange={setValue} />;
}

const meta: Meta<typeof ColorPicker> = {
    title: 'UI/ColorPicker',
    component: ColorPicker,
    render: (args: ColorPickerProps): ReturnType<typeof ControlledColorPicker> => (
        <ControlledColorPicker {...args} />
    ),
    args: { label: 'Brush color', value: '#5F6DAC' },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Alpha on: the 8-digit hex, the alpha channel slider, and the swatch
// transparency checker behind a semi-transparent fill.
export const WithAlpha: Story = {
    args: { alpha: true, value: '#5F6DACC0' },
};

// A consumer-supplied opaque tone color drives the focus glow and child accents.
export const Toned: Story = {
    args: { tone: 'oklch(0.62 0.21 25)' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled, value: '#A0444D' },
};

// Two pickers side by side read as one machined-HUD panel family.
export const Composition: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <ControlledColorPicker label="Primary" value="#5F6DAC" />
            <ControlledColorPicker label="Accent" value="#5CE0A0" />
        </div>
    ),
};
