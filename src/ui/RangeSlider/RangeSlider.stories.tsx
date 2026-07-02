import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { RangeSlider } from './RangeSlider';
import { type RangeSliderProps, type RangeSliderValue } from './RangeSlider.types';

// Controlled harness so every story drags and keys like the real control.
function RangeDemo(props: RangeSliderProps): ReactElement {
    const [value, setValue]: [
        RangeSliderValue,
        Dispatch<SetStateAction<RangeSliderValue>>,
    ] = useState<RangeSliderValue>(props.value);
    return (
        <div style={{ inlineSize: 'min(24rem, 80vw)' }}>
            <RangeSlider {...props} value={value} onValueChange={setValue} />
        </div>
    );
}

const meta: Meta<typeof RangeSlider> = {
    title: 'UI/RangeSlider',
    component: RangeSlider,
    render: (args: RangeSliderProps): ReactElement => <RangeDemo {...args} />,
    args: {
        label: 'Signal window',
        value: { lower: 20, upper: 80 },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Stepped: Story = {
    args: { value: { lower: 20, upper: 60 }, step: 10 },
};

export const Formatted: Story = {
    args: {
        formatValue: (value: number): string => `${String(value)} %`,
    },
};

export const NarrowBand: Story = {
    args: { value: { lower: 48, upper: 52 } },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.62 0.2 25)' },
};
