import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { Chip } from './Chip';

// A shared placeholder remove handler for the single-chip stories. The wrapped
// row story below owns real removal state instead.
function noop(): void {
    // Story placeholder remove handler.
}

const INITIAL_TAGS: readonly string[] = [
    'Crimson',
    'Cobalt',
    'Verdant',
    'Amber',
    'Slate',
];

// The composition story: a wrapped row of removable chips that owns its tag list
// and drops a tag when its chip is removed, the pattern a consumer wiring a chip
// row to filter state uses. Documented in place rather than as a separate
// ChipRow component.
function ChipRowDemo(): ReactElement {
    const [tags, setTags]: [
        readonly string[],
        Dispatch<SetStateAction<readonly string[]>>,
    ] = useState<readonly string[]>(INITIAL_TAGS);

    function removeTag(tag: string): void {
        setTags((previous: readonly string[]): readonly string[] =>
            previous.filter((entry: string): boolean => entry !== tag),
        );
    }

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {tags.map(
                (tag: string): ReactElement => (
                    <Chip
                        key={tag}
                        label={tag}
                        onRemove={(): void => {
                            removeTag(tag);
                        }}
                    >
                        {tag}
                    </Chip>
                ),
            )}
        </div>
    );
}

const meta: Meta<typeof Chip> = {
    title: 'UI/Chip',
    component: Chip,
    args: {
        children: 'Crimson',
        label: 'Crimson',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Removable: Story = {
    args: { onRemove: noop },
};

export const Selected: Story = {
    args: { selected: true, onRemove: noop },
};

// A consumer-supplied opaque tone color drives the border, fill, and marker.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)', selected: true, onRemove: noop },
};

export const DangerStatus: Story = {
    args: {
        children: 'Expired',
        label: 'Expired',
        status: EUiStatus.Danger,
        onRemove: noop,
    },
};

export const Disabled: Story = {
    args: { onRemove: noop, enabled: EEnabledState.Disabled },
};

export const ChipRow: Story = {
    render: (): ReactElement => <ChipRowDemo />,
};
