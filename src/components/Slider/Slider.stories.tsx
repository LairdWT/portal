import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { useState } from 'react';

import { EEnabledState } from '../../state/state';
import { Slider } from './Slider';
import { type SliderProps } from './Slider.types';

function ControlledSlider(props: SliderProps): ReactElement {
    const [value, setValue]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(props.value);

    function handleChange(next: number): void {
        setValue(next);
        props.onChange?.(next);
    }

    return <Slider {...props} value={value} onChange={handleChange} />;
}

const meta: Meta<typeof Slider> = {
    title: 'Controls/Slider',
    component: Slider,
    args: {
        label: 'Sensitivity',
        value: 40,
        min: 0,
        max: 100,
        step: 1,
        enabled: EEnabledState.Enabled,
    },
    render: (args: SliderProps): ReactElement => <ControlledSlider {...args} />,
};

export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {};

export const Disabled: Story = {
    args: {
        label: 'Sensitivity (locked)',
        enabled: EEnabledState.Disabled,
    },
};
