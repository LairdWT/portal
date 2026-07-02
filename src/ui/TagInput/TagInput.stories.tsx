import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { TagInput } from './TagInput';
import type { TagInputProps } from './TagInput.types';

const SUGGESTIONS: readonly string[] = [
    'vanguard',
    'rearguard',
    'recon',
    'siege',
    'support',
    'skirmish',
];

// Controlled harness: tags and draft both live so every story edits fully.
function TagDemo(props: TagInputProps): ReactElement {
    const [tags, setTags]: [
        readonly string[],
        Dispatch<SetStateAction<readonly string[]>>,
    ] = useState<readonly string[]>(props.tags);
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    return (
        <div style={{ inlineSize: 'min(26rem, 80vw)' }}>
            <TagInput
                {...props}
                tags={tags}
                onTagsChange={setTags}
                value={value}
                onValueChange={setValue}
            />
        </div>
    );
}

const meta: Meta<typeof TagInput> = {
    title: 'UI/TagInput',
    component: TagInput,
    render: (args: TagInputProps): ReactElement => <TagDemo {...args} />,
    args: {
        label: 'Squad tags',
        tags: ['recon', 'vanguard'],
        value: '',
        suggestions: SUGGESTIONS,
        placeholder: 'Add a tag',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
    args: { tags: [] },
};

export const NoSuggestions: Story = {
    args: { suggestions: undefined },
};

export const WithError: Story = {
    args: { error: 'A squad carries at most five tags.' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.62 0.2 25)' },
};
