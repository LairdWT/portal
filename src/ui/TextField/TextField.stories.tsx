import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type Dispatch, type SetStateAction, useState } from 'react';

import { EEnabledState } from '../../state/state';
import { TextField } from './TextField';
import { ETextFieldType, type TextFieldProps } from './TextField.types';

// A controlled wrapper so the stories drive the input value locally; portal
// keeps the TextField controlled and the story owns the state.
function ControlledTextField(props: TextFieldProps): ReturnType<typeof TextField> {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    return <TextField {...props} value={value} onValueChange={setValue} />;
}

const meta: Meta<typeof TextField> = {
    title: 'UI/TextField',
    component: TextField,
    render: (args: TextFieldProps): ReturnType<typeof ControlledTextField> => (
        <ControlledTextField {...args} />
    ),
    args: { label: 'Player name', value: '', placeholder: 'Enter a name' },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
    args: { value: 'ab', error: 'Name must be at least three characters.' },
};

export const SearchType: Story = {
    args: {
        label: 'Find a card',
        type: ETextFieldType.Search,
        placeholder: 'Search deck',
    },
};

// A consumer-supplied opaque tone color drives the focus ring and border accent.
export const Toned: Story = {
    args: { tone: 'oklch(0.62 0.21 25)' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled, value: 'Locked' },
};
