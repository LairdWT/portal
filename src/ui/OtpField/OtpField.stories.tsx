import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { OtpField } from './OtpField';
import { type OtpFieldProps } from './OtpField.types';

// Controlled harness so every story accepts real typing and paste.
function OtpDemo(props: OtpFieldProps): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    return (
        <OtpField
            {...props}
            value={value}
            onValueChange={setValue}
            onComplete={(code: string): void => {
                console.log('complete', code);
            }}
        />
    );
}

const meta: Meta<typeof OtpField> = {
    title: 'UI/OtpField',
    component: OtpField,
    render: (args: OtpFieldProps): ReactElement => <OtpDemo {...args} />,
    args: {
        label: 'Access code',
        value: '',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PartiallyFilled: Story = {
    args: { value: '482' },
};

export const FourDigits: Story = {
    args: { length: 4, value: '19' },
};

export const WithError: Story = {
    args: { value: '482913', error: 'That code has expired.' },
};

export const Disabled: Story = {
    args: { value: '48', enabled: EEnabledState.Disabled },
};

export const Toned: Story = {
    args: { value: '48', tone: 'oklch(0.7 0.15 240)' },
};
