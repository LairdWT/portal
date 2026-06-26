import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type Dispatch, type SetStateAction, useState } from 'react';

import { EEnabledState } from '../../state/state';
import { SecretField } from './SecretField';
import { ESecretAutocomplete, type SecretFieldProps } from './SecretField.types';

// A controlled wrapper so the stories drive the secret value locally; portal keeps
// the SecretField controlled and the story owns the state.
function ControlledSecretField(
    props: SecretFieldProps,
): ReturnType<typeof SecretField> {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    return <SecretField {...props} value={value} onValueChange={setValue} />;
}

const meta: Meta<typeof SecretField> = {
    title: 'UI/SecretField',
    component: SecretField,
    render: (args: SecretFieldProps): ReturnType<typeof ControlledSecretField> => (
        <ControlledSecretField {...args} />
    ),
    args: {
        label: 'Password',
        value: '',
        autoComplete: ESecretAutocomplete.Current,
        placeholder: 'Enter your password',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// A create/change-password field forces the new-password autocomplete intent.
export const NewPassword: Story = {
    args: {
        label: 'New password',
        autoComplete: ESecretAutocomplete.New,
        placeholder: 'Choose a strong password',
    },
};

export const WithError: Story = {
    args: { value: 'abc', error: 'Password must be at least eight characters.' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled, value: 'locked-secret' },
};

// A consumer-supplied opaque tone color drives the focus ring and border accent.
export const Toned: Story = {
    args: { value: 'phoenix', tone: 'oklch(0.62 0.21 25)' },
};
