import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { TextArea } from './TextArea';
import { ETextAreaResize, type TextAreaProps } from './TextArea.types';

// Controlled harness so every story is a live, editable area.
function TextAreaDemo(props: TextAreaProps): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    return <TextArea {...props} value={value} onValueChange={setValue} />;
}

const meta: Meta<typeof TextArea> = {
    title: 'UI/TextArea',
    component: TextArea,
    render: (args: TextAreaProps): ReactElement => <TextAreaDemo {...args} />,
    args: {
        label: 'Mission notes',
        value: 'Hold the eastern ridge until the convoy clears the pass.',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AutoSize: Story = {
    args: { autoSize: true, rows: 2 },
};

export const PinnedSize: Story = {
    args: { resize: ETextAreaResize.None, rows: 4 },
};

export const WithError: Story = {
    args: { error: 'Notes must stay under 500 characters.' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};
